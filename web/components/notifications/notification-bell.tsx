"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { getNotificationPresentation } from "@/lib/notifications/presentation";

import { useNotifications } from "./realtime-provider";

export function NotificationBell() {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls="notification-menu"
        aria-expanded={open}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className="relative rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path
            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-amber-700 px-1 text-center text-xs font-semibold leading-5 text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          aria-label="Notifications"
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
          id="notification-menu"
        >
          <h2 className="border-b border-zinc-100 px-4 py-3 font-semibold">
            Notifications
          </h2>
          {notifications.length ? (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => {
                const presentation = getNotificationPresentation(
                  notification.type,
                  notification.href,
                );
                return (
                  <li
                    className="border-b border-zinc-100 last:border-0"
                    key={notification.id}
                  >
                    <Link
                      className={`block px-4 py-3 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-amber-700 ${
                        notification.readAt ? "" : "bg-amber-50"
                      }`}
                      href={presentation.href}
                      onClick={() => {
                        setOpen(false);
                        if (!notification.readAt) {
                          void markRead(notification.id);
                        }
                      }}
                    >
                      <span className="block text-sm font-semibold">
                        {presentation.title}
                        {!notification.readAt ? (
                          <span className="sr-only"> (unread)</span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-sm text-zinc-600">
                        {presentation.description}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              No notifications yet.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
