import {
  ADMIN_PAGE_SIZE,
  MENTOR_MILESTONE_COMPLETED_MEETINGS,
} from "@/lib/constants/admin";
import { FEEDBACK_SOFT_BLOCK_DAYS, FEEDBACK_SOFT_BLOCK_MS, MS_PER_DAY } from "@/lib/constants/enforcement";
import {
  countMeetingsForAdmin,
  findAdminMeetingById,
  listCompletedMentorMeetingCounts,
  listMeetingsForAdmin,
  listMeetingsInUtcRangeForAdmin,
  listNotCompletedMeetingsForAdmin,
  listStuckAttendanceMeetingsForAdmin,
  listVerifiedCompletedMeetingsForAdmin,
} from "@/lib/dal/meetings";
import {
  countUsersForAdmin,
  findAdminUserById,
  findUsersByIds,
  listUsersForAdmin,
} from "@/lib/dal/users";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import type {
  AdminCalendarMonthInput,
  AdminMeetingsFilterInput,
  AdminUsersFilterInput,
} from "@/lib/validations/admin";

import {
  getCurrentVerification,
  isOutcomeVerified,
  type VerifiableMeeting,
} from "./meeting-verification";

export type AdminAlertKind =
  | "NOT_COMPLETED"
  | "STUCK_ATTENDANCE"
  | "OVERDUE_FEEDBACK"
  | "MENTOR_MILESTONE";

export type AdminAlert = {
  kind: AdminAlertKind;
  href: string;
  title: string;
  detail: string;
  occurredAt: Date;
  meetingId?: string;
  userId?: string;
};

type AdminParticipant = {
  id: string;
  username: string;
  email: string;
};

type AdminListedMeeting = {
  id: string;
  status: MeetingStatus;
  scheduledAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
  mentee: AdminParticipant;
  mentor: AdminParticipant;
};

export function utcMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export function formatUtcMonthParam(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftUtcMonth(year: number, month: number, delta: number) {
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
  };
}

export function buildUtcMonthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leadingBlanks = first.getUTCDay();
  const cells: Array<{ date: Date | null }> = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push({ date: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(Date.UTC(year, month - 1, day)) });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null });
  }

  return cells;
}

export function mentorsReachingMilestone(
  counts: Array<{ mentorId: string; _count: { id: number } }>,
  threshold = MENTOR_MILESTONE_COMPLETED_MEETINGS,
) {
  return counts
    .filter((entry) => entry._count.id >= threshold)
    .sort((left, right) => right._count.id - left._count.id);
}

export function classifyOverdueFeedbackMeetings(
  meetings: Array<
    VerifiableMeeting & {
      updatedAt?: Date;
      completedAt?: Date | null;
      mentee: AdminParticipant;
      mentor: AdminParticipant;
    }
  >,
  now = new Date(),
) {
  const overdue: Array<{
    meeting: (typeof meetings)[number];
    daysOverdue: number;
    missingAuthorIds: string[];
  }> = [];

  for (const meeting of meetings) {
    if (!isOutcomeVerified(meeting)) {
      continue;
    }

    const verification = getCurrentVerification(meeting);
    if (!verification?.verificationResolvedAt) {
      continue;
    }

    const missingAuthorIds = [meeting.mentorId, meeting.menteeId].filter(
      (authorId) =>
        !meeting.feedback.some((entry) => entry.authorId === authorId),
    );

    if (missingAuthorIds.length === 0) {
      continue;
    }

    const elapsedMs = now.getTime() - verification.verificationResolvedAt.getTime();
    if (elapsedMs < FEEDBACK_SOFT_BLOCK_MS) {
      continue;
    }

    overdue.push({
      meeting,
      missingAuthorIds,
      daysOverdue: Math.floor(elapsedMs / MS_PER_DAY) - FEEDBACK_SOFT_BLOCK_DAYS,
    });
  }

  return overdue;
}

