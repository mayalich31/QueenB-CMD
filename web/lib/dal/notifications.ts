import type { Prisma } from "@/lib/generated/prisma/client";
import type { NotificationType } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

import type { DatabaseClient } from "./meetings";

export type NotificationCreateData = {
  userId: string;
  meetingId?: string;
  type: NotificationType;
  href?: string;
  message?: string;
  dedupeKey: string;
};

export type NotificationRecord = Prisma.NotificationGetPayload<object>;

export function createNotification(
  data: NotificationCreateData,
  database: DatabaseClient = prisma,
) {
  return database.notification.upsert({
    where: { dedupeKey: data.dedupeKey },
    create: data,
    update: {},
  });
}

export async function createNotifications(
  notifications: NotificationCreateData[],
  database: DatabaseClient = prisma,
) {
  if (notifications.length === 0) {
    return { count: 0 };
  }

  return database.notification.createMany({
    data: notifications,
    skipDuplicates: true,
  });
}

export function listRecentNotifications(
  userId: string,
  limit = 30,
  database: DatabaseClient = prisma,
) {
  return database.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export function listUnreadNotifications(
  userId: string,
  limit = 30,
  database: DatabaseClient = prisma,
) {
  return database.notification.findMany({
    where: { userId, readAt: null },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationRead(
  notificationId: string,
  userId: string,
  readAt = new Date(),
  database: DatabaseClient = prisma,
) {
  await database.notification.updateMany({
    where: { id: notificationId, userId, readAt: null },
    data: { readAt },
  });

  return database.notification.findFirst({
    where: { id: notificationId, userId },
  });
}
