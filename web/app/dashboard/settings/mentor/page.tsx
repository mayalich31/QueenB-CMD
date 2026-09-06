import { redirect } from "next/navigation";

import {
  MENTORING_TOPIC_LABELS,
  MENTORING_TOPIC_VALUES,
} from "@/lib/constants/mentoring-topics";
import { findMentorProfile } from "@/lib/dal/mentor-profiles";
import { createClient } from "@/lib/supabase/server";

import { saveMentorProfileAction } from "./actions";

type MentorSettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function MentorSettingsPage({
  searchParams,
}: MentorSettingsPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    redirect("/login");
  }

  const [profile, status] = await Promise.all([
    findMentorProfile(userId),
    searchParams,
  ]);

  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm font-medium text-amber-700">Account settings</p>
      <h1 className="mt-2 text-3xl font-semibold">
        {profile ? "Mentor profile" : "Become a mentor"}
      </h1>
      <p className="mt-3 text-zinc-600">
        Set the topics you advise on and the meeting capacity that works for
        you.
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

      <form
        action={saveMentorProfileAction}
        className="mt-8 space-y-8 rounded-2xl border border-zinc-200 bg-white p-6"
      >
        <label className="block text-sm font-medium text-zinc-800">
          Professional background
          <textarea
            className="mt-2 min-h-32 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
            name="background"
            defaultValue={profile?.background}
            minLength={20}
            maxLength={2000}
            required
          />
        </label>

        <fieldset>
          <legend className="text-sm font-medium text-zinc-800">
            Advisory topics
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {MENTORING_TOPIC_VALUES.map((topic) => (
              <label
                className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 text-sm"
                key={topic}
              >
                <input
                  name="topics"
                  type="checkbox"
                  value={topic}
                  defaultChecked={profile?.topics.includes(topic)}
                />
                {MENTORING_TOPIC_LABELS[topic]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-800">
            Concurrent meeting capacity
            <input
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
              name="maxConcurrentMeetings"
              type="number"
              min={1}
              max={100}
              defaultValue={profile?.maxConcurrentMeetings ?? 3}
              required
            />
          </label>
          <label className="block text-sm font-medium text-zinc-800">
            Meeting length in minutes
            <input
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-amber-600"
              name="meetingDurationMinutes"
              type="number"
              min={15}
              max={240}
              step={15}
              defaultValue={profile?.meetingDurationMinutes ?? 30}
              required
            />
          </label>
        </div>

        <label className="flex items-center gap-3 text-sm text-zinc-700">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={profile?.isActive ?? true}
          />
          Show my profile in the mentor directory
        </label>

        <button
          className="rounded-lg bg-zinc-950 px-5 py-2.5 font-medium text-white hover:bg-zinc-800"
          type="submit"
        >
          Save mentor profile
        </button>
      </form>
    </section>
  );
}
