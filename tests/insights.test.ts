import { describe, expect, it } from "vitest";
import {
  getBestMonth,
  getBestWeek,
  getCurrentMonthStats,
  getCurrentWeekStats,
  getPreviousMonthStats,
  getPreviousWeekStats,
  getTrendDirection,
  getWeekdayStats,
} from "@/lib/insights/insights-engine";
import type { HabitMonth } from "@/types/habit";

function makeMonth(habitId: string, year: number, month: number, doneDays: number[]): HabitMonth {
  const bits = Array.from({ length: 31 }, (_, index) => (doneDays.includes(index + 1) ? "1" : "0")).join("");
  return { habitId, year, month, bits, completedCount: doneDays.length, updatedAt: "2026-03-11" };
}

describe("insights engine", () => {
  it("calculates current and previous week stats from monthly bitsets", () => {
    const march = makeMonth("h", 2026, 3, [1, 2, 3, 5, 9, 11, 12, 20]);

    expect(getCurrentWeekStats([march], "2026-03-01", "2026-03-11")).toEqual({
      startDate: "2026-03-09",
      endDate: "2026-03-11",
      completedDays: 2,
      eligibleDays: 3,
      completionRate: 2 / 3,
    });

    expect(getPreviousWeekStats([march], "2026-03-01", "2026-03-11")).toEqual({
      startDate: "2026-03-02",
      endDate: "2026-03-08",
      completedDays: 3,
      eligibleDays: 7,
      completionRate: 3 / 7,
    });
  });

  it("calculates current and previous month stats with habit-start and future-day bounds", () => {
    const february = makeMonth("h", 2026, 2, [15, 16, 20, 28]);
    const march = makeMonth("h", 2026, 3, [1, 2, 3, 5, 9, 11, 12, 20]);

    expect(getCurrentMonthStats([february, march], "2026-02-15", "2026-03-11")).toEqual({
      startDate: "2026-03-01",
      endDate: "2026-03-11",
      completedDays: 6,
      eligibleDays: 11,
      completionRate: 6 / 11,
    });

    expect(getPreviousMonthStats([february, march], "2026-02-15", "2026-03-11")).toEqual({
      startDate: "2026-02-15",
      endDate: "2026-02-28",
      completedDays: 4,
      eligibleDays: 14,
      completionRate: 4 / 14,
    });
  });

  it("analyzes weekday completion rates from Monday through Sunday", () => {
    const march = makeMonth("h", 2026, 3, [2, 3, 6, 9, 14]);
    const stats = getWeekdayStats([march], "2026-03-02", "2026-03-15");

    expect(stats.map((stat) => stat.label)).toEqual([
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ]);
    expect(stats[0]).toMatchObject({ label: "Monday", completionCount: 2, eligibleCount: 2, completionRate: 1 });
    expect(stats[1]).toMatchObject({ label: "Tuesday", completionCount: 1, eligibleCount: 2, completionRate: 0.5 });
    expect(stats[2]).toMatchObject({ label: "Wednesday", completionCount: 0, eligibleCount: 2, completionRate: 0 });
    expect(stats[5]).toMatchObject({ label: "Saturday", completionCount: 1, eligibleCount: 2, completionRate: 0.5 });
  });

  it("selects the best week by rate, then completion count, then recency", () => {
    const march = makeMonth("h", 2026, 3, [2, 4, 6, 9, 10, 11, 12, 16, 17, 18, 19]);

    expect(getBestWeek([march], "2026-03-02", "2026-03-22")).toEqual({
      label: "2026-03-16 to 2026-03-22",
      startDate: "2026-03-16",
      endDate: "2026-03-22",
      completedDays: 4,
      eligibleDays: 7,
      completionRate: 4 / 7,
    });
  });

  it("selects the best month by rate, then completion count, then recency", () => {
    const january = makeMonth("h", 2026, 1, [1, 2, 3, 4, 5]);
    const february = makeMonth("h", 2026, 2, [1, 2, 3, 4, 5, 6]);
    const march = makeMonth("h", 2026, 3, [1, 2, 20]);

    expect(getBestMonth([january, february, march], "2026-01-22", "2026-03-10")).toEqual({
      label: "2026-02",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      completedDays: 6,
      eligibleDays: 28,
      completionRate: 6 / 28,
    });
  });

  it("determines trend direction by comparing rates", () => {
    expect(getTrendDirection(0.75, 0.5)).toBe("improving");
    expect(getTrendDirection(0.25, 0.5)).toBe("declining");
    expect(getTrendDirection(0.5, 0.5)).toBe("stable");
  });

  it("excludes future days from period calculations even when future bits exist", () => {
    const march = makeMonth("h", 2026, 3, [1, 2, 3, 12, 13, 14, 15, 31]);

    expect(getCurrentMonthStats([march], "2026-03-01", "2026-03-03")).toEqual({
      startDate: "2026-03-01",
      endDate: "2026-03-03",
      completedDays: 3,
      eligibleDays: 3,
      completionRate: 1,
    });
  });
});
