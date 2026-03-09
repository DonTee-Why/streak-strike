import { buildMonthGrid, type MonthGridDay } from "@/lib/calendar/month-grid";
import { getHabitMonth, listHabitMonths, markHabitDay, unmarkHabitDay } from "@/lib/db/habit-months-repo";
import { createHabitRecord, getHabitById, listHabits } from "@/lib/db/habits-repo";
import { upsertHabitStats } from "@/lib/db/stats-repo";
import { getLocalToday, getYmd } from "@/lib/date/local-date";
import { deriveDayState } from "@/lib/grace/day-state";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateTotalCompletions,
} from "@/lib/streak/streak-engine";
import type { Habit, HabitMonth } from "@/types/habit";

export class HabitRuleError extends Error {}

function createHabitId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `habit_${crypto.randomUUID()}`;
  }

  return `habit_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function isCompletedOnDate(habitId: string, date: string): Promise<boolean> {
  const { year, month, day } = getYmd(date);
  const monthRecord = await getHabitMonth(habitId, year, month);
  if (!monthRecord) {
    return false;
  }
  return monthRecord.bits[day - 1] === "1";
}

async function refreshStats(habitId: string): Promise<void> {
  const months = await listHabitMonths(habitId);
  const today = getLocalToday();
  const currentStreak = await calculateCurrentStreak(today, async (year, month) =>
    getHabitMonth(habitId, year, month),
  );
  const longestStreak = calculateLongestStreak(months);
  const totalCompletions = calculateTotalCompletions(months);

  await upsertHabitStats({
    habitId,
    currentStreak,
    longestStreak,
    totalCompletions,
    updatedAt: today,
  });
}

export async function createHabit(input: { name: string; color: string; startDate: string }): Promise<Habit> {
  const today = getLocalToday();
  const habit: Habit = {
    id: createHabitId(),
    name: input.name.trim(),
    color: input.color,
    startDate: input.startDate,
    createdAt: today,
  };

  await createHabitRecord(habit);
  await refreshStats(habit.id);
  return habit;
}

export async function getHabits(): Promise<Habit[]> {
  return listHabits();
}

export async function toggleToday(habitId: string, today = getLocalToday()): Promise<void> {
  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new HabitRuleError("Habit not found");
  }

  const { year, month, day } = getYmd(today);
  const completed = await isCompletedOnDate(habitId, today);

  if (completed) {
    await unmarkHabitDay(habitId, year, month, day);
  } else {
    await markHabitDay(habitId, year, month, day);
  }

  await refreshStats(habitId);
}

export async function markGraceDayOnce(
  habitId: string,
  targetDate: string,
  today = getLocalToday(),
): Promise<void> {
  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new HabitRuleError("Habit not found");
  }

  const completed = await isCompletedOnDate(habitId, targetDate);
  const dayState = deriveDayState({ targetDate, today, isCompleted: completed });

  if (dayState !== "grace_open") {
    throw new HabitRuleError("Only unmarked grace-window days are markable");
  }

  const { year, month, day } = getYmd(targetDate);
  await markHabitDay(habitId, year, month, day);
  await refreshStats(habitId);
}

function toMonthMap(months: HabitMonth[]): Map<string, HabitMonth> {
  const map = new Map<string, HabitMonth>();
  for (const record of months) {
    map.set(`${record.year}-${record.month}`, record);
  }
  return map;
}

export async function getHabitCalendarMonth(input: {
  habitId: string;
  year: number;
  month: number;
  today?: string;
}): Promise<MonthGridDay[]> {
  const { habitId, year, month } = input;
  const today = input.today ?? getLocalToday();
  const months = await listHabitMonths(habitId);
  const monthMap = toMonthMap(months);

  return buildMonthGrid({
    year,
    month,
    today,
    isCompletedForDate: (date) => {
      const { year: y, month: m, day } = getYmd(date);
      const record = monthMap.get(`${y}-${m}`);
      if (!record) {
        return false;
      }
      return record.bits[day - 1] === "1";
    },
  });
}

export async function getHabitStreaks(habitId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}> {
  const today = getLocalToday();
  const months = await listHabitMonths(habitId);

  const currentStreak = await calculateCurrentStreak(today, async (year, month) =>
    getHabitMonth(habitId, year, month),
  );

  return {
    currentStreak,
    longestStreak: calculateLongestStreak(months),
    totalCompletions: calculateTotalCompletions(months),
  };
}
