import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import {
  calculateTotalCompletionsInRange,
  getCompletionRate,
  getDaysSinceStart,
} from "@/lib/streak/streak-engine";
import type { HabitMonth } from "@/types/habit";

let createHabit: typeof import("@/lib/db/habit-service").createHabit;
let getHabitMetrics: typeof import("@/lib/db/habit-service").getHabitMetrics;
let getTotalCompletions: typeof import("@/lib/db/habit-service").getTotalCompletions;
let markGraceDayOnce: typeof import("@/lib/db/habit-service").markGraceDayOnce;
let toggleToday: typeof import("@/lib/db/habit-service").toggleToday;
let db: typeof import("@/lib/db/dexie").db;

function makeMonth(habitId: string, year: number, month: number, doneDays: number[]): HabitMonth {
  const bits = Array.from({ length: 31 }, (_, index) => (doneDays.includes(index + 1) ? "1" : "0")).join("");
  return { habitId, year, month, bits, completedCount: doneDays.length, updatedAt: "2026-03-15" };
}

beforeAll(async () => {
  const service = await import("@/lib/db/habit-service");
  const dexie = await import("@/lib/db/dexie");

  createHabit = service.createHabit;
  getHabitMetrics = service.getHabitMetrics;
  getTotalCompletions = service.getTotalCompletions;
  markGraceDayOnce = service.markGraceDayOnce;
  toggleToday = service.toggleToday;
  db = dexie.db;
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("habit metrics", () => {
  it("derives days since start inclusively and validates future dates", () => {
    expect(getDaysSinceStart("2026-03-15", "2026-03-15")).toBe(1);
    expect(getDaysSinceStart("2026-03-12", "2026-03-15")).toBe(4);
    expect(() => getDaysSinceStart("2026-03-16", "2026-03-15")).toThrow("Start date cannot be in the future");
  });

  it("derives total completions from bitsets within the requested date range", () => {
    const month = makeMonth("habit_1", 2026, 3, [1, 5, 10, 12, 15]);

    expect(calculateTotalCompletionsInRange([month], "2026-03-10", "2026-03-15")).toBe(3);
    expect(calculateTotalCompletionsInRange([month], "2026-03-13", "2026-03-15")).toBe(1);
  });

  it("computes completion rate correctly and clamps it between 0 and 1", () => {
    expect(getCompletionRate(0, 1)).toBe(0);
    expect(getCompletionRate(2, 4)).toBe(0.5);
    expect(getCompletionRate(9, 4)).toBe(1);
    expect(() => getCompletionRate(1, 0)).toThrow("Days since start must be at least 1");
  });

  it("returns compact habit metrics from the habit start date", async () => {
    const habit = await createHabit({ name: "Meditate", color: "#000000", startDate: "2026-03-12" });

    await markGraceDayOnce(habit.id, "2026-03-13", "2026-03-15");
    await toggleToday(habit.id, "2026-03-15");

    const metrics = await getHabitMetrics(habit.id, "2026-03-15");

    expect(metrics).toEqual({
      startDate: "2026-03-12",
      daysSinceStart: 4,
      totalCompletions: 2,
      completionRate: 0.5,
      currentStreak: 1,
      longestStreak: 1,
    });
  });

  it("handles zero completions on the first day", async () => {
    const habit = await createHabit({ name: "Stretch", color: "#000000", startDate: "2026-03-15" });

    expect(await getTotalCompletions(habit.id, "2026-03-15")).toBe(0);
    await expect(getHabitMetrics(habit.id, "2026-03-15")).resolves.toEqual({
      startDate: "2026-03-15",
      daysSinceStart: 1,
      totalCompletions: 0,
      completionRate: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
  });

  it("rejects habits whose start date is in the future", async () => {
    await expect(createHabit({ name: "Read", color: "#000000", startDate: "2099-01-01" })).rejects.toThrow(
      "Start date must be today or earlier",
    );
  });
});
