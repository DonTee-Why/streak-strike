import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";

let createHabit: typeof import("@/lib/db/habit-service").createHabit;
let getHabitCalendarMonth: typeof import("@/lib/db/habit-service").getHabitCalendarMonth;
let markGraceDayOnce: typeof import("@/lib/db/habit-service").markGraceDayOnce;
let toggleToday: typeof import("@/lib/db/habit-service").toggleToday;
let db: typeof import("@/lib/db/dexie").db;

beforeAll(async () => {
  const service = await import("@/lib/db/habit-service");
  const dexie = await import("@/lib/db/dexie");
  createHabit = service.createHabit;
  getHabitCalendarMonth = service.getHabitCalendarMonth;
  markGraceDayOnce = service.markGraceDayOnce;
  toggleToday = service.toggleToday;
  db = dexie.db;
});

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe("grace window locking", () => {
  it("allows mark-once for grace day and then locks it", async () => {
    const habit = await createHabit({ name: "Read", color: "#000000", startDate: "2026-03-01" });

    await markGraceDayOnce(habit.id, "2026-03-08", "2026-03-09");
    await expect(markGraceDayOnce(habit.id, "2026-03-08", "2026-03-09")).rejects.toThrow();

    const days = await getHabitCalendarMonth({ habitId: habit.id, year: 2026, month: 3, today: "2026-03-09" });
    const graceDay = days.find((day) => day.date === "2026-03-08");

    expect(graceDay?.state).toBe("grace_done_locked");
    expect(graceDay?.completed).toBe(true);
  });

  it("keeps today editable while expired day is locked", async () => {
    const habit = await createHabit({ name: "Journal", color: "#000000", startDate: "2026-03-01" });

    await toggleToday(habit.id, "2026-03-09");
    await toggleToday(habit.id, "2026-03-09");
    await expect(markGraceDayOnce(habit.id, "2026-03-05", "2026-03-09")).rejects.toThrow();
  });
});
