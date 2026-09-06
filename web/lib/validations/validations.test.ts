import { describe, expect, it } from "vitest";

import {
  feedbackCreateSchema,
  meetingCreateSchema,
  mentorProfileCreateSchema,
  proposeMeetingSlotsSchema,
  userUpdateSchema,
} from "./index";

const userId = "d9428888-122b-4e1f-9f2f-07ed2fd8556f";
const mentorId = "7b1c5f5a-9d17-46db-9e6f-31ca1898f55d";

describe("core DTO validation", () => {
  it("rejects empty user updates", () => {
    expect(userUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("normalizes valid email updates", () => {
    expect(
      userUpdateSchema.parse({ email: "  developer@example.com  " }),
    ).toEqual({ email: "developer@example.com" });
  });

  it("rejects meetings where the mentor and mentee are the same user", () => {
    expect(
      meetingCreateSchema.safeParse({
        menteeId: userId,
        mentorId: userId,
      }).success,
    ).toBe(false);
  });

  it("rejects duplicate mentor topics", () => {
    expect(
      mentorProfileCreateSchema.safeParse({
        userId,
        background: "Experienced engineering mentor.",
        topics: ["career_planning", "career_planning"],
        maxConcurrentMeetings: 3,
        meetingDurationMinutes: 30,
      }).success,
    ).toBe(false);
  });

  it("rejects mentor topics outside the controlled directory taxonomy", () => {
    expect(
      mentorProfileCreateSchema.safeParse({
        userId,
        background: "Experienced engineering mentor.",
        topics: ["unrecognized_topic"],
        maxConcurrentMeetings: 3,
        meetingDurationMinutes: 30,
      }).success,
    ).toBe(false);
  });

  it("accepts ratings from one through five only", () => {
    const validFeedback = {
      meetingId: userId,
      authorId: mentorId,
      comment: "Helpful conversation.",
    };

    expect(
      feedbackCreateSchema.safeParse({ ...validFeedback, rating: 5 }).success,
    ).toBe(true);
    expect(
      feedbackCreateSchema.safeParse({ ...validFeedback, rating: 6 }).success,
    ).toBe(false);
  });

  it("rejects meeting slots whose end is not after their start", () => {
    expect(
      proposeMeetingSlotsSchema.safeParse({
        meetingId: userId,
        slots: [
          {
            startsAt: "2026-09-06T12:00:00.000Z",
            endsAt: "2026-09-06T11:00:00.000Z",
          },
        ],
      }).success,
    ).toBe(false);
  });
});
