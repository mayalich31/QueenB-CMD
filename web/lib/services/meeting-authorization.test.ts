import { describe, expect, it } from "vitest";

import {
  assertMeetingMentee,
  assertMeetingMentor,
  assertMeetingParticipant,
  MeetingAuthorizationError,
} from "./meeting-authorization";

const meeting = {
  mentorId: "mentor-id",
  menteeId: "mentee-id",
};

describe("meeting authorization", () => {
  it("allows only the assigned mentor to perform mentor actions", () => {
    expect(() => assertMeetingMentor(meeting, "mentor-id")).not.toThrow();
    expect(() => assertMeetingMentor(meeting, "other-id")).toThrow(
      MeetingAuthorizationError,
    );
  });

  it("allows only the assigned mentee to perform mentee actions", () => {
    expect(() => assertMeetingMentee(meeting, "mentee-id")).not.toThrow();
    expect(() => assertMeetingMentee(meeting, "other-id")).toThrow(
      MeetingAuthorizationError,
    );
  });

  it("allows either participant to submit participant actions", () => {
    expect(() =>
      assertMeetingParticipant(meeting, "mentor-id"),
    ).not.toThrow();
    expect(() =>
      assertMeetingParticipant(meeting, "mentee-id"),
    ).not.toThrow();
    expect(() => assertMeetingParticipant(meeting, "other-id")).toThrow(
      MeetingAuthorizationError,
    );
  });
});
