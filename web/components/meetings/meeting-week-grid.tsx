"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";

import {
  calendarSlotTitle,
  MEETING_STATUS_COLORS,
  MEETING_STATUS_LABELS,
} from "@/lib/constants/meeting-statuses";
import type { MeetingStatus } from "@/lib/generated/prisma/enums";
import {
  cellOverlapsInterval,
  formatHourLabel,
  formatWeekParam,
  localDayCells,
  localWeekDays,
  parseWeekParam,
  shiftWeek,
} from "@/lib/services/week-calendar";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CELL_HOVER =
  "hover:z-10 hover:ring-2 hover:ring-inset hover:ring-amber-600";

export type CalendarSlotEvent = {
  meetingId: string;
  counterpartName: string;
  status: MeetingStatus;
  startsAt: string;
  endsAt: string;
  role?: "mentee" | "mentor";
};

function hrefForWeek(
  basePath: string,
  week: string,
  extraQuery: Record<string, string> = {},
) {
  const params = new URLSearchParams({ week });
  for (const [key, value] of Object.entries(extraQuery)) {
    if (value) {
      params.set(key, value);
    }
  }
  return `${basePath}?${params.toString()}`;
}

export function MeetingWeekGrid({
  weekParam,
  events,
  basePath,
  extraQuery,
  emptyCell,
}: {
  weekParam: string;
  events: CalendarSlotEvent[];
  basePath: string;
  extraQuery?: Record<string, string>;
  emptyCell?: (cell: Date) => ReactNode;
}) {
  const weekStart = useMemo(() => parseWeekParam(weekParam), [weekParam]);
  const days = localWeekDays(weekStart);
  const hourLabels = localDayCells(days[0]).filter(
    (cell) => cell.getMinutes() === 0,
  );
  const previous = formatWeekParam(shiftWeek(weekStart, -1));
  const next = formatWeekParam(shiftWeek(weekStart, 1));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-zinc-600">
          Week of {weekStart.toLocaleDateString()}
        </p>
        <div className="flex gap-2 text-sm">
          <Link
            className="rounded-lg px-3 py-2 hover:bg-zinc-100"
            href={hrefForWeek(basePath, previous, extraQuery)}
          >
            Previous
          </Link>
          <Link
            className="rounded-lg px-3 py-2 hover:bg-zinc-100"
            href={hrefForWeek(basePath, next, extraQuery)}
          >
            Next
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200">
        <div
          className="grid min-w-[52rem] gap-px bg-zinc-200"
          style={{ gridTemplateColumns: "4.5rem repeat(7, minmax(0, 1fr))" }}
        >
          <div className="bg-zinc-50" />
          {days.map((day, index) => (
            <div
              className="bg-zinc-50 px-1 py-2 text-center text-xs font-medium text-zinc-600"
              key={day.toISOString()}
            >
              {weekdayLabels[index]} {day.getDate()}
            </div>
          ))}
          {hourLabels.map((hour) => (
            <HourRow
              days={days}
              emptyCell={emptyCell}
              events={events}
              hour={hour}
              key={hour.toISOString()}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HourRow({
  hour,
  days,
  events,
  emptyCell,
}: {
  hour: Date;
  days: Date[];
  events: CalendarSlotEvent[];
  emptyCell?: (cell: Date) => ReactNode;
}) {
  return (
    <>
      <div className="bg-white px-1 py-2 text-right text-xs text-zinc-500">
        {formatHourLabel(hour)}
      </div>
      {days.map((day) => {
        const cells = localDayCells(day).filter(
          (cell) => cell.getHours() === hour.getHours(),
        );

        return (
          <div className="bg-white" key={`${day.toISOString()}-${hour.getHours()}`}>
            {cells.map((cell) => {
              const event = events.find((entry) =>
                cellOverlapsInterval(
                  cell,
                  new Date(entry.startsAt),
                  new Date(entry.endsAt),
                ),
              );

              if (event) {
                const title = calendarSlotTitle(
                  event.counterpartName,
                  event.status,
                  event.role,
                );
                const isStart =
                  Math.abs(new Date(event.startsAt).getTime() - cell.getTime()) <
                  60_000;

                return (
                  <Link
                    className={`block h-7 truncate px-1 text-[11px] font-medium ${MEETING_STATUS_COLORS[event.status]} ${CELL_HOVER}`}
                    href={`/meetings/${event.meetingId}`}
                    key={cell.toISOString()}
                    title={title}
                  >
                    {isStart ? (
                      <span className="flex items-center gap-1">
                        {event.role ? (
                          <span
                            className={`shrink-0 rounded px-1 text-[9px] font-semibold uppercase ${
                              event.role === "mentor"
                                ? "bg-zinc-950 text-white"
                                : "bg-white/80 text-zinc-800"
                            }`}
                          >
                            {event.role === "mentor" ? "Mentor" : "Mentee"}
                          </span>
                        ) : null}
                        <span className="truncate">{event.counterpartName}</span>
                      </span>
                    ) : null}
                    <span className="sr-only">{title}</span>
                  </Link>
                );
              }

              if (emptyCell) {
                return (
                  <div className="h-7" key={cell.toISOString()}>
                    {emptyCell(cell)}
                  </div>
                );
              }

              return (
                <div className="h-7 border-b border-zinc-100" key={cell.toISOString()} />
              );
            })}
          </div>
        );
      })}
    </>
  );
}
