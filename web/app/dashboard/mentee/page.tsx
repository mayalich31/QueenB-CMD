import Link from "next/link";
import { redirect } from "next/navigation";

import { FeedbackForm } from "@/components/meetings/feedback-form";
import { MEETING_STATUS_LABELS } from "@/lib/constants/meeting-statuses";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import { listMeetingsForMentee } from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

import {
  requestMoreTimesAction,
  selectMeetingSlotAction,
} from "./actions";

type MenteeDashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function MenteeDashboardPage({
  searchParams,
}: MenteeDashboardPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const [meetings, status] = await Promise.all([
    listMeetingsForMentee(userId),
    searchParams,
  ]);

  return (
    <section>
      <p className="text-sm font-medium text-amber-700">Mentee workspace</p>
      <h1 className="mt-2 text-3xl font-semibold">Find your next mentor</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Browse available mentors by advisory topic. Meeting requests will be
        added in the next integration slice.
      </p>
      <Link
        className="mt-6 inline-flex rounded-lg bg-zinc-950 px-4 py-2.5 font-medium text-white hover:bg-zinc-800"
        href="/dashboard/mentee/directory"
      >
        Browse mentors
      </Link>

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

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Your meeting requests</h2>
        {meetings.length > 0 ? (
          <div className="mt-4 space-y-3">
            {meetings.map((meeting) => {
              const hasFeedback = meeting.feedback.some(
                (feedback) => feedback.authorId === userId,
              );

              return (
                <article
                  className="rounded-xl border border-zinc-200 bg-white p-4"
                  key={meeting.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{meeting.mentor.username}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {meeting.scheduledAt
                          ? meeting.scheduledAt.toLocaleString()
                          : `Requested ${meeting.createdAt.toLocaleDateString()}`}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800">
                      {MEETING_STATUS_LABELS[meeting.status]}
                    </span>
                  </div>

                  {meeting.status ===
                  MeetingStatus.WAITING_FOR_MENTEE_SELECTION ? (
                    <div className="mt-4 border-t border-zinc-100 pt-4">
                      <p className="text-sm font-medium">Choose a time</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {meeting.slots.map((slot) => (
                          <form action={selectMeetingSlotAction} key={slot.id}>
                            <input
                              name="meetingId"
                              type="hidden"
                              value={meeting.id}
                            />
                            <input
                              name="slotId"
                              type="hidden"
                              value={slot.id}
                            />
                            <button
                              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50"
                              type="submit"
                            >
                              {slot.startsAt.toLocaleString()}
                            </button>
                          </form>
                        ))}
                      </div>
                      {!meeting.hasRequestedMoreTimes ? (
                        <form action={requestMoreTimesAction} className="mt-3">
                          <input
                            name="meetingId"
                            type="hidden"
                            value={meeting.id}
                          />
                          <button
                            className="text-sm font-medium text-amber-700 hover:underline"
                            type="submit"
                          >
                            None work — request more times
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}

                  {meeting.status === MeetingStatus.COMPLETED &&
                  !hasFeedback ? (
                    <FeedbackForm meetingId={meeting.id} workspace="mentee" />
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-zinc-600">
            You have no meeting requests yet.
          </p>
        )}
      </div>
    </section>
  );
}
