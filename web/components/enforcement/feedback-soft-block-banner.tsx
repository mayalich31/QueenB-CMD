import { FEEDBACK_SOFT_BLOCK_DAYS } from "@/lib/constants/enforcement";

export function FeedbackSoftBlockBanner({
  overdueCount,
}: {
  overdueCount: number;
}) {
  return (
    <div className="border-b border-red-200 bg-red-50">
      <div className="mx-auto max-w-6xl px-4 py-3 text-sm text-red-800">
        New meeting requests are paused until you submit feedback for{" "}
        {overdueCount === 1
          ? "1 completed meeting"
          : `${overdueCount} completed meetings`}{" "}
        that have been waiting more than {FEEDBACK_SOFT_BLOCK_DAYS} days.
        Verification, cancellation, and profile actions remain available.
      </div>
    </div>
  );
}
