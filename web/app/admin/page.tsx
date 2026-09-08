import Link from "next/link";

import { MeetingsByWeekdayChart } from "@/components/admin/charts/meetings-by-weekday-chart";
import { RequestResponseChart } from "@/components/admin/charts/request-response-chart";
import { TopMentorsChart } from "@/components/admin/charts/top-mentors-chart";
import { TopicsOfferedChart } from "@/components/admin/charts/topics-offered-chart";
import { UserGrowthChart } from "@/components/admin/charts/user-growth-chart";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import { getAdminMetrics } from "@/lib/services/admin";

export default async function AdminMetricsPage() {
  const metrics = await getAdminMetrics();

  return (
    <section>
      <p className="text-sm font-medium text-brand-deep">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">Metrics</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Users, meetings, and mentoring activity across Queens Match.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          change={metrics.changes.users}
          href="/admin/users"
          label="Users"
          value={metrics.users.total}
        />
        <SummaryCard
          change={metrics.changes.mentors}
          href="/admin/users"
          label="Mentors"
          value={metrics.users.mentors}
        />
        <SummaryCard
          change={metrics.changes.meetings}
          href="/admin/meetings"
          label="Meetings"
          value={metrics.meetings.total}
        />
        <SummaryCard
          change={metrics.changes.completed}
          href={`/admin/meetings?status=${MeetingStatus.COMPLETED}`}
          label="Completed"
          value={metrics.meetings.byStatus[MeetingStatus.COMPLETED]}
        />
        <SummaryCard
          change={metrics.changes.alerts}
          href="/admin/alerts"
          label="Open alerts"
          value={metrics.alerts.total}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <TopicsOfferedChart data={metrics.topicsOffered} />
        <UserGrowthChart data={metrics.userGrowth} />
        <RequestResponseChart data={metrics.requestResponses} />
        <TopMentorsChart data={metrics.topMentors} />
      </div>

      <div className="mt-4">
        <MeetingsByWeekdayChart data={metrics.meetingsByWeekday} />
      </div>
    </section>
  );
}

function SummaryCard({
  href,
  label,
  value,
  change,
}: {
  href: string;
  label: string;
  value: number;
  change: number;
}) {
  const positive = change > 0;
  const negative = change < 0;

  return (
    <Link
      className="rounded-2xl border border-brand/30 bg-cream-card p-5 shadow-sm hover:border-brand"
      href={href}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-3xl font-semibold">{value}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
            positive
              ? "bg-emerald-100 text-emerald-800"
              : negative
                ? "bg-red-100 text-red-700"
                : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {positive ? "+" : ""}
          {change}%
        </span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">{label}</p>
    </Link>
  );
}
