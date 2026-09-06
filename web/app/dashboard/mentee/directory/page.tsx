import Link from "next/link";
import { redirect } from "next/navigation";

import {
  MENTORING_TOPIC_LABELS,
  MENTORING_TOPIC_VALUES,
} from "@/lib/constants/mentoring-topics";
import { listMentors } from "@/lib/services/mentor-profiles";
import { createClient } from "@/lib/supabase/server";
import { mentoringTopicSchema } from "@/lib/validations/mentor-profile";

import { requestMeetingAction } from "./actions";

type MentorDirectoryPageProps = {
  searchParams: Promise<{
    topic?: string | string[];
    error?: string;
    message?: string;
  }>;
};

export default async function MentorDirectoryPage({
  searchParams,
}: MentorDirectoryPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const params = await searchParams;
  const rawTopics = Array.isArray(params.topic)
    ? params.topic
    : params.topic
      ? [params.topic]
      : [];
  const topics = [
    ...new Set(
      rawTopics.flatMap((topic) => {
        const result = mentoringTopicSchema.safeParse(topic);
        return result.success ? [result.data] : [];
      }),
    ),
  ];
  const mentors = await listMentors({ topics }, userId);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Mentee workspace</p>
          <h1 className="mt-2 text-3xl font-semibold">Mentor directory</h1>
          <p className="mt-3 text-zinc-600">
            Filter active mentors by every topic you need.
          </p>
        </div>
        {topics.length > 0 ? (
          <Link
            className="text-sm font-medium text-amber-700 hover:underline"
            href="/dashboard/mentee/directory"
          >
            Clear filters
          </Link>
        ) : null}
      </div>

      {params.error ? (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {params.error}
        </p>
      ) : null}
      {params.message ? (
        <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {params.message}
        </p>
      ) : null}

      <form
        className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5"
        method="get"
      >
        <fieldset>
          <legend className="text-sm font-semibold text-zinc-900">
            Advisory topics
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
          className="mt-4 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          type="submit"
        >
          Apply filters
        </button>
      </form>

      {mentors.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {mentors.map((mentor) => (
            <article
              className="rounded-2xl border border-zinc-200 bg-white p-6"
              key={mentor.userId}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {mentor.user.username}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {mentor.meetingDurationMinutes}-minute meetings
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {mentor.maxConcurrentMeetings -
                    mentor.user._count.mentorMeetings}{" "}
                  spots
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-700">
                {mentor.background}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {mentor.topics.map((topic) => {
                  const result = mentoringTopicSchema.safeParse(topic);
                  return (
                    <span
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
                      key={topic}
                    >
                      {result.success
                        ? MENTORING_TOPIC_LABELS[result.data]
                        : topic}
                    </span>
                  );
                })}
              </div>
              <form action={requestMeetingAction} className="mt-6">
                <input name="mentorId" type="hidden" value={mentor.userId} />
                <button
                  className="w-full rounded-lg bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
                  type="submit"
                >
                  Request meeting
                </button>
              </form>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-zinc-600">
          No available mentors match these topics yet.
        </div>
      )}
    </section>
  );
}
