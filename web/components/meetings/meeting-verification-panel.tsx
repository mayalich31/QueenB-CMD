import {
  answerMeetingOutcomeAction,
  answerMeetingRescheduleIntentAction,
} from "@/app/dashboard/meetings/actions";
import {
  isWaitingForCounterpartOutcome,
  isWaitingForCounterpartRescheduleIntent,
  needsOutcomeAnswer,
  needsRescheduleIntent,
  type VerifiableMeeting,
} from "@/lib/services/meeting-verification";

type MeetingVerificationPanelProps = {
  meeting: VerifiableMeeting;
  userId: string;
  workspace: "profile" | "mentor";
};

function AnswerButton({
  action,
  name,
  value,
  meetingId,
  workspace,
  label,
  variant,
}: {
  action: (formData: FormData) => Promise<void>;
  name: string;
  value: "true" | "false";
  meetingId: string;
  workspace: "profile" | "mentor";
  label: string;
  variant: "primary" | "secondary";
}) {
  return (
    <form action={action}>
      <input name="meetingId" type="hidden" value={meetingId} />
      <input name="workspace" type="hidden" value={workspace} />
      <input name={name} type="hidden" value={value} />
      <button
        className={
          variant === "primary"
            ? "rounded-lg bg-brand-deep px-4 py-2 text-sm font-medium text-white hover:bg-brand"
            : "rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-cream"
        }
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}

export function MeetingVerificationPanel({
  meeting,
  userId,
  workspace,
}: MeetingVerificationPanelProps) {
  if (needsOutcomeAnswer(meeting, userId)) {
    return (
      <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
        <p className="text-sm font-medium text-zinc-800">
          Did this meeting take place?
        </p>
        <div className="flex flex-wrap gap-2">
          <AnswerButton
            action={answerMeetingOutcomeAction}
            label="Yes, it happened"
            meetingId={meeting.id}
            name="didHappen"
            value="true"
            variant="primary"
            workspace={workspace}
          />
          <AnswerButton
            action={answerMeetingOutcomeAction}
            label="No, it did not"
            meetingId={meeting.id}
            name="didHappen"
            value="false"
            variant="secondary"
            workspace={workspace}
          />
        </div>
      </div>
    );
  }

  if (isWaitingForCounterpartOutcome(meeting, userId)) {
    return (
      <p className="mt-4 text-sm text-zinc-600">
        Waiting for the other participant to confirm whether the meeting
        happened.
      </p>
    );
  }

  if (needsRescheduleIntent(meeting, userId)) {
    return (
      <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
        <p className="text-sm font-medium text-zinc-800">
          Both participants did not confirm that the meeting happened. Do you
          still want to meet?
        </p>
        <div className="flex flex-wrap gap-2">
          <AnswerButton
            action={answerMeetingRescheduleIntentAction}
            label="Yes, propose new times"
            meetingId={meeting.id}
            name="wantsReschedule"
            value="true"
            variant="primary"
            workspace={workspace}
          />
          <AnswerButton
            action={answerMeetingRescheduleIntentAction}
            label="No, close this meeting"
            meetingId={meeting.id}
            name="wantsReschedule"
            value="false"
            variant="secondary"
            workspace={workspace}
          />
        </div>
      </div>
    );
  }

  if (isWaitingForCounterpartRescheduleIntent(meeting, userId)) {
    return (
      <p className="mt-4 text-sm text-zinc-600">
        Waiting for the other participant to decide whether to reschedule.
      </p>
    );
  }

  return null;
}
