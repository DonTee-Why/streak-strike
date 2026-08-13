import { describe, expect, it } from "vitest";
import { createEmptyMonthBits } from "@/lib/bitset/month-bitset";
import { calculateLongestStreak } from "@/lib/streak/streak-engine";
import type { HabitMonth } from "@/types/habit";

function makeMonth(habitId: string, year: number, month: number, doneDays: number[]): HabitMonth {
  const bits = Array.from({ length: 31 }, (_, i) => (doneDays.includes(i + 1) ? "1" : "0")).join("");
  return {
    habitId,
    year,
    month,
    bits,
    graceMarkedBits: createEmptyMonthBits(),
    graceCorrectionBits: createEmptyMonthBits(),
    completedCount: doneDays.length,
    updatedAt: "2026-03-09",
  };
}

describe("longest streak", () => {
  it("calculates max contiguous run across months", () => {
    const jan = makeMonth("h", 2026, 1, [30, 31]);
    const feb = makeMonth("h", 2026, 2, [1, 2, 6, 7, 8]);
    const mar = makeMonth("h", 2026, 3, [1]);

    expect(calculateLongestStreak([mar, jan, feb])).toBe(4);
  });

  it("returns 0 with no records", () => {
    expect(calculateLongestStreak([])).toBe(0);
  });

  it("ignores completed days outside the habit tracking range", () => {
    const august = makeMonth("h", 2026, 8, [27, 28, 29, 30, 31]);
    const september = makeMonth("h", 2026, 9, [1, 2, 3]);

    expect(calculateLongestStreak([september, august], "2026-08-01", "2026-08-30")).toBe(4);
  });

  it("calculates bounded cross-month streaks", () => {
    const january = makeMonth("h", 2026, 1, [30, 31]);
    const february = makeMonth("h", 2026, 2, [1, 2, 3]);

    expect(calculateLongestStreak([february, january], "2026-01-30", "2026-02-03")).toBe(5);
  });
});
