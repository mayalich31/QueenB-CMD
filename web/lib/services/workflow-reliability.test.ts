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
import { getMeetingTransitionPatch } from "./meeting-state-machine";
import {
  canSubmitFeedback,
  isOutcomeVerified,
  type VerifiableMeeting,
} from "./meeting-verification";

describe("reliability workflow", () => {
  it("advances from confirmation through verification, reminder, block, and clearance", () => {
    const now = new Date("2026-09-07T13:00:00.000Z");
    const confirmed = {
      status: MeetingStatus.ATTENDANCE_CONFIRMED,
      scheduledAt: new Date("2026-09-07T12:00:00.000Z"),
      completedAt: null,
      mentorAttendanceConfirmedAt: now,
      menteeAttendanceConfirmedAt: now,
      hasRequestedMoreTimes: false,
      hasRescheduled: false,
    };

    const completedPatch = getMeetingTransitionPatch(
      confirmed,
      MeetingStatus.COMPLETED,
      now,
    );
    expect(completedPatch).toEqual({
      status: MeetingStatus.COMPLETED,
      completedAt: now,
    });

    const pendingVerification: VerifiableMeeting = {
      id: "meeting-id",
      mentorId: "mentor-id",
      menteeId: "mentee-id",
      status: MeetingStatus.COMPLETED,
      hasRescheduled: false,
      feedback: [],
      verifications: [],
    };
    expect(isOutcomeVerified(pendingVerification)).toBe(false);
    expect(canSubmitFeedback(pendingVerification, "mentee-id")).toBe(false);

    const verifiedAt = new Date("2026-09-07T14:00:00.000Z");
    const verified: VerifiableMeeting = {
      ...pendingVerification,
      verifications: [
        {
          cycle: 0,
          mentorDidHappen: true,
          menteeDidHappen: true,
          mentorWantsReschedule: null,
          menteeWantsReschedule: null,
          verificationResolvedAt: verifiedAt,
        },
      ],
    };
    expect(canSubmitFeedback(verified, "mentee-id")).toBe(true);

    const reminderTime = new Date(
      verifiedAt.getTime() + FEEDBACK_REMINDER_INTERVAL_MS,
    );
    const reminderState = getFeedbackDueState(
      [verified],
      "mentee-id",
      reminderTime,
    );
    expect(reminderState.isSoftBlocked).toBe(false);
    expect(
      getDueFeedbackReminderKeys(reminderState.eligibleMeetings[0], reminderTime)
        .length,
    ).toBeGreaterThan(0);

    const blockTime = new Date(verifiedAt.getTime() + FEEDBACK_SOFT_BLOCK_MS);
    expect(getFeedbackDueState([verified], "mentee-id", blockTime).isSoftBlocked).toBe(
      true,
    );

    const cleared: VerifiableMeeting = {
      ...verified,
      feedback: [{ authorId: "mentee-id" }],
    };
    expect(getFeedbackDueState([cleared], "mentee-id", blockTime).isSoftBlocked).toBe(
      false,
    );
  });
});
