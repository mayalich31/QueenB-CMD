import Link from "next/link";

import { formatUtcDate, monthLabel } from "@/components/admin/format";
import { MEETING_STATUS_COLORS } from "@/lib/constants/meeting-statuses";
import {
  formatUtcMonthParam,
  getAdminCalendar,
} from "@/lib/services/admin";
import { adminCalendarMonthSchema } from "@/lib/validations/admin";

type AdminCalendarPageProps = {
  searchParams: Promise<{ month?: string }>;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AdminCalendarPage({
  searchParams,
}: AdminCalendarPageProps) {
  const raw = await searchParams;
  const parsed = adminCalendarMonthSchema.safeParse({ month: raw.month });
  const month = parsed.success
    ? parsed.data
    : adminCalendarMonthSchema.parse({});
  const calendar = await getAdminCalendar(month);

  return (
    <section>
      <p className="text-sm font-medium text-brand-deep">Admin</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Master calendar</h1>
          <p className="mt-3 max-w-2xl text-zinc-600">
            System-wide meetings with a scheduled UTC time, color-coded by
            status.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            className="rounded-lg px-3 py-2 hover:bg-brand/25"
            href={`/admin/calendar?month=${formatUtcMonthParam(calendar.previous.year, calendar.previous.month)}`}
          >
            Previous
          </Link>
          <p className="min-w-40 text-center font-medium">
            {monthLabel(calendar.year, calendar.month)}
          </p>
          <Link
            className="rounded-lg px-3 py-2 hover:bg-brand/25"
            href={`/admin/calendar?month=${formatUtcMonthParam(calendar.next.year, calendar.next.month)}`}
          >
            Next
          </Link>
        </div>
      </div>

      {parsed.success ? null : (
        <p className="mt-4 text-sm text-red-700">
          Invalid month was ignored. Use YYYY-MM.
        </p>
      )}

      <div className="mt-8 grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200">
        {weekdayLabels.map((label) => (
          <div
            className="bg-cream px-2 py-2 text-center text-xs font-medium text-zinc-500"
            key={label}
          >
            {label}
          </div>
        ))}
        {calendar.cells.map((cell, index) => (
          <div
            className="min-h-28 bg-cream-card p-2"
            key={cell.date ? formatUtcDate(cell.date) : `empty-${index}`}
          >
            {cell.date ? (
              <>
                <p className="text-xs font-medium text-zinc-500">
                  {cell.date.getUTCDate()}
                </p>
                <ul className="mt-1 space-y-1">
                  {cell.meetings.map((meeting) => (
                    <li key={meeting.id}>
                      <Link
                        className={`block truncate rounded px-1 py-0.5 text-xs ${MEETING_STATUS_COLORS[meeting.status]}`}
                        href={`/admin/meetings/${meeting.id}`}
                        title={`${meeting.mentee.username} / ${meeting.mentor.username}`}
                      >
                        {meeting.mentee.username} / {meeting.mentor.username}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
