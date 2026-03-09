import { diffCalendarDays } from "@/lib/date/local-date";
import type { DayState } from "@/types/day-state";

interface DeriveDayStateInput {
  targetDate: string;
  today: string;
  isCompleted: boolean;
}

export function deriveDayState({ targetDate, today, isCompleted }: DeriveDayStateInput): DayState {
  const delta = diffCalendarDays(targetDate, today);

  if (delta < 0) {
    return "future";
  }

  if (delta === 0) {
    return isCompleted ? "today_done" : "today_open";
  }

  if (delta >= 1 && delta <= 3) {
    return isCompleted ? "grace_done_locked" : "grace_open";
  }

  return isCompleted ? "expired_done" : "expired_missed";
}

export function isMarkableDayState(dayState: DayState): boolean {
  return dayState === "today_open" || dayState === "today_done" || dayState === "grace_open";
}
