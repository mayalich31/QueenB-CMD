import Link from "next/link";

import { AdminPagination } from "@/components/admin/admin-pagination";
import { formatUtcDateTime } from "@/components/admin/format";
import {
  MEETING_STATUS_COLORS,
  MEETING_STATUS_LABELS,
} from "@/lib/constants/meeting-statuses";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import { getAdminMeetingsReport } from "@/lib/services/admin";
import { adminMeetingsFilterSchema } from "@/lib/validations/admin";

type AdminMeetingsPageProps = {
  searchParams: Promise<{
    status?: string;
    participant?: string;
    page?: string;
  }>;
};

const statusOptions = Object.values(MeetingStatus);

export default async function AdminMeetingsPage({
  searchParams,
}: AdminMeetingsPageProps) {
  const raw = await searchParams;
  const parsed = adminMeetingsFilterSchema.safeParse({
    status: raw.status || undefined,
    participant: raw.participant,
    page: raw.page ?? "1",
  });
  const filters = parsed.success
    ? parsed.data
    : { page: 1, participant: undefined, status: undefined };
  const report = await getAdminMeetingsReport(filters);

  return (
    <section>
      <p className="text-sm font-medium text-brand-deep">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">Meetings report</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Filter every meeting by status or participant using URL search
        parameters.
      </p>

      <form className="mt-8 flex flex-wrap gap-3" method="get">
        <label className="text-sm text-zinc-700">
          Status
          <select
            className="ml-2 rounded-lg border border-zinc-300 bg-cream-card px-3 py-2"
            defaultValue={filters.status ?? ""}
            name="status"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {MEETING_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-zinc-700">
          Participant
          <input
            className="ml-2 rounded-lg border border-zinc-300 px-3 py-2"
            defaultValue={filters.participant ?? ""}
            name="participant"
            placeholder="username or email"
            type="search"
          />
        </label>
        <button
          className="rounded-lg bg-brand-deep px-4 py-2 text-sm font-medium text-white"
          type="submit"
        >
          Filter
        </button>
      </form>

      {parsed.success ? null : (
        <p className="mt-4 text-sm text-red-700">
          Invalid filters were ignored. Use a known meeting status.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-brand/30 bg-cream-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-brand/30 bg-table-header text-ink">
            <tr>
              <th className="px-4 py-3 font-medium">Participants</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Scheduled</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {report.meetings.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-zinc-600" colSpan={4}>
                  No meetings match these filters.
                </td>
              </tr>
            ) : (
              report.meetings.map((meeting) => (
                <tr className="border-t border-zinc-100" key={meeting.id}>
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-brand-deep hover:underline"
                      href={`/admin/meetings/${meeting.id}`}
                    >
                      {meeting.mentee.username} / {meeting.mentor.username}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {meeting.mentee.email} · {meeting.mentor.email}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${MEETING_STATUS_COLORS[meeting.status]}`}
                    >
                      {MEETING_STATUS_LABELS[meeting.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatUtcDateTime(meeting.scheduledAt)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatUtcDateTime(meeting.updatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        basePath="/admin/meetings"
        page={report.page}
        pageCount={report.pageCount}
        params={{
          status: filters.status,
          participant: filters.participant,
        }}
      />
    </section>
  );
}
