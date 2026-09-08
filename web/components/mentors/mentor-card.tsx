"use client";

import { useEffect, useId, useState } from "react";

import { requestMeetingAction } from "@/app/dashboard/actions";
import {
  MENTORING_TOPIC_LABELS,
  type MentoringTopic,
} from "@/lib/constants/mentoring-topics";
import { mentoringTopicSchema } from "@/lib/validations/mentor-profile";

export type MentorCardDetails = {
  background: string;
  jobTitle: string | null;
  workplace: string | null;
  yearsOfExperience: number | null;
  programmingLanguages: string[];
  techStack: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  maxConcurrentMeetings: number;
};

type MentorCardProps = {
  mentorId: string;
  username: string;
  meetingDurationMinutes: number;
  topics: string[];
  remainingSpots: number;
  isSoftBlocked: boolean;
  details: MentorCardDetails;
};

function topicLabel(topic: string) {
  const result = mentoringTopicSchema.safeParse(topic);
  return result.success
    ? MENTORING_TOPIC_LABELS[result.data as MentoringTopic]
    : topic;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-zinc-800">{value || "Not provided"}</dd>
    </div>
  );
}

export function MentorCard({
  mentorId,
  username,
  meetingDurationMinutes,
  topics,
  remainingSpots,
  isSoftBlocked,
  details,
}: MentorCardProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const hasSpots = remainingSpots > 0;
  const requestDisabled = isSoftBlocked || !hasSpots;

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-ink-soft/15 bg-cream-card p-4 shadow-md">
      <h2 className="text-base font-semibold leading-tight">{username}</h2>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {topics.map((topic) => (
          <span
            className="rounded-full bg-mist/40 px-2.5 py-1 text-sm text-ink"
            key={topic}
          >
            {topicLabel(topic)}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-zinc-600">
        {meetingDurationMinutes}-minute sessions
      </p>

      <div className="mt-auto pt-4">
        {!hasSpots ? (
          <p className="mb-2 text-sm text-red-700">No available spots left</p>
        ) : null}
        {hasSpots && isSoftBlocked ? (
          <p className="mb-2 text-sm text-red-700">
            Submit overdue feedback before requesting another meeting.
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-lg border border-brand/60 bg-cream px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-brand/30"
            onClick={() => setOpen(true)}
            type="button"
          >
            View Details
          </button>
          <form action={requestMeetingAction} className="flex-1">
            <input name="mentorId" type="hidden" value={mentorId} />
            <button
              className="w-full rounded-lg bg-brand-deep px-3 py-2 text-sm font-medium text-white hover:bg-brand disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:hover:bg-zinc-400"
              disabled={requestDisabled}
              title={
                isSoftBlocked
                  ? "Submit overdue feedback before requesting another meeting."
                  : !hasSpots
                    ? "No available spots left."
                    : undefined
              }
              type="submit"
            >
              Request Meeting
            </button>
          </form>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
          <button
            aria-label="Close details"
            className="absolute inset-0 bg-zinc-950/40"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            aria-labelledby={titleId}
            aria-modal="true"
            className="relative z-10 w-full max-w-lg rounded-2xl border border-ink-soft/15 bg-cream-card p-6 shadow-xl"
            role="dialog"
          >
            <button
              aria-label="Close"
              className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 hover:bg-brand/30"
              onClick={() => setOpen(false)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <h3 className="pr-2 pl-10 text-xl font-semibold" id={titleId}>
              {username}
            </h3>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <DetailRow
                  label="Programming languages"
                  value={
                    details.programmingLanguages.length
                      ? details.programmingLanguages.join(", ")
                      : null
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <DetailRow label="Tech stack" value={details.techStack} />
              </div>
              <DetailRow
                label="Years of experience"
                value={details.yearsOfExperience}
              />
              <DetailRow
                label="Job title / description"
                value={details.jobTitle}
              />
              <DetailRow label="Workplace" value={details.workplace} />
              <DetailRow label="LinkedIn" value={details.linkedinUrl} />
              <div className="sm:col-span-2">
                <DetailRow label="GitHub" value={details.githubUrl} />
              </div>
              <div className="sm:col-span-2">
                <DetailRow
                  label="Professional background"
                  value={details.background}
                />
              </div>
              <DetailRow
                label="Meeting length"
                value={`${meetingDurationMinutes} minutes`}
              />
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Advisory topics
                </dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {topics.map((topic) => (
                    <span
                      className="rounded-full bg-mist/40 px-2.5 py-1 text-sm text-ink"
                      key={topic}
                    >
                      {topicLabel(topic)}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </article>
  );
}
