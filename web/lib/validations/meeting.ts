import { z } from "zod";

import { MeetingStatus } from "../generated/prisma/enums";

export const meetingCreateSchema = z
  .object({
    menteeId: z.uuid({ error: "Mentee ID must be a valid UUID." }),
    mentorId: z.uuid({ error: "Mentor ID must be a valid UUID." }),
  })
  .refine(({ menteeId, mentorId }) => menteeId !== mentorId, {
    message: "A user cannot request a meeting with themselves.",
    path: ["mentorId"],
  });

export const meetingStatusUpdateSchema = z.object({
  meetingId: z.uuid({ error: "Meeting ID must be a valid UUID." }),
  status: z.enum(MeetingStatus),
});

export type MeetingCreateInput = z.infer<typeof meetingCreateSchema>;
export type MeetingStatusUpdateInput = z.infer<
  typeof meetingStatusUpdateSchema
>;
