import {
  clearMeetingSlots,
  completeEligibleMeetings,
  countActiveMentorMeetings,
  createMeeting,
  findActiveMeetingBetween,
  findActiveMentorProfile,
  findMeetingById,
  findMeetingSlotById,
  listMenteeMeetings as listMenteeMeetingRecords,
  listMentorMeetings as listMentorMeetingRecords,
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

export async function listMeetingsForMentee(menteeId: string) {
  await completeEligibleMeetings();
  return listMenteeMeetingRecords(menteeId);
}

export async function listRequestsForMentor(mentorId: string) {
  await completeEligibleMeetings();
  return listPendingMentorRequests(mentorId);
}

export async function listMeetingsForMentor(mentorId: string) {
  await completeEligibleMeetings();
  return listMentorMeetingRecords(mentorId);
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

export async function proposeMeetingSlotsForMentor(
  mentorId: string,
  input: unknown,
) {
  const data = proposeMeetingSlotsSchema.parse(input);

  if (data.slots.some((slot) => slot.startsAt <= new Date())) {
    throw new MeetingRequestError("Meeting time options must be in the future.");
  }

  return prisma.$transaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    if (meeting.mentorId !== mentorId) {
      throw new MeetingRequestError(
        "Only the assigned mentor can propose meeting times.",
      );
    }

    const patch = getMeetingTransitionPatch(
      meeting,
      MeetingStatus.WAITING_FOR_MENTEE_SELECTION,
    );

    await replaceMeetingSlots(data.meetingId, data.slots, transaction);
    return updateMeetingState(data.meetingId, patch, transaction);
  });
}

export async function selectMeetingSlotForMentee(
  menteeId: string,
  input: unknown,
) {
  const data = selectMeetingSlotSchema.parse(input);

  return prisma.$transaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);
    const slot = await findMeetingSlotById(data.slotId, transaction);

    if (!meeting || !slot || slot.meetingId !== meeting.id) {
      throw new MeetingNotFoundError();
    }

    if (meeting.menteeId !== menteeId) {
      throw new MeetingRequestError(
        "Only the assigned mentee can select a meeting time.",
      );
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

export async function requestMoreMeetingTimes(
  menteeId: string,
  meetingId: string,
) {
  const data = meetingStatusUpdateSchema.parse({
    meetingId,
    status: MeetingStatus.WAITING_FOR_MENTOR_TIMES,
  });

  return prisma.$transaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    if (meeting.menteeId !== menteeId) {
      throw new MeetingRequestError(
        "Only the assigned mentee can request more times.",
      );
    }

    const patch = getMeetingTransitionPatch(meeting, data.status);
    await clearMeetingSlots(meeting.id, transaction);
    return updateMeetingState(meeting.id, patch, transaction);
  });
}

export async function confirmMeetingAttendance(
  mentorId: string,
  meetingId: string,
) {
  const data = meetingStatusUpdateSchema.parse({
    meetingId,
    status: MeetingStatus.ATTENDANCE_CONFIRMED,
  });

  return prisma.$transaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    if (meeting.mentorId !== mentorId) {
      throw new MeetingRequestError(
        "Only the assigned mentor can confirm attendance.",
      );
    }

    const patch = getMeetingTransitionPatch(meeting, data.status);
    return updateMeetingState(meeting.id, patch, transaction);
  });
}
