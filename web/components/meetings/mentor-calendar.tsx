"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { proposeMeetingSlotsAction } from "@/app/dashboard/mentor/actions";
import { MeetingWeekGrid } from "@/components/meetings/meeting-week-grid";
import { SlotProposalForm } from "@/components/meetings/slot-proposal-form";
import { slotIntervalFromCell } from "@/lib/services/week-calendar";

import type { CalendarSlotEvent } from "./meeting-week-grid";

export type MentorCalendarEvent = CalendarSlotEvent;

export function MentorCalendar({
  weekParam,
  durationMinutes,
  selectedRequestId,
  selectedMenteeName,
  closeHref,
  events,
}: {
  weekParam: string;
  durationMinutes: number;
  selectedRequestId: string;
  selectedMenteeName: string;
  closeHref: string;
  events: MentorCalendarEvent[];
}) {
  const [pending, setPending] = useState<string[]>([]);

  function toggleCell(cell: Date) {
    const iso = slotIntervalFromCell(cell, durationMinutes).startsAt.toISOString();
    setPending((current) =>
      current.includes(iso)
        ? current.filter((value) => value !== iso)
        : current.length >= 20
          ? current
          : [...current, iso],
    );
  }

  const pendingSet = useMemo(() => new Set(pending), [pending]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Choose times</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Paint available windows for {selectedMenteeName}. Existing scheduled
            meetings stay visible so you can avoid conflicts.
          </p>
        </div>
        <Link
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
          href={closeHref}
        >
          Close calendar
        </Link>
      </div>

      {pending.length > 0 ? (
        <form action={proposeMeetingSlotsAction} className="rounded-xl border border-zinc-200 bg-white p-4">
          <input name="meetingId" type="hidden" value={selectedRequestId} />
          {pending.map((iso) => (
            <input key={iso} name="startsAt" type="hidden" value={iso} />
          ))}
          <p className="text-sm text-zinc-700">
            {pending.length} time{pending.length === 1 ? "" : "s"} painted
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pending.map((iso) => (
              <button
                className="rounded-full bg-sky-100 px-3 py-1 text-xs text-sky-800 hover:ring-2 hover:ring-amber-600"
                key={iso}
                type="button"
                onClick={() =>
                  setPending((current) => current.filter((value) => value !== iso))
                }
              >
                {new Date(iso).toLocaleString()} ×
              </button>
            ))}
          </div>
          <button
            className="mt-3 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            type="submit"
          >
            Send time options
          </button>
        </form>
      ) : null}

      <MeetingWeekGrid
        emptyCell={(cell) => {
          const isPending =
            pendingSet.has(cell.toISOString()) ||
            [...pendingSet].some(
              (value) => new Date(value).getTime() === cell.getTime(),
            );
          return (
            <button
              className={`h-7 w-full border border-transparent border-b-zinc-100 text-left hover:ring-2 hover:ring-inset hover:ring-amber-600 ${
                isPending ? "bg-sky-100" : ""
              }`}
              type="button"
              onClick={() => toggleCell(cell)}
            />
          );
        }}
        events={events}
        extraQuery={{ request: selectedRequestId }}
        basePath="/dashboard/mentor"
        weekParam={weekParam}
      />

      <details className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium">
          Enter times manually
        </summary>
        <SlotProposalForm meetingId={selectedRequestId} />
      </details>
    </div>
  );
}
