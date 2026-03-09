import { describe, expect, it } from "vitest";
import { calculateLongestStreak } from "@/lib/streak/streak-engine";
import type { HabitMonth } from "@/types/habit";

function makeMonth(habitId: string, year: number, month: number, doneDays: number[]): HabitMonth {
  const bits = Array.from({ length: 31 }, (_, i) => (doneDays.includes(i + 1) ? "1" : "0")).join("");
  return { habitId, year, month, bits, completedCount: doneDays.length, updatedAt: "2026-03-09" };
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
});
