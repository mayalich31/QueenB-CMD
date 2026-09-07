import { prisma } from "@/lib/prisma";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import type {
  UserCreateInput,
  UserUpdateInput,
} from "@/lib/validations/user";

export function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { mentorProfile: true },
  });
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export function createUser(data: UserCreateInput) {
  return prisma.user.create({ data });
}

export function updateUser(id: string, data: UserUpdateInput) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export function listUsersForAdmin(query: string | undefined, skip: number, take: number) {
  return prisma.user.findMany({
    where: adminUserWhere(query),
    include: {
      mentorProfile: true,
      _count: {
        select: {
          menteeMeetings: true,
          mentorMeetings: {
            where: { status: MeetingStatus.COMPLETED },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export function countUsersForAdmin(query: string | undefined) {
  return prisma.user.count({ where: adminUserWhere(query) });
}

export function countMentorsForAdmin() {
  return prisma.user.count({ where: { isMentor: true } });
}

export function findUsersByIds(ids: string[]) {
  if (ids.length === 0) {
    return Promise.resolve([]);
  }

  return prisma.user.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      username: true,
      email: true,
      isMentor: true,
    },
  });
}

export function findAdminUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      mentorProfile: true,
      menteeMeetings: {
        include: {
          mentor: { select: { id: true, username: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      mentorMeetings: {
        include: {
          mentee: { select: { id: true, username: true, email: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      feedbackEntries: {
        include: {
          meeting: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

function adminUserWhere(query: string | undefined) {
  if (!query) {
    return {};
  }

  return {
    OR: [
      { username: { contains: query, mode: "insensitive" as const } },
      { email: { contains: query, mode: "insensitive" as const } },
    ],
  };
}
