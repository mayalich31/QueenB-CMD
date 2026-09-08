export const CALENDAR_START_HOUR = 8;
export const CALENDAR_END_HOUR = 20;
export const CALENDAR_CELL_MINUTES = 30;

const WEEK_PARAM_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function startOfLocalWeek(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

export function parseWeekParam(week?: string | null) {
  if (week && WEEK_PARAM_PATTERN.test(week)) {
    const [year, month, day] = week.split("-").map(Number);
    return startOfLocalWeek(new Date(year, month - 1, day));
  }

  return startOfLocalWeek(new Date());
}

export function formatWeekParam(weekStart: Date) {
  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(2, "0");
  const day = String(weekStart.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftWeek(weekStart: Date, deltaWeeks: number) {
  const shifted = new Date(weekStart);
  shifted.setDate(shifted.getDate() + deltaWeeks * 7);
  return startOfLocalWeek(shifted);
}

export function localWeekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + index);
    return day;
  });
}

export function localDayCells(day: Date) {
  const cells: Date[] = [];

  for (let hour = CALENDAR_START_HOUR; hour < CALENDAR_END_HOUR; hour += 1) {
    for (let minute = 0; minute < 60; minute += CALENDAR_CELL_MINUTES) {
      const cell = new Date(day);
      cell.setHours(hour, minute, 0, 0);
      cells.push(cell);
    }
  }

  return cells;
}

export function slotIntervalFromCell(cellStart: Date, durationMinutes: number) {
  return {
    startsAt: new Date(cellStart),
    endsAt: new Date(cellStart.getTime() + durationMinutes * 60_000),
  };
}

export function isPaintedSlotStart(cell: Date, slotStartIso: string) {
  return new Date(slotStartIso).getTime() === cell.getTime();
}

export function isPaintedSlotEnd(
  cell: Date,
  slotStartIso: string,
  durationMinutes: number,
  cellMinutes = CALENDAR_CELL_MINUTES,
) {
  const start = new Date(slotStartIso).getTime();
  const end = start + durationMinutes * 60_000;
  const cellStart = cell.getTime();
  const cellEnd = cellStart + cellMinutes * 60_000;
  return cellStart < end && cellEnd >= end;
}

export function cellOverlapsInterval(
  cellStart: Date,
  intervalStart: Date,
  intervalEnd: Date,
  cellMinutes = CALENDAR_CELL_MINUTES,
) {
  const cellEnd = new Date(cellStart.getTime() + cellMinutes * 60_000);
  return intervalStart < cellEnd && intervalEnd > cellStart;
}

export function cellCoveredByPaintedSlot(
  cell: Date,
  slotStartIso: string,
  durationMinutes: number,
) {
  const start = new Date(slotStartIso);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return cellOverlapsInterval(cell, start, end);
}

export function formatHourLabel(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}
