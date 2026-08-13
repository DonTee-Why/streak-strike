import { diffCalendarDays, isValidLocalDate } from "@/lib/date/local-date";
import type { Habit, HabitStatus } from "@/types/habit";

export function normalizeHabitEndDate(endDate?: string | null): string | null {
  return endDate || null;
}

export function getHabitStatus(habit: Pick<Habit, "endDate">, today: string): HabitStatus {
  const endDate = normalizeHabitEndDate(habit.endDate);
  return endDate && today > endDate ? "ended" : "active";
}

export function getEffectiveHabitEndDate(habit: Pick<Habit, "endDate">, today: string): string {
  const endDate = normalizeHabitEndDate(habit.endDate);
  return endDate && endDate < today ? endDate : today;
}

export function isDateWithinHabitRange(
  habit: Pick<Habit, "startDate" | "endDate">,
  date: string,
): boolean {
  const endDate = normalizeHabitEndDate(habit.endDate);
  return date >= habit.startDate && (!endDate || date <= endDate);
}

export function getHabitTrackingDays(
  habit: Pick<Habit, "startDate" | "endDate">,
  today: string,
): number {
  const effectiveEndDate = getEffectiveHabitEndDate(habit, today);
  const diff = diffCalendarDays(habit.startDate, effectiveEndDate);
  if (diff < 0) {
    throw new Error("Start date cannot be in the future");
  }

  return diff + 1;
}

export function validateHabitBoundaryDates(input: {
  startDate: string;
  endDate?: string | null;
  today: string;
}): string | null {
  if (!isValidLocalDate(input.startDate)) {
    return "Start date must be a valid local date";
  }

  if (input.startDate > input.today) {
    return "Start date must be today or earlier";
  }

  const endDate = normalizeHabitEndDate(input.endDate);
  if (!endDate) {
    return null;
  }

  if (!isValidLocalDate(endDate)) {
    return "End date must be a valid local date";
  }

  if (endDate < input.startDate) {
    return "End date must be on or after the start date";
  }

  return null;
}

export function validateHabitEndDateUpdate(input: {
  habit: Habit;
  nextEndDate?: string | null;
  today: string;
}): string | null {
  const nextEndDate = normalizeHabitEndDate(input.nextEndDate);
  const boundaryError = validateHabitBoundaryDates({
    startDate: input.habit.startDate,
    endDate: nextEndDate,
    today: input.today,
  });
  if (boundaryError) {
    return boundaryError;
  }

  if (!nextEndDate) {
    return null;
  }

  const currentEndDate = normalizeHabitEndDate(input.habit.endDate);
  const status = getHabitStatus(input.habit, input.today);

  if (status === "active") {
    return nextEndDate < input.today ? "Active habits cannot end before today" : null;
  }

  if (currentEndDate && nextEndDate < currentEndDate) {
    return "Ended habits cannot move the end date backwards";
  }

  return null;
}
