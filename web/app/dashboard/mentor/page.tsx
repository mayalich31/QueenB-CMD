import { redirect } from "next/navigation";

import { FeedbackForm } from "@/components/meetings/feedback-form";
import { SlotProposalForm } from "@/components/meetings/slot-proposal-form";
import { MEETING_STATUS_LABELS } from "@/lib/constants/meeting-statuses";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import {
  listMeetingsForMentor,
  listRequestsForMentor,
} from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

import {
  confirmAttendanceAction,
  rejectMeetingRequestAction,
} from "./actions";

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

  const [requests, meetings, status] = await Promise.all([
    listRequestsForMentor(mentorId),
    listMeetingsForMentor(mentorId),
    searchParams,
  ]);
  const managedMeetings = meetings.filter(
    (meeting) => meeting.status !== MeetingStatus.WAITING_FOR_MENTOR_TIMES,
  );

  return (
    <section>
      <p className="text-sm font-medium text-amber-700">Mentor workspace</p>
      <h1 className="mt-2 text-3xl font-semibold">Inbound requests</h1>
      <p className="mt-3 max-w-2xl text-zinc-600">
        Review requests, propose times, and manage scheduled meetings.
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
              className="rounded-2xl border border-zinc-200 bg-white p-5"
              key={request.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
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
              </div>
              <SlotProposalForm meetingId={request.id} />
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600">
          No new meeting requests.
        </p>
      )}

      <div className="mt-12">
        <h2 className="text-xl font-semibold">Meeting activity</h2>
        {managedMeetings.length > 0 ? (
          <div className="mt-4 space-y-4">
            {managedMeetings.map((meeting) => {
              const hasFeedback = meeting.feedback.some(
                (feedback) => feedback.authorId === mentorId,
              );

              return (
                <article
                  className="rounded-2xl border border-zinc-200 bg-white p-5"
                  key={meeting.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">
                        {meeting.mentee.username}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {meeting.scheduledAt
                          ? meeting.scheduledAt.toLocaleString()
                          : "Time selection pending"}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800">
                      {MEETING_STATUS_LABELS[meeting.status]}
                    </span>
                  </div>

                  {meeting.status === MeetingStatus.SCHEDULED ? (
                    <form action={confirmAttendanceAction} className="mt-4">
                      <input
                        name="meetingId"
                        type="hidden"
                        value={meeting.id}
                      />
                      <button
                        className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                        type="submit"
                      >
                        Confirm attendance
                      </button>
                    </form>
                  ) : null}

                  {meeting.status === MeetingStatus.COMPLETED &&
                  !hasFeedback ? (
                    <FeedbackForm meetingId={meeting.id} workspace="mentor" />
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-600">
            No meeting activity yet.
          </p>
        )}
      </div>
    </section>
  );
}
