import { describe, expect, it } from "vitest";

import { MeetingStatus } from "@/lib/generated/prisma/enums";

import {
  canSubmitFeedback,
  isOutcomeVerified,
  needsOutcomeAnswer,
  needsRescheduleIntent,
  type VerifiableMeeting,
} from "./meeting-verification";

function meeting(
  overrides: Partial<VerifiableMeeting> = {},
): VerifiableMeeting {
  return {
    id: "meeting-id",
    mentorId: "mentor-id",
    menteeId: "mentee-id",
    status: MeetingStatus.COMPLETED,
    hasRescheduled: false,
    feedback: [],
    verifications: [],
    ...overrides,
  };
}

describe("meeting verification helpers", () => {
  it("requires a current-cycle joint success before feedback", () => {
    const pending = meeting();
    const verified = meeting({
      verifications: [
        {
          cycle: 0,
          mentorDidHappen: true,
          menteeDidHappen: true,
          mentorWantsReschedule: null,
          menteeWantsReschedule: null,
          verificationResolvedAt: new Date(),
        },
      ],
    });

    expect(isOutcomeVerified(pending)).toBe(false);
    expect(canSubmitFeedback(verified, "mentee-id")).toBe(true);
    expect(
      canSubmitFeedback(
        { ...verified, feedback: [{ authorId: "mentee-id" }] },
        "mentee-id",
      ),
    ).toBe(false);
  });

  it("asks for outcome and reschedule answers in the right order", () => {
    const awaitingOutcome = meeting();
    const mixed = meeting({
      verifications: [
        {
          cycle: 0,
          mentorDidHappen: true,
          menteeDidHappen: false,
          mentorWantsReschedule: null,
          menteeWantsReschedule: null,
          verificationResolvedAt: null,
        },
      ],
    });

    expect(needsOutcomeAnswer(awaitingOutcome, "mentor-id")).toBe(true);
    expect(needsRescheduleIntent(mixed, "mentor-id")).toBe(true);
    expect(needsOutcomeAnswer(mixed, "mentor-id")).toBe(false);
  });
});
