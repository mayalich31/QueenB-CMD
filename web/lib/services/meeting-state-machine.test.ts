import { describe, expect, it } from "vitest";

import { MeetingStatus } from "@/lib/generated/prisma/enums";

import {
  getMeetingTransitionPatch,
  InvalidMeetingTransitionError,
  type MeetingState,
} from "./meeting-state-machine";

const baseMeeting: MeetingState = {
  status: MeetingStatus.WAITING_FOR_MENTOR_TIMES,
  scheduledAt: null,
  hasRequestedMoreTimes: false,
  hasRescheduled: false,
};

describe("getMeetingTransitionPatch", () => {
  it("allows the mentor to move a request to mentee selection", () => {
    expect(
      getMeetingTransitionPatch(
        baseMeeting,
        MeetingStatus.WAITING_FOR_MENTEE_SELECTION,
      ),
    ).toEqual({ status: MeetingStatus.WAITING_FOR_MENTEE_SELECTION });
  });

  it("consumes the single request-for-more-times iteration", () => {
    const meeting = {
      ...baseMeeting,
      status: MeetingStatus.WAITING_FOR_MENTEE_SELECTION,
    };

    expect(
      getMeetingTransitionPatch(
        meeting,
        MeetingStatus.WAITING_FOR_MENTOR_TIMES,
      ),
    ).toEqual({
      status: MeetingStatus.WAITING_FOR_MENTOR_TIMES,
      hasRequestedMoreTimes: true,
    });

    expect(() =>
      getMeetingTransitionPatch(
        { ...meeting, hasRequestedMoreTimes: true },
        MeetingStatus.WAITING_FOR_MENTOR_TIMES,
      ),
    ).toThrow(InvalidMeetingTransitionError);
  });

  it("requires a selected time before scheduling", () => {
    expect(() =>
      getMeetingTransitionPatch(
        {
          ...baseMeeting,
          status: MeetingStatus.WAITING_FOR_MENTEE_SELECTION,
        },
        MeetingStatus.SCHEDULED,
      ),
    ).toThrow(InvalidMeetingTransitionError);
  });

  it("only completes an attendance-confirmed meeting after its start time", () => {
    const now = new Date("2026-09-06T12:00:00.000Z");
    const meeting = {
      ...baseMeeting,
      status: MeetingStatus.ATTENDANCE_CONFIRMED,
      scheduledAt: new Date("2026-09-06T11:00:00.000Z"),
    };

    expect(
      getMeetingTransitionPatch(meeting, MeetingStatus.COMPLETED, now),
    ).toEqual({ status: MeetingStatus.COMPLETED });

    expect(() =>
      getMeetingTransitionPatch(
        {
          ...meeting,
          scheduledAt: new Date("2026-09-06T13:00:00.000Z"),
        },
        MeetingStatus.COMPLETED,
        now,
      ),
    ).toThrow(InvalidMeetingTransitionError);
  });

  it("rejects transitions out of terminal states", () => {
    expect(() =>
      getMeetingTransitionPatch(
        { ...baseMeeting, status: MeetingStatus.CANCELLED },
        MeetingStatus.WAITING_FOR_MENTOR_TIMES,
      ),
    ).toThrow(InvalidMeetingTransitionError);
  });
});
