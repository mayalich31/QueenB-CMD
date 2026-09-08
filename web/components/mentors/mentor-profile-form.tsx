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
  embedded?: boolean;
  variant?: "standalone" | "embedded" | "modal";
};

export function MentorProfileForm({
  profile,
  embedded = false,
  variant,
}: MentorProfileFormProps) {
  const mode = variant ?? (embedded ? "embedded" : "standalone");
  const isModal = mode === "modal";
  const isEmbedded = mode === "embedded";

  return (
    <section
      className={
        isModal ? undefined : isEmbedded ? "scroll-mt-24" : "mt-12 scroll-mt-24"
      }
      id={isModal ? undefined : "mentor"}
    >
      {isEmbedded ? (
        <h2 className="text-xl font-semibold">Mentor details</h2>
      ) : null}
      {mode === "standalone" ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-brand-deep">Mentor profile</p>
            <h2 className="mt-2 text-2xl font-semibold">Become a mentor</h2>
            <p className="mt-2 text-zinc-600">
              Tell mentees about your background, topics, meeting length, and
              capacity.
            </p>
          </div>
          <a
            className="text-sm font-medium text-brand-deep hover:underline"
            href="/dashboard/profile"
          >
            Cancel
          </a>
        </div>
      ) : null}

      <form
        action={saveMentorProfileAction}
        className={
          isModal
            ? "mt-6 space-y-6"
            : isEmbedded
              ? "mt-6 space-y-8"
              : "mt-6 space-y-8 rounded-2xl border border-brand/30 bg-cream-card p-6"
        }
      >
        <label className="block text-sm font-medium text-zinc-800">
          Professional background
          <textarea
            className="mt-2 min-h-32 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-brand-deep"
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
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-brand-deep"
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
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-brand-deep"
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
          className="rounded-lg bg-brand-deep px-5 py-2.5 font-medium text-white hover:bg-brand"
          type="submit"
        >
          {isModal ? "Save" : profile ? "Save mentor details" : "Become a mentor"}
        </button>
      </form>
    </section>
  );
}
