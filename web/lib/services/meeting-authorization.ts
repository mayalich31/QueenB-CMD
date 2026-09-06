type MeetingParticipants = {
  mentorId: string;
  menteeId: string;
};

export class MeetingAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MeetingAuthorizationError";
  }
}

export function assertMeetingMentor(
  meeting: MeetingParticipants,
  userId: string,
) {
  if (meeting.mentorId !== userId) {
    throw new MeetingAuthorizationError(
      "Only the assigned mentor can perform this action.",
    );
  }
}

export function assertMeetingMentee(
  meeting: MeetingParticipants,
  userId: string,
) {
  if (meeting.menteeId !== userId) {
    throw new MeetingAuthorizationError(
      "Only the assigned mentee can perform this action.",
    );
  }
}

export function assertMeetingParticipant(
  meeting: MeetingParticipants,
  userId: string,
) {
  if (meeting.mentorId !== userId && meeting.menteeId !== userId) {
    throw new MeetingAuthorizationError(
      "Only meeting participants can perform this action.",
    );
  }
}
