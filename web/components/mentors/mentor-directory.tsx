import Link from "next/link";

import { MentorCard } from "@/components/mentors/mentor-card";
import {
  MENTORING_TOPIC_LABELS,
  MENTORING_TOPIC_VALUES,
} from "@/lib/constants/mentoring-topics";
import { listMentors } from "@/lib/services/mentor-profiles";
import { mentoringTopicSchema } from "@/lib/validations/mentor-profile";

export type MentorDirectorySearchParams = {
  topic?: string | string[];
  error?: string;
  message?: string;
};

type MentorDirectoryProps = {
  currentUserId: string;
  searchParams: MentorDirectorySearchParams;
  isSoftBlocked?: boolean;
};

export async function MentorDirectory({
  currentUserId,
  searchParams,
  isSoftBlocked = false,
}: MentorDirectoryProps) {
  const rawTopics = Array.isArray(searchParams.topic)
    ? searchParams.topic
    : searchParams.topic
      ? [searchParams.topic]
      : [];
  const topics = [
    ...new Set(
      rawTopics.flatMap((topic) => {
        const result = mentoringTopicSchema.safeParse(topic);
        return result.success ? [result.data] : [];
      }),
    ),
  ];
  const mentors = await listMentors({ topics }, currentUserId);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Find your next mentor</h1>
          <p className="mt-3 text-zinc-600">
            Browse available mentors and filter by every topic you need.
          </p>
        </div>
        {topics.length > 0 ? (
          <Link
            className="text-sm font-medium text-brand-deep hover:underline"
            href="/dashboard"
          >
            Clear filters
          </Link>
        ) : null}
      </div>

      {searchParams.error ? (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      ) : null}
      {searchParams.message ? (
        <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {searchParams.message}
        </p>
      ) : null}

      <form
        className="mt-8 rounded-2xl border border-brand/30 bg-cream-card p-5"
        method="get"
      >
        <fieldset>
          <legend className="text-sm font-semibold text-zinc-900">
            Expertise and interests
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {MENTORING_TOPIC_VALUES.map((topic) => (
              <label
                className="flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-sm"
                key={topic}
              >
                <input
                  name="topic"
                  type="checkbox"
                  value={topic}
                  defaultChecked={topics.includes(topic)}
                />
                {MENTORING_TOPIC_LABELS[topic]}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          className="mt-4 rounded-lg bg-brand-deep px-4 py-2 text-sm font-medium text-white hover:bg-brand"
          type="submit"
        >
          Apply filters
        </button>
      </form>

      {mentors.length > 0 ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((mentor) => {
            const remainingSpots =
              mentor.maxConcurrentMeetings - mentor.user._count.mentorMeetings;

            return (
              <MentorCard
                details={{
                  background: mentor.background,
                  githubUrl: mentor.user.githubUrl,
                  jobTitle: mentor.user.jobTitle,
                  linkedinUrl: mentor.user.linkedinUrl,
                  maxConcurrentMeetings: mentor.maxConcurrentMeetings,
                  programmingLanguages: mentor.user.programmingLanguages,
                  techStack: mentor.user.techStack,
                  workplace: mentor.user.workplace,
                  yearsOfExperience: mentor.user.yearsOfExperience,
                }}
                isSoftBlocked={isSoftBlocked}
                key={mentor.userId}
                meetingDurationMinutes={mentor.meetingDurationMinutes}
                mentorId={mentor.userId}
                remainingSpots={remainingSpots}
                topics={mentor.topics}
                username={mentor.user.username}
              />
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-600">
          No available mentors match these topics yet.
        </div>
      )}
    </section>
  );
}
