import {
  clearMeetingSlots,
  countActiveMentorMeetings,
  createMeetingVerification,
  createMeeting,
  findActiveMeetingBetween,
  findActiveMentorProfile,
  findMeetingById,
  findMeetingSlotById,
  findMeetingVerification,
  findParticipantMeetingById,
  listMenteeMeetings as listMenteeMeetingRecords,
  listMentorMeetings as listMentorMeetingRecords,
  listMeetingsForUser as listMeetingsForUserRecords,
  listPendingMentorRequests,
  markMeetingSlotSelected,
  lockMeetingForUpdate,
  replaceMeetingSlots,
  updateMeetingVerification,
  updateMeetingState,
} from "@/lib/dal/meetings";
import { MeetingStatus, NotificationType } from "@/lib/generated/prisma/enums";
import {
  meetingCreateSchema,
  meetingParticipantActionSchema,
  meetingRescheduleIntentSchema,
  meetingStatusUpdateSchema,
  meetingVerificationAnswerSchema,
  proposeMeetingSlotsSchema,
  selectMeetingSlotSchema,
} from "@/lib/validations/meeting";

import {
  assertMeetingMentee,
  assertMeetingMentor,
  assertMeetingParticipant,
} from "./meeting-authorization";
import {
  getMeetingTransitionPatch,
  InvalidMeetingTransitionError,
} from "./meeting-state-machine";
import { assertUserCanRequestMeetings } from "./enforcement";
import { notifyMeetingUsers } from "./notifications";
import { runSerializableTransaction } from "./transaction";

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

export class MeetingVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MeetingVerificationError";
  }
}

export async function requestMeetingForMentee(
  menteeId: string,
  mentorId: string,
) {
  const data = meetingCreateSchema.parse({ menteeId, mentorId });
  await assertUserCanRequestMeetings(data.menteeId);

  return runSerializableTransaction(async (transaction) => {
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

    const meeting = await createMeeting(data, transaction);
    await notifyMeetingUsers(
      transaction,
      meeting,
      [meeting.mentorId],
      NotificationType.MEETING_REQUESTED,
      "requested",
    );
    return meeting;
  });
}

export async function listMeetingsForMentee(menteeId: string) {
  return listMenteeMeetingRecords(menteeId);
}

export async function listRequestsForMentor(mentorId: string) {
  return listPendingMentorRequests(mentorId);
}

export async function listMeetingsForMentor(mentorId: string) {
  return listMentorMeetingRecords(mentorId);
}

export async function listMeetingsForParticipant(userId: string) {
  return listMeetingsForUserRecords(userId);
}

export async function getMeetingForParticipant(
  userId: string,
  meetingId: string,
) {
  const meeting = await findParticipantMeetingById(meetingId);

  if (!meeting) {
    throw new MeetingNotFoundError();
  }

  assertMeetingParticipant(meeting, userId);
  return meeting;
}

export { runMeetingCompletionJob as completeEligibleMeetings } from "./cron-jobs";

export async function rejectMeetingRequest(
  mentorId: string,
  meetingId: string,
) {
  const data = meetingStatusUpdateSchema.parse({
    meetingId,
    status: MeetingStatus.CANCELLED,
  });

  return runSerializableTransaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    assertMeetingMentor(meeting, mentorId);

    const patch = getMeetingTransitionPatch(meeting, data.status);
    const updatedMeeting = await updateMeetingState(
      meeting.id,
      patch,
      transaction,
    );
    await notifyMeetingUsers(
      transaction,
      meeting,
      [meeting.menteeId],
      NotificationType.MEETING_CANCELLED,
      "request-rejected",
    );
    return updatedMeeting;
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

  return runSerializableTransaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    assertMeetingMentor(meeting, mentorId);

    const patch = getMeetingTransitionPatch(
      meeting,
      MeetingStatus.WAITING_FOR_MENTEE_SELECTION,
    );

    await replaceMeetingSlots(data.meetingId, data.slots, transaction);
    const updatedMeeting = await updateMeetingState(
      data.meetingId,
      patch,
      transaction,
    );
    await notifyMeetingUsers(
      transaction,
      meeting,
      [meeting.menteeId],
      NotificationType.MEETING_SLOTS_PROPOSED,
      "slots-proposed",
    );
    return updatedMeeting;
  });
}

