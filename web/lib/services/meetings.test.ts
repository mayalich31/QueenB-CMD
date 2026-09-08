import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingStatus, NotificationType } from "@/lib/generated/prisma/enums";

const mocks = vi.hoisted(() => ({
  clearMeetingSlots: vi.fn(),
  createMeetingVerification: vi.fn(),
  findMeetingById: vi.fn(),
  findMeetingVerification: vi.fn(),
  lockMeetingForUpdate: vi.fn(),
  updateMeetingVerification: vi.fn(),
  updateMeetingState: vi.fn(),
}));

vi.mock("@/lib/dal/meetings", () => ({
  clearMeetingSlots: mocks.clearMeetingSlots,
  completeEligibleMeetings: vi.fn(),
  countActiveMentorMeetings: vi.fn(),
  createMeetingVerification: mocks.createMeetingVerification,
  createMeeting: vi.fn(),
  findActiveMeetingBetween: vi.fn(),
  findActiveMentorProfile: vi.fn(),
  findMeetingById: mocks.findMeetingById,
  findMeetingSlotById: vi.fn(),
  findMeetingVerification: mocks.findMeetingVerification,
  listMenteeMeetings: vi.fn(),
  listMentorMeetings: vi.fn(),
  listPendingMentorRequests: vi.fn(),
  markMeetingSlotSelected: vi.fn(),
  lockMeetingForUpdate: mocks.lockMeetingForUpdate,
  listCompletedMeetingsForUser: vi.fn(),
  replaceMeetingSlots: vi.fn(),
  updateMeetingVerification: mocks.updateMeetingVerification,
  updateMeetingState: mocks.updateMeetingState,
}));

vi.mock("./transaction", () => ({
  runSerializableTransaction: vi.fn(
    (operation: (transaction: object) => unknown) => operation({}),
  ),
}));

const notificationMocks = vi.hoisted(() => ({
  createNotification: vi.fn().mockResolvedValue({}),
  createNotifications: vi.fn().mockResolvedValue({ count: 1 }),
  notifyMeetingUsers: vi.fn().mockResolvedValue({ count: 1 }),
}));

vi.mock("./notifications", () => notificationMocks);

import {
  answerMeetingOutcomeForParticipant,
  answerMeetingRescheduleIntentForParticipant,
  cancelMeetingForParticipant,
  confirmMeetingAttendanceForParticipant,
} from "./meetings";

const meetingId = "d9428888-122b-4e1f-9f2f-07ed2fd8556f";
const scheduledMeeting = {
  id: meetingId,
  mentorId: "mentor-id",
  menteeId: "mentee-id",
  status: MeetingStatus.SCHEDULED,
  scheduledAt: new Date("2026-09-07T12:00:00.000Z"),
  completedAt: null,
  mentorAttendanceConfirmedAt: null,
  menteeAttendanceConfirmedAt: null,
  hasRequestedMoreTimes: false,
  hasRescheduled: false,
  slots: [],
  feedback: [],
  verifications: [],
};

