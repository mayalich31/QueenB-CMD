import { MeetingStatus } from "@/lib/generated/prisma/enums";

export const ACTIVE_MEETING_STATUSES = [
  MeetingStatus.WAITING_FOR_MENTOR_TIMES,
  MeetingStatus.WAITING_FOR_MENTEE_SELECTION,
  MeetingStatus.SCHEDULED,
  MeetingStatus.ATTENDANCE_CONFIRMED,
] as const;

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  [MeetingStatus.WAITING_FOR_MENTOR_TIMES]: "Waiting for mentor times",
  [MeetingStatus.WAITING_FOR_MENTEE_SELECTION]: "Select a meeting time",
  [MeetingStatus.SCHEDULED]: "Scheduled",
  [MeetingStatus.ATTENDANCE_CONFIRMED]: "Attendance confirmed",
  [MeetingStatus.COMPLETED]: "Completed",
  [MeetingStatus.NOT_COMPLETED]: "Did not happen",
  [MeetingStatus.CANCELLED]: "Cancelled",
};

type MeetingConfirmationState = {
  status: MeetingStatus;
  mentorAttendanceConfirmedAt: Date | null;
  menteeAttendanceConfirmedAt: Date | null;
  hasRescheduled?: boolean;
  verifications?: Array<{
    cycle: number;
    mentorDidHappen: boolean | null;
    menteeDidHappen: boolean | null;
    mentorWantsReschedule: boolean | null;
    menteeWantsReschedule: boolean | null;
    verificationResolvedAt: Date | null;
  }>;
};

export function getMeetingStatusLabel(meeting: MeetingConfirmationState) {
  if (meeting.status === MeetingStatus.COMPLETED && meeting.verifications) {
    const cycle = meeting.hasRescheduled ? 1 : 0;
    const verification = meeting.verifications.find(
      (entry) => entry.cycle === cycle,
    );

    if (
      !verification ||
      verification.mentorDidHappen == null ||
      verification.menteeDidHappen == null
    ) {
      return "Completed — verify outcome";
    }

    if (
      verification.mentorDidHappen &&
      verification.menteeDidHappen &&
      verification.verificationResolvedAt
    ) {
      return MEETING_STATUS_LABELS[meeting.status];
    }

    if (!meeting.hasRescheduled && !verification.verificationResolvedAt) {
      return "Completed — decide whether to meet again";
    }
  }

  if (meeting.status !== MeetingStatus.SCHEDULED) {
    return MEETING_STATUS_LABELS[meeting.status];
  }

  if (meeting.mentorAttendanceConfirmedAt) {
    return "Scheduled — waiting for mentee confirmation";
  }

  if (meeting.menteeAttendanceConfirmedAt) {
    return "Scheduled — waiting for mentor confirmation";
  }

  return MEETING_STATUS_LABELS[meeting.status];
}
