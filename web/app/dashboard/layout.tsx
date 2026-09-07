import Link from "next/link";
import { redirect } from "next/navigation";

import { findUserById } from "@/lib/dal/users";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { FeedbackSoftBlockBanner } from "@/components/enforcement/feedback-soft-block-banner";
import { NotificationBell } from "@/components/notifications/notification-bell";
import {
  NotificationRealtimeProvider,
  type NotificationItem,
} from "@/components/notifications/realtime-provider";
import { NotificationToastHost } from "@/components/notifications/toast-host";
import { getFeedbackEnforcementState } from "@/lib/services/enforcement";
import { isSoleAdminEmail } from "@/lib/services/admin-authorization";
import { listRecentNotifications } from "@/lib/services/notifications";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/login");
  }

  const [user, notificationRecords, enforcement] = await Promise.all([
    findUserById(claims.sub),
    listRecentNotifications(claims.sub),
    getFeedbackEnforcementState(claims.sub),
  ]);
  const initialNotifications: NotificationItem[] = notificationRecords.map(
    (notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? null,
    }),
  );

  return (
    <NotificationRealtimeProvider
      initialNotifications={initialNotifications}
      userId={claims.sub}
    >
      <div className="min-h-screen bg-zinc-50 text-zinc-950">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <Link
              className="font-semibold tracking-widest text-amber-700"
              href="/"
            >
              QUEENS MATCH
            </Link>
            <nav className="flex items-center gap-2" aria-label="Workspace">
              <Link
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
                href="/dashboard"
              >
                Directory
              </Link>
              <Link
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
                href="/dashboard/profile"
              >
                My Profile
              </Link>
              {user?.isMentor ? (
                <Link
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
                  href="/dashboard/mentor"
                >
                  Mentor
                </Link>
              ) : null}
              {isSoleAdminEmail(user?.email) ? (
                <Link
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100"
                  href="/admin"
                >
                  Admin
                </Link>
              ) : null}
              <NotificationBell />
              <form action={logout}>
                <button
                  className="rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </nav>
          </div>
        </header>
        {enforcement.isSoftBlocked ? (
          <FeedbackSoftBlockBanner
            overdueCount={enforcement.overdueMeetings.length}
          />
        ) : null}
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <NotificationToastHost />
      </div>
    </NotificationRealtimeProvider>
  );
}
