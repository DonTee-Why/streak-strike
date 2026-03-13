"use client";

import { useShallow } from "zustand/react/shallow";
import { useHabitsStore } from "@/store/habits-store";

export function useHabits() {
  return useHabitsStore(
    useShallow((state) => ({
      today: state.today,
      habits: state.habits,
      isLoading: state.isLoading,
      error: state.error,
      loadHabits: state.loadHabits,
      addHabit: state.addHabit,
    })),
  );
}
