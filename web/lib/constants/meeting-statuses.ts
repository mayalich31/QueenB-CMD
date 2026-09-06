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
