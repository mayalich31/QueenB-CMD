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
  completedAt: null,
  mentorAttendanceConfirmedAt: null,
  menteeAttendanceConfirmedAt: null,
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

  it("allows the mentor to reject a new request", () => {
    expect(
      getMeetingTransitionPatch(baseMeeting, MeetingStatus.CANCELLED),
    ).toEqual({
      status: MeetingStatus.CANCELLED,
      mentorAttendanceConfirmedAt: null,
      menteeAttendanceConfirmedAt: null,
    });
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

  it("requires both confirmations before attendance is confirmed", () => {
    const scheduledMeeting = {
      ...baseMeeting,
      status: MeetingStatus.SCHEDULED,
      scheduledAt: new Date("2026-09-06T13:00:00.000Z"),
      mentorAttendanceConfirmedAt: new Date("2026-09-06T12:00:00.000Z"),
    };

    expect(() =>
      getMeetingTransitionPatch(
        scheduledMeeting,
        MeetingStatus.ATTENDANCE_CONFIRMED,
      ),
    ).toThrow(InvalidMeetingTransitionError);

    expect(
      getMeetingTransitionPatch(
        {
          ...scheduledMeeting,
          menteeAttendanceConfirmedAt: new Date("2026-09-06T12:05:00.000Z"),
        },
        MeetingStatus.ATTENDANCE_CONFIRMED,
      ),
    ).toEqual({ status: MeetingStatus.ATTENDANCE_CONFIRMED });
  });

  it("only completes an attendance-confirmed meeting after its start time", () => {
    const now = new Date("2026-09-06T12:00:00.000Z");
    const meeting = {
      ...baseMeeting,
      status: MeetingStatus.ATTENDANCE_CONFIRMED,
      scheduledAt: new Date("2026-09-06T11:00:00.000Z"),
      mentorAttendanceConfirmedAt: new Date("2026-09-06T10:00:00.000Z"),
      menteeAttendanceConfirmedAt: new Date("2026-09-06T10:05:00.000Z"),
    };

    expect(
      getMeetingTransitionPatch(meeting, MeetingStatus.COMPLETED, now),
    ).toEqual({
      status: MeetingStatus.COMPLETED,
      completedAt: now,
    });

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

  it("allows either participant to cancel an attendance-confirmed meeting", () => {
    expect(
      getMeetingTransitionPatch(
        {
          ...baseMeeting,
          status: MeetingStatus.ATTENDANCE_CONFIRMED,
          scheduledAt: new Date("2026-09-06T13:00:00.000Z"),
          mentorAttendanceConfirmedAt: new Date(
            "2026-09-06T12:00:00.000Z",
          ),
          menteeAttendanceConfirmedAt: new Date(
            "2026-09-06T12:05:00.000Z",
          ),
        },
        MeetingStatus.CANCELLED,
      ),
    ).toEqual({
      status: MeetingStatus.CANCELLED,
      mentorAttendanceConfirmedAt: null,
      menteeAttendanceConfirmedAt: null,
    });
  });

  it.each([
    MeetingStatus.WAITING_FOR_MENTEE_SELECTION,
    MeetingStatus.SCHEDULED,
  ])("allows cancellation from active status %s", (status) => {
    expect(
      getMeetingTransitionPatch(
        {
          ...baseMeeting,
          status,
          scheduledAt:
            status === MeetingStatus.SCHEDULED
              ? new Date("2026-09-06T13:00:00.000Z")
              : null,
        },
        MeetingStatus.CANCELLED,
      ),
    ).toEqual({
      status: MeetingStatus.CANCELLED,
      mentorAttendanceConfirmedAt: null,
      menteeAttendanceConfirmedAt: null,
    });
  });

  it("rejects transitions out of terminal states", () => {
    expect(() =>
      getMeetingTransitionPatch(
        { ...baseMeeting, status: MeetingStatus.CANCELLED },
        MeetingStatus.WAITING_FOR_MENTOR_TIMES,
      ),
    ).toThrow(InvalidMeetingTransitionError);
  });

  it("reschedules a completed meeting once and clears scheduling state", () => {
    const completedMeeting = {
      ...baseMeeting,
      status: MeetingStatus.COMPLETED,
      scheduledAt: new Date("2026-09-06T11:00:00.000Z"),
      completedAt: new Date("2026-09-06T12:00:00.000Z"),
      mentorAttendanceConfirmedAt: new Date("2026-09-06T10:00:00.000Z"),
      menteeAttendanceConfirmedAt: new Date("2026-09-06T10:05:00.000Z"),
    };

    expect(
      getMeetingTransitionPatch(
        completedMeeting,
        MeetingStatus.WAITING_FOR_MENTOR_TIMES,
      ),
    ).toEqual({
      status: MeetingStatus.WAITING_FOR_MENTOR_TIMES,
      scheduledAt: null,
      completedAt: null,
      mentorAttendanceConfirmedAt: null,
      menteeAttendanceConfirmedAt: null,
      hasRescheduled: true,
    });

    expect(() =>
      getMeetingTransitionPatch(
        { ...completedMeeting, hasRescheduled: true },
        MeetingStatus.WAITING_FOR_MENTOR_TIMES,
      ),
    ).toThrow(InvalidMeetingTransitionError);
  });

  it("allows a completed meeting to resolve as not completed", () => {
    expect(
      getMeetingTransitionPatch(
        {
          ...baseMeeting,
          status: MeetingStatus.COMPLETED,
          scheduledAt: new Date("2026-09-06T11:00:00.000Z"),
          completedAt: new Date("2026-09-06T12:00:00.000Z"),
        },
        MeetingStatus.NOT_COMPLETED,
      ),
    ).toEqual({ status: MeetingStatus.NOT_COMPLETED });
  });
});
