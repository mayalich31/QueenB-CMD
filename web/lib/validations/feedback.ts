import { z } from "zod";

export const feedbackCreateSchema = z.object({
  meetingId: z.uuid({ error: "Meeting ID must be a valid UUID." }),
  authorId: z.uuid({ error: "Author ID must be a valid UUID." }),
  rating: z.int().min(1).max(5),
  comment: z.string().trim().max(2_000).optional(),
});

export type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>;
