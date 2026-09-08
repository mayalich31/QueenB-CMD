"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { proposeMeetingSlotsAction } from "@/app/dashboard/mentor/actions";
import { MeetingWeekGrid } from "@/components/meetings/meeting-week-grid";
import { SlotProposalForm } from "@/components/meetings/slot-proposal-form";
import { slotIntervalFromCell, cellCoveredByPaintedSlot } from "@/lib/services/week-calendar";

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
    const covering = pending.find((iso) =>
      cellCoveredByPaintedSlot(cell, iso, durationMinutes),
    );

    if (covering) {
      setPending((current) => current.filter((value) => value !== covering));
      return;
    }

    const iso = slotIntervalFromCell(cell, durationMinutes).startsAt.toISOString();
    setPending((current) =>
      current.length >= 20 ? current : [...current, iso],
    );
  }

  const pendingSet = useMemo(() => new Set(pending), [pending]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Choose times</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Paint {durationMinutes}-minute windows for {selectedMenteeName}. Existing scheduled
            meetings stay visible so you can avoid conflicts.
          </p>
        </div>
        <Link
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-brand/25"
          href={closeHref}
        >
          Close calendar
        </Link>
      </div>

      {pending.length > 0 ? (
        <form action={proposeMeetingSlotsAction} className="rounded-xl border border-brand/30 bg-cream-card p-4">
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
                className="rounded-full bg-brand/40 px-3 py-1 text-xs text-zinc-800 hover:ring-2 hover:ring-brand-deep"
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
            className="mt-3 rounded-lg bg-brand-deep px-4 py-2 text-sm font-medium text-white hover:bg-brand"
            type="submit"
          >
            Send time options
          </button>
        </form>
      ) : null}

      <MeetingWeekGrid
        emptyCell={(cell) => {
          const coveringStart = [...pendingSet].find((iso) =>
            cellCoveredByPaintedSlot(cell, iso, durationMinutes),
          );
          const isPending = Boolean(coveringStart);
          const isStart =
            coveringStart !== undefined &&
            new Date(coveringStart).getTime() === cell.getTime();

          return (
            <button
              aria-label={
                isStart
                  ? `${durationMinutes}-minute slot starting ${cell.toLocaleTimeString()}`
                  : undefined
              }
              className={`h-7 w-full border border-transparent border-b-brand/20 text-left hover:ring-2 hover:ring-inset hover:ring-brand-deep ${
                isPending ? "bg-sky-200" : ""
              } ${isStart ? "rounded-t bg-sky-300" : ""}`}
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

      <details className="rounded-xl border border-brand/30 bg-cream-card p-4 text-sm">
        <summary className="cursor-pointer font-medium">
          Enter times manually
        </summary>
        <SlotProposalForm meetingId={selectedRequestId} />
      </details>
    </div>
  );
}
