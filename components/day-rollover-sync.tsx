"use client";

import { useEffect } from "react";
import { registerDayRolloverSync } from "@/lib/app/day-rollover-sync";
import { useHabitsStore } from "@/store/habits-store";

export function DayRolloverSync() {
  useEffect(() => {
    return registerDayRolloverSync({
      syncToday: () => useHabitsStore.getState().syncToday(),
      windowTarget: window,
      documentTarget: document,
      timerApi: window,
    });
  }, []);

  return null;
}