describe("bilateral meeting services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateMeetingState.mockResolvedValue({});
    mocks.lockMeetingForUpdate.mockResolvedValue(undefined);
  });

  it("keeps the meeting scheduled after the first confirmation", async () => {
    mocks.findMeetingById.mockResolvedValue(scheduledMeeting);

    await confirmMeetingAttendanceForParticipant("mentor-id", meetingId);

    expect(mocks.updateMeetingState).toHaveBeenCalledWith(
      meetingId,
      expect.objectContaining({
        status: MeetingStatus.SCHEDULED,
        mentorAttendanceConfirmedAt: expect.any(Date),
      }),
      expect.anything(),
    );
  });

  it("promotes the meeting after the second confirmation", async () => {
    mocks.findMeetingById.mockResolvedValue({
      ...scheduledMeeting,
      mentorAttendanceConfirmedAt: new Date("2026-09-06T12:00:00.000Z"),
    });

    await confirmMeetingAttendanceForParticipant("mentee-id", meetingId);

    expect(mocks.updateMeetingState).toHaveBeenCalledWith(
      meetingId,
      expect.objectContaining({
        status: MeetingStatus.ATTENDANCE_CONFIRMED,
        menteeAttendanceConfirmedAt: expect.any(Date),
      }),
      expect.anything(),
    );
  });

  it("is idempotent after both confirmations are recorded", async () => {
    const confirmedMeeting = {
      ...scheduledMeeting,
      status: MeetingStatus.ATTENDANCE_CONFIRMED,
      mentorAttendanceConfirmedAt: new Date("2026-09-06T12:00:00.000Z"),
      menteeAttendanceConfirmedAt: new Date("2026-09-06T12:05:00.000Z"),
    };
    mocks.findMeetingById.mockResolvedValue(confirmedMeeting);

    await expect(
      confirmMeetingAttendanceForParticipant("mentor-id", meetingId),
    ).resolves.toBe(confirmedMeeting);
    expect(mocks.updateMeetingState).not.toHaveBeenCalled();
  });

  it("allows a participant to cancel and clears confirmations", async () => {
    mocks.findMeetingById.mockResolvedValue({
      ...scheduledMeeting,
      mentorAttendanceConfirmedAt: new Date("2026-09-06T12:00:00.000Z"),
    });

    await cancelMeetingForParticipant("mentee-id", meetingId);

    expect(mocks.updateMeetingState).toHaveBeenCalledWith(
      meetingId,
      {
        status: MeetingStatus.CANCELLED,
        mentorAttendanceConfirmedAt: null,
        menteeAttendanceConfirmedAt: null,
      },
      expect.anything(),
    );
  });

  it("rejects confirmation and cancellation by an outsider", async () => {
    mocks.findMeetingById.mockResolvedValue(scheduledMeeting);

    await expect(
      confirmMeetingAttendanceForParticipant("outsider-id", meetingId),
    ).rejects.toThrow("Only meeting participants");
    await expect(
      cancelMeetingForParticipant("outsider-id", meetingId),
    ).rejects.toThrow("Only meeting participants");
    expect(mocks.updateMeetingState).not.toHaveBeenCalled();
  });
});

