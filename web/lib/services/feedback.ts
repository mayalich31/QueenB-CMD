import { createFeedback as createFeedbackRecord } from "@/lib/dal/feedback";
import { findMeetingById } from "@/lib/dal/meetings";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import { feedbackCreateSchema } from "@/lib/validations/feedback";

import { MeetingNotFoundError } from "./meetings";

export class FeedbackNotAllowedError extends Error {
  constructor() {
    super("Feedback is only allowed for completed meetings and participants.");
    this.name = "FeedbackNotAllowedError";
  }
}

export async function createFeedback(input: unknown) {
  const data = feedbackCreateSchema.parse(input);
  const meeting = await findMeetingById(data.meetingId);

  if (!meeting) {
    throw new MeetingNotFoundError();
  }

  const isParticipant =
    data.authorId === meeting.menteeId || data.authorId === meeting.mentorId;

  if (meeting.status !== MeetingStatus.COMPLETED || !isParticipant) {
    throw new FeedbackNotAllowedError();
  }

  return createFeedbackRecord(data);
}
