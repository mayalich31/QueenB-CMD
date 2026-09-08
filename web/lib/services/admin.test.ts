import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/dal/meetings", () => ({
  countMeetingsByStatusForAdmin: vi.fn(),
  countMeetingsForAdmin: vi.fn(),
  findAdminMeetingById: vi.fn(),
  listCompletedMeetingDatesForAdmin: vi.fn(),
  listCompletedMentorMeetingCounts: vi.fn(),
  listMeetingsMetricsForAdmin: vi.fn(),
  listMeetingsForAdmin: vi.fn(),
  listMeetingsInUtcRangeForAdmin: vi.fn(),
  listNotCompletedMeetingsForAdmin: vi.fn(),
  listStuckAttendanceMeetingsForAdmin: vi.fn(),
  listVerifiedCompletedMeetingsForAdmin: vi.fn(),
}));
vi.mock("@/lib/dal/users", () => ({
  countMentorsForAdmin: vi.fn(),
  countUsersForAdmin: vi.fn(),
  findAdminUserById: vi.fn(),
  findUsersByIds: vi.fn(),
  listUserSignupDatesForAdmin: vi.fn(),
  listUsersForAdmin: vi.fn(),
}));
vi.mock("@/lib/dal/mentor-profiles", () => ({
  listActiveMentorTopicsForAdmin: vi.fn(),
}));

import { MENTOR_MILESTONE_COMPLETED_MEETINGS } from "@/lib/constants/admin";
import { FEEDBACK_SOFT_BLOCK_MS } from "@/lib/constants/enforcement";
import { MeetingStatus } from "@/lib/generated/prisma/enums";

import {
  buildAdminAlerts,
  buildUtcMonthGrid,
  classifyOverdueFeedbackMeetings,
  bucketMeetingsByWeekday,
  bucketUserGrowthByDay,
  classifyRequestResponse,
  countAlertsByKind,
  lastUtcDayKeys,
  mapTopMentors,
  mentorsReachingMilestone,
  percentChange,
  shiftUtcMonth,
  summarizeMeetingStatuses,
  summarizeRequestResponses,
  summarizeTopicsOffered,
  utcMonthRange,
} from "./admin";
import type { VerifiableMeeting } from "./meeting-verification";

const mentee = {
  id: "mentee-id",
  username: "maya",
  email: "maya@example.com",
};
const mentor = {
  id: "mentor-id",
  username: "nina",
  email: "nina@example.com",
};

const resolvedAt = new Date("2026-09-01T12:00:00.000Z");

function verifiedMeeting(
  overrides: Partial<VerifiableMeeting> = {},
): VerifiableMeeting & {
  mentee: typeof mentee;
  mentor: typeof mentor;
  completedAt: Date | null;
  updatedAt: Date;
} {
  return {
    id: "meeting-id",
    mentorId: mentor.id,
    menteeId: mentee.id,
    status: MeetingStatus.COMPLETED,
    hasRescheduled: false,
    feedback: [],
    verifications: [
      {
        cycle: 0,
        mentorDidHappen: true,
        menteeDidHappen: true,
        mentorWantsReschedule: null,
        menteeWantsReschedule: null,
        verificationResolvedAt: resolvedAt,
      },
    ],
    mentee,
    mentor,
    completedAt: resolvedAt,
    updatedAt: resolvedAt,
    ...overrides,
  };
}

