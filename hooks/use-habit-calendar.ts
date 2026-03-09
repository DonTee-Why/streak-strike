"use client";

import { useShallow } from "zustand/react/shallow";
import { useHabitsStore } from "@/store/habits-store";

export function useHabitCalendar() {
  return useHabitsStore(
    useShallow((state) => ({
      currentHabitId: state.currentHabitId,
      calendarDays: state.calendarDays,
      viewedYear: state.viewedYear,
      viewedMonth: state.viewedMonth,
      currentStreak: state.currentStreak,
      longestStreak: state.longestStreak,
      totalCompletions: state.totalCompletions,
      isLoading: state.isLoading,
      error: state.error,
      loadHabitCalendar: state.loadHabitCalendar,
      moveMonth: state.moveMonth,
      toggleDate: state.toggleDate,
    })),
  );
}
