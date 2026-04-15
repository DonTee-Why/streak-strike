import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Habit } from "@/types/habit";

const currentToday = vi.hoisted(() => ({ value: "2026-03-09" }));
const serviceMocks = vi.hoisted(() => ({
  createHabit: vi.fn(),
  deleteHabit: vi.fn(),
  getHabit: vi.fn(),
  getHabitCalendarMonth: vi.fn(),
  getHabits: vi.fn(),
  getHabitMetrics: vi.fn(),
  getHabitStreaks: vi.fn(),
  markGraceDayOnce: vi.fn(),
  toggleToday: vi.fn(),
}));

vi.mock("@/lib/date/local-date", async () => {
  const actual = await vi.importActual<typeof import("@/lib/date/local-date")>("@/lib/date/local-date");
  return {
    ...actual,
    getLocalToday: () => currentToday.value,
  };
});

vi.mock("@/lib/db/habit-service", () => ({
  HabitRuleError: class HabitRuleError extends Error {},
  createHabit: serviceMocks.createHabit,
  deleteHabit: serviceMocks.deleteHabit,
  getHabit: serviceMocks.getHabit,
  getHabitCalendarMonth: serviceMocks.getHabitCalendarMonth,
  getHabits: serviceMocks.getHabits,
  getHabitMetrics: serviceMocks.getHabitMetrics,
  getHabitStreaks: serviceMocks.getHabitStreaks,
  markGraceDayOnce: serviceMocks.markGraceDayOnce,
  toggleToday: serviceMocks.toggleToday,
}));

async function loadStore() {
  vi.resetModules();
  const mod = await import("@/store/habits-store");
  return mod.useHabitsStore;
}

const streaks = { currentStreak: 2, longestStreak: 5, totalCompletions: 8 };
const metrics = {
  startDate: "2026-03-01",
  daysSinceStart: 9,
  totalCompletions: 8,
  completionRate: 8 / 9,
  currentStreak: 2,
  longestStreak: 5,
};
const habit: Habit = {
  id: "habit_1",
  name: "Read",
  color: "#000000",
  startDate: "2026-03-01",
  createdAt: "2026-03-01",
};

describe("habits store day sync", () => {
  beforeEach(() => {
    currentToday.value = "2026-03-09";
    vi.clearAllMocks();
    serviceMocks.createHabit.mockResolvedValue(habit);
    serviceMocks.deleteHabit.mockResolvedValue(undefined);
    serviceMocks.getHabit.mockResolvedValue(habit);
    serviceMocks.getHabits.mockResolvedValue([habit]);
    serviceMocks.getHabitMetrics.mockResolvedValue(metrics);
    serviceMocks.getHabitStreaks.mockResolvedValue(streaks);
    serviceMocks.getHabitCalendarMonth.mockResolvedValue([]);
    serviceMocks.markGraceDayOnce.mockResolvedValue(undefined);
    serviceMocks.toggleToday.mockResolvedValue(undefined);
  });

  it("refreshes stale today before toggling so yesterday is treated as a grace write", async () => {
    currentToday.value = "2026-03-10";
    const useHabitsStore = await loadStore();

    useHabitsStore.setState({
      today: "2026-03-09",
      viewedYear: 2026,
      viewedMonth: 3,
    });

    await useHabitsStore.getState().toggleDate("habit_1", "2026-03-09");

    expect(serviceMocks.toggleToday).not.toHaveBeenCalled();
    expect(serviceMocks.markGraceDayOnce).toHaveBeenCalledWith("habit_1", "2026-03-09", "2026-03-10");
    expect(useHabitsStore.getState().today).toBe("2026-03-10");
  });

  it("reloads list and open calendar when syncToday detects a rollover", async () => {
    currentToday.value = "2026-03-10";
    const useHabitsStore = await loadStore();

    useHabitsStore.setState({
      today: "2026-03-09",
      currentHabitId: "habit_1",
      viewedYear: 2026,
      viewedMonth: 3,
    });

    await useHabitsStore.getState().syncToday();

    expect(useHabitsStore.getState().today).toBe("2026-03-10");
    expect(serviceMocks.getHabits).toHaveBeenCalledTimes(1);
    expect(serviceMocks.getHabitCalendarMonth).toHaveBeenCalledWith({
      habitId: "habit_1",
      year: 2026,
      month: 3,
      today: "2026-03-10",
    });
    expect(serviceMocks.getHabitStreaks).toHaveBeenCalledWith("habit_1", "2026-03-10");
  });

  it("stores the active habit details when loading a calendar", async () => {
    const useHabitsStore = await loadStore();

    await useHabitsStore.getState().loadHabitCalendar("habit_1", 2026, 3);

    expect(serviceMocks.getHabit).toHaveBeenCalledWith("habit_1");
    expect(useHabitsStore.getState().currentHabit).toEqual(habit);
    expect(useHabitsStore.getState().metrics).toEqual(metrics);
  });
});
