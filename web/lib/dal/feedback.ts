import { prisma } from "@/lib/prisma";
import type { FeedbackCreateInput } from "@/lib/validations/feedback";

export function createFeedback(data: FeedbackCreateInput) {
  return prisma.feedback.create({ data });
}

export function listMeetingFeedback(meetingId: string) {
  return prisma.feedback.findMany({
    where: { meetingId },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
}
