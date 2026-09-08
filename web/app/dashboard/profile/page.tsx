import { redirect } from "next/navigation";
import Link from "next/link";

import { FeedbackForm } from "@/components/meetings/feedback-form";
import { MeetingVerificationPanel } from "@/components/meetings/meeting-verification-panel";
import { MeetingWeekGrid } from "@/components/meetings/meeting-week-grid";
import { BecomeMentorModal } from "@/components/mentors/become-mentor-modal";
import { ProfileDetailsCard } from "@/components/profile/profile-details-card";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { SlotSelectionButtons } from "@/components/meetings/slot-selection-buttons";
import { canSubmitFeedback } from "@/lib/services/meeting-verification";
import {
  ACTIVE_MEETING_STATUSES,
  getMeetingStatusLabel,
  MENTEE_CALENDAR_STATUSES,
} from "@/lib/constants/meeting-statuses";
import { findMentorProfile } from "@/lib/dal/mentor-profiles";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import {
  listMeetingsForMentee,
  listMeetingsForParticipant,
} from "@/lib/services/meetings";
import {
  formatWeekParam,
  parseWeekParam,
} from "@/lib/services/week-calendar";
import { createClient } from "@/lib/supabase/server";
import { findUserById } from "@/lib/dal/users";

import {
  cancelMeetingAction,
  confirmAttendanceAction,
  requestMoreTimesAction,
} from "./actions";

type ProfilePageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    week?: string;
    edit?: string;
    view?: string;
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
    <article className="rounded-xl border border-brand/30 bg-cream-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{meeting.mentor.username}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {meeting.scheduledAt
              ? meeting.scheduledAt.toLocaleString()
              : `Requested ${meeting.createdAt.toLocaleDateString()}`}
          </p>
        </div>
        <span className="rounded-full bg-brand/35 px-3 py-1 text-sm text-brand-deep">
          {getMeetingStatusLabel(meeting)}
        </span>
      </div>
      <Link
        className="mt-2 inline-block text-sm font-medium text-brand-deep hover:underline"
        href={`/meetings/${meeting.id}`}
      >
        Open meeting
      </Link>

      {meeting.status === MeetingStatus.WAITING_FOR_MENTEE_SELECTION ? (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <p className="text-sm font-medium">Choose a time</p>
          <SlotSelectionButtons
            meetingId={meeting.id}
            slots={meeting.slots}
          />
          {!meeting.hasRequestedMoreTimes ? (
            <form action={requestMoreTimesAction} className="mt-3">
              <input name="meetingId" type="hidden" value={meeting.id} />
              <button
                className="text-sm font-medium text-brand-deep hover:underline"
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
                className="rounded-lg bg-brand-deep px-4 py-2 text-sm font-medium text-white hover:bg-brand"
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

  const [menteeMeetings, allMeetings, mentorProfile, user, status] =
    await Promise.all([
    listMeetingsForMentee(userId),
    listMeetingsForParticipant(userId),
    findMentorProfile(userId),
    findUserById(userId),
    searchParams,
  ]);

  if (!user) {
    redirect("/login");
  }
  const meetings = menteeMeetings;
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
  const menteeCalendarStatuses = new Set<string>(MENTEE_CALENDAR_STATUSES);
  const weekParam = formatWeekParam(parseWeekParam(status.week));
  const calendarEvents = allMeetings.flatMap((meeting) => {
    if (
      !menteeCalendarStatuses.has(meeting.status) ||
      !meeting.scheduledAt
    ) {
      return [];
    }

    const selectedSlot = meeting.slots.find((slot) => slot.isSelected);
    const endsAt =
      selectedSlot?.endsAt ??
      new Date(meeting.scheduledAt.getTime() + 30 * 60_000);
    const role = meeting.mentorId === userId ? ("mentor" as const) : ("mentee" as const);
    const counterpartName =
      role === "mentor" ? meeting.mentee.username : meeting.mentor.username;

    return [
      {
        meetingId: meeting.id,
        counterpartName,
        status: meeting.status,
        startsAt: meeting.scheduledAt.toISOString(),
        endsAt: endsAt.toISOString(),
        role,
      },
    ];
  });

  const isEditing = status.edit === "1";
  const view =
    status.view === "calendar" ||
    status.view === "appointments" ||
    status.view === "history"
      ? status.view
      : "overview";

  const tabs = [
    { id: "overview", label: "Overview", href: "/dashboard/profile" },
    {
      id: "calendar",
      label: "Calendar",
      href: `/dashboard/profile?view=calendar&week=${weekParam}`,
    },
    {
      id: "appointments",
      label: "Appointments",
      href: "/dashboard/profile?view=appointments",
    },
    {
      id: "history",
      label: "Meetings History",
      href: "/dashboard/profile?view=history",
    },
  ] as const;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">My Profile</h1>
          <p className="mt-3 text-zinc-600">
            Track your requests, upcoming meetings, and mentoring profile.
          </p>
        </div>
        {view === "overview" ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              className="rounded-lg border border-brand/60 bg-cream-card px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-brand/30"
              href="/dashboard/profile?edit=1"
            >
              Edit Profile
            </Link>
            {!user.isMentor ? <BecomeMentorModal /> : null}
          </div>
        ) : null}
      </div>

      <nav
        aria-label="Profile sections"
        className="mt-8 flex flex-wrap gap-1 border-b border-brand/30"
      >
        {tabs.map((tab) => {
          const isActive = view === tab.id;
          return (
            <Link
              className={`rounded-t-lg px-4 py-2.5 text-sm font-medium ${
                isActive
                  ? "border border-b-0 border-brand/40 bg-cream-card text-brand-deep"
                  : "text-zinc-600 hover:bg-brand/20 hover:text-zinc-950"
              }`}
              href={tab.href}
              key={tab.id}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

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

      {view === "overview" ? (
        <>
          {isEditing ? (
            <ProfileDetailsForm
              mentorProfile={
                mentorProfile
                  ? {
                      background: mentorProfile.background,
                      topics: mentorProfile.topics,
                      maxConcurrentMeetings: mentorProfile.maxConcurrentMeetings,
                      meetingDurationMinutes:
                        mentorProfile.meetingDurationMinutes,
                      isActive: mentorProfile.isActive,
                    }
                  : null
              }
              user={user}
            />
          ) : (
            <ProfileDetailsCard profile={user} />
          )}
        </>
      ) : null}

      {view === "calendar" ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Calendar</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Scheduled meetings you booked as a mentee and sessions booked with
            you as a mentor. Each block is tagged with your role.
          </p>
          <div className="mt-4">
            <MeetingWeekGrid
              basePath="/dashboard/profile"
              extraQuery={{ view: "calendar" }}
              events={calendarEvents}
              weekParam={weekParam}
            />
          </div>
        </section>
      ) : null}

      {view === "appointments" ? (
        <>
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
        </>
      ) : null}

      {view === "history" ? (
        <MeetingSection
          title="Meetings History"
          meetings={historyMeetings}
          userId={userId}
          emptyMessage="You have no meetings history yet."
        />
      ) : null}
    </div>
  );
}
