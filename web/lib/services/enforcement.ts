import {
  FEEDBACK_REMINDER_INTERVAL_MS,
  FEEDBACK_SOFT_BLOCK_DAYS,
  FEEDBACK_SOFT_BLOCK_MS,
  MS_PER_DAY,
} from "@/lib/constants/enforcement";
import { listCompletedMeetingsForUser } from "@/lib/dal/meetings";
import { NotificationType } from "@/lib/generated/prisma/enums";

import {
  getCurrentVerification,
  isOutcomeVerified,
  type VerifiableMeeting,
} from "./meeting-verification";

export class FeedbackEnforcementError extends Error {
  constructor() {
    super(
      "Submit overdue meeting feedback before requesting another mentor.",
    );
    this.name = "FeedbackEnforcementError";
  }
}

export type OverdueFeedbackMeeting = {
  meetingId: string;
  verificationResolvedAt: Date;
  daysOverdue: number;
};

export type FeedbackEnforcementState = {
  isSoftBlocked: boolean;
  overdueMeetings: OverdueFeedbackMeeting[];
  eligibleMeetings: Array<{
    meetingId: string;
    mentorId: string;
    menteeId: string;
    hasRescheduled: boolean;
    verificationResolvedAt: Date;
    missingAuthorIds: string[];
  }>;
};

function currentCycleVerification(meeting: VerifiableMeeting) {
  if (!isOutcomeVerified(meeting)) {
    return null;
  }

  return getCurrentVerification(meeting);
}

export function getFeedbackDueState(
  meetings: VerifiableMeeting[],
  userId: string,
  now = new Date(),
): FeedbackEnforcementState {
  const overdueMeetings: OverdueFeedbackMeeting[] = [];
  const eligibleMeetings: FeedbackEnforcementState["eligibleMeetings"] = [];

  for (const meeting of meetings) {
    const verification = currentCycleVerification(meeting);
    if (!verification?.verificationResolvedAt) {
      continue;
    }

    const verificationResolvedAt = verification.verificationResolvedAt;
    const missingAuthorIds = [meeting.mentorId, meeting.menteeId].filter(
      (authorId) =>
        !meeting.feedback.some((entry) => entry.authorId === authorId),
    );

    if (missingAuthorIds.length === 0) {
      continue;
    }

    eligibleMeetings.push({
      meetingId: meeting.id,
      mentorId: meeting.mentorId,
      menteeId: meeting.menteeId,
      hasRescheduled: meeting.hasRescheduled,
      verificationResolvedAt,
      missingAuthorIds,
    });

    const userOwesFeedback = missingAuthorIds.includes(userId);
    const elapsedMs = now.getTime() - verificationResolvedAt.getTime();

    if (userOwesFeedback && elapsedMs >= FEEDBACK_SOFT_BLOCK_MS) {
      overdueMeetings.push({
        meetingId: meeting.id,
        verificationResolvedAt,
        daysOverdue:
          Math.floor(elapsedMs / MS_PER_DAY) - FEEDBACK_SOFT_BLOCK_DAYS,
      });
    }
  }

  return {
    isSoftBlocked: overdueMeetings.length > 0,
    overdueMeetings,
    eligibleMeetings,
  };
}

export function getDueFeedbackReminderKeys(
  meeting: FeedbackEnforcementState["eligibleMeetings"][number],
  now = new Date(),
) {
  const elapsedMs = now.getTime() - meeting.verificationResolvedAt.getTime();
  const dueCount = Math.floor(elapsedMs / FEEDBACK_REMINDER_INTERVAL_MS);

  if (dueCount < 1) {
    return [];
  }

  return meeting.missingAuthorIds.flatMap((userId) =>
    Array.from({ length: dueCount }, (_, index) => ({
      userId,
      meetingId: meeting.meetingId,
      type: NotificationType.FEEDBACK_REMINDER,
      href:
        userId === meeting.mentorId
          ? "/dashboard/mentor"
          : "/dashboard/profile",
      dedupeKey: `meeting:${meeting.meetingId}:feedback-reminder:${index + 1}:cycle:${meeting.hasRescheduled ? 1 : 0}:user:${userId}`,
    })),
  );
}

export async function getFeedbackEnforcementState(
  userId: string,
  now = new Date(),
) {
  const meetings = await listCompletedMeetingsForUser(userId);
  return getFeedbackDueState(meetings, userId, now);
}

export async function assertUserCanRequestMeetings(
  userId: string,
  now = new Date(),
) {
  const enforcement = await getFeedbackEnforcementState(userId, now);
  if (enforcement.isSoftBlocked) {
    throw new FeedbackEnforcementError();
  }
}
