import { z } from "zod";

import { MeetingStatus } from "../generated/prisma/enums";

const meetingSlotSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine(({ startsAt, endsAt }) => endsAt > startsAt, {
    message: "A meeting slot must end after it starts.",
    path: ["endsAt"],
  });

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

export const meetingParticipantActionSchema = z.object({
  meetingId: z.uuid({ error: "Meeting ID must be a valid UUID." }),
});

export const meetingVerificationAnswerSchema = z.object({
  meetingId: z.uuid({ error: "Meeting ID must be a valid UUID." }),
  didHappen: z.boolean(),
});

export const meetingRescheduleIntentSchema = z.object({
  meetingId: z.uuid({ error: "Meeting ID must be a valid UUID." }),
  wantsReschedule: z.boolean(),
});

export const notificationActionSchema = z.object({
  notificationId: z.uuid({
    error: "Notification ID must be a valid UUID.",
  }),
});

export const proposeMeetingSlotsSchema = z.object({
  meetingId: z.uuid({ error: "Meeting ID must be a valid UUID." }),
  slots: z.array(meetingSlotSchema).min(1).max(20),
});

export const selectMeetingSlotSchema = z.object({
  meetingId: z.uuid({ error: "Meeting ID must be a valid UUID." }),
  slotId: z.uuid({ error: "Slot ID must be a valid UUID." }),
});

export type MeetingCreateInput = z.infer<typeof meetingCreateSchema>;
export type MeetingStatusUpdateInput = z.infer<
  typeof meetingStatusUpdateSchema
>;
export type MeetingVerificationAnswerInput = z.infer<
  typeof meetingVerificationAnswerSchema
>;
export type MeetingRescheduleIntentInput = z.infer<
  typeof meetingRescheduleIntentSchema
>;
export type NotificationActionInput = z.infer<
  typeof notificationActionSchema
>;
export type ProposeMeetingSlotsInput = z.infer<
  typeof proposeMeetingSlotsSchema
>;
export type SelectMeetingSlotInput = z.infer<
  typeof selectMeetingSlotSchema
>;
