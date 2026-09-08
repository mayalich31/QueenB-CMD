import { PROGRAMMING_LANGUAGE_VALUES } from "@/lib/constants/programming-languages";

const inputClassName =
  "mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-brand-deep";

type OptionalProfileFieldsFormProps = {
  defaults?: {
    programmingLanguages?: string[];
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    yearsOfExperience?: number | null;
    jobTitle?: string | null;
    workplace?: string | null;
    techStack?: string | null;
  };
};

export function OptionalProfileFieldsForm({
  defaults,
}: OptionalProfileFieldsFormProps) {
  const selected = new Set(defaults?.programmingLanguages ?? []);

  return (
    <fieldset className="space-y-5">
      <legend className="text-sm font-semibold text-zinc-800">
        Optional profile details
      </legend>
      <p className="text-sm text-zinc-500">
        You can skip this section and add it later from My Profile.
      </p>

      <fieldset>
        <legend className="text-sm font-medium text-zinc-800">
          Programming languages
        </legend>
        <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto rounded-lg border border-zinc-200 bg-cream-card p-3 sm:grid-cols-2">
          {PROGRAMMING_LANGUAGE_VALUES.map((language) => (
            <label className="flex items-center gap-2 text-sm" key={language}>
              <input
                defaultChecked={selected.has(language)}
                name="programmingLanguages"
                type="checkbox"
                value={language}
              />
              {language}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-zinc-800">
        Tech stack
        <textarea
          className={`${inputClassName} min-h-24`}
          defaultValue={defaults?.techStack ?? ""}
          maxLength={500}
          name="techStack"
          placeholder="React, Node.js, PostgreSQL…"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Years of experience
        <input
          className={inputClassName}
          defaultValue={defaults?.yearsOfExperience ?? ""}
          max={80}
          min={0}
          name="yearsOfExperience"
          type="number"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Job title / description
        <input
          className={inputClassName}
          defaultValue={defaults?.jobTitle ?? ""}
          maxLength={120}
          name="jobTitle"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        Workplace
        <input
          className={inputClassName}
          defaultValue={defaults?.workplace ?? ""}
          maxLength={120}
          name="workplace"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        LinkedIn profile URL
        <input
          className={inputClassName}
          defaultValue={defaults?.linkedinUrl ?? ""}
          name="linkedinUrl"
          placeholder="https://www.linkedin.com/in/username"
          type="url"
        />
      </label>

      <label className="block text-sm font-medium text-zinc-800">
        GitHub profile URL
        <input
          className={inputClassName}
          defaultValue={defaults?.githubUrl ?? ""}
          name="githubUrl"
          placeholder="https://github.com/username"
          type="url"
        />
      </label>
    </fieldset>
  );
}
