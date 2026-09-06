import { redirect } from "next/navigation";

import { FeedbackForm } from "@/components/meetings/feedback-form";
import { MeetingVerificationPanel } from "@/components/meetings/meeting-verification-panel";
import { MentorProfileForm } from "@/components/mentors/mentor-profile-form";
import { canSubmitFeedback } from "@/lib/services/meeting-verification";
import {
  ACTIVE_MEETING_STATUSES,
  getMeetingStatusLabel,
} from "@/lib/constants/meeting-statuses";
import { findMentorProfile } from "@/lib/dal/mentor-profiles";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import { listMeetingsForMentee } from "@/lib/services/meetings";
import { createClient } from "@/lib/supabase/server";

import {
  cancelMeetingAction,
  confirmAttendanceAction,
  requestMoreTimesAction,
  selectMeetingSlotAction,
} from "./actions";

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

type ProfileMeeting = Awaited<
  ReturnType<typeof listMeetingsForMentee>
>[number];

const pendingStatuses = new Set<MeetingStatus>([
  MeetingStatus.WAITING_FOR_MENTOR_TIMES,
  MeetingStatus.WAITING_FOR_MENTEE_SELECTION,
]);
const upcomingStatuses = new Set<MeetingStatus>([
  MeetingStatus.SCHEDULED,
  MeetingStatus.ATTENDANCE_CONFIRMED,
]);
const activeStatuses = new Set<MeetingStatus>(ACTIVE_MEETING_STATUSES);

function MeetingCard({
  meeting,
  userId,
}: {
  meeting: ProfileMeeting;
  userId: string;
}) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{meeting.mentor.username}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {meeting.scheduledAt
              ? meeting.scheduledAt.toLocaleString()
              : `Requested ${meeting.createdAt.toLocaleDateString()}`}
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800">
          {getMeetingStatusLabel(meeting)}
        </span>
      </div>

      {meeting.status === MeetingStatus.WAITING_FOR_MENTEE_SELECTION ? (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <p className="text-sm font-medium">Choose a time</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {meeting.slots.map((slot) => (
              <form action={selectMeetingSlotAction} key={slot.id}>
                <input name="meetingId" type="hidden" value={meeting.id} />
                <input name="slotId" type="hidden" value={slot.id} />
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
              <input name="meetingId" type="hidden" value={meeting.id} />
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

      {meeting.status === MeetingStatus.SCHEDULED ? (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <div className="grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
            <p>
              Your confirmation:{" "}
              {meeting.menteeAttendanceConfirmedAt ? "Confirmed" : "Pending"}
            </p>
            <p>
              Mentor confirmation:{" "}
              {meeting.mentorAttendanceConfirmedAt ? "Confirmed" : "Pending"}
            </p>
          </div>
          {!meeting.menteeAttendanceConfirmedAt ? (
            <form action={confirmAttendanceAction} className="mt-4">
              <input name="meetingId" type="hidden" value={meeting.id} />
              <button
                className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                type="submit"
              >
                Confirm attendance
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {meeting.status === MeetingStatus.ATTENDANCE_CONFIRMED ? (
        <p className="mt-4 text-sm text-emerald-700">
          Both participants confirmed. This meeting will complete after its
          scheduled time.
        </p>
      ) : null}

      {activeStatuses.has(meeting.status) ? (
        <form action={cancelMeetingAction} className="mt-4">
          <input name="meetingId" type="hidden" value={meeting.id} />
          <button
            className="text-sm font-medium text-red-700 hover:underline"
            type="submit"
          >
            Cancel meeting
          </button>
        </form>
      ) : null}

      {meeting.status === MeetingStatus.COMPLETED ? (
        <MeetingVerificationPanel
          meeting={meeting}
          userId={userId}
          workspace="profile"
        />
      ) : null}

      {canSubmitFeedback(meeting, userId) ? (
        <FeedbackForm meetingId={meeting.id} workspace="profile" />
      ) : null}

      {meeting.status === MeetingStatus.NOT_COMPLETED ? (
        <p className="mt-4 text-sm text-zinc-600">
          This meeting was marked as not completed.
        </p>
      ) : null}
    </article>
  );
}

function MeetingSection({
  title,
  meetings,
  userId,
  emptyMessage,
}: {
  title: string;
  meetings: ProfileMeeting[];
  userId: string;
  emptyMessage: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold">{title}</h2>
      {meetings.length > 0 ? (
        <div className="mt-4 space-y-4">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} userId={userId} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-zinc-600">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}

export default async function ProfilePage({
  searchParams,
}: ProfilePageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const [meetings, mentorProfile, status] = await Promise.all([
    listMeetingsForMentee(userId),
    findMentorProfile(userId),
    searchParams,
  ]);
  const pendingMeetings = meetings.filter((meeting) =>
    pendingStatuses.has(meeting.status),
  );
  const upcomingMeetings = meetings.filter((meeting) =>
    upcomingStatuses.has(meeting.status),
  );
  const historyMeetings = meetings.filter(
    (meeting) =>
      !pendingStatuses.has(meeting.status) &&
      !upcomingStatuses.has(meeting.status),
  );

  return (
    <div>
      <p className="text-sm font-medium text-amber-700">Personal hub</p>
      <h1 className="mt-2 text-3xl font-semibold">My Profile</h1>
      <p className="mt-3 text-zinc-600">
        Track your requests, upcoming meetings, and mentoring profile.
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

      <MeetingSection
        title="Pending requests"
        meetings={pendingMeetings}
        userId={userId}
        emptyMessage="You have no pending requests."
      />
      <MeetingSection
        title="Confirmed and upcoming meetings"
        meetings={upcomingMeetings}
        userId={userId}
        emptyMessage="You have no upcoming meetings."
      />
      {historyMeetings.length > 0 ? (
        <MeetingSection
          title="Meeting history"
          meetings={historyMeetings}
          userId={userId}
          emptyMessage=""
        />
      ) : null}

      <MentorProfileForm profile={mentorProfile} />
    </div>
  );
}
