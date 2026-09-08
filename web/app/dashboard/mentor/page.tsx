import Link from "next/link";
import { redirect } from "next/navigation";

import { MentorCalendar } from "@/components/meetings/mentor-calendar";
import { MENTEE_CALENDAR_STATUSES } from "@/lib/constants/meeting-statuses";
import { findMentorProfile } from "@/lib/dal/mentor-profiles";
import {
  listMeetingsForMentor,
  listRequestsForMentor,
} from "@/lib/services/meetings";
import {
  formatWeekParam,
  parseWeekParam,
} from "@/lib/services/week-calendar";
import { createClient } from "@/lib/supabase/server";

import { rejectMeetingRequestAction } from "./actions";

type MentorDashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    week?: string;
    request?: string;
  }>;
};

const scheduledStatuses = new Set<string>(MENTEE_CALENDAR_STATUSES);

export default async function MentorDashboardPage({
  searchParams,
}: MentorDashboardPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const mentorId = data?.claims?.sub;

  if (!mentorId) {
    redirect("/login");
  }

  const status = await searchParams;
  const [requests, meetings, profile] = await Promise.all([
    listRequestsForMentor(mentorId),
    listMeetingsForMentor(mentorId),
    findMentorProfile(mentorId),
  ]);

  const weekStart = parseWeekParam(status.week);
  const weekParam = formatWeekParam(weekStart);
  const selectedRequest =
    requests.find((request) => request.id === status.request) ?? null;
  const durationMinutes = profile?.meetingDurationMinutes ?? 30;

  const events = meetings.flatMap((meeting) => {
    if (
      !meeting.scheduledAt ||
      !scheduledStatuses.has(meeting.status)
    ) {
      return [];
    }

    return [
      {
        meetingId: meeting.id,
        counterpartName: meeting.mentee.username,
        status: meeting.status,
        startsAt: meeting.scheduledAt.toISOString(),
        endsAt: new Date(
          meeting.scheduledAt.getTime() + durationMinutes * 60_000,
        ).toISOString(),
        role: "mentor" as const,
      },
    ];
  });

  return (
    <section>
      <h1 className="text-3xl font-semibold">Requests</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Review pending requests. Choose times to open the calendar, or reject a
        request.
      </p>

      {status.error ? (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {status.error}
        </p>
      ) : null}
      {status.message ? (
        <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {status.message}
        </p>
      ) : null}

      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Pending requests
        </h2>
        {requests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600">
            No new meeting requests.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {requests.map((request) => {
              const isSelected = selectedRequest?.id === request.id;
              const chooseHref = `/dashboard/mentor?week=${weekParam}&request=${request.id}`;

              return (
                <article
                  className={`rounded-xl border p-5 ${
                    isSelected
                      ? "border-brand-deep bg-brand/35"
                      : "border-brand/30 bg-cream-card"
                  }`}
                  key={request.id}
                >
                  <p className="font-medium">{request.mentee.username}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Requested {request.createdAt.toLocaleDateString()}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      className="rounded-lg bg-brand-deep px-4 py-2 text-sm font-medium text-white hover:bg-brand"
                      href={chooseHref}
                    >
                      Choose times
                    </Link>
                    <form action={rejectMeetingRequestAction}>
                      <input name="meetingId" type="hidden" value={request.id} />
                      <button
                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                        type="submit"
                      >
                        Reject request
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedRequest ? (
        <div className="mt-10">
          <MentorCalendar
            closeHref="/dashboard/mentor"
            durationMinutes={durationMinutes}
            events={events}
            selectedMenteeName={selectedRequest.mentee.username}
            selectedRequestId={selectedRequest.id}
            weekParam={weekParam}
          />
        </div>
      ) : null}
    </section>
  );
}
