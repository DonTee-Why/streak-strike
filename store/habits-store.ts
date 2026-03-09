"use client";

import { create } from "zustand";
import {
  createHabit,
  getHabitCalendarMonth,
  getHabits,
  getHabitStreaks,
  HabitRuleError,
  markGraceDayOnce,
  toggleToday,
} from "@/lib/db/habit-service";
import { getLocalToday, getYmd } from "@/lib/date/local-date";
import type { MonthGridDay } from "@/lib/calendar/month-grid";
import type { Habit } from "@/types/habit";

interface HabitListItem {
  habit: Habit;
  currentStreak: number;
}

interface HabitsStoreState {
  habits: HabitListItem[];
  currentHabitId?: string;
  calendarDays: MonthGridDay[];
  viewedYear: number;
  viewedMonth: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  isLoading: boolean;
  error?: string;
  loadHabits: () => Promise<void>;
  addHabit: (input: { name: string; color: string; startDate: string }) => Promise<string>;
  loadHabitCalendar: (habitId: string, year?: number, month?: number) => Promise<void>;
  moveMonth: (habitId: string, delta: number) => Promise<void>;
  toggleDate: (habitId: string, targetDate: string) => Promise<void>;
}

const todayYmd = getYmd(getLocalToday());

export const useHabitsStore = create<HabitsStoreState>((set, get) => ({
  habits: [],
  calendarDays: [],
  viewedYear: todayYmd.year,
  viewedMonth: todayYmd.month,
  currentStreak: 0,
  longestStreak: 0,
  totalCompletions: 0,
  isLoading: false,
  async loadHabits() {
    set({ isLoading: true, error: undefined });
    try {
      const habits = await getHabits();
      const withStreaks = await Promise.all(
        habits.map(async (habit) => ({
          habit,
          currentStreak: (await getHabitStreaks(habit.id)).currentStreak,
        })),
      );
      set({ habits: withStreaks, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load habits", isLoading: false });
    }
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
    const fallback = getYmd(getLocalToday());
    const targetYear = year ?? get().viewedYear ?? fallback.year;
    const targetMonth = month ?? get().viewedMonth ?? fallback.month;

    set({ isLoading: true, error: undefined, currentHabitId: habitId, viewedYear: targetYear, viewedMonth: targetMonth });
    try {
      const [calendarDays, streaks] = await Promise.all([
        getHabitCalendarMonth({ habitId, year: targetYear, month: targetMonth }),
        getHabitStreaks(habitId),
      ]);
      set({
        calendarDays,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        totalCompletions: streaks.totalCompletions,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load calendar", isLoading: false });
    }
  },
  async moveMonth(habitId, delta) {
    const { viewedYear, viewedMonth } = get();
    const nextDate = new Date(viewedYear, viewedMonth - 1 + delta, 1, 12);
    await get().loadHabitCalendar(habitId, nextDate.getFullYear(), nextDate.getMonth() + 1);
  },
  async toggleDate(habitId, targetDate) {
    const today = getLocalToday();
    set({ isLoading: true, error: undefined });
    try {
      if (targetDate === today) {
        await toggleToday(habitId, today);
      } else {
        await markGraceDayOnce(habitId, targetDate, today);
      }

      await Promise.all([
        get().loadHabitCalendar(habitId, get().viewedYear, get().viewedMonth),
        get().loadHabits(),
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
}));
