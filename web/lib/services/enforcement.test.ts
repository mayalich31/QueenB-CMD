import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/dal/meetings", () => ({
  listCompletedMeetingsForUser: vi.fn(),
}));

import {
  FEEDBACK_REMINDER_INTERVAL_MS,
  FEEDBACK_SOFT_BLOCK_MS,
} from "@/lib/constants/enforcement";
import { MeetingStatus } from "@/lib/generated/prisma/enums";

import {
  getDueFeedbackReminderKeys,
  getFeedbackDueState,
} from "./enforcement";
import type { VerifiableMeeting } from "./meeting-verification";

const resolvedAt = new Date("2026-09-01T12:00:00.000Z");

function verifiedMeeting(
  overrides: Partial<VerifiableMeeting> = {},
): VerifiableMeeting {
  return {
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
    ...overrides,
  };
}

describe("feedback enforcement", () => {
  it("does not block on day six and blocks on day seven", () => {
    const meeting = verifiedMeeting();
    const daySix = new Date(resolvedAt.getTime() + FEEDBACK_SOFT_BLOCK_MS - 1);
    const daySeven = new Date(resolvedAt.getTime() + FEEDBACK_SOFT_BLOCK_MS);

    expect(getFeedbackDueState([meeting], "mentee-id", daySix).isSoftBlocked).toBe(
      false,
    );
    expect(
      getFeedbackDueState([meeting], "mentee-id", daySeven).isSoftBlocked,
    ).toBe(true);
  });

  it("clears the block after the user submits feedback", () => {
    const meeting = verifiedMeeting({
      feedback: [{ authorId: "mentee-id" }],
    });
    const later = new Date(resolvedAt.getTime() + FEEDBACK_SOFT_BLOCK_MS * 2);

    expect(getFeedbackDueState([meeting], "mentee-id", later).isSoftBlocked).toBe(
      false,
    );
    expect(getFeedbackDueState([meeting], "mentor-id", later).isSoftBlocked).toBe(
      true,
    );
  });

  it("issues a reminder every two days with stable dedupe keys", () => {
    const meeting = verifiedMeeting();
    const now = new Date(resolvedAt.getTime() + FEEDBACK_REMINDER_INTERVAL_MS * 2);
    const state = getFeedbackDueState([meeting], "mentee-id", now);
    const reminders = getDueFeedbackReminderKeys(state.eligibleMeetings[0], now);

    expect(reminders).toHaveLength(4);
    expect(reminders.map((reminder) => reminder.dedupeKey)).toEqual([
      "meeting:meeting-id:feedback-reminder:1:cycle:0:user:mentor-id",
      "meeting:meeting-id:feedback-reminder:2:cycle:0:user:mentor-id",
      "meeting:meeting-id:feedback-reminder:1:cycle:0:user:mentee-id",
      "meeting:meeting-id:feedback-reminder:2:cycle:0:user:mentee-id",
    ]);
  });
});
