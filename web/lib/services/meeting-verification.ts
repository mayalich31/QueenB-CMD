import { MeetingStatus } from "@/lib/generated/prisma/enums";

export type MeetingVerificationRecord = {
  cycle: number;
  mentorDidHappen: boolean | null;
  menteeDidHappen: boolean | null;
  mentorWantsReschedule: boolean | null;
  menteeWantsReschedule: boolean | null;
  verificationResolvedAt: Date | null;
};

export type VerifiableMeeting = {
  id: string;
  mentorId: string;
  menteeId: string;
  status: MeetingStatus;
  hasRescheduled: boolean;
  verifications: MeetingVerificationRecord[];
  feedback: Array<{ authorId: string }>;
};

export function getCurrentVerificationCycle(meeting: {
  hasRescheduled: boolean;
}) {
  return meeting.hasRescheduled ? 1 : 0;
}

export function getCurrentVerification(meeting: VerifiableMeeting) {
  const cycle = getCurrentVerificationCycle(meeting);
  return (
    meeting.verifications.find((verification) => verification.cycle === cycle) ??
    null
  );
}

export function isOutcomeVerified(meeting: VerifiableMeeting) {
  const verification = getCurrentVerification(meeting);
  return Boolean(
    meeting.status === MeetingStatus.COMPLETED &&
      verification?.verificationResolvedAt &&
      verification.mentorDidHappen &&
      verification.menteeDidHappen,
  );
}

export function needsOutcomeAnswer(
  meeting: VerifiableMeeting,
  userId: string,
) {
  if (meeting.status !== MeetingStatus.COMPLETED) {
    return false;
  }

  const verification = getCurrentVerification(meeting);
  if (verification?.verificationResolvedAt) {
    return false;
  }

  const answer =
    meeting.mentorId === userId
      ? verification?.mentorDidHappen
      : verification?.menteeDidHappen;
  return answer == null;
}

export function isWaitingForCounterpartOutcome(
  meeting: VerifiableMeeting,
  userId: string,
) {
  if (meeting.status !== MeetingStatus.COMPLETED) {
    return false;
  }

  const verification = getCurrentVerification(meeting);
  if (!verification || verification.verificationResolvedAt) {
    return false;
  }

  const ownAnswer =
    meeting.mentorId === userId
      ? verification.mentorDidHappen
      : verification.menteeDidHappen;
  const counterpartAnswer =
    meeting.mentorId === userId
      ? verification.menteeDidHappen
      : verification.mentorDidHappen;

  return ownAnswer != null && counterpartAnswer == null;
}

export function needsRescheduleIntent(
  meeting: VerifiableMeeting,
  userId: string,
) {
  if (
    meeting.status !== MeetingStatus.COMPLETED ||
    meeting.hasRescheduled
  ) {
    return false;
  }

  const verification = getCurrentVerification(meeting);
  if (
    !verification ||
    verification.verificationResolvedAt ||
    verification.mentorDidHappen == null ||
    verification.menteeDidHappen == null ||
    (verification.mentorDidHappen && verification.menteeDidHappen)
  ) {
    return false;
  }

  const intent =
    meeting.mentorId === userId
      ? verification.mentorWantsReschedule
      : verification.menteeWantsReschedule;
  return intent == null;
}

export function isWaitingForCounterpartRescheduleIntent(
  meeting: VerifiableMeeting,
  userId: string,
) {
  if (
    meeting.status !== MeetingStatus.COMPLETED ||
    meeting.hasRescheduled
  ) {
    return false;
  }

  const verification = getCurrentVerification(meeting);
  if (
    !verification ||
    verification.verificationResolvedAt ||
    verification.mentorDidHappen == null ||
    verification.menteeDidHappen == null ||
    (verification.mentorDidHappen && verification.menteeDidHappen)
  ) {
    return false;
  }

  const ownIntent =
    meeting.mentorId === userId
      ? verification.mentorWantsReschedule
      : verification.menteeWantsReschedule;
  const counterpartIntent =
    meeting.mentorId === userId
      ? verification.menteeWantsReschedule
      : verification.mentorWantsReschedule;

  return ownIntent != null && counterpartIntent == null;
}

export function canSubmitFeedback(meeting: VerifiableMeeting, userId: string) {
  return (
    isOutcomeVerified(meeting) &&
    !meeting.feedback.some((entry) => entry.authorId === userId)
  );
}
