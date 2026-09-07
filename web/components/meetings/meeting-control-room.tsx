import { FeedbackForm } from "@/components/meetings/feedback-form";
import { MeetingVerificationPanel } from "@/components/meetings/meeting-verification-panel";
import { SlotSelectionButtons } from "@/components/meetings/slot-selection-buttons";
import { SlotProposalForm } from "@/components/meetings/slot-proposal-form";
import {
  ACTIVE_MEETING_STATUSES,
  getMeetingStatusLabel,
} from "@/lib/constants/meeting-statuses";
import { MeetingStatus } from "@/lib/generated/prisma/enums";
import { canSubmitFeedback } from "@/lib/services/meeting-verification";
import { cancelMeetingAction as mentorCancelAction } from "@/app/dashboard/mentor/actions";
import { confirmAttendanceAction as mentorConfirmAction } from "@/app/dashboard/mentor/actions";
import { rejectMeetingRequestAction } from "@/app/dashboard/mentor/actions";
import {
  cancelMeetingAction as menteeCancelAction,
  confirmAttendanceAction as menteeConfirmAction,
  requestMoreTimesAction,
} from "@/app/dashboard/profile/actions";

export type ControlRoomMeeting = {
  id: string;
  status: MeetingStatus;
  scheduledAt: Date | null;
  createdAt: Date;
  mentorId: string;
  menteeId: string;
  hasRequestedMoreTimes: boolean;
  hasRescheduled: boolean;
  mentorAttendanceConfirmedAt: Date | null;
  menteeAttendanceConfirmedAt: Date | null;
  mentee: { id: string; username: string };
  mentor: { id: string; username: string };
  slots: Array<{
    id: string;
    startsAt: Date;
    endsAt: Date;
    isSelected: boolean;
  }>;
  feedback: Array<{ authorId: string }>;
  verifications: Array<{
    cycle: number;
    mentorDidHappen: boolean | null;
    menteeDidHappen: boolean | null;
    mentorWantsReschedule: boolean | null;
    menteeWantsReschedule: boolean | null;
    verificationResolvedAt: Date | null;
  }>;
};

const activeStatuses = new Set<MeetingStatus>(ACTIVE_MEETING_STATUSES);

export function MeetingControlRoom({
  meeting,
  userId,
}: {
  meeting: ControlRoomMeeting;
  userId: string;
}) {
  const isMentor = meeting.mentorId === userId;
  const workspace = isMentor ? "mentor" : "profile";
  const counterpart = isMentor ? meeting.mentee : meeting.mentor;
  const ownAttendance = isMentor
    ? meeting.mentorAttendanceConfirmedAt
    : meeting.menteeAttendanceConfirmedAt;
  const otherAttendance = isMentor
    ? meeting.menteeAttendanceConfirmedAt
    : meeting.mentorAttendanceConfirmedAt;
  const confirmAction = isMentor ? mentorConfirmAction : menteeConfirmAction;
  const cancelAction = isMentor ? mentorCancelAction : menteeCancelAction;

  return (
    <div>
      <p className="text-sm font-medium text-amber-700">
        {isMentor ? "Mentor" : "Mentee"}
      </p>
      <h2 className="mt-1 text-2xl font-semibold">{counterpart.username}</h2>
      <p className="mt-2 text-sm text-zinc-500">
        {meeting.scheduledAt
          ? meeting.scheduledAt.toLocaleString()
          : `Requested ${meeting.createdAt.toLocaleDateString()}`}
      </p>
      <p className="mt-3">
        <span className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800">
          {getMeetingStatusLabel(meeting)}
        </span>
      </p>

      {isMentor && meeting.status === MeetingStatus.WAITING_FOR_MENTOR_TIMES ? (
        <div className="mt-6">
          <form action={rejectMeetingRequestAction}>
            <input name="meetingId" type="hidden" value={meeting.id} />
            <button
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              type="submit"
            >
              Reject request
            </button>
          </form>
          <p className="mt-4 text-sm text-zinc-600">
            Paint times on the calendar, or enter options below.
          </p>
          <SlotProposalForm meetingId={meeting.id} />
        </div>
      ) : null}

      {!isMentor &&
      meeting.status === MeetingStatus.WAITING_FOR_MENTEE_SELECTION ? (
        <div className="mt-6">
          <p className="text-sm font-medium">Choose a time</p>
          <SlotSelectionButtons
            meetingId={meeting.id}
            slots={meeting.slots}
          />
          {!meeting.hasRequestedMoreTimes ? (
            <form action={requestMoreTimesAction} className="mt-3">
              <input name="meetingId" type="hidden" value={meeting.id} />
              <button
                className="text-sm font-medium text-amber-700 hover:underline"
                type="submit"
              >
                None work — request more times
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {meeting.status === MeetingStatus.SCHEDULED ? (
        <div className="mt-6 border-t border-zinc-100 pt-4">
          <div className="grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
            <p>Your confirmation: {ownAttendance ? "Confirmed" : "Pending"}</p>
            <p>
              Their confirmation: {otherAttendance ? "Confirmed" : "Pending"}
            </p>
          </div>
          {!ownAttendance ? (
            <form action={confirmAction} className="mt-4">
              <input name="meetingId" type="hidden" value={meeting.id} />
              <button
                className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                type="submit"
              >
                Confirm attendance
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {meeting.status === MeetingStatus.ATTENDANCE_CONFIRMED ? (
        <p className="mt-6 text-sm text-emerald-700">
          Both participants confirmed. This meeting will complete after its
          scheduled time.
        </p>
      ) : null}

      {activeStatuses.has(meeting.status) ? (
        <form action={cancelAction} className="mt-4">
          <input name="meetingId" type="hidden" value={meeting.id} />
          <button
            className="text-sm font-medium text-red-700 hover:underline"
            type="submit"
          >
            Cancel meeting
          </button>
        </form>
      ) : null}

      {meeting.status === MeetingStatus.COMPLETED ? (
        <MeetingVerificationPanel
          meeting={meeting}
          userId={userId}
          workspace={workspace}
        />
      ) : null}

      {canSubmitFeedback(meeting, userId) ? (
        <FeedbackForm meetingId={meeting.id} workspace={workspace} />
      ) : null}

      {meeting.status === MeetingStatus.NOT_COMPLETED ? (
        <p className="mt-4 text-sm text-zinc-600">
          This meeting was marked as not completed.
        </p>
      ) : null}
    </div>
  );
}