describe("admin inbox classification", () => {
  it("builds alerts for the four inbox kinds", () => {
    const alerts = buildAdminAlerts({
      notCompleted: [
        {
          id: "did-not-happen",
          status: MeetingStatus.NOT_COMPLETED,
          scheduledAt: null,
          completedAt: null,
          updatedAt: new Date("2026-09-07T10:00:00.000Z"),
          mentee,
          mentor,
        },
      ],
      stuckAttendance: [
        {
          id: "stuck",
          status: MeetingStatus.ATTENDANCE_CONFIRMED,
          scheduledAt: new Date("2026-09-06T10:00:00.000Z"),
          completedAt: null,
          updatedAt: new Date("2026-09-06T10:00:00.000Z"),
          mentee,
          mentor,
        },
      ],
      overdueFeedback: [
        {
          meeting: verifiedMeeting(),
          daysOverdue: 2,
          missingAuthorIds: [mentee.id],
        },
      ],
      milestoneMentors: [
        {
          id: mentor.id,
          username: mentor.username,
          email: mentor.email,
          completedCount: 10,
        },
      ],
    });

    expect(alerts.map((alert) => alert.kind)).toEqual([
      "NOT_COMPLETED",
      "STUCK_ATTENDANCE",
      "OVERDUE_FEEDBACK",
      "MENTOR_MILESTONE",
    ]);
    expect(alerts[0].href).toBe("/admin/meetings/did-not-happen");
    expect(alerts[3].href).toBe(`/admin/users/${mentor.id}`);
  });

  it("hides mentors below the 10 completed-session milestone", () => {
    expect(
      mentorsReachingMilestone([
        { mentorId: "nine", _count: { id: MENTOR_MILESTONE_COMPLETED_MEETINGS - 1 } },
        { mentorId: "ten", _count: { id: MENTOR_MILESTONE_COMPLETED_MEETINGS } },
        { mentorId: "twelve", _count: { id: 12 } },
      ]).map((entry) => entry.mentorId),
    ).toEqual(["twelve", "ten"]);
  });

  it("flags feedback overdue after seven days and ignores earlier missing ratings", () => {
    const meeting = verifiedMeeting();
    const daySix = new Date(resolvedAt.getTime() + FEEDBACK_SOFT_BLOCK_MS - 1);
    const daySeven = new Date(resolvedAt.getTime() + FEEDBACK_SOFT_BLOCK_MS);

    expect(classifyOverdueFeedbackMeetings([meeting], daySix)).toHaveLength(0);
    expect(classifyOverdueFeedbackMeetings([meeting], daySeven)).toHaveLength(1);
  });
});

