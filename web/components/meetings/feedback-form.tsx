import { submitFeedbackAction } from "@/app/dashboard/actions";

type FeedbackFormProps = {
  meetingId: string;
  workspace: "mentee" | "mentor";
};

export function FeedbackForm({
  meetingId,
  workspace,
}: FeedbackFormProps) {
  return (
    <form
      action={submitFeedbackAction}
      className="mt-4 space-y-3 border-t border-zinc-100 pt-4"
    >
      <input name="meetingId" type="hidden" value={meetingId} />
      <input name="workspace" type="hidden" value={workspace} />
      <label className="block text-sm font-medium text-zinc-700">
        Rating
        <select
          className="ml-3 rounded-lg border border-zinc-300 px-3 py-2"
          name="rating"
          defaultValue="5"
        >
          {[5, 4, 3, 2, 1].map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium text-zinc-700">
        Comment (optional)
        <textarea
          className="mt-1 min-h-20 w-full rounded-lg border border-zinc-300 px-3 py-2"
          maxLength={2000}
          name="comment"
        />
      </label>
      <button
        className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        type="submit"
      >
        Submit feedback
      </button>
    </form>
  );
}
