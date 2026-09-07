import { selectMeetingSlotAction } from "@/app/dashboard/profile/actions";

type Slot = {
  id: string;
  startsAt: Date;
  endsAt: Date;
};

export function SlotSelectionButtons({
  meetingId,
  slots,
}: {
  meetingId: string;
  slots: Slot[];
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {slots.map((slot) => (
        <form action={selectMeetingSlotAction} key={slot.id}>
          <input name="meetingId" type="hidden" value={meetingId} />
          <input name="slotId" type="hidden" value={slot.id} />
          <button
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:border-amber-600 hover:ring-2 hover:ring-amber-500 hover:ring-offset-1"
            type="submit"
          >
            {slot.startsAt.toLocaleString()}
          </button>
        </form>
      ))}
    </div>
  );
}
