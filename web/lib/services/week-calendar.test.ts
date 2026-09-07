import { describe, expect, it } from "vitest";

import {
  CALENDAR_CELL_MINUTES,
  cellOverlapsInterval,
  formatWeekParam,
  localDayCells,
  localWeekDays,
  parseWeekParam,
  shiftWeek,
  slotIntervalFromCell,
  startOfLocalWeek,
} from "./week-calendar";

describe("local week calendar helpers", () => {
  it("snaps dates to Sunday local week starts", () => {
    const wednesday = new Date(2026, 8, 9, 15, 30, 0);
    const weekStart = startOfLocalWeek(wednesday);

    expect(weekStart.getDay()).toBe(0);
    expect(weekStart.getDate()).toBe(6);
    expect(weekStart.getHours()).toBe(0);
  });

  it("parses and formats week params", () => {
    const parsed = parseWeekParam("2026-09-09");
    expect(formatWeekParam(parsed)).toBe("2026-09-06");
    expect(formatWeekParam(shiftWeek(parsed, 1))).toBe("2026-09-13");
  });

  it("builds seven days and working-hour cells", () => {
    const weekStart = parseWeekParam("2026-09-06");
    const days = localWeekDays(weekStart);
    expect(days).toHaveLength(7);
    expect(days[0].getDate()).toBe(6);
    expect(days[6].getDate()).toBe(12);

    const cells = localDayCells(days[1]);
    expect(cells[0].getHours()).toBe(8);
    expect(cells[1].getMinutes()).toBe(CALENDAR_CELL_MINUTES);
    expect(cells.at(-1)?.getHours()).toBe(19);
    expect(cells.at(-1)?.getMinutes()).toBe(30);
  });

  it("creates UTC-ready intervals from a clicked cell and duration", () => {
    const cell = new Date(2026, 8, 8, 10, 0, 0);
    const interval = slotIntervalFromCell(cell, 45);

    expect(interval.startsAt.getTime()).toBe(cell.getTime());
    expect(interval.endsAt.getTime() - interval.startsAt.getTime()).toBe(
      45 * 60_000,
    );
    expect(interval.startsAt.toISOString().endsWith("Z")).toBe(true);
  });

  it("detects whether a meeting interval covers a grid cell", () => {
    const cell = new Date(2026, 8, 8, 10, 0, 0);
    const start = new Date(2026, 8, 8, 10, 0, 0);
    const end = new Date(2026, 8, 8, 10, 45, 0);

    expect(cellOverlapsInterval(cell, start, end)).toBe(true);
    expect(
      cellOverlapsInterval(new Date(2026, 8, 8, 11, 0, 0), start, end),
    ).toBe(false);
  });
});
