import { saveMentorProfileAction } from "@/app/dashboard/profile/actions";
import {
  MENTORING_TOPIC_LABELS,
  MENTORING_TOPIC_VALUES,
} from "@/lib/constants/mentoring-topics";

type MentorProfileValues = {
  background: string;
  topics: string[];
  maxConcurrentMeetings: number;
  meetingDurationMinutes: number;
  isActive: boolean;
};

type MentorProfileFormProps = {
  profile: MentorProfileValues | null;
};

export function MentorProfileForm({ profile }: MentorProfileFormProps) {
  return (
    <section className="mt-12 scroll-mt-24" id="mentor">
      <p className="text-sm font-medium text-amber-700">Mentor profile</p>
      <h2 className="mt-2 text-2xl font-semibold">
        {profile ? "Manage your mentor profile" : "Become a mentor"}
      </h2>
      <p className="mt-2 text-zinc-600">
        Set your advisory topics, meeting length, and current capacity.
      </p>

      <form
        action={saveMentorProfileAction}
        className="mt-6 space-y-8 rounded-2xl border border-zinc-200 bg-white p-6"
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
