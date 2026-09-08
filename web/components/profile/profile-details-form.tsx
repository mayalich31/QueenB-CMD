import { saveUserProfileAction } from "@/app/dashboard/profile/actions";
import { OptionalProfileFieldsForm } from "@/components/profile/optional-profile-fields-form";
import { MentorProfileForm } from "@/components/mentors/mentor-profile-form";

type ProfileDetailsFormProps = {
  user: {
    programmingLanguages: string[];
    githubUrl: string | null;
    linkedinUrl: string | null;
    yearsOfExperience: number | null;
    jobTitle: string | null;
    workplace: string | null;
    techStack: string | null;
  };
  mentorProfile: {
    background: string;
    topics: string[];
    maxConcurrentMeetings: number;
    meetingDurationMinutes: number;
    isActive: boolean;
  } | null;
};

export function ProfileDetailsForm({
  user,
  mentorProfile,
}: ProfileDetailsFormProps) {
  return (
    <section className="mt-10 rounded-2xl border border-brand/30 bg-cream-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Edit profile</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Update your professional details
            {mentorProfile ? " and mentor settings" : ""}.
          </p>
        </div>
        <a
          className="text-sm font-medium text-brand-deep hover:underline"
          href="/dashboard/profile"
        >
          Cancel
        </a>
      </div>

      <form action={saveUserProfileAction} className="mt-6 space-y-8">
        <OptionalProfileFieldsForm defaults={user} />
        <button
          className="rounded-lg bg-brand-deep px-5 py-2.5 font-medium text-white hover:bg-brand"
          type="submit"
        >
          Save profile
        </button>
      </form>

      {mentorProfile ? (
        <div className="mt-10 border-t border-brand/30 pt-8">
          <MentorProfileForm embedded profile={mentorProfile} />
        </div>
      ) : null}
    </section>
  );
}
