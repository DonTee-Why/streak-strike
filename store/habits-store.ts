"use client";

import { create } from "zustand";
import {
  createHabit,
  deleteHabit as deleteHabitRecord,
  getHabit,
  getHabitCalendarMonth,
  getHabits,
  getHabitMetrics,
  getHabitStreaks,
  HabitRuleError,
  markGraceDayOnce,
  toggleToday,
} from "@/lib/db/habit-service";
import { getLocalToday, getYmd } from "@/lib/date/local-date";
import type { MonthGridDay } from "@/lib/calendar/month-grid";
import type { Habit, HabitMetrics } from "@/types/habit";

interface HabitListItem {
  habit: Habit;
  currentStreak: number;
}

interface HabitsStoreState {
  today: string;
  habits: HabitListItem[];
  currentHabit?: Habit;
  currentHabitId?: string;
  calendarDays: MonthGridDay[];
  viewedYear: number;
  viewedMonth: number;
  metrics?: HabitMetrics;
  isLoading: boolean;
  error?: string;
  syncToday: () => Promise<string>;
  ensureFreshToday: () => Promise<string>;
  refreshForTodayChange: (nextToday: string) => Promise<void>;
  loadHabits: () => Promise<void>;
  addHabit: (input: { name: string; color: string; startDate: string }) => Promise<string>;
  loadHabitCalendar: (habitId: string, year?: number, month?: number) => Promise<void>;
  moveMonth: (habitId: string, delta: number) => Promise<void>;
  toggleDate: (habitId: string, targetDate: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
}

export const useHabitsStore = create<HabitsStoreState>((set, get) => {
  const initialToday = getLocalToday();
  const initialTodayYmd = getYmd(initialToday);
  let syncPromise: Promise<string> | null = null;

  const loadHabitsForToday = async (today: string) => {
    set({ isLoading: true, error: undefined });
    try {
      const habits = await getHabits();
      const withStreaks = await Promise.all(
        habits.map(async (habit) => ({
          habit,
          currentStreak: (await getHabitStreaks(habit.id, today)).currentStreak,
        })),
      );
      set({ habits: withStreaks, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load habits", isLoading: false });
    }
  };

  const loadHabitCalendarForToday = async (habitId: string, year: number | undefined, month: number | undefined, today: string) => {
    const fallback = getYmd(today);
    const targetYear = year ?? get().viewedYear ?? fallback.year;
    const targetMonth = month ?? get().viewedMonth ?? fallback.month;

    set({ isLoading: true, error: undefined, currentHabitId: habitId, viewedYear: targetYear, viewedMonth: targetMonth });
    try {
      const [habit, calendarDays, metrics] = await Promise.all([
        getHabit(habitId),
        getHabitCalendarMonth({ habitId, year: targetYear, month: targetMonth, today }),
        getHabitMetrics(habitId, today),
      ]);
      set({
        currentHabit: habit,
        calendarDays,
        metrics,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load calendar", isLoading: false });
    }
  };

  const refreshForTodayChange = async (nextToday: string) => {
    const { currentHabitId, viewedYear, viewedMonth } = get();
    await loadHabitsForToday(nextToday);
    if (currentHabitId) {
      await loadHabitCalendarForToday(currentHabitId, viewedYear, viewedMonth, nextToday);
    }
  };

  return {
    today: initialToday,
    habits: [],
    currentHabit: undefined,
    calendarDays: [],
    viewedYear: initialTodayYmd.year,
    viewedMonth: initialTodayYmd.month,
    metrics: undefined,
    isLoading: false,
    async syncToday() {
      if (syncPromise) {
        return syncPromise;
      }

      syncPromise = (async () => {
        const actualToday = getLocalToday();
        if (get().today === actualToday) {
          return actualToday;
        }

        set({ today: actualToday });
        await refreshForTodayChange(actualToday);
        return actualToday;
      })();

      try {
        return await syncPromise;
      } finally {
        syncPromise = null;
      }
    },
    async ensureFreshToday() {
      return get().syncToday();
    },
    async refreshForTodayChange(nextToday) {
      await refreshForTodayChange(nextToday);
    },
    async loadHabits() {
      const today = await get().ensureFreshToday();
      await loadHabitsForToday(today);
    },
    async addHabit(input) {
      set({ isLoading: true, error: undefined });
      try {
        const habit = await createHabit(input);
        await get().loadHabits();
        set({ isLoading: false });
        return habit.id;
      } catch (error) {
        set({ error: error instanceof Error ? error.message : "Failed to create habit", isLoading: false });
        throw error;
      }
    },
    async loadHabitCalendar(habitId, year, month) {
      const today = await get().ensureFreshToday();
      await loadHabitCalendarForToday(habitId, year, month, today);
    },
    async moveMonth(habitId, delta) {
      const { viewedYear, viewedMonth } = get();
      const nextDate = new Date(viewedYear, viewedMonth - 1 + delta, 1, 12);
      await get().loadHabitCalendar(habitId, nextDate.getFullYear(), nextDate.getMonth() + 1);
    },
    async toggleDate(habitId, targetDate) {
      const today = await get().ensureFreshToday();
      set({ isLoading: true, error: undefined });
      try {
        if (targetDate === today) {
          await toggleToday(habitId, today);
        } else {
          await markGraceDayOnce(habitId, targetDate, today);
        }

        await Promise.all([
          loadHabitCalendarForToday(habitId, get().viewedYear, get().viewedMonth, today),
          loadHabitsForToday(today),
        ]);
        set({ isLoading: false });
      } catch (error) {
        if (error instanceof HabitRuleError) {
          set({ error: error.message, isLoading: false });
          return;
        }
        set({ error: error instanceof Error ? error.message : "Failed to update day", isLoading: false });
      }
    },
    async deleteHabit(habitId) {
      set({ isLoading: true, error: undefined });
      try {
        await deleteHabitRecord(habitId);
        const today = await get().ensureFreshToday();
        await loadHabitsForToday(today);
        set({
          currentHabit: undefined,
          currentHabitId: undefined,
          calendarDays: [],
          metrics: undefined,
          isLoading: false,
        });
      } catch (error) {
        if (error instanceof HabitRuleError) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
        set({ error: error instanceof Error ? error.message : "Failed to delete habit", isLoading: false });
        throw error;
      }
    },
  };
});