export async function selectMeetingSlotForMentee(
  menteeId: string,
  input: unknown,
) {
  const data = selectMeetingSlotSchema.parse(input);

  return runSerializableTransaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);
    const slot = await findMeetingSlotById(data.slotId, transaction);

    if (!meeting || !slot || slot.meetingId !== meeting.id) {
      throw new MeetingNotFoundError();
    }

    assertMeetingMentee(meeting, menteeId);

    const patch = getMeetingTransitionPatch(
      { ...meeting, scheduledAt: slot.startsAt },
      MeetingStatus.SCHEDULED,
    );

    await markMeetingSlotSelected(meeting.id, slot.id, transaction);

    const updatedMeeting = await updateMeetingState(
      meeting.id,
      { ...patch, scheduledAt: slot.startsAt },
      transaction,
    );
    await notifyMeetingUsers(
      transaction,
      meeting,
      [meeting.mentorId, meeting.menteeId],
      NotificationType.MEETING_SCHEDULED,
      "scheduled",
    );
    return updatedMeeting;
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

  return runSerializableTransaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    assertMeetingMentee(meeting, menteeId);

    const patch = getMeetingTransitionPatch(meeting, data.status);
    await clearMeetingSlots(meeting.id, transaction);
    const updatedMeeting = await updateMeetingState(
      meeting.id,
      patch,
      transaction,
    );
    await notifyMeetingUsers(
      transaction,
      meeting,
      [meeting.mentorId],
      NotificationType.MEETING_RESCHEDULED,
      "more-times-requested",
    );
    return updatedMeeting;
  });
}

export async function confirmMeetingAttendanceForParticipant(
  userId: string,
  meetingId: string,
) {
  const data = meetingParticipantActionSchema.parse({ meetingId });

  return runSerializableTransaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    assertMeetingParticipant(meeting, userId);

    if (meeting.status === MeetingStatus.ATTENDANCE_CONFIRMED) {
      return meeting;
    }

    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw new InvalidMeetingTransitionError(
        meeting.status,
        MeetingStatus.ATTENDANCE_CONFIRMED,
      );
    }

    const confirmedAt = new Date();
    const confirmationPatch =
      meeting.mentorId === userId
        ? { mentorAttendanceConfirmedAt: confirmedAt }
        : { menteeAttendanceConfirmedAt: confirmedAt };
    const nextMeeting = { ...meeting, ...confirmationPatch };
    const bothConfirmed =
      nextMeeting.mentorAttendanceConfirmedAt &&
      nextMeeting.menteeAttendanceConfirmedAt;
    const patch = bothConfirmed
      ? {
          ...getMeetingTransitionPatch(
            nextMeeting,
            MeetingStatus.ATTENDANCE_CONFIRMED,
          ),
          ...confirmationPatch,
        }
      : {
          status: MeetingStatus.SCHEDULED,
          ...confirmationPatch,
        };

    const updatedMeeting = await updateMeetingState(
      meeting.id,
      patch,
      transaction,
    );

    if (bothConfirmed) {
      await notifyMeetingUsers(
        transaction,
        meeting,
        [meeting.mentorId, meeting.menteeId],
        NotificationType.MEETING_ATTENDANCE_CONFIRMED,
        "attendance-confirmed",
      );
    }

    return updatedMeeting;
  });
}

export async function cancelMeetingForParticipant(
  userId: string,
  meetingId: string,
) {
  const data = meetingParticipantActionSchema.parse({ meetingId });

  return runSerializableTransaction(async (transaction) => {
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    assertMeetingParticipant(meeting, userId);

    const patch = getMeetingTransitionPatch(
      meeting,
      MeetingStatus.CANCELLED,
    );
    const updatedMeeting = await updateMeetingState(
      meeting.id,
      patch,
      transaction,
    );
    const counterpartId =
      meeting.mentorId === userId ? meeting.menteeId : meeting.mentorId;
    await notifyMeetingUsers(
      transaction,
      meeting,
      [counterpartId],
      NotificationType.MEETING_CANCELLED,
      "cancelled",
    );
    return updatedMeeting;
  });
}

