import {
  createMeeting,
  findMeetingById,
  findMeetingSlotById,
  markMeetingSlotSelected,
  replaceMeetingSlots,
  updateMeetingState,
} from "@/lib/dal/meetings";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import {
  meetingCreateSchema,
  meetingStatusUpdateSchema,
  proposeMeetingSlotsSchema,
  selectMeetingSlotSchema,
} from "@/lib/validations/meeting";

import { getMeetingTransitionPatch } from "./meeting-state-machine";

export class MeetingNotFoundError extends Error {
  constructor() {
    super("Meeting was not found.");
    this.name = "MeetingNotFoundError";
  }
}

export async function requestMeeting(input: unknown) {
  const data = meetingCreateSchema.parse(input);
  return createMeeting(data);
}

export async function proposeMeetingSlots(input: unknown) {
  const data = proposeMeetingSlotsSchema.parse(input);

  return prisma.$transaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    const patch = getMeetingTransitionPatch(
      meeting,
      MeetingStatus.WAITING_FOR_MENTEE_SELECTION,
    );

    await replaceMeetingSlots(data.meetingId, data.slots, transaction);
    return updateMeetingState(data.meetingId, patch, transaction);
  });
}

export async function selectMeetingSlot(input: unknown) {
  const data = selectMeetingSlotSchema.parse(input);

  return prisma.$transaction(async (transaction) => {
    const [meeting, slot] = await Promise.all([
      findMeetingById(data.meetingId, transaction),
      findMeetingSlotById(data.slotId, transaction),
    ]);

    if (!meeting || !slot || slot.meetingId !== meeting.id) {
      throw new MeetingNotFoundError();
    }

    const patch = getMeetingTransitionPatch(
      { ...meeting, scheduledAt: slot.startsAt },
      MeetingStatus.SCHEDULED,
    );

    await markMeetingSlotSelected(meeting.id, slot.id, transaction);

    return updateMeetingState(
      meeting.id,
      { ...patch, scheduledAt: slot.startsAt },
      transaction,
    );
  });
}

export async function transitionMeetingStatus(input: unknown) {
  const data = meetingStatusUpdateSchema.parse(input);

  return prisma.$transaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    const patch = getMeetingTransitionPatch(meeting, data.status);
    return updateMeetingState(meeting.id, patch, transaction);
  });
}
