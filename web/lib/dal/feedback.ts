import { prisma } from "@/lib/prisma";
import type { FeedbackCreateInput } from "@/lib/validations/feedback";

import type { DatabaseClient } from "./meetings";

export function createFeedback(
  data: FeedbackCreateInput,
  database: DatabaseClient = prisma,
) {
  return database.feedback.create({ data });
}

export function listMeetingFeedback(meetingId: string) {
  return prisma.feedback.findMany({
    where: { meetingId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
}