describe("meeting verification services", () => {
  const completedMeeting = {
    ...scheduledMeeting,
    status: MeetingStatus.COMPLETED,
    completedAt: new Date("2026-09-07T13:00:00.000Z"),
    mentorAttendanceConfirmedAt: new Date("2026-09-07T11:00:00.000Z"),
    menteeAttendanceConfirmedAt: new Date("2026-09-07T11:05:00.000Z"),
    mentee: { id: "mentee-id", username: "nina" },
  };
  const verification = {
    id: "verification-id",
    meetingId,
    cycle: 0,
    mentorDidHappen: true,
    menteeDidHappen: null,
    mentorWantsReschedule: null,
    menteeWantsReschedule: null,
    verificationResolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMeetingById.mockResolvedValue(completedMeeting);
    mocks.lockMeetingForUpdate.mockResolvedValue(undefined);
    mocks.updateMeetingState.mockResolvedValue({});
  });

  it("resolves feedback eligibility when both report success", async () => {
    mocks.findMeetingVerification.mockResolvedValue(verification);
    mocks.updateMeetingVerification
      .mockResolvedValueOnce({
        ...verification,
        menteeDidHappen: true,
      })
      .mockResolvedValueOnce({
        ...verification,
        menteeDidHappen: true,
        verificationResolvedAt: new Date(),
      });

    await answerMeetingOutcomeForParticipant("mentee-id", {
      meetingId,
      didHappen: true,
    });

    expect(mocks.updateMeetingVerification).toHaveBeenLastCalledWith(
      verification.id,
      { verificationResolvedAt: expect.any(Date) },
      expect.anything(),
    );
    expect(mocks.updateMeetingState).not.toHaveBeenCalled();
    expect(notificationMocks.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "mentor-id",
        type: NotificationType.MENTOR_THANK_YOU,
        message: "Thank you for contributing your time to meet with 'nina'",
      }),
      expect.anything(),
    );
  });

  it("keeps the same answer idempotent and rejects changing it", async () => {
    mocks.findMeetingVerification.mockResolvedValue(verification);

    await expect(
      answerMeetingOutcomeForParticipant("mentor-id", {
        meetingId,
        didHappen: true,
      }),
    ).resolves.toBe(verification);
    await expect(
      answerMeetingOutcomeForParticipant("mentor-id", {
        meetingId,
        didHappen: false,
      }),
    ).rejects.toThrow("cannot be changed");
  });

  it("atomically consumes the one retry after two positive intents", async () => {
    const failedVerification = {
      ...verification,
      mentorDidHappen: false,
      menteeDidHappen: true,
      mentorWantsReschedule: true,
    };
    mocks.findMeetingVerification.mockResolvedValue(failedVerification);
    mocks.updateMeetingVerification
      .mockResolvedValueOnce({
        ...failedVerification,
        menteeWantsReschedule: true,
      })
      .mockResolvedValueOnce({
        ...failedVerification,
        menteeWantsReschedule: true,
        verificationResolvedAt: new Date(),
      });

    await answerMeetingRescheduleIntentForParticipant("mentee-id", {
      meetingId,
      wantsReschedule: true,
    });

    expect(mocks.clearMeetingSlots).toHaveBeenCalledWith(
      meetingId,
      expect.anything(),
    );
    expect(mocks.updateMeetingState).toHaveBeenCalledWith(
      meetingId,
      expect.objectContaining({
        status: MeetingStatus.WAITING_FOR_MENTOR_TIMES,
        scheduledAt: null,
        hasRescheduled: true,
      }),
      expect.anything(),
    );
  });

  it("resolves a failed second cycle as not completed", async () => {
    const retriedMeeting = { ...completedMeeting, hasRescheduled: true };
    const retriedVerification = {
      ...verification,
      cycle: 1,
      mentorDidHappen: false,
    };
    mocks.findMeetingById.mockResolvedValue(retriedMeeting);
    mocks.findMeetingVerification.mockResolvedValue(retriedVerification);
    mocks.updateMeetingVerification
      .mockResolvedValueOnce({
        ...retriedVerification,
        menteeDidHappen: true,
      })
      .mockResolvedValueOnce({
        ...retriedVerification,
        menteeDidHappen: true,
        verificationResolvedAt: new Date(),
      });

    await answerMeetingOutcomeForParticipant("mentee-id", {
      meetingId,
      didHappen: true,
    });

    expect(mocks.updateMeetingState).toHaveBeenCalledWith(
      meetingId,
      { status: MeetingStatus.NOT_COMPLETED },
      expect.anything(),
    );
  });

  it("leaves a mixed first-cycle outcome open until reschedule intent", async () => {
    mocks.findMeetingVerification.mockResolvedValue(verification);
    mocks.updateMeetingVerification.mockResolvedValue({
      ...verification,
      menteeDidHappen: false,
    });

    await answerMeetingOutcomeForParticipant("mentee-id", {
      meetingId,
      didHappen: false,
    });

    expect(mocks.updateMeetingState).not.toHaveBeenCalled();
  });

  it("closes the meeting when a participant declines the retry", async () => {
    const failedVerification = {
      ...verification,
      mentorDidHappen: false,
      menteeDidHappen: true,
    };
    mocks.findMeetingVerification.mockResolvedValue(failedVerification);
    mocks.updateMeetingVerification
      .mockResolvedValueOnce({
        ...failedVerification,
        menteeWantsReschedule: false,
      })
      .mockResolvedValueOnce({
        ...failedVerification,
        menteeWantsReschedule: false,
        verificationResolvedAt: new Date(),
      });

    await answerMeetingRescheduleIntentForParticipant("mentee-id", {
      meetingId,
      wantsReschedule: false,
    });

    expect(mocks.updateMeetingState).toHaveBeenCalledWith(
      meetingId,
      { status: MeetingStatus.NOT_COMPLETED },
      expect.anything(),
    );
  });
});
