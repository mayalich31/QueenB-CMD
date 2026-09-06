import Link from "next/link";
import { redirect } from "next/navigation";

import { MEETING_STATUS_LABELS } from "@/lib/constants/meeting-statuses";
import { listMeetingsForMentee } from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

export default async function MenteeDashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const meetings = await listMeetingsForMentee(userId);

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

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Your meeting requests</h2>
        {meetings.length > 0 ? (
          <div className="mt-4 space-y-3">
            {meetings.map((meeting) => (
              <article
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4"
                key={meeting.id}
              >
                <div>
                  <p className="font-medium">{meeting.mentor.username}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Requested {meeting.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800">
                  {MEETING_STATUS_LABELS[meeting.status]}
                </span>
              </article>
            ))}
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
