import {
  countActiveMentorMeetings,
  createMeeting,
  findActiveMeetingBetween,
  findActiveMentorProfile,
  findMeetingById,
  findMeetingSlotById,
  listMenteeMeetings as listMenteeMeetingRecords,
  listPendingMentorRequests,
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

export class MeetingRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MeetingRequestError";
  }
}

export async function requestMeetingForMentee(
  menteeId: string,
  mentorId: string,
) {
  const data = meetingCreateSchema.parse({ menteeId, mentorId });

  return prisma.$transaction(async (transaction) => {
    const mentorProfile = await findActiveMentorProfile(mentorId, transaction);

    if (!mentorProfile) {
      throw new MeetingRequestError("This mentor is not currently available.");
    }

    const existingMeeting = await findActiveMeetingBetween(
      menteeId,
      mentorId,
      transaction,
    );

    if (existingMeeting) {
      throw new MeetingRequestError(
        "You already have an active request with this mentor.",
      );
    }

    const activeMeetingCount = await countActiveMentorMeetings(
      mentorId,
      transaction,
    );

    if (activeMeetingCount >= mentorProfile.maxConcurrentMeetings) {
      throw new MeetingRequestError(
        "This mentor has reached their current meeting capacity.",
      );
    }

    return createMeeting(data, transaction);
  });
}

export function listMeetingsForMentee(menteeId: string) {
  return listMenteeMeetingRecords(menteeId);
}

export function listRequestsForMentor(mentorId: string) {
  return listPendingMentorRequests(mentorId);
}

export async function rejectMeetingRequest(
  mentorId: string,
  meetingId: string,
) {
  const data = meetingStatusUpdateSchema.parse({
    meetingId,
    status: MeetingStatus.CANCELLED,
  });

  return prisma.$transaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    if (meeting.mentorId !== mentorId) {
      throw new MeetingRequestError(
        "Only the assigned mentor can reject this request.",
      );
    }

    const patch = getMeetingTransitionPatch(meeting, data.status);
    return updateMeetingState(meeting.id, patch, transaction);
  });
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
