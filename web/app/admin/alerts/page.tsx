import Link from "next/link";

import { getAdminInbox } from "@/lib/services/admin";
import type { AdminAlertKind } from "@/lib/services/admin";

const kindLabels: Record<AdminAlertKind, string> = {
  NOT_COMPLETED: "Did not happen",
  STUCK_ATTENDANCE: "Stuck attendance",
  OVERDUE_FEEDBACK: "Overdue feedback",
  MENTOR_MILESTONE: "Mentor milestone",
};

export default async function AdminAlertsPage() {
  const alerts = await getAdminInbox();

  return (
    <section>
      <p className="text-sm font-medium text-brand-deep">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">Alerts inbox</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Triage meetings that did not happen, attendance that is stuck past the
        scheduled time, overdue feedback, and mentors who have reached 10
        completed sessions.
      </p>

      {alerts.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-brand/30 bg-cream-card p-5 text-sm text-zinc-600">
          No alerts right now.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {alerts.map((alert) => (
            <li key={`${alert.kind}-${alert.meetingId ?? alert.userId}`}>
              <Link
                className="block rounded-2xl border border-brand/30 bg-cream-card p-5 hover:border-brand"
                href={alert.href}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-brand-deep">
                  {kindLabels[alert.kind]}
                </p>
                <p className="mt-2 font-medium text-zinc-900">{alert.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{alert.detail}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
