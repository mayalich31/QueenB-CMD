import { beforeEach, describe, expect, it, vi } from "vitest";

import { MeetingStatus } from "@/lib/generated/prisma/enums";

const mocks = vi.hoisted(() => ({
  createFeedback: vi.fn(),
  findMeetingById: vi.fn(),
  lockMeetingForUpdate: vi.fn(),
}));

vi.mock("@/lib/dal/feedback", () => ({
  createFeedback: mocks.createFeedback,
}));

vi.mock("@/lib/dal/meetings", () => ({
  findMeetingById: mocks.findMeetingById,
  lockMeetingForUpdate: mocks.lockMeetingForUpdate,
}));

vi.mock("./transaction", () => ({
  runSerializableTransaction: vi.fn(
    (operation: (transaction: object) => unknown) => operation({}),
  ),
}));

vi.mock("./notifications", () => ({
  createNotifications: vi.fn(),
}));

import { createFeedbackForUser } from "./feedback";

const meetingId = "d9428888-122b-4e1f-9f2f-07ed2fd8556f";
const authorId = "7b1c5f5a-9d17-46db-9e6f-31ca1898f55d";

function completedMeeting(
  verification: {
    cycle: number;
    mentorDidHappen: boolean | null;
    menteeDidHappen: boolean | null;
    verificationResolvedAt: Date | null;
  },
) {
  return {
    id: meetingId,
    mentorId: authorId,
    menteeId: "mentee-id",
    status: MeetingStatus.COMPLETED,
    hasRescheduled: verification.cycle === 1,
    verifications: [verification],
  };
}

describe("feedback eligibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createFeedback.mockResolvedValue({});
  });

  it("allows feedback after the current cycle is jointly verified", async () => {
    mocks.findMeetingById.mockResolvedValue(
      completedMeeting({
        cycle: 0,
        mentorDidHappen: true,
        menteeDidHappen: true,
        verificationResolvedAt: new Date(),
      }),
    );

    await createFeedbackForUser(authorId, {
      meetingId,
      rating: 5,
      comment: "",
    });

    expect(mocks.createFeedback).toHaveBeenCalled();
  });

  it("rejects unresolved, failed, and stale-cycle verification", async () => {
    const ineligible = [
      completedMeeting({
        cycle: 0,
        mentorDidHappen: true,
        menteeDidHappen: true,
        verificationResolvedAt: null,
      }),
      completedMeeting({
        cycle: 0,
        mentorDidHappen: false,
        menteeDidHappen: true,
        verificationResolvedAt: new Date(),
      }),
      {
        ...completedMeeting({
          cycle: 0,
          mentorDidHappen: true,
          menteeDidHappen: true,
          verificationResolvedAt: new Date(),
        }),
        hasRescheduled: true,
      },
    ];

    for (const meeting of ineligible) {
      mocks.findMeetingById.mockResolvedValueOnce(meeting);
      await expect(
        createFeedbackForUser(authorId, {
          meetingId,
          rating: 4,
          comment: "",
        }),
      ).rejects.toThrow("Feedback is only allowed");
    }

    expect(mocks.createFeedback).not.toHaveBeenCalled();
  });
});
