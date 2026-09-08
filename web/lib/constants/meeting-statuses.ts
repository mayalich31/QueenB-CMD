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

export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  [MeetingStatus.WAITING_FOR_MENTOR_TIMES]: "bg-zinc-200 text-zinc-800",
  [MeetingStatus.WAITING_FOR_MENTEE_SELECTION]:
    "bg-[rgb(29_57_60_/_0.5)] text-zinc-800",
  [MeetingStatus.SCHEDULED]: "bg-[rgb(29_57_60_/_0.35)] text-zinc-800",
  [MeetingStatus.ATTENDANCE_CONFIRMED]: "bg-emerald-100 text-emerald-800",
  [MeetingStatus.COMPLETED]: "bg-emerald-200 text-emerald-950",
  [MeetingStatus.NOT_COMPLETED]: "bg-red-100 text-red-800",
  [MeetingStatus.CANCELLED]: "bg-zinc-100 text-zinc-500",
};

export const MENTEE_CALENDAR_STATUSES = [
  MeetingStatus.SCHEDULED,
  MeetingStatus.ATTENDANCE_CONFIRMED,
  MeetingStatus.COMPLETED,
  MeetingStatus.NOT_COMPLETED,
  MeetingStatus.CANCELLED,
] as const;

export function calendarSlotTitle(
  counterpartName: string,
  status: MeetingStatus,
  role?: "mentee" | "mentor",
) {
  const roleLabel = role === "mentor" ? "as mentor" : role === "mentee" ? "as mentee" : "";
  return roleLabel
    ? `${counterpartName} · ${MEETING_STATUS_LABELS[status]} · ${roleLabel}`
    : `${counterpartName} · ${MEETING_STATUS_LABELS[status]}`;
}

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
