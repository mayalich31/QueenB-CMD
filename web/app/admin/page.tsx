import Link from "next/link";

import {
  MEETING_STATUS_COLORS,
  MEETING_STATUS_LABELS,
} from "@/lib/constants/meeting-statuses";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import { getAdminSummary } from "@/lib/services/admin";
import type { AdminAlertKind } from "@/lib/services/admin";

const alertKindCards: Array<{
  kind: AdminAlertKind;
  label: string;
}> = [
  { kind: "NOT_COMPLETED", label: "Did not happen" },
  { kind: "STUCK_ATTENDANCE", label: "Stuck attendance" },
  { kind: "OVERDUE_FEEDBACK", label: "Overdue feedback" },
  { kind: "MENTOR_MILESTONE", label: "Mentor milestone" },
];

export default async function AdminSummaryPage() {
  const summary = await getAdminSummary();

  return (
    <section>
      <p className="text-sm font-medium text-amber-700">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">General summary</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Snapshot of users, meetings, and open alerts across Queens Match.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard href="/admin/users" label="Users" value={summary.users.total} />
        <SummaryCard
          href="/admin/users"
          label="Mentors"
          value={summary.users.mentors}
        />
        <SummaryCard
          href="/admin/users"
          label="Other accounts"
          value={summary.users.others}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SummaryCard
          href="/admin/meetings"
          label="Meetings"
          value={summary.meetings.total}
        />
        <SummaryCard
          href="/admin/alerts"
          label="Open alerts"
          value={summary.alerts.total}
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold">Meetings by status</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Count</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(MeetingStatus).map((status) => (
              <tr className="border-t border-zinc-100" key={status}>
                <td className="px-4 py-3">
                  <Link
                    className={`rounded-full px-2 py-1 text-xs font-medium ${MEETING_STATUS_COLORS[status]}`}
                    href={`/admin/meetings?status=${status}`}
                  >
                    {MEETING_STATUS_LABELS[status]}
                  </Link>
                </td>
                <td className="px-4 py-3">{summary.meetings.byStatus[status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Open alerts</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {alertKindCards.map((card) => (
          <SummaryCard
            href="/admin/alerts"
            key={card.kind}
            label={card.label}
            value={summary.alerts.byKind[card.kind]}
          />
        ))}
      </div>
    </section>
  );
}

function SummaryCard({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: number;
}) {
  return (
    <Link
      className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-amber-300"
      href={href}
    >
      <p className="text-sm text-zinc-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </Link>
  );
}
