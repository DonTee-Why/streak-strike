import { describe, expect, it } from "vitest";
import {
  addDays,
  daysInMonth,
  diffCalendarDays,
  formatLocalDate,
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
});