describe("admin calendar month helpers", () => {
  it("builds a UTC month range and grid including leading blanks", () => {
    const range = utcMonthRange(2026, 9);
    expect(range.start.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-01T00:00:00.000Z");

    const cells = buildUtcMonthGrid(2026, 9);
    expect(cells[0].date).toBeNull();
    expect(cells[2].date?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(cells.length % 7).toBe(0);
  });

  it("shifts months across year boundaries", () => {
    expect(shiftUtcMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftUtcMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
});

describe("admin summary aggregation", () => {
  it("fills every meeting status and totals alert kinds", () => {
    const byStatus = summarizeMeetingStatuses([
      { status: MeetingStatus.SCHEDULED, _count: { id: 4 } },
      { status: MeetingStatus.COMPLETED, _count: { id: 2 } },
    ]);

    expect(byStatus[MeetingStatus.SCHEDULED]).toBe(4);
    expect(byStatus[MeetingStatus.COMPLETED]).toBe(2);
    expect(byStatus[MeetingStatus.CANCELLED]).toBe(0);

    expect(
      countAlertsByKind([
        {
          kind: "NOT_COMPLETED",
          href: "/admin/meetings/1",
          title: "Did not happen",
          detail: "",
          occurredAt: new Date(),
        },
        {
          kind: "NOT_COMPLETED",
          href: "/admin/meetings/2",
          title: "Did not happen",
          detail: "",
          occurredAt: new Date(),
        },
        {
          kind: "OVERDUE_FEEDBACK",
          href: "/admin/meetings/3",
          title: "Overdue",
          detail: "",
          occurredAt: new Date(),
        },
      ]),
    ).toEqual({
      NOT_COMPLETED: 2,
      STUCK_ATTENDANCE: 0,
      OVERDUE_FEEDBACK: 1,
      MENTOR_MILESTONE: 0,
    });
  });
});

describe("admin metrics helpers", () => {
  const now = new Date("2026-09-15T12:00:00.000Z");

  it("returns seven UTC day keys ending today", () => {
    expect(lastUtcDayKeys(now)).toEqual([
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]);
  });

  it("computes day-over-day percent change", () => {
    expect(percentChange(102, 100)).toBe(2);
    expect(percentChange(98, 100)).toBe(-2);
    expect(percentChange(5, 0)).toBe(100);
    expect(percentChange(0, 0)).toBe(0);
  });

  it("buckets mentor vs mentee signups by day", () => {
    const growth = bucketUserGrowthByDay(
      [
        { createdAt: new Date("2026-09-15T01:00:00.000Z"), isMentor: true },
        { createdAt: new Date("2026-09-15T08:00:00.000Z"), isMentor: false },
        { createdAt: new Date("2026-09-14T20:00:00.000Z"), isMentor: false },
        { createdAt: new Date("2026-08-01T00:00:00.000Z"), isMentor: true },
      ],
      now,
    );

    expect(growth).toHaveLength(7);
    expect(growth[6]).toEqual({
      day: "2026-09-15",
      label: "Tue",
      mentors: 1,
      mentees: 1,
    });
    expect(growth[5]).toEqual({
      day: "2026-09-14",
      label: "Mon",
      mentors: 0,
      mentees: 1,
    });
    expect(growth[0].mentors + growth[0].mentees).toBe(0);
  });

  it("classifies request responses and weekday meeting stacks", () => {
    expect(
      classifyRequestResponse(
        {
          status: MeetingStatus.SCHEDULED,
          createdAt: now,
          slotCount: 2,
        },
        now,
      ),
    ).toBe("accepted");
    expect(
      classifyRequestResponse(
        {
          status: MeetingStatus.CANCELLED,
          createdAt: now,
          slotCount: 0,
        },
        now,
      ),
    ).toBe("declined");
    expect(
      classifyRequestResponse(
        {
          status: MeetingStatus.WAITING_FOR_MENTOR_TIMES,
          createdAt: new Date("2026-09-01T00:00:00.000Z"),
          slotCount: 0,
        },
        now,
      ),
    ).toBe("expired");
    expect(
      classifyRequestResponse(
        {
          status: MeetingStatus.WAITING_FOR_MENTOR_TIMES,
          createdAt: new Date("2026-09-14T00:00:00.000Z"),
          slotCount: 0,
        },
        now,
      ),
    ).toBe("pending");

    expect(
      summarizeRequestResponses(
        [
          { status: MeetingStatus.COMPLETED, createdAt: now, slotCount: 1 },
          { status: MeetingStatus.COMPLETED, createdAt: now, slotCount: 1 },
          { status: MeetingStatus.CANCELLED, createdAt: now, slotCount: 0 },
          {
            status: MeetingStatus.WAITING_FOR_MENTOR_TIMES,
            createdAt: new Date("2026-09-01T00:00:00.000Z"),
            slotCount: 0,
          },
        ],
        now,
      ).percents,
    ).toEqual({ accepted: 50, declined: 25, expired: 25 });

    const stacked = bucketMeetingsByWeekday(
      [
        {
          createdAt: new Date("2026-09-15T10:00:00.000Z"),
          status: MeetingStatus.SCHEDULED,
        },
        {
          createdAt: new Date("2026-09-15T11:00:00.000Z"),
          status: MeetingStatus.COMPLETED,
        },
        {
          createdAt: new Date("2026-09-14T11:00:00.000Z"),
          status: MeetingStatus.CANCELLED,
        },
      ],
      now,
    );

    expect(stacked[6][MeetingStatus.SCHEDULED]).toBe(1);
    expect(stacked[6][MeetingStatus.COMPLETED]).toBe(1);
    expect(stacked[5][MeetingStatus.CANCELLED]).toBe(1);
  });

  it("counts canonical topics and ranks top mentors", () => {
    expect(
      summarizeTopicsOffered([
        { topics: ["career_planning", "resume_review"] },
        { topics: ["career_planning", "unknown_topic"] },
      ]).find((row) => row.topic === "career_planning")?.count,
    ).toBe(2);

    expect(
      mapTopMentors(
        [
          { mentorId: "a", _count: { id: 3 } },
          { mentorId: "b", _count: { id: 9 } },
          { mentorId: "c", _count: { id: 1 } },
        ],
        [
          { id: "a", username: "ava" },
          { id: "b", username: "bella" },
        ],
        2,
      ),
    ).toEqual([
      { userId: "b", username: "bella", completedCount: 9 },
      { userId: "a", username: "ava", completedCount: 3 },
    ]);
  });
});
