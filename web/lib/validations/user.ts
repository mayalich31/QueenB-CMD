import { z } from "zod";

import { PROGRAMMING_LANGUAGE_VALUES } from "@/lib/constants/programming-languages";

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be at most 30 characters.")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Username may only contain letters, numbers, underscores, and hyphens.",
  );

export const emailSchema = z
  .string()
  .trim()
  .pipe(z.email({ error: "Email must be valid." }).max(254));

export const programmingLanguageSchema = z.enum(PROGRAMMING_LANGUAGE_VALUES);

function optionalUrlField() {
  return z
    .union([z.url({ error: "Enter a valid URL." }).max(500), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null));
}

function optionalTextField(max: number) {
  return z
    .union([z.string().trim().max(max), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      return value ? value : null;
    });
}

function optionalYearsField() {
  return z
    .union([z.number().int().min(0).max(80), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value));
}

export const optionalProfileFieldsSchema = z.object({
  programmingLanguages: z
    .array(programmingLanguageSchema)
    .max(PROGRAMMING_LANGUAGE_VALUES.length)
    .default([]),
  githubUrl: optionalUrlField().transform((value) => value ?? null),
  linkedinUrl: optionalUrlField().transform((value) => value ?? null),
  yearsOfExperience: optionalYearsField().transform((value) => value ?? null),
  jobTitle: optionalTextField(120).transform((value) => value ?? null),
  workplace: optionalTextField(120).transform((value) => value ?? null),
  techStack: optionalTextField(500).transform((value) => value ?? null),
});

export const userCreateSchema = z
  .object({
    id: z.uuid({ error: "User ID must be a valid UUID." }),
    email: emailSchema,
    username: usernameSchema,
  })
  .and(optionalProfileFieldsSchema);

export const userProfileUpdateSchema = z.object({
  programmingLanguages: z
    .array(programmingLanguageSchema)
    .max(PROGRAMMING_LANGUAGE_VALUES.length)
    .optional(),
  githubUrl: optionalUrlField(),
  linkedinUrl: optionalUrlField(),
  yearsOfExperience: optionalYearsField(),
  jobTitle: optionalTextField(120),
  workplace: optionalTextField(120),
  techStack: optionalTextField(500),
});

export const userUpdateSchema = z
  .object({
    email: emailSchema.optional(),
    username: usernameSchema.optional(),
  })
  .and(userProfileUpdateSchema)
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    { message: "At least one user field must be provided." },
  );

export function parseOptionalProfileFormData(formData: FormData) {
  const yearsRaw = formData.get("yearsOfExperience");
  const yearsOfExperience =
    typeof yearsRaw === "string" && yearsRaw.trim() !== ""
      ? Number(yearsRaw)
      : null;

  return {
    programmingLanguages: formData
      .getAll("programmingLanguages")
      .filter((value): value is string => typeof value === "string"),
    githubUrl: formData.get("githubUrl"),
    linkedinUrl: formData.get("linkedinUrl"),
    yearsOfExperience: Number.isFinite(yearsOfExperience)
      ? yearsOfExperience
      : null,
    jobTitle: formData.get("jobTitle") || null,
    workplace: formData.get("workplace") || null,
    techStack: formData.get("techStack") || null,
  };
}
export type OptionalProfileFields = z.infer<typeof optionalProfileFieldsSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