export function buildAdminAlerts(input: {
  notCompleted: AdminListedMeeting[];
  stuckAttendance: AdminListedMeeting[];
  overdueFeedback: ReturnType<typeof classifyOverdueFeedbackMeetings>;
  milestoneMentors: Array<{
    id: string;
    username: string;
    email: string;
    completedCount: number;
  }>;
}): AdminAlert[] {
  const alerts: AdminAlert[] = [
    ...input.notCompleted.map((meeting) => ({
      kind: "NOT_COMPLETED" as const,
      meetingId: meeting.id,
      href: `/admin/meetings/${meeting.id}`,
      title: "Did not happen",
      detail: `${meeting.mentee.username} and ${meeting.mentor.username}`,
      occurredAt: meeting.updatedAt,
    })),
    ...input.stuckAttendance.map((meeting) => ({
      kind: "STUCK_ATTENDANCE" as const,
      meetingId: meeting.id,
      href: `/admin/meetings/${meeting.id}`,
      title: "Stuck in attendance confirmed",
      detail: `${meeting.mentee.username} and ${meeting.mentor.username} — scheduled ${meeting.scheduledAt?.toISOString() ?? "unknown"}`,
      occurredAt: meeting.scheduledAt ?? meeting.updatedAt,
    })),
    ...input.overdueFeedback.map(({ meeting, daysOverdue, missingAuthorIds }) => ({
      kind: "OVERDUE_FEEDBACK" as const,
      meetingId: meeting.id,
      href: `/admin/meetings/${meeting.id}`,
      title: `Overdue feedback (${daysOverdue}d)`,
      detail: `${missingAuthorIds.length} participant${missingAuthorIds.length === 1 ? "" : "s"} still missing a rating`,
      occurredAt: meeting.completedAt ?? meeting.updatedAt ?? new Date(0),
    })),
    ...input.milestoneMentors.map((mentor) => ({
      kind: "MENTOR_MILESTONE" as const,
      userId: mentor.id,
      href: `/admin/users/${mentor.id}`,
      title: "Mentor 10-meeting milestone",
      detail: `${mentor.username} has ${mentor.completedCount} completed sessions`,
      occurredAt: new Date(0),
    })),
  ];

  return alerts.sort((left, right) => {
    if (left.kind === "MENTOR_MILESTONE" && right.kind !== "MENTOR_MILESTONE") {
      return 1;
    }
    if (right.kind === "MENTOR_MILESTONE" && left.kind !== "MENTOR_MILESTONE") {
      return -1;
    }
    return right.occurredAt.getTime() - left.occurredAt.getTime();
  });
}

export async function getAdminInbox(now = new Date()) {
  const [notCompleted, stuckAttendance, verifiedCompleted, mentorCounts] =
    await Promise.all([
      listNotCompletedMeetingsForAdmin(),
      listStuckAttendanceMeetingsForAdmin(now),
      listVerifiedCompletedMeetingsForAdmin(),
      listCompletedMentorMeetingCounts(),
    ]);

  const milestoneCounts = mentorsReachingMilestone(mentorCounts);
  const milestoneUsers = await findUsersByIds(
    milestoneCounts.map((entry) => entry.mentorId),
  );
  const countByMentor = new Map(
    milestoneCounts.map((entry) => [entry.mentorId, entry._count.id]),
  );

  return buildAdminAlerts({
    notCompleted,
    stuckAttendance,
    overdueFeedback: classifyOverdueFeedbackMeetings(verifiedCompleted, now),
    milestoneMentors: milestoneUsers.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      completedCount: countByMentor.get(user.id) ?? 0,
    })),
  });
}

export async function getAdminMeetingsReport(filters: AdminMeetingsFilterInput) {
  const skip = (filters.page - 1) * ADMIN_PAGE_SIZE;
  const [meetings, total] = await Promise.all([
    listMeetingsForAdmin(
      { status: filters.status, participant: filters.participant },
      skip,
      ADMIN_PAGE_SIZE,
    ),
    countMeetingsForAdmin({
      status: filters.status,
      participant: filters.participant,
    }),
  ]);

  return {
    meetings,
    total,
    page: filters.page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminMeetingDetail(id: string) {
  return findAdminMeetingById(id);
}

export async function getAdminCalendar(month: AdminCalendarMonthInput) {
  const { start, end } = utcMonthRange(month.year, month.month);
  const meetings = await listMeetingsInUtcRangeForAdmin(start, end);
  const cells = buildUtcMonthGrid(month.year, month.month);

  return {
    year: month.year,
    month: month.month,
    previous: shiftUtcMonth(month.year, month.month, -1),
    next: shiftUtcMonth(month.year, month.month, 1),
    cells: cells.map((cell) => {
      if (!cell.date) {
        return { date: null, meetings: [] };
      }

      const day = cell.date.getUTCDate();
      return {
        date: cell.date,
        meetings: meetings.filter((meeting) => {
          if (!meeting.scheduledAt) {
            return false;
          }
          return (
            meeting.scheduledAt.getUTCFullYear() === month.year &&
            meeting.scheduledAt.getUTCMonth() + 1 === month.month &&
            meeting.scheduledAt.getUTCDate() === day
          );
        }),
      };
    }),
  };
}

export async function getAdminUsersDirectory(filters: AdminUsersFilterInput) {
  const skip = (filters.page - 1) * ADMIN_PAGE_SIZE;
  const [users, total] = await Promise.all([
    listUsersForAdmin(filters.q, skip, ADMIN_PAGE_SIZE),
    countUsersForAdmin(filters.q),
  ]);

  return {
    users,
    total,
    page: filters.page,
    pageSize: ADMIN_PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export async function getAdminUserDetail(id: string) {
  return findAdminUserById(id);
}
