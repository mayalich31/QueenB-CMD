import type { NotificationType } from "@/lib/generated/prisma/enums";

const PRESENTATION: Record<
  NotificationType,
  { title: string; description: string; defaultHref: string }
> = {
  MEETING_REQUESTED: {
    title: "New meeting request",
    description: "A mentee requested a meeting with you.",
    defaultHref: "/dashboard/mentor",
  },
  MEETING_SLOTS_PROPOSED: {
    title: "Meeting times available",
    description: "Your mentor proposed times for your meeting.",
    defaultHref: "/dashboard/profile",
  },
  MEETING_SCHEDULED: {
    title: "Meeting scheduled",
    description: "A meeting time has been selected.",
    defaultHref: "/dashboard/profile",
  },
  MEETING_ATTENDANCE_CONFIRMED: {
    title: "Attendance confirmed",
    description: "Both participants confirmed attendance.",
    defaultHref: "/dashboard/profile",
  },
  MEETING_CANCELLED: {
    title: "Meeting cancelled",
    description: "A meeting request or meeting was closed.",
    defaultHref: "/dashboard/profile",
  },
  MEETING_COMPLETED: {
    title: "Meeting outcome verified",
    description: "Both participants verified the meeting outcome.",
    defaultHref: "/dashboard/profile",
  },
  MEETING_VERIFICATION_REQUIRED: {
    title: "Verify meeting outcome",
    description: "Please confirm whether your meeting happened.",
    defaultHref: "/dashboard/profile",
  },
  MEETING_RESCHEDULED: {
    title: "Meeting reschedule update",
    description: "Your meeting needs new time options.",
    defaultHref: "/dashboard/profile",
  },
  FEEDBACK_REMINDER: {
    title: "Share meeting feedback",
    description: "Feedback is available for your completed meeting.",
    defaultHref: "/dashboard/profile",
  },
};

export function getNotificationPresentation(
  type: NotificationType,
  href?: string | null,
) {
  const presentation = PRESENTATION[type];
  return { ...presentation, href: href ?? presentation.defaultHref };
}
