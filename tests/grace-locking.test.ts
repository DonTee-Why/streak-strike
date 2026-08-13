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
  it("allows one correction cycle for a grace day and then locks it", async () => {
    const habit = await createHabit({ name: "Read", color: "#000000", startDate: "2026-03-01" });

    await markGraceDayOnce(habit.id, "2026-03-08", "2026-03-09");
    let days = await getHabitCalendarMonth({ habitId: habit.id, year: 2026, month: 3, today: "2026-03-09" });
    let graceDay = days.find((day) => day.date === "2026-03-08");

    expect(graceDay?.state).toBe("grace_done_editable");
    expect(graceDay?.completed).toBe(true);
    expect(graceDay?.markable).toBe(true);

    await markGraceDayOnce(habit.id, "2026-03-08", "2026-03-09");
    days = await getHabitCalendarMonth({ habitId: habit.id, year: 2026, month: 3, today: "2026-03-09" });
    graceDay = days.find((day) => day.date === "2026-03-08");

    expect(graceDay?.state).toBe("grace_open");
    expect(graceDay?.completed).toBe(false);
    expect(graceDay?.markable).toBe(true);

    await markGraceDayOnce(habit.id, "2026-03-08", "2026-03-09");
    await expect(markGraceDayOnce(habit.id, "2026-03-08", "2026-03-09")).rejects.toThrow(
      "Only editable grace-window days can be changed",
    );

    days = await getHabitCalendarMonth({ habitId: habit.id, year: 2026, month: 3, today: "2026-03-09" });
    graceDay = days.find((day) => day.date === "2026-03-08");

    expect(graceDay?.state).toBe("grace_done_locked");
    expect(graceDay?.completed).toBe(true);
    expect(graceDay?.markable).toBe(false);
  });

  it("keeps today editable while expired day is locked", async () => {
    const habit = await createHabit({ name: "Journal", color: "#000000", startDate: "2026-03-01" });

    await toggleToday(habit.id, "2026-03-09");
    await toggleToday(habit.id, "2026-03-09");
    await expect(markGraceDayOnce(habit.id, "2026-03-05", "2026-03-09")).rejects.toThrow();
  });

  it("prevents marking previous days when today is the habit start day", async () => {
    const habit = await createHabit({ name: "Move", color: "#000000", startDate: "2026-03-09" });

    await expect(markGraceDayOnce(habit.id, "2026-03-08", "2026-03-09")).rejects.toThrow(
      "Only editable grace-window days can be changed",
    );

    const days = await getHabitCalendarMonth({ habitId: habit.id, year: 2026, month: 3, today: "2026-03-09" });
    const preStartDay = days.find((day) => day.date === "2026-03-08");

    expect(preStartDay?.state).toBe("pre_start");
    expect(preStartDay?.completed).toBe(false);
    expect(preStartDay?.markable).toBe(false);
  });

  it("allows backfilling the end date inside grace after the habit ended", async () => {
    const habit = await createHabit({
      name: "Challenge",
      color: "#000000",
      startDate: "2026-03-01",
      endDate: "2026-03-10",
    });

    await markGraceDayOnce(habit.id, "2026-03-10", "2026-03-11");

    const days = await getHabitCalendarMonth({ habitId: habit.id, year: 2026, month: 3, today: "2026-03-11" });
    const endDay = days.find((day) => day.date === "2026-03-10");
    const postEndDay = days.find((day) => day.date === "2026-03-11");

    expect(endDay?.state).toBe("grace_done_editable");
    expect(endDay?.completed).toBe(true);
    expect(endDay?.markable).toBe(true);
    expect(postEndDay?.state).toBe("post_end");
    expect(postEndDay?.markable).toBe(false);
  });

  it("prevents marking dates after the habit end date", async () => {
    const habit = await createHabit({
      name: "Sprint",
      color: "#000000",
      startDate: "2026-03-01",
      endDate: "2026-03-10",
    });

    await expect(markGraceDayOnce(habit.id, "2026-03-11", "2026-03-12")).rejects.toThrow(
      "Only editable grace-window days can be changed",
    );
    await expect(toggleToday(habit.id, "2026-03-11")).rejects.toThrow("Only today can be changed");
  });
});
