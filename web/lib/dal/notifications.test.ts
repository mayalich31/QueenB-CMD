import { describe, expect, it, vi } from "vitest";

import { NotificationType } from "@/lib/generated/prisma/enums";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import type { DatabaseClient } from "./meetings";
import { createNotification, createNotifications } from "./notifications";

const data = {
  userId: "user-id",
  meetingId: "meeting-id",
  type: NotificationType.MEETING_REQUESTED,
  href: "/dashboard/mentor",
  dedupeKey: "meeting:meeting-id:requested:cycle:0:user:user-id",
};

describe("notification DAL deduplication", () => {
  it("upserts a single notification without changing an existing row", async () => {
    const upsert = vi.fn().mockResolvedValue({ id: "notification-id" });
    const database = {
      notification: { upsert },
    } as unknown as DatabaseClient;

    await createNotification(data, database);

    expect(upsert).toHaveBeenCalledWith({
      where: { dedupeKey: data.dedupeKey },
      create: data,
      update: {},
    });
  });

  it("skips duplicate keys when creating a batch", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const database = {
      notification: { createMany },
    } as unknown as DatabaseClient;

    await createNotifications([data, data], database);

    expect(createMany).toHaveBeenCalledWith({
      data: [data, data],
      skipDuplicates: true,
    });
  });
});
