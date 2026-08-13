import { describe, expect, it } from "vitest";
import {
  getEffectiveHabitEndDate,
  getHabitStatus,
  getHabitTrackingDays,
  isDateWithinHabitRange,
  validateHabitEndDateUpdate,
} from "@/lib/habit/lifecycle";
import type { Habit } from "@/types/habit";

function habit(endDate?: string | null): Habit {
  return {
    id: "habit_1",
    name: "Read",
    color: "#000000",
    startDate: "2026-08-01",
    endDate,
    createdAt: "2026-08-01",
  };
}

describe("habit lifecycle boundaries", () => {
  it("keeps indefinite habits active and bounded by today", () => {
    const indefinite = habit(null);

    expect(getHabitStatus(indefinite, "2026-12-10")).toBe("active");
    expect(getEffectiveHabitEndDate(indefinite, "2026-12-10")).toBe("2026-12-10");
    expect(getHabitTrackingDays(indefinite, "2026-08-03")).toBe(3);
  });

  it("derives ended status only after the inclusive end date", () => {
    const finite = habit("2026-08-30");

    expect(getHabitStatus(finite, "2026-08-30")).toBe("active");
    expect(getHabitStatus(finite, "2026-08-31")).toBe("ended");
  });

  it("re-derives ended status when the synchronized local date rolls past end date", () => {
    const finite = habit("2026-08-10");

    expect(getHabitStatus(finite, "2026-08-10")).toBe("active");
    expect(getHabitStatus(finite, "2026-08-11")).toBe("ended");
  });

  it("stops tracking days at the habit end date", () => {
    expect(getHabitTrackingDays(habit("2026-08-30"), "2026-12-10")).toBe(30);
  });

  it("checks inclusive habit tracking range", () => {
    const finite = habit("2026-08-30");

    expect(isDateWithinHabitRange(finite, "2026-07-31")).toBe(false);
    expect(isDateWithinHabitRange(finite, "2026-08-01")).toBe(true);
    expect(isDateWithinHabitRange(finite, "2026-08-30")).toBe(true);
    expect(isDateWithinHabitRange(finite, "2026-08-31")).toBe(false);
  });

  it("validates active-habit end date edits", () => {
    const active = habit("2026-08-30");

    expect(validateHabitEndDateUpdate({ habit: active, nextEndDate: "2026-09-10", today: "2026-08-12" })).toBeNull();
    expect(validateHabitEndDateUpdate({ habit: active, nextEndDate: "2026-08-12", today: "2026-08-12" })).toBeNull();
    expect(validateHabitEndDateUpdate({ habit: active, nextEndDate: "2026-08-11", today: "2026-08-12" })).toBe(
      "Active habits cannot end before today",
    );
    expect(validateHabitEndDateUpdate({ habit: active, nextEndDate: null, today: "2026-08-12" })).toBeNull();
  });

  it("validates ended-habit end date edits", () => {
    const ended = habit("2026-08-10");

    expect(validateHabitEndDateUpdate({ habit: ended, nextEndDate: "2026-08-09", today: "2026-08-12" })).toBe(
      "Ended habits cannot move the end date backwards",
    );
    expect(validateHabitEndDateUpdate({ habit: ended, nextEndDate: "2026-08-11", today: "2026-08-12" })).toBeNull();
    expect(validateHabitEndDateUpdate({ habit: ended, nextEndDate: "2026-09-01", today: "2026-08-12" })).toBeNull();
    expect(validateHabitEndDateUpdate({ habit: ended, nextEndDate: null, today: "2026-08-12" })).toBeNull();
  });
});
