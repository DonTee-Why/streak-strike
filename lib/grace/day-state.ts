import { diffCalendarDays } from "@/lib/date/local-date";
import type { DayState } from "@/types/day-state";

interface DeriveDayStateInput {
  targetDate: string;
  today: string;
  isCompleted: boolean;
  wasGraceMarked?: boolean;
  wasGraceCorrectionUsed?: boolean;
  startDate?: string;
  endDate?: string | null;
}

export function deriveDayState({
  targetDate,
  today,
  isCompleted,
  wasGraceMarked = false,
  wasGraceCorrectionUsed = false,
  startDate,
  endDate,
}: DeriveDayStateInput): DayState {
  if (startDate && targetDate < startDate) {
    return "pre_start";
  }

  if (endDate && targetDate > endDate) {
    return "post_end";
  }

  const delta = diffCalendarDays(targetDate, today);

  if (delta < 0) {
    return "future";
  }

  if (delta === 0) {
    return isCompleted ? "today_done" : "today_open";
  }

  if (delta >= 1 && delta <= 3) {
    if (!isCompleted) {
      return "grace_open";
    }

    return wasGraceMarked && !wasGraceCorrectionUsed ? "grace_done_editable" : "grace_done_locked";
  }

  return isCompleted ? "expired_done" : "expired_missed";
}

export function isMarkableDayState(dayState: DayState): boolean {
  return (
    dayState === "today_open" ||
    dayState === "today_done" ||
    dayState === "grace_open" ||
    dayState === "grace_done_editable"
  );
}
