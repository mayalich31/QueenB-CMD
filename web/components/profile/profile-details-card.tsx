type ProfileDetails = {
  programmingLanguages: string[];
  githubUrl: string | null;
  linkedinUrl: string | null;
  yearsOfExperience: number | null;
  jobTitle: string | null;
  workplace: string | null;
  techStack: string | null;
};

function Detail({
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

export function ProfileDetailsList({ profile }: { profile: ProfileDetails }) {
  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Detail
          label="Programming languages"
          value={
            profile.programmingLanguages.length
              ? profile.programmingLanguages.join(", ")
              : null
          }
        />
      </div>
      <div className="sm:col-span-2">
        <Detail label="Tech stack" value={profile.techStack} />
      </div>
      <Detail label="Years of experience" value={profile.yearsOfExperience} />
      <Detail label="Job title / description" value={profile.jobTitle} />
      <Detail label="Workplace" value={profile.workplace} />
      <Detail label="LinkedIn" value={profile.linkedinUrl} />
      <div className="sm:col-span-2">
        <Detail label="GitHub" value={profile.githubUrl} />
      </div>
    </dl>
  );
}

export function ProfileDetailsCard({ profile }: { profile: ProfileDetails }) {
  return (
    <section className="mt-8 rounded-2xl border border-ink-soft/15 bg-cream-card p-6 shadow-md">
      <h2 className="text-xl font-semibold">Profile details</h2>
      <div className="mt-5">
        <ProfileDetailsList profile={profile} />
      </div>
    </section>
  );
}
