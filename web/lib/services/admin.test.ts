import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/dal/meetings", () => ({
  countMeetingsForAdmin: vi.fn(),
  findAdminMeetingById: vi.fn(),
  listCompletedMentorMeetingCounts: vi.fn(),
  listMeetingsForAdmin: vi.fn(),
  listMeetingsInUtcRangeForAdmin: vi.fn(),
  listNotCompletedMeetingsForAdmin: vi.fn(),
  listStuckAttendanceMeetingsForAdmin: vi.fn(),
  listVerifiedCompletedMeetingsForAdmin: vi.fn(),
}));
vi.mock("@/lib/dal/users", () => ({
  countUsersForAdmin: vi.fn(),
  findAdminUserById: vi.fn(),
  findUsersByIds: vi.fn(),
  listUsersForAdmin: vi.fn(),
}));

import { MENTOR_MILESTONE_COMPLETED_MEETINGS } from "@/lib/constants/admin";
import { FEEDBACK_SOFT_BLOCK_MS } from "@/lib/constants/enforcement";
import { MeetingStatus } from "@/lib/generated/prisma/enums";

import {
  buildAdminAlerts,
  buildUtcMonthGrid,
  classifyOverdueFeedbackMeetings,
  mentorsReachingMilestone,
  shiftUtcMonth,
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
