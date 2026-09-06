import { prisma } from "@/lib/prisma";
import type {
  MentorProfileCreateInput,
  MentorProfileUpdateInput,
} from "@/lib/validations/mentor-profile";

export function findMentorProfile(userId: string) {
  return prisma.mentorProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
}

export function listActiveMentors(topics: string[] = []) {
  return prisma.mentorProfile.findMany({
    where: {
      isActive: true,
      ...(topics.length > 0 ? { topics: { hasEvery: topics } } : {}),
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
}

export function createMentorProfile(data: MentorProfileCreateInput) {
  return prisma.$transaction(async (transaction) => {
    const profile = await transaction.mentorProfile.create({ data });

    await transaction.user.update({
      where: { id: data.userId },
      data: { isMentor: true },
    });

    return profile;
  });
}

export function updateMentorProfile(
  userId: string,
  data: MentorProfileUpdateInput,
) {
  return prisma.mentorProfile.update({
    where: { userId },
    data,
  });
}
