import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";
import { createEmptyMonthBits } from "@/lib/bitset/month-bitset";
import type { Habit, HabitMonth } from "@/types/habit";

let getHabit: typeof import("@/lib/db/habit-service").getHabit;
let getHabitMetrics: typeof import("@/lib/db/habit-service").getHabitMetrics;
let updateHabitEndDate: typeof import("@/lib/db/habit-service").updateHabitEndDate;
let db: typeof import("@/lib/db/dexie").db;

function makeHabit(endDate: string | null): Habit {
  return {
    id: `habit_${endDate ?? "none"}`,
    name: "Read",
    color: "#000000",
    startDate: "2026-08-01",
    endDate,
    createdAt: "2026-08-01",
  };
}

function makeMonth(habitId: string, doneDays: number[]): HabitMonth {
  const bits = Array.from({ length: 31 }, (_, index) => (doneDays.includes(index + 1) ? "1" : "0")).join("");
  return {
    habitId,
    year: 2026,
    month: 8,
    bits,
    graceMarkedBits: createEmptyMonthBits(),
    graceCorrectionBits: createEmptyMonthBits(),
    completedCount: doneDays.length,
    updatedAt: "2026-08-12",
  };
}

beforeAll(async () => {
  const service = await import("@/lib/db/habit-service");
  const dexie = await import("@/lib/db/dexie");

  getHabit = service.getHabit;
  getHabitMetrics = service.getHabitMetrics;
  updateHabitEndDate = service.updateHabitEndDate;
  db = dexie.db;
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("habit end-date editing", () => {
  it("allows an active habit to extend, shorten to today or later, and remove the end date", async () => {
    const habit = makeHabit("2026-08-30");
    await db.habits.put(habit);

    await expect(updateHabitEndDate(habit.id, "2026-09-05", "2026-08-12")).resolves.toMatchObject({
      endDate: "2026-09-05",
    });
    await expect(updateHabitEndDate(habit.id, "2026-08-12", "2026-08-12")).resolves.toMatchObject({
      endDate: "2026-08-12",
    });
    await expect(updateHabitEndDate(habit.id, null, "2026-08-12")).resolves.toMatchObject({
      endDate: null,
    });
  });

  it("prevents an active habit from shortening into the past", async () => {
    const habit = makeHabit("2026-08-30");
    await db.habits.put(habit);

    await expect(updateHabitEndDate(habit.id, "2026-08-11", "2026-08-12")).rejects.toThrow(
      "Active habits cannot end before today",
    );
  });

  it("prevents an ended habit from moving the end date backwards", async () => {
    const habit = makeHabit("2026-08-10");
    await db.habits.put(habit);

    await expect(updateHabitEndDate(habit.id, "2026-08-09", "2026-08-12")).rejects.toThrow(
      "Ended habits cannot move the end date backwards",
    );
  });

  it("allows an ended habit to extend forward or become indefinite", async () => {
    const habit = makeHabit("2026-08-10");
    await db.habits.put(habit);

    await expect(updateHabitEndDate(habit.id, "2026-08-11", "2026-08-12")).resolves.toMatchObject({
      endDate: "2026-08-11",
    });
    await expect(updateHabitEndDate(habit.id, null, "2026-08-12")).resolves.toMatchObject({ endDate: null });
  });

  it("retains raw completion history when a new end date excludes later records", async () => {
    const habit = makeHabit("2026-08-30");
    await db.habits.put(habit);
    await db.habitMonths.put(makeMonth(habit.id, [10, 12, 15]));

    await updateHabitEndDate(habit.id, "2026-08-12", "2026-08-12");

    const month = await db.habitMonths.get([habit.id, 2026, 8]);
    expect(month?.bits[14]).toBe("1");
    await expect(getHabitMetrics(habit.id, "2026-08-20")).resolves.toMatchObject({
      daysSinceStart: 12,
      totalCompletions: 2,
    });
    await expect(getHabit(habit.id)).resolves.toMatchObject({ endDate: "2026-08-12" });
  });
});
