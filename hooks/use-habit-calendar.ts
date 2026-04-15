"use client";

import { useShallow } from "zustand/react/shallow";
import { useHabitsStore } from "@/store/habits-store";

export function useHabitCalendar() {
  return useHabitsStore(
    useShallow((state) => ({
      today: state.today,
      currentHabit: state.currentHabit,
      currentHabitId: state.currentHabitId,
      calendarDays: state.calendarDays,
      viewedYear: state.viewedYear,
      viewedMonth: state.viewedMonth,
      metrics: state.metrics,
      isLoading: state.isLoading,
      error: state.error,
      loadHabitCalendar: state.loadHabitCalendar,
      moveMonth: state.moveMonth,
      toggleDate: state.toggleDate,
      deleteHabit: state.deleteHabit,
    })),
  );
}
