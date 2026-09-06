import { ACTIVE_MEETING_STATUSES } from "@/lib/constants/meeting-statuses";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import type { MeetingCreateInput } from "@/lib/validations/meeting";

export type DatabaseClient = Prisma.TransactionClient | typeof prisma;

export type MeetingStatePatch = {
  status: MeetingStatus;
  scheduledAt?: Date | null;
  completedAt?: Date | null;
  mentorAttendanceConfirmedAt?: Date | null;
  menteeAttendanceConfirmedAt?: Date | null;
  hasRequestedMoreTimes?: boolean;
  hasRescheduled?: boolean;
};

export function createMeeting(
  data: MeetingCreateInput,
  database: DatabaseClient = prisma,
) {
  return database.meeting.create({ data });
}

export function findActiveMeetingBetween(
  menteeId: string,
  mentorId: string,
  database: DatabaseClient = prisma,
) {
  return database.meeting.findFirst({
    where: {
      menteeId,
      mentorId,
      status: { in: [...ACTIVE_MEETING_STATUSES] },
    },
  });
}

export function findActiveMentorProfile(
  mentorId: string,
  database: DatabaseClient = prisma,
) {
  return database.mentorProfile.findFirst({
    where: {
      userId: mentorId,
      isActive: true,
      user: { isMentor: true },
    },
  });
}

export function countActiveMentorMeetings(
  mentorId: string,
  database: DatabaseClient = prisma,
) {
  return database.meeting.count({
    where: {
      mentorId,
      status: { in: [...ACTIVE_MEETING_STATUSES] },
    },
  });
}

export function findMeetingById(
  id: string,
  database: DatabaseClient = prisma,
) {
  return database.meeting.findUnique({
    where: { id },
    include: {
      slots: { orderBy: { startsAt: "asc" } },
      feedback: true,
      verifications: { orderBy: { cycle: "asc" } },
    },
  });
}

export function listPendingMentorRequests(mentorId: string) {
  return prisma.meeting.findMany({
    where: {
      mentorId,
      status: MeetingStatus.WAITING_FOR_MENTOR_TIMES,
    },
    include: { mentee: true },
    orderBy: { createdAt: "asc" },
  });
}

export function listMenteeMeetings(menteeId: string) {
  return prisma.meeting.findMany({
    where: { menteeId },
    include: {
      mentor: true,
      slots: { orderBy: { startsAt: "asc" } },
      feedback: true,
      verifications: { orderBy: { cycle: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function listMentorMeetings(mentorId: string) {
  return prisma.meeting.findMany({
    where: { mentorId },
    include: {
      mentee: true,
      slots: { orderBy: { startsAt: "asc" } },
      feedback: true,
      verifications: { orderBy: { cycle: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function findEligibleMeetingsForCompletion(
  now = new Date(),
  database: DatabaseClient = prisma,
) {
  return database.meeting.findMany({
    where: {
      status: MeetingStatus.ATTENDANCE_CONFIRMED,
      scheduledAt: { lte: now },
    },
  });
}

export function completeEligibleMeetings(
  now = new Date(),
  database: DatabaseClient = prisma,
) {
  return database.meeting.updateManyAndReturn({
    where: {
      status: MeetingStatus.ATTENDANCE_CONFIRMED,
      scheduledAt: { lte: now },
    },
    data: {
      status: MeetingStatus.COMPLETED,
      completedAt: now,
    },
  });
}

export function listCompletedMeetingsAwaitingFeedback(
  database: DatabaseClient = prisma,
) {
  return database.meeting.findMany({
    where: {
      status: MeetingStatus.COMPLETED,
      verifications: {
        some: {
          verificationResolvedAt: { not: null },
          mentorDidHappen: true,
          menteeDidHappen: true,
        },
      },
    },
    include: {
      feedback: true,
      verifications: { orderBy: { cycle: "asc" } },
    },
  });
}

export function listCompletedMeetingsForUser(
  userId: string,
  database: DatabaseClient = prisma,
) {
  return database.meeting.findMany({
    where: {
      status: MeetingStatus.COMPLETED,
      OR: [{ menteeId: userId }, { mentorId: userId }],
    },
    include: {
      feedback: true,
      verifications: { orderBy: { cycle: "asc" } },
    },
  });
}

export function listMeetingsForUser(userId: string) {
  return prisma.meeting.findMany({
    where: {
      OR: [{ menteeId: userId }, { mentorId: userId }],
    },
    include: {
      mentee: true,
      mentor: true,
      slots: { orderBy: { startsAt: "asc" } },
      feedback: true,
      verifications: { orderBy: { cycle: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export function findMeetingSlotById(
  id: string,
  database: DatabaseClient = prisma,
) {
  return database.meetingSlot.findUnique({ where: { id } });
}

export async function markMeetingSlotSelected(
  meetingId: string,
  slotId: string,
  database: DatabaseClient = prisma,
) {
  await database.meetingSlot.updateMany({
    where: { meetingId },
    data: { isSelected: false },
  });

  return database.meetingSlot.update({
    where: { id: slotId },
    data: { isSelected: true },
  });
}

export function updateMeetingState(
  id: string,
  data: MeetingStatePatch,
  database: DatabaseClient = prisma,
) {
  return database.meeting.update({
    where: { id },
    data,
  });
}

export async function replaceMeetingSlots(
  meetingId: string,
  slots: Array<{ startsAt: Date; endsAt: Date }>,
  database: DatabaseClient = prisma,
) {
  await database.meetingSlot.deleteMany({ where: { meetingId } });

  return database.meetingSlot.createMany({
    data: slots.map((slot) => ({ ...slot, meetingId })),
  });
}

export function clearMeetingSlots(
  meetingId: string,
  database: DatabaseClient = prisma,
) {
  return database.meetingSlot.deleteMany({ where: { meetingId } });
}

export async function lockMeetingForUpdate(
  meetingId: string,
  database: DatabaseClient,
) {
  await database.$queryRaw`
    SELECT "id"
    FROM "Meeting"
    WHERE "id" = ${meetingId}::uuid
    FOR UPDATE
  `;
}

export function findMeetingVerification(
  meetingId: string,
  cycle: number,
  database: DatabaseClient = prisma,
) {
  return database.meetingVerification.findUnique({
    where: { meetingId_cycle: { meetingId, cycle } },
  });
}

type MeetingVerificationCreateData = {
  meetingId: string;
  cycle: number;
  mentorDidHappen?: boolean;
  menteeDidHappen?: boolean;
};

export function createMeetingVerification(
  data: MeetingVerificationCreateData,
  database: DatabaseClient = prisma,
) {
  return database.meetingVerification.create({ data });
}

type MeetingVerificationPatch = {
  mentorDidHappen?: boolean;
  menteeDidHappen?: boolean;
  mentorWantsReschedule?: boolean;
  menteeWantsReschedule?: boolean;
  verificationResolvedAt?: Date;
};

export function updateMeetingVerification(
  id: string,
  data: MeetingVerificationPatch,
  database: DatabaseClient = prisma,
) {
  return database.meetingVerification.update({ where: { id }, data });
}
