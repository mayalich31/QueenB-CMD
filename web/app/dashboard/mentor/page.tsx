import { redirect } from "next/navigation";

import { listRequestsForMentor } from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

import { rejectMeetingRequestAction } from "./actions";

type MentorDashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function MentorDashboardPage({
  searchParams,
}: MentorDashboardPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const mentorId = data?.claims?.sub;

  if (!mentorId) {
    redirect("/login");
  }

  const [requests, status] = await Promise.all([
    listRequestsForMentor(mentorId),
    searchParams,
  ]);

  return (
    <section>
      <p className="text-sm font-medium text-amber-700">Mentor workspace</p>
      <h1 className="mt-2 text-3xl font-semibold">Inbound requests</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Review new requests. Time proposals will be added in the next
        integration slice.
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

      {requests.length > 0 ? (
        <div className="mt-8 space-y-4">
          {requests.map((request) => (
            <article
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-5"
              key={request.id}
            >
              <div>
                <h2 className="font-semibold">{request.mentee.username}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Requested {request.createdAt.toLocaleDateString()}
                </p>
              </div>
              <form action={rejectMeetingRequestAction}>
                <input name="meetingId" type="hidden" value={request.id} />
                <button
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  type="submit"
                >
                  Reject request
                </button>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600">
          No new meeting requests.
        </p>
      )}
    </section>
  );
}
