import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createNotification: vi.fn(),
  createNotifications: vi.fn(),
  listRecentNotifications: vi.fn(),
  listUnreadNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));

vi.mock("@/lib/dal/notifications", () => mocks);

import {
  NotificationNotFoundError,
  markNotificationRead,
} from "./notifications";

describe("notification service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an already-read notification idempotently", async () => {
    const notification = {
      id: "notification-id",
      userId: "user-id",
      readAt: new Date(),
    };
    mocks.markNotificationRead.mockResolvedValue(notification);

    await expect(
      markNotificationRead("user-id", "notification-id"),
    ).resolves.toBe(notification);
    expect(mocks.markNotificationRead).toHaveBeenCalledWith(
      "notification-id",
      "user-id",
    );
  });

  it("does not reveal or mutate another user's notification", async () => {
    mocks.markNotificationRead.mockResolvedValue(null);

    await expect(
      markNotificationRead("other-user", "notification-id"),
    ).rejects.toBeInstanceOf(NotificationNotFoundError);
  });
});
