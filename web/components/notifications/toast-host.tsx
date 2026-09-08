"use client";

import Link from "next/link";

import { getNotificationPresentation } from "@/lib/notifications/presentation";

import { useNotifications } from "./realtime-provider";

export function NotificationToastHost() {
  const { toasts, dismissToast, markRead } = useNotifications();

  return (
    <div
      aria-label="New notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
    >
      {toasts.map((toast) => {
        const presentation = getNotificationPresentation(
          toast.type,
          toast.href,
          toast.message,
        );
        return (
          <div
            className="pointer-events-auto rounded-xl border border-brand/30 bg-cream-card p-4 shadow-xl"
            key={toast.toastId}
            role="status"
          >
            <div className="flex items-start gap-3">
              <Link
                className="min-w-0 flex-1 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-deep"
                href={presentation.href}
                onClick={() => {
                  dismissToast(toast.toastId);
                  void markRead(toast.id);
                }}
              >
                <span className="block text-sm font-semibold">
                  {presentation.title}
                </span>
                <span className="mt-1 block text-sm text-zinc-600">
                  {presentation.description}
                </span>
              </Link>
              <button
                aria-label="Dismiss notification"
                className="rounded p-1 text-zinc-500 hover:bg-brand/25 focus-visible:outline-2 focus-visible:outline-brand-deep"
                onClick={() => dismissToast(toast.toastId)}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
