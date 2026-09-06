import type { DatabaseClient } from "@/lib/dal/meetings";
import {
  createNotification as createNotificationRecord,
  createNotifications as createNotificationRecords,
  listRecentNotifications as listRecentNotificationRecords,
  listUnreadNotifications as listUnreadNotificationRecords,
  markNotificationRead as markNotificationRecordRead,
  type NotificationCreateData,
} from "@/lib/dal/notifications";
import {
  NotificationType,
  type NotificationType as NotificationTypeValue,
} from "@/lib/generated/prisma/enums";

export class NotificationNotFoundError extends Error {
  constructor() {
    super("Notification was not found.");
    this.name = "NotificationNotFoundError";
  }
}

export type NotificationMeeting = {
  id: string;
  mentorId: string;
  menteeId: string;
  hasRescheduled: boolean;
};

export function meetingNotificationCycle(meeting: NotificationMeeting) {
  return meeting.hasRescheduled ? 1 : 0;
}

export function createNotification(
  data: NotificationCreateData,
  database?: DatabaseClient,
) {
  return createNotificationRecord(data, database);
}

export function createNotifications(
  notifications: NotificationCreateData[],
  database?: DatabaseClient,
) {
  return createNotificationRecords(notifications, database);
}

export function notifyMeetingUsers(
  database: DatabaseClient,
  meeting: NotificationMeeting,
  userIds: string[],
  type: NotificationTypeValue,
  event: string,
  cycle = meetingNotificationCycle(meeting),
) {
  return createNotifications(
    userIds.map((userId) => ({
      userId,
      meetingId: meeting.id,
      type,
      href:
        userId === meeting.mentorId
          ? "/dashboard/mentor"
          : "/dashboard/profile",
      dedupeKey: `meeting:${meeting.id}:${event}:cycle:${cycle}:user:${userId}`,
    })),
    database,
  );
}

export function listRecentNotifications(userId: string, limit?: number) {
  return listRecentNotificationRecords(userId, limit);
}

export function listUnreadNotifications(userId: string, limit?: number) {
  return listUnreadNotificationRecords(userId, limit);
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
) {
  const notification = await markNotificationRecordRead(notificationId, userId);

  if (!notification) {
    throw new NotificationNotFoundError();
  }

  return notification;
}

export { NotificationType };
