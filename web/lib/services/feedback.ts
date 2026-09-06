import { createFeedback as createFeedbackRecord } from "@/lib/dal/feedback";
import {
  findMeetingById,
  lockMeetingForUpdate,
} from "@/lib/dal/meetings";
import {
  feedbackCreateSchema,
  feedbackFormSchema,
} from "@/lib/validations/feedback";

import { assertMeetingParticipant } from "./meeting-authorization";
import { isOutcomeVerified } from "./meeting-verification";
import { MeetingNotFoundError } from "./meetings";
import { runSerializableTransaction } from "./transaction";

export class FeedbackNotAllowedError extends Error {
  constructor() {
    super("Feedback is only allowed for completed meetings and participants.");
    this.name = "FeedbackNotAllowedError";
  }
}

export async function createFeedbackForUser(
  authorId: string,
  input: unknown,
) {
  const formData = feedbackFormSchema.parse(input);
  const data = feedbackCreateSchema.parse({ ...formData, authorId });

  return runSerializableTransaction(async (transaction) => {
    await lockMeetingForUpdate(data.meetingId, transaction);
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    assertMeetingParticipant(meeting, data.authorId);

    if (!isOutcomeVerified(meeting)) {
      throw new FeedbackNotAllowedError();
    }

    return createFeedbackRecord(data, transaction);
  });
}
