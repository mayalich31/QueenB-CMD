import { z } from "zod";

const topicsSchema = z
  .array(z.string().trim().min(1).max(64))
  .min(1, "Select at least one mentoring topic.")
  .max(20, "A mentor may select at most 20 topics.")
  .refine((topics) => new Set(topics).size === topics.length, {
    message: "Mentoring topics must be unique.",
  });

export const mentorProfileCreateSchema = z.object({
  userId: z.uuid({ error: "User ID must be a valid UUID." }),
  background: z
    .string()
    .trim()
    .min(20, "Background must be at least 20 characters.")
    .max(2_000, "Background must be at most 2,000 characters."),
  topics: topicsSchema,
  maxConcurrentMeetings: z.number().int().min(1).max(100),
  meetingDurationMinutes: z.number().int().min(15).max(240),
  isActive: z.boolean().optional().default(true),
});

export const mentorProfileUpdateSchema = mentorProfileCreateSchema
  .omit({ userId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one mentor profile field must be provided.",
  });

export type MentorProfileCreateInput = z.infer<
  typeof mentorProfileCreateSchema
>;
export type MentorProfileUpdateInput = z.infer<
  typeof mentorProfileUpdateSchema
>;
