import Link from "next/link";
import { notFound } from "next/navigation";

import { formatUtcDateTime } from "@/components/admin/format";
import { SOLE_ADMIN_EMAIL } from "@/lib/constants/admin";
import {
  MEETING_STATUS_COLORS,
  MEETING_STATUS_LABELS,
} from "@/lib/constants/meeting-statuses";
import { isSoleAdminEmail } from "@/lib/services/admin-authorization";
import { getAdminUserDetail } from "@/lib/services/admin";

type AdminUserDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;
  const user = await getAdminUserDetail(id);

  if (!user) {
    notFound();
  }

  const meetings = [
    ...user.menteeMeetings.map((meeting) => ({
      ...meeting,
      counterpart: meeting.mentor,
      role: "Mentee" as const,
    })),
    ...user.mentorMeetings.map((meeting) => ({
      ...meeting,
      counterpart: meeting.mentee,
      role: "Mentor" as const,
    })),
  ].sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime());

  return (
    <section>
      <p className="text-sm font-medium text-brand-deep">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold">{user.username}</h1>
      <p className="mt-2 text-zinc-600">{user.email}</p>

      <dl className="mt-8 grid gap-4 rounded-2xl border border-brand/30 bg-cream-card p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Registered</dt>
          <dd className="mt-1">{formatUtcDateTime(user.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Roles</dt>
          <dd className="mt-1">
            {[
              user.isMentor ? "Mentor" : "Mentee",
              isSoleAdminEmail(user.email) ? "Admin" : null,
            ]
              .filter(Boolean)
              .join(", ")}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">isAdmin flag</dt>
          <dd className="mt-1">
            {user.isAdmin ? "true" : "false"}
            {isSoleAdminEmail(user.email)
              ? ` (access granted via ${SOLE_ADMIN_EMAIL})`
              : " (does not grant /admin)"}
          </dd>
        </div>
      </dl>

      {user.mentorProfile ? (
        <div className="mt-8 rounded-2xl border border-brand/30 bg-cream-card p-5 text-sm">
          <h2 className="text-lg font-semibold">Mentor profile</h2>
          <p className="mt-3 text-zinc-700">{user.mentorProfile.background}</p>
          <p className="mt-3 text-zinc-600">
            Topics: {user.mentorProfile.topics.join(", ")}
          </p>
          <p className="mt-1 text-zinc-600">
            Capacity {user.mentorProfile.maxConcurrentMeetings} · Duration{" "}
            {user.mentorProfile.meetingDurationMinutes} minutes ·{" "}
            {user.mentorProfile.isActive ? "Visible in directory" : "Hidden"}
          </p>
        </div>
      ) : null}

      <h2 className="mt-8 text-lg font-semibold">Meeting history</h2>
      {meetings.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">No meetings yet.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {meetings.map((meeting) => (
            <li
              className="rounded-xl border border-brand/30 bg-cream-card px-4 py-3"
              key={`${meeting.role}-${meeting.id}`}
            >
              <Link
                className="font-medium text-brand-deep hover:underline"
                href={`/admin/meetings/${meeting.id}`}
              >
                {meeting.role} with {meeting.counterpart.username}
              </Link>
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${MEETING_STATUS_COLORS[meeting.status]}`}
              >
                {MEETING_STATUS_LABELS[meeting.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-8 text-lg font-semibold">Submitted feedback</h2>
      {user.feedbackEntries.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-600">No feedback authored.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {user.feedbackEntries.map((entry) => (
            <li
              className="rounded-xl border border-brand/30 bg-cream-card px-4 py-3"
              key={entry.id}
            >
              <Link
                className="font-medium text-brand-deep hover:underline"
                href={`/admin/meetings/${entry.meetingId}`}
              >
                {entry.rating}/5 on {MEETING_STATUS_LABELS[entry.meeting.status]}{" "}
                meeting
              </Link>
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