export async function answerMeetingOutcomeForParticipant(
  userId: string,
  input: unknown,
) {
  const data = meetingVerificationAnswerSchema.parse(input);

  return runSerializableTransaction(async (transaction) => {
    await lockMeetingForUpdate(data.meetingId, transaction);
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    assertMeetingParticipant(meeting, userId);

    if (meeting.status !== MeetingStatus.COMPLETED) {
      throw new MeetingVerificationError(
        "Meeting outcomes can only be answered for completed meetings.",
      );
    }

    const cycle = meeting.hasRescheduled ? 1 : 0;
    const answerField =
      meeting.mentorId === userId
        ? "mentorDidHappen"
        : "menteeDidHappen";
    let verification = await findMeetingVerification(
      meeting.id,
      cycle,
      transaction,
    );

    if (!verification) {
      verification = await createMeetingVerification(
        {
          meetingId: meeting.id,
          cycle,
          [answerField]: data.didHappen,
        },
        transaction,
      );
    } else {
      const existingAnswer = verification[answerField];

      if (existingAnswer !== null) {
        if (existingAnswer === data.didHappen) {
          return verification;
        }

        throw new MeetingVerificationError(
          "A submitted meeting outcome cannot be changed.",
        );
      }

      verification = await updateMeetingVerification(
        verification.id,
        { [answerField]: data.didHappen },
        transaction,
      );
    }

    const bothAnswered =
      verification.mentorDidHappen !== null &&
      verification.menteeDidHappen !== null;

    if (!bothAnswered) {
      return verification;
    }

    const resolvedAt = new Date();
    const bothHappened =
      verification.mentorDidHappen && verification.menteeDidHappen;

    if (bothHappened) {
      const resolvedVerification = await updateMeetingVerification(
        verification.id,
        { verificationResolvedAt: resolvedAt },
        transaction,
      );
      await notifyMeetingUsers(
        transaction,
        meeting,
        [meeting.mentorId, meeting.menteeId],
        NotificationType.MEETING_COMPLETED,
        "outcome-verified",
        cycle,
      );
      return resolvedVerification;
    }

    if (cycle === 1) {
      await updateMeetingState(
        meeting.id,
        getMeetingTransitionPatch(
          meeting,
          MeetingStatus.NOT_COMPLETED,
        ),
        transaction,
      );
      const resolvedVerification = await updateMeetingVerification(
        verification.id,
        { verificationResolvedAt: resolvedAt },
        transaction,
      );
      await notifyMeetingUsers(
        transaction,
        meeting,
        [meeting.mentorId, meeting.menteeId],
        NotificationType.MEETING_CANCELLED,
        "outcome-not-completed",
        cycle,
      );
      return resolvedVerification;
    }

    return verification;
  });
}

export async function answerMeetingRescheduleIntentForParticipant(
  userId: string,
  input: unknown,
) {
  const data = meetingRescheduleIntentSchema.parse(input);

  return runSerializableTransaction(async (transaction) => {
    await lockMeetingForUpdate(data.meetingId, transaction);
    const meeting = await findMeetingById(data.meetingId, transaction);

    if (!meeting) {
      throw new MeetingNotFoundError();
    }

    assertMeetingParticipant(meeting, userId);

    const intentField =
      meeting.mentorId === userId
        ? "mentorWantsReschedule"
        : "menteeWantsReschedule";

    if (meeting.status !== MeetingStatus.COMPLETED) {
      const priorVerification = await findMeetingVerification(
        meeting.id,
        0,
        transaction,
      );

      if (priorVerification?.[intentField] === data.wantsReschedule) {
        return priorVerification;
      }

      throw new MeetingVerificationError(
        "Reschedule intent is not available for this meeting.",
      );
    }

    const cycle = meeting.hasRescheduled ? 1 : 0;
    const verification = await findMeetingVerification(
      meeting.id,
      cycle,
      transaction,
    );

    if (
      !verification ||
      verification.mentorDidHappen === null ||
      verification.menteeDidHappen === null ||
      (verification.mentorDidHappen && verification.menteeDidHappen) ||
      cycle !== 0
    ) {
      throw new MeetingVerificationError(
        "Reschedule intent requires a failed original meeting outcome.",
      );
    }

    const existingIntent = verification[intentField];

    if (existingIntent !== null) {
      if (existingIntent === data.wantsReschedule) {
        return verification;
      }

      throw new MeetingVerificationError(
        "A submitted reschedule intent cannot be changed.",
      );
    }

    const updatedVerification = await updateMeetingVerification(
      verification.id,
      { [intentField]: data.wantsReschedule },
      transaction,
    );
    const resolvedAt = new Date();

    if (!data.wantsReschedule) {
      await updateMeetingState(
        meeting.id,
        getMeetingTransitionPatch(
          meeting,
          MeetingStatus.NOT_COMPLETED,
        ),
        transaction,
      );
      const resolvedVerification = await updateMeetingVerification(
        verification.id,
        { verificationResolvedAt: resolvedAt },
        transaction,
      );
      await notifyMeetingUsers(
        transaction,
        meeting,
        [meeting.mentorId, meeting.menteeId],
        NotificationType.MEETING_CANCELLED,
        "reschedule-declined",
        cycle,
      );
      return resolvedVerification;
    }

    if (
      updatedVerification.mentorWantsReschedule &&
      updatedVerification.menteeWantsReschedule
    ) {
      const patch = getMeetingTransitionPatch(
        meeting,
        MeetingStatus.WAITING_FOR_MENTOR_TIMES,
      );
      await clearMeetingSlots(meeting.id, transaction);
      await updateMeetingState(meeting.id, patch, transaction);
      const resolvedVerification = await updateMeetingVerification(
        verification.id,
        { verificationResolvedAt: resolvedAt },
        transaction,
      );
      await notifyMeetingUsers(
        transaction,
        meeting,
        [meeting.mentorId, meeting.menteeId],
        NotificationType.MEETING_RESCHEDULED,
        "rescheduled",
        1,
      );
      return resolvedVerification;
    }

    return updatedVerification;
  });
}
