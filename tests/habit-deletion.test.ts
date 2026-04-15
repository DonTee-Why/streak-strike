import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";

let createHabit: typeof import("@/lib/db/habit-service").createHabit;
let deleteHabit: typeof import("@/lib/db/habit-service").deleteHabit;
let markGraceDayOnce: typeof import("@/lib/db/habit-service").markGraceDayOnce;
let toggleToday: typeof import("@/lib/db/habit-service").toggleToday;
let getHabitStats: typeof import("@/lib/db/stats-repo").getHabitStats;
let listHabitMonths: typeof import("@/lib/db/habit-months-repo").listHabitMonths;
let db: typeof import("@/lib/db/dexie").db;

beforeAll(async () => {
  const service = await import("@/lib/db/habit-service");
  const statsRepo = await import("@/lib/db/stats-repo");
  const monthsRepo = await import("@/lib/db/habit-months-repo");
  const dexie = await import("@/lib/db/dexie");

  createHabit = service.createHabit;
  deleteHabit = service.deleteHabit;
  markGraceDayOnce = service.markGraceDayOnce;
  toggleToday = service.toggleToday;
  getHabitStats = statsRepo.getHabitStats;
  listHabitMonths = monthsRepo.listHabitMonths;
  db = dexie.db;
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("habit deletion", () => {
  it("removes the habit, all habitMonths, and habitStats in one delete flow", async () => {
    const habit = await createHabit({ name: "Read", color: "#000000", startDate: "2026-03-01" });

    await markGraceDayOnce(habit.id, "2026-03-08", "2026-03-09");
    await toggleToday(habit.id, "2026-03-09");

    expect(await db.habits.get(habit.id)).toBeDefined();
    expect(await listHabitMonths(habit.id)).toHaveLength(1);
    expect(await getHabitStats(habit.id)).toBeDefined();

    await deleteHabit(habit.id);

    expect(await db.habits.get(habit.id)).toBeUndefined();
    expect(await listHabitMonths(habit.id)).toHaveLength(0);
    expect(await getHabitStats(habit.id)).toBeUndefined();
  });

  it("does not leave orphaned records and does not touch other habits", async () => {
    const doomedHabit = await createHabit({ name: "Journal", color: "#111111", startDate: "2026-03-01" });
    const survivingHabit = await createHabit({ name: "Walk", color: "#222222", startDate: "2026-03-01" });

    await toggleToday(doomedHabit.id, "2026-03-09");
    await toggleToday(survivingHabit.id, "2026-03-09");

    await deleteHabit(doomedHabit.id);

    expect(await db.habits.get(doomedHabit.id)).toBeUndefined();
    expect(await db.habitMonths.where("habitId").equals(doomedHabit.id).count()).toBe(0);
    expect(await db.habitStats.where("habitId").equals(doomedHabit.id).count()).toBe(0);

    expect(await db.habits.get(survivingHabit.id)).toBeDefined();
    expect(await db.habitMonths.where("habitId").equals(survivingHabit.id).count()).toBeGreaterThan(0);
    expect(await db.habitStats.where("habitId").equals(survivingHabit.id).count()).toBe(1);
  });
});
