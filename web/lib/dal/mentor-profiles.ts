import { ACTIVE_MEETING_STATUSES } from "@/lib/constants/meeting-statuses";
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

type ListAvailableMentorsOptions = {
  topics?: string[];
  excludeUserId?: string;
};

export async function listAvailableMentors({
  topics = [],
  excludeUserId,
}: ListAvailableMentorsOptions = {}) {
  const mentors = await prisma.mentorProfile.findMany({
    where: {
      isActive: true,
      ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      ...(topics.length > 0 ? { topics: { hasEvery: topics } } : {}),
    },
    include: {
      user: {
        include: {
          _count: {
            select: {
              mentorMeetings: {
                where: { status: { in: [...ACTIVE_MEETING_STATUSES] } },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return mentors.filter(
    (mentor) =>
      mentor.user._count.mentorMeetings < mentor.maxConcurrentMeetings,
  );
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
