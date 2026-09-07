import Link from "next/link";
import { notFound } from "next/navigation";

import { formatUtcDateTime } from "@/components/admin/format";
import {
  MEETING_STATUS_COLORS,
  MEETING_STATUS_LABELS,
} from "@/lib/constants/meeting-statuses";
import { getAdminMeetingDetail } from "@/lib/services/admin";

type AdminMeetingDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMeetingDetailPage({
  params,
}: AdminMeetingDetailPageProps) {
  const { id } = await params;
  const meeting = await getAdminMeetingDetail(id);

  if (!meeting) {
    notFound();
  }

  return (
    <section>
      <p className="text-sm font-medium text-amber-700">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">Meeting detail</h1>
      <p className="mt-3 text-zinc-600">
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${MEETING_STATUS_COLORS[meeting.status]}`}
        >
          {MEETING_STATUS_LABELS[meeting.status]}
        </span>
      </p>

      <dl className="mt-8 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Mentee</dt>
          <dd className="mt-1 font-medium">
            <Link
              className="text-amber-800 hover:underline"
              href={`/admin/users/${meeting.mentee.id}`}
            >
              {meeting.mentee.username}
            </Link>
            <span className="block text-zinc-500">{meeting.mentee.email}</span>
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Mentor</dt>
          <dd className="mt-1 font-medium">
            <Link
              className="text-amber-800 hover:underline"
              href={`/admin/users/${meeting.mentor.id}`}
            >
              {meeting.mentor.username}
            </Link>
            <span className="block text-zinc-500">{meeting.mentor.email}</span>
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Scheduled</dt>
          <dd className="mt-1">{formatUtcDateTime(meeting.scheduledAt)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Completed</dt>
          <dd className="mt-1">{formatUtcDateTime(meeting.completedAt)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Mentor attendance</dt>
          <dd className="mt-1">
            {formatUtcDateTime(meeting.mentorAttendanceConfirmedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Mentee attendance</dt>
          <dd className="mt-1">
            {formatUtcDateTime(meeting.menteeAttendanceConfirmedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Requested more times</dt>
          <dd className="mt-1">{meeting.hasRequestedMoreTimes ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Rescheduled</dt>
          <dd className="mt-1">{meeting.hasRescheduled ? "Yes" : "No"}</dd>
        </div>
      </dl>

      <h2 className="mt-8 text-lg font-semibold">Proposed slots</h2>
      {meeting.slots.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">No slots proposed.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {meeting.slots.map((slot) => (
            <li
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
              key={slot.id}
            >
              {formatUtcDateTime(slot.startsAt)} – {formatUtcDateTime(slot.endsAt)}
              {slot.isSelected ? (
                <span className="ml-2 text-emerald-700">Selected</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-lg font-semibold">Verification</h2>
      {meeting.verifications.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">No verification records.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {meeting.verifications.map((verification) => (
            <li
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
              key={verification.id}
            >
              <p>Cycle {verification.cycle}</p>
              <p>
                Did happen — mentor: {formatOptionalBool(verification.mentorDidHappen)},
                mentee: {formatOptionalBool(verification.menteeDidHappen)}
              </p>
              <p>
                Wants reschedule — mentor:{" "}
                {formatOptionalBool(verification.mentorWantsReschedule)}, mentee:{" "}
                {formatOptionalBool(verification.menteeWantsReschedule)}
              </p>
              <p>Resolved: {formatUtcDateTime(verification.verificationResolvedAt)}</p>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-lg font-semibold">Feedback</h2>
      {meeting.feedback.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">No feedback submitted.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {meeting.feedback.map((entry) => (
            <li
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
              key={entry.id}
            >
              <p className="font-medium">
                {entry.author.username} — {entry.rating}/5
              </p>
              {entry.comment ? (
                <p className="mt-1 text-zinc-600">{entry.comment}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatOptionalBool(value: boolean | null) {
  if (value == null) {
    return "—";
  }
  return value ? "yes" : "no";
}
