import {
  findEligibleMeetingsForCompletion,
  findMeetingById,
  listCompletedMeetingsAwaitingFeedback,
  lockMeetingForUpdate,
  updateMeetingState,
} from "@/lib/dal/meetings";
import { MeetingStatus, NotificationType } from "@/lib/generated/prisma/enums";

import {
  getDueFeedbackReminderKeys,
  getFeedbackDueState,
} from "./enforcement";
import { getMeetingTransitionPatch } from "./meeting-state-machine";
import { createNotifications, notifyMeetingUsers } from "./notifications";
import { runSerializableTransaction } from "./transaction";

export async function runMeetingCompletionJob(now = new Date()) {
  const eligible = await findEligibleMeetingsForCompletion(now);
  let completed = 0;

  for (const meeting of eligible) {
    const updated = await runSerializableTransaction(async (transaction) => {
      await lockMeetingForUpdate(meeting.id, transaction);
      const current = await findMeetingById(meeting.id, transaction);

      if (
        !current ||
        current.status !== MeetingStatus.ATTENDANCE_CONFIRMED ||
        !current.scheduledAt ||
        current.scheduledAt > now
      ) {
        return null;
      }

      const patch = getMeetingTransitionPatch(
        current,
        MeetingStatus.COMPLETED,
        now,
      );
      const completedMeeting = await updateMeetingState(
        current.id,
        patch,
        transaction,
      );
      await notifyMeetingUsers(
        transaction,
        current,
        [current.mentorId, current.menteeId],
        NotificationType.MEETING_VERIFICATION_REQUIRED,
        "verification-required",
      );
      return completedMeeting;
    });

    if (updated) {
      completed += 1;
    }
  }

  return { scanned: eligible.length, completed };
}

export async function runFeedbackReminderJob(now = new Date()) {
  const meetings = await listCompletedMeetingsAwaitingFeedback();
  const reminders = meetings.flatMap((meeting) => {
    const state = getFeedbackDueState([meeting], meeting.menteeId, now);
    return state.eligibleMeetings.flatMap((eligible) =>
      getDueFeedbackReminderKeys(eligible, now),
    );
  });

  const created = await createNotifications(reminders);
  return { scanned: meetings.length, reminded: created.count };
}
