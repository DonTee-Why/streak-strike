import { describe, expect, it } from "vitest";
import {
  addDays,
  daysInMonth,
  diffCalendarDays,
  formatLocalDate,
  getCurrentLocalDate,
  getMsUntilNextLocalMidnight,
  getNextLocalMidnight,
  getYmd,
  isValidLocalDate,
  parseLocalDate,
} from "@/lib/date/local-date";

describe("local date utilities", () => {
  it("parses and formats YYYY-MM-DD", () => {
    const parsed = parseLocalDate("2026-03-09");
    expect(formatLocalDate(parsed)).toBe("2026-03-09");
  });

  it("adds days across month boundary", () => {
    expect(addDays("2026-03-31", 1)).toBe("2026-04-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("computes calendar day diffs", () => {
    expect(diffCalendarDays("2026-03-06", "2026-03-09")).toBe(3);
  });

  it("extracts YMD parts", () => {
    expect(getYmd("2026-11-04")).toEqual({ year: 2026, month: 11, day: 4 });
  });

  it("handles leap year and validation", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(isValidLocalDate("2024-02-29")).toBe(true);
    expect(isValidLocalDate("2025-02-29")).toBe(false);
  });

  it("formats the current local date from an explicit clock value", () => {
    expect(getCurrentLocalDate(new Date(2026, 2, 9, 23, 59, 58, 999))).toBe("2026-03-09");
  });

  it("computes the next local midnight", () => {
    expect(formatLocalDate(getNextLocalMidnight(new Date(2026, 11, 31, 23, 59, 30)))).toBe("2027-01-01");
  });

  it("computes milliseconds until next local midnight", () => {
    expect(getMsUntilNextLocalMidnight(new Date(2026, 2, 9, 23, 59, 59, 500))).toBe(500);
    expect(getMsUntilNextLocalMidnight(new Date(2026, 2, 10, 0, 0, 0, 0))).toBe(24 * 60 * 60 * 1000);
  });
});
