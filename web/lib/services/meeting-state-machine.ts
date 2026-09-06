import {
  MeetingStatus,
  type MeetingStatus as MeetingStatusValue,
} from "@/lib/generated/prisma/enums";

export type MeetingState = {
  status: MeetingStatusValue;
  scheduledAt: Date | null;
  completedAt: Date | null;
  mentorAttendanceConfirmedAt: Date | null;
  menteeAttendanceConfirmedAt: Date | null;
  hasRequestedMoreTimes: boolean;
  hasRescheduled: boolean;
};

export type MeetingTransitionPatch = {
  status: MeetingStatusValue;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  mentorAttendanceConfirmedAt?: Date | null;
  menteeAttendanceConfirmedAt?: Date | null;
  hasRequestedMoreTimes?: boolean;
  hasRescheduled?: boolean;
};

export class InvalidMeetingTransitionError extends Error {
  constructor(current: MeetingStatusValue, target: MeetingStatusValue) {
    super(`Meeting cannot transition from ${current} to ${target}.`);
    this.name = "InvalidMeetingTransitionError";
  }
}

const allowedTransitions: Record<
  MeetingStatusValue,
  readonly MeetingStatusValue[]
> = {
  [MeetingStatus.WAITING_FOR_MENTOR_TIMES]: [
    MeetingStatus.WAITING_FOR_MENTEE_SELECTION,
    MeetingStatus.CANCELLED,
  ],
  [MeetingStatus.WAITING_FOR_MENTEE_SELECTION]: [
    MeetingStatus.SCHEDULED,
    MeetingStatus.WAITING_FOR_MENTOR_TIMES,
    MeetingStatus.CANCELLED,
  ],
  [MeetingStatus.SCHEDULED]: [
    MeetingStatus.ATTENDANCE_CONFIRMED,
    MeetingStatus.CANCELLED,
  ],
  [MeetingStatus.ATTENDANCE_CONFIRMED]: [
    MeetingStatus.COMPLETED,
    MeetingStatus.CANCELLED,
  ],
  [MeetingStatus.COMPLETED]: [
    MeetingStatus.WAITING_FOR_MENTOR_TIMES,
    MeetingStatus.NOT_COMPLETED,
  ],
  [MeetingStatus.NOT_COMPLETED]: [],
  [MeetingStatus.CANCELLED]: [],
};

export function getMeetingTransitionPatch(
  meeting: MeetingState,
  target: MeetingStatusValue,
  now = new Date(),
): MeetingTransitionPatch {
  if (!allowedTransitions[meeting.status].includes(target)) {
    throw new InvalidMeetingTransitionError(meeting.status, target);
  }

  if (
    meeting.status === MeetingStatus.WAITING_FOR_MENTEE_SELECTION &&
    target === MeetingStatus.WAITING_FOR_MENTOR_TIMES
  ) {
    if (meeting.hasRequestedMoreTimes) {
      throw new InvalidMeetingTransitionError(meeting.status, target);
    }

    return {
      status: target,
      hasRequestedMoreTimes: true,
    };
  }

  if (
    meeting.status === MeetingStatus.COMPLETED &&
    target === MeetingStatus.WAITING_FOR_MENTOR_TIMES
  ) {
    if (meeting.hasRescheduled) {
      throw new InvalidMeetingTransitionError(meeting.status, target);
    }

    return {
      status: target,
      scheduledAt: null,
      completedAt: null,
      mentorAttendanceConfirmedAt: null,
      menteeAttendanceConfirmedAt: null,
      hasRescheduled: true,
    };
  }

  if (target === MeetingStatus.SCHEDULED && !meeting.scheduledAt) {
    throw new InvalidMeetingTransitionError(meeting.status, target);
  }

  if (
    target === MeetingStatus.ATTENDANCE_CONFIRMED &&
    (!meeting.mentorAttendanceConfirmedAt ||
      !meeting.menteeAttendanceConfirmedAt)
  ) {
    throw new InvalidMeetingTransitionError(meeting.status, target);
  }

  if (
    target === MeetingStatus.COMPLETED &&
    (!meeting.scheduledAt || meeting.scheduledAt > now)
  ) {
    throw new InvalidMeetingTransitionError(meeting.status, target);
  }

  if (target === MeetingStatus.COMPLETED) {
    return { status: target, completedAt: now };
  }

  if (target === MeetingStatus.CANCELLED) {
    return {
      status: target,
      mentorAttendanceConfirmedAt: null,
      menteeAttendanceConfirmedAt: null,
    };
  }

  return { status: target };
}
