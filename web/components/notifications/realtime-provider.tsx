"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { markNotificationReadAction } from "@/app/dashboard/notifications/actions";
import type { NotificationType } from "@/lib/generated/prisma/enums";
import { createClient } from "@/lib/supabase/client";

export type NotificationItem = {
  id: string;
  userId: string;
  meetingId: string | null;
  type: NotificationType;
  href: string | null;
  message: string | null;
  readAt: string | null;
  dedupeKey: string;
  createdAt: string;
};

type ToastItem = NotificationItem & { toastId: string };

type NotificationContextValue = {
  notifications: NotificationItem[];
  unreadNotifications: NotificationItem[];
  unreadCount: number;
  toasts: ToastItem[];
  markRead: (notificationId: string) => Promise<void>;
  dismissToast: (toastId: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

function parseRealtimeNotification(value: Record<string, unknown>) {
  if (
    typeof value.id !== "string" ||
    typeof value.userId !== "string" ||
    typeof value.type !== "string" ||
    typeof value.dedupeKey !== "string" ||
    typeof value.createdAt !== "string"
  ) {
    return null;
  }

  return {
    ...value,
    meetingId:
      typeof value.meetingId === "string" || value.meetingId === null
        ? value.meetingId
        : null,
    href: typeof value.href === "string" || value.href === null ? value.href : null,
    message:
      typeof value.message === "string" || value.message === null
        ? value.message
        : null,
    readAt:
      typeof value.readAt === "string" || value.readAt === null
        ? value.readAt
        : null,
  } as NotificationItem;
}

export function NotificationRealtimeProvider({
  userId,
  initialNotifications,
  children,
}: {
  userId: string;
  initialNotifications: NotificationItem[];
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const knownIds = useRef(
    new Set(initialNotifications.map((notification) => notification.id)),
  );

  const dismissToast = useCallback((toastId: string) => {
    setToasts((current) =>
      current.filter((toast) => toast.toastId !== toastId),
    );
    const timer = timers.current.get(toastId);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(toastId);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${userId}`,
        },
        (payload) => {
          const incoming = parseRealtimeNotification(payload.new);
          if (!incoming || incoming.userId !== userId) {
            return;
          }

          if (knownIds.current.has(incoming.id)) {
            return;
          }
          knownIds.current.add(incoming.id);
          setNotifications((current) => [incoming, ...current].slice(0, 30));

          const toastId = `notification-${incoming.id}`;
          setToasts((current) => [
            ...current.filter((toast) => toast.id !== incoming.id),
            { ...incoming, toastId },
          ]);
          timers.current.set(
            toastId,
            setTimeout(() => dismissToast(toastId), 5_000),
          );
        },
      )
      .subscribe();

    const activeTimers = timers.current;
    return () => {
      void supabase.removeChannel(channel);
      for (const timer of activeTimers.values()) {
        clearTimeout(timer);
      }
      activeTimers.clear();
    };
  }, [dismissToast, userId]);

  const markRead = useCallback(async (notificationId: string) => {
    let snapshot: NotificationItem[] = [];
    setNotifications((current) => {
      snapshot = current;
      return current.filter((notification) => notification.id !== notificationId);
    });

    try {
      await markNotificationReadAction(notificationId);
    } catch {
      setNotifications(snapshot);
    }
  }, []);

  const value = useMemo(() => {
    const unreadNotifications = notifications.filter(
      (notification) => !notification.readAt,
    );
    return {
      notifications,
      unreadNotifications,
      unreadCount: unreadNotifications.length,
      toasts,
      markRead,
      dismissToast,
    };
  }, [dismissToast, markRead, notifications, toasts]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within its provider.");
  }
  return context;
}
