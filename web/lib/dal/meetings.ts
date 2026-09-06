import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { MeetingStatus } from "@/lib/generated/prisma/enums";
import type { MeetingCreateInput } from "@/lib/validations/meeting";

export type DatabaseClient = Prisma.TransactionClient | typeof prisma;

export type MeetingStatePatch = {
  status: MeetingStatus;
  scheduledAt?: Date | null;
  hasRequestedMoreTimes?: boolean;
  hasRescheduled?: boolean;
};

export function createMeeting(
  data: MeetingCreateInput,
  database: DatabaseClient = prisma,
) {
  return database.meeting.create({ data });
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
