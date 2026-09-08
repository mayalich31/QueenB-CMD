import {
  ADMIN_METRICS_DAYS,
  ADMIN_PAGE_SIZE,
  ADMIN_REQUEST_TIMEOUT_DAYS,
  ADMIN_TOP_MENTORS,
  MENTOR_MILESTONE_COMPLETED_MEETINGS,
} from "@/lib/constants/admin";
import { FEEDBACK_SOFT_BLOCK_DAYS, FEEDBACK_SOFT_BLOCK_MS, MS_PER_DAY } from "@/lib/constants/enforcement";
import {
  MENTORING_TOPIC_LABELS,
  MENTORING_TOPIC_VALUES,
  type MentoringTopic,
} from "@/lib/constants/mentoring-topics";
import { listActiveMentorTopicsForAdmin } from "@/lib/dal/mentor-profiles";
import {
  countMeetingsByStatusForAdmin,
  countMeetingsForAdmin,
  findAdminMeetingById,
  listCompletedMentorMeetingCounts,
  listMeetingsMetricsForAdmin,
  listMeetingsForAdmin,
  listMeetingsInUtcRangeForAdmin,
  listNotCompletedMeetingsForAdmin,
  listStuckAttendanceMeetingsForAdmin,
  listVerifiedCompletedMeetingsForAdmin,
} from "@/lib/dal/meetings";
import {
  countMentorsForAdmin,
  countUsersForAdmin,
  findAdminUserById,
  findUsersByIds,
  listUserSignupDatesForAdmin,
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

export function emptyMeetingStatusCounts(): Record<MeetingStatus, number> {
  return {
    [MeetingStatus.WAITING_FOR_MENTOR_TIMES]: 0,
    [MeetingStatus.WAITING_FOR_MENTEE_SELECTION]: 0,
    [MeetingStatus.SCHEDULED]: 0,
    [MeetingStatus.ATTENDANCE_CONFIRMED]: 0,
    [MeetingStatus.COMPLETED]: 0,
    [MeetingStatus.NOT_COMPLETED]: 0,
    [MeetingStatus.CANCELLED]: 0,
  };
}

export function summarizeMeetingStatuses(
  rows: Array<{ status: MeetingStatus; _count: { id: number } }>,
) {
  const counts = emptyMeetingStatusCounts();
  for (const row of rows) {
    counts[row.status] = row._count.id;
  }
  return counts;
}

export function countAlertsByKind(alerts: AdminAlert[]) {
  const counts: Record<AdminAlertKind, number> = {
    NOT_COMPLETED: 0,
    STUCK_ATTENDANCE: 0,
    OVERDUE_FEEDBACK: 0,
    MENTOR_MILESTONE: 0,
  };

  for (const alert of alerts) {
    counts[alert.kind] += 1;
  }

  return counts;
}

export function utcDayStart(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function utcDayKey(date: Date) {
  return utcDayStart(date).toISOString().slice(0, 10);
}

export function lastUtcDayKeys(now: Date, count = ADMIN_METRICS_DAYS) {
  const start = utcDayStart(now);
  const keys: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const day = new Date(start.getTime() - offset * MS_PER_DAY);
    keys.push(utcDayKey(day));
  }

  return keys;
}

export function formatUtcDayLabel(dayKey: string) {
  return new Date(`${dayKey}T00:00:00.000Z`).toLocaleString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export function countCreatedBefore(
  records: Array<{ createdAt: Date }>,
  before: Date,
) {
  return records.filter((record) => record.createdAt < before).length;
}

export function bucketUserGrowthByDay(
  users: Array<{ createdAt: Date; isMentor: boolean }>,
  now: Date,
) {
  const keys = lastUtcDayKeys(now);
  const buckets = new Map(
    keys.map((day) => [
      day,
      { day, label: formatUtcDayLabel(day), mentors: 0, mentees: 0 },
    ]),
  );

  for (const user of users) {
    const bucket = buckets.get(utcDayKey(user.createdAt));
    if (!bucket) {
      continue;
    }

    if (user.isMentor) {
      bucket.mentors += 1;
    } else {
      bucket.mentees += 1;
    }
  }

  return keys.map((key) => buckets.get(key)!);
}

export function bucketMeetingsByWeekday(
  meetings: Array<{ createdAt: Date; status: MeetingStatus }>,
  now: Date,
) {
  const keys = lastUtcDayKeys(now);
  const buckets = new Map(
    keys.map((day) => [
      day,
      {
        day,
        label: formatUtcDayLabel(day),
        ...emptyMeetingStatusCounts(),
      },
    ]),
  );

  for (const meeting of meetings) {
    const bucket = buckets.get(utcDayKey(meeting.createdAt));
    if (!bucket) {
      continue;
    }

    bucket[meeting.status] += 1;
  }

  return keys.map((key) => buckets.get(key)!);
}

export type RequestResponseKind = "accepted" | "declined" | "expired" | "pending";

export function classifyRequestResponse(
  meeting: { status: MeetingStatus; createdAt: Date; slotCount: number },
  now: Date,
  timeoutDays = ADMIN_REQUEST_TIMEOUT_DAYS,
): RequestResponseKind {
  if (meeting.status === MeetingStatus.WAITING_FOR_MENTOR_TIMES) {
    const ageMs = now.getTime() - meeting.createdAt.getTime();
    return ageMs >= timeoutDays * MS_PER_DAY ? "expired" : "pending";
  }

  if (meeting.status === MeetingStatus.CANCELLED && meeting.slotCount === 0) {
    return "declined";
  }

  return "accepted";
}

export function summarizeRequestResponses(
  meetings: Array<{ status: MeetingStatus; createdAt: Date; slotCount: number }>,
  now: Date,
) {
  const counts = {
    accepted: 0,
    declined: 0,
    expired: 0,
    pending: 0,
  };

  for (const meeting of meetings) {
    counts[classifyRequestResponse(meeting, now)] += 1;
  }

  const resolved = counts.accepted + counts.declined + counts.expired;
  const percent = (value: number) =>
    resolved === 0 ? 0 : Math.round((value / resolved) * 100);

  return {
    counts,
    percents: {
      accepted: percent(counts.accepted),
      declined: percent(counts.declined),
      expired: percent(counts.expired),
    },
  };
}

export function summarizeTopicsOffered(profiles: Array<{ topics: string[] }>) {
  const counts = Object.fromEntries(
    MENTORING_TOPIC_VALUES.map((topic) => [topic, 0]),
  ) as Record<MentoringTopic, number>;

  for (const profile of profiles) {
    for (const topic of profile.topics) {
      if (topic in counts) {
        counts[topic as MentoringTopic] += 1;
      }
    }
  }

  return MENTORING_TOPIC_VALUES.map((topic) => ({
    topic,
    label: MENTORING_TOPIC_LABELS[topic],
    count: counts[topic],
  }));
}

export function mapTopMentors(
  counts: Array<{ mentorId: string; _count: { id: number } }>,
  users: Array<{ id: string; username: string }>,
  limit = ADMIN_TOP_MENTORS,
) {
  const usernames = new Map(users.map((user) => [user.id, user.username]));

  return [...counts]
    .sort((left, right) => right._count.id - left._count.id)
    .slice(0, limit)
    .map((entry) => ({
      userId: entry.mentorId,
      username: usernames.get(entry.mentorId) ?? "Unknown",
      completedCount: entry._count.id,
    }));
}

export async function getAdminSummary(now = new Date()) {
  const [userTotal, mentorTotal, statusRows, alerts] = await Promise.all([
    countUsersForAdmin(undefined),
    countMentorsForAdmin(),
    countMeetingsByStatusForAdmin(),
    getAdminInbox(now),
  ]);

  const meetingStatusCounts = summarizeMeetingStatuses(statusRows);
  const meetingTotal = Object.values(meetingStatusCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const todayStart = utcDayStart(now);

  return {
    users: {
      total: userTotal,
      mentors: mentorTotal,
      others: userTotal - mentorTotal,
    },
    meetings: {
      total: meetingTotal,
      byStatus: meetingStatusCounts,
    },
    alerts: {
      total: alerts.length,
      byKind: countAlertsByKind(alerts),
      previous: alerts.filter((alert) => alert.occurredAt < todayStart).length,
    },
  };
}

export async function getAdminMetrics(now = new Date()) {
  const [summary, signups, meetingRows, mentorCounts, topicProfiles] =
    await Promise.all([
      getAdminSummary(now),
      listUserSignupDatesForAdmin(),
      listMeetingsMetricsForAdmin(),
      listCompletedMentorMeetingCounts(),
      listActiveMentorTopicsForAdmin(),
    ]);

  const todayStart = utcDayStart(now);
  const completedMeetings = meetingRows.filter(
    (meeting) => meeting.status === MeetingStatus.COMPLETED,
  );
  const completedPrevious = completedMeetings.filter((meeting) => {
    const at = meeting.completedAt ?? meeting.createdAt;
    return at < todayStart;
  }).length;

  const topCountRows = [...mentorCounts]
    .sort((left, right) => right._count.id - left._count.id)
    .slice(0, ADMIN_TOP_MENTORS);
  const topUsers = await findUsersByIds(topCountRows.map((row) => row.mentorId));

  return {
    ...summary,
    changes: {
      users: percentChange(
        summary.users.total,
        countCreatedBefore(signups, todayStart),
      ),
      mentors: percentChange(
        summary.users.mentors,
        signups.filter((user) => user.isMentor && user.createdAt < todayStart)
          .length,
      ),
      meetings: percentChange(
        summary.meetings.total,
        countCreatedBefore(meetingRows, todayStart),
      ),
      completed: percentChange(
        summary.meetings.byStatus[MeetingStatus.COMPLETED],
        completedPrevious,
      ),
      alerts: percentChange(summary.alerts.total, summary.alerts.previous),
    },
    userGrowth: bucketUserGrowthByDay(signups, now),
    requestResponses: summarizeRequestResponses(
      meetingRows.map((meeting) => ({
        status: meeting.status,
        createdAt: meeting.createdAt,
        slotCount: meeting._count.slots,
      })),
      now,
    ),
    topMentors: mapTopMentors(topCountRows, topUsers),
    topicsOffered: summarizeTopicsOffered(topicProfiles),
    meetingsByWeekday: bucketMeetingsByWeekday(meetingRows, now),
  };
}
