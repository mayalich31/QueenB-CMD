import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingStatus, NotificationType } from "@/lib/generated/prisma/enums";

const mocks = vi.hoisted(() => ({
  findEligibleMeetingsForCompletion: vi.fn(),
  findMeetingById: vi.fn(),
  listCompletedMeetingsAwaitingFeedback: vi.fn(),
  lockMeetingForUpdate: vi.fn(),
  updateMeetingState: vi.fn(),
  createNotifications: vi.fn(),
  notifyMeetingUsers: vi.fn(),
}));

vi.mock("@/lib/dal/meetings", () => ({
  findEligibleMeetingsForCompletion: mocks.findEligibleMeetingsForCompletion,
  findMeetingById: mocks.findMeetingById,
  listCompletedMeetingsAwaitingFeedback: mocks.listCompletedMeetingsAwaitingFeedback,
  lockMeetingForUpdate: mocks.lockMeetingForUpdate,
  updateMeetingState: mocks.updateMeetingState,
}));

vi.mock("./notifications", () => ({
  createNotifications: mocks.createNotifications,
  notifyMeetingUsers: mocks.notifyMeetingUsers,
}));

vi.mock("./transaction", () => ({
  runSerializableTransaction: vi.fn(
    (operation: (transaction: object) => unknown) => operation({}),
  ),
}));

import {
  runFeedbackReminderJob,
  runMeetingCompletionJob,
} from "./cron-jobs";

describe("scheduled jobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.lockMeetingForUpdate.mockResolvedValue(undefined);
    mocks.updateMeetingState.mockResolvedValue({});
    mocks.notifyMeetingUsers.mockResolvedValue({ count: 2 });
    mocks.createNotifications.mockResolvedValue({ count: 0 });
  });

  it("completes due meetings through the state machine and is restart-safe", async () => {
    const now = new Date("2026-09-07T13:00:00.000Z");
    const meeting = {
      id: "meeting-id",
      mentorId: "mentor-id",
      menteeId: "mentee-id",
      status: MeetingStatus.ATTENDANCE_CONFIRMED,
      scheduledAt: new Date("2026-09-07T12:00:00.000Z"),
      completedAt: null,
      mentorAttendanceConfirmedAt: now,
      menteeAttendanceConfirmedAt: now,
      hasRequestedMoreTimes: false,
      hasRescheduled: false,
    };
    mocks.findEligibleMeetingsForCompletion.mockResolvedValue([meeting]);
    mocks.findMeetingById.mockResolvedValue(meeting);

    await expect(runMeetingCompletionJob(now)).resolves.toEqual({
      scanned: 1,
      completed: 1,
    });
    expect(mocks.updateMeetingState).toHaveBeenCalledWith(
      "meeting-id",
      { status: MeetingStatus.COMPLETED, completedAt: now },
      expect.anything(),
    );
    expect(mocks.notifyMeetingUsers).toHaveBeenCalledWith(
      expect.anything(),
      meeting,
      ["mentor-id", "mentee-id"],
      NotificationType.MEETING_VERIFICATION_REQUIRED,
      "verification-required",
    );

    mocks.findMeetingById.mockResolvedValue({
      ...meeting,
      status: MeetingStatus.COMPLETED,
      completedAt: now,
    });
    await expect(runMeetingCompletionJob(now)).resolves.toEqual({
      scanned: 1,
      completed: 0,
    });
  });

  it("does not remind before the two-day interval", async () => {
    const resolvedAt = new Date("2026-09-01T12:00:00.000Z");
    mocks.listCompletedMeetingsAwaitingFeedback.mockResolvedValue([
      {
        id: "meeting-id",
        mentorId: "mentor-id",
        menteeId: "mentee-id",
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
      },
    ]);

    await runFeedbackReminderJob(
      new Date(resolvedAt.getTime() + 24 * 60 * 60 * 1000),
    );

    expect(mocks.createNotifications).toHaveBeenCalledWith([]);
  });
});
