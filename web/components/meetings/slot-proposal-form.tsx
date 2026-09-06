"use client";

import { useState } from "react";

import { proposeMeetingSlotsAction } from "@/app/dashboard/mentor/actions";

type SlotProposalFormProps = {
  meetingId: string;
};

export function SlotProposalForm({ meetingId }: SlotProposalFormProps) {
  const [starts, setStarts] = useState(["", "", ""]);

  return (
    <form action={proposeMeetingSlotsAction} className="mt-4 space-y-3">
      <input name="meetingId" type="hidden" value={meetingId} />
      {starts.map((start, index) => (
        <label className="block text-sm text-zinc-700" key={index}>
          Option {index + 1}
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
            type="datetime-local"
            value={start}
            required={index === 0}
            onChange={(event) => {
              setStarts((current) =>
                current.map((value, itemIndex) =>
                  itemIndex === index ? event.target.value : value,
                ),
              );
            }}
          />
          {start ? (
            <input
              name="startsAt"
              type="hidden"
              value={new Date(start).toISOString()}
            />
          ) : null}
        </label>
      ))}
      <button
        className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        type="submit"
      >
        Send time options
      </button>
    </form>
  );
}
