import { buildMonthGrid, type MonthGridDay } from "@/lib/calendar/month-grid";
import { db } from "@/lib/db/dexie";
import { deleteHabitMonths, getHabitMonth, listHabitMonths, markHabitDay, unmarkHabitDay } from "@/lib/db/habit-months-repo";
import { createHabitRecord, deleteHabitRecord, getHabitById, listHabits } from "@/lib/db/habits-repo";
import { deleteHabitStats, upsertHabitStats } from "@/lib/db/stats-repo";
import { getLocalToday, getYmd } from "@/lib/date/local-date";
import { deriveDayState } from "@/lib/grace/day-state";
import { getHabitInsights as deriveHabitInsights } from "@/lib/insights/insights-engine";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateTotalCompletions,
  calculateTotalCompletionsInRange,
  getCompletionRate,
  getDaysSinceStart,
} from "@/lib/streak/streak-engine";
import type { Habit, HabitInsights, HabitMetrics, HabitMonth } from "@/types/habit";

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

async function getGraceHistoryOnDate(
  habitId: string,
  date: string,
): Promise<{ wasGraceMarked: boolean; wasGraceCorrectionUsed: boolean }> {
  const { year, month, day } = getYmd(date);
  const monthRecord = await getHabitMonth(habitId, year, month);
  if (!monthRecord) {
    return { wasGraceMarked: false, wasGraceCorrectionUsed: false };
  }

  return {
    wasGraceMarked: monthRecord.graceMarkedBits[day - 1] === "1",
    wasGraceCorrectionUsed: monthRecord.graceCorrectionBits[day - 1] === "1",
  };
}

async function refreshStats(habitId: string, today = getLocalToday()): Promise<void> {
  const months = await listHabitMonths(habitId);
  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new HabitRuleError("Habit not found");
  }

  const currentStreak = await calculateCurrentStreak(today, async (year, month) =>
    getHabitMonth(habitId, year, month),
  );
  const longestStreak = calculateLongestStreak(months);
  const totalCompletions = calculateTotalCompletionsInRange(months, habit.startDate, today);

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
  try {
    getDaysSinceStart(input.startDate, today);
  } catch {
    throw new HabitRuleError("Start date must be today or earlier");
  }

  const habit: Habit = {
    id: createHabitId(),
    name: input.name.trim(),
    color: input.color,
    startDate: input.startDate,
    createdAt: today,
  };

  await createHabitRecord(habit);
  await refreshStats(habit.id, today);
  return habit;
}

export async function deleteHabit(habitId: string): Promise<void> {
  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new HabitRuleError("Habit not found");
  }

  await db.transaction("rw", db.habits, db.habitMonths, db.habitStats, async () => {
    await deleteHabitMonths(habitId);
    await deleteHabitStats(habitId);
    await deleteHabitRecord(habitId);
  });
}

export async function getHabits(): Promise<Habit[]> {
  return listHabits();
}

export async function getHabit(habitId: string): Promise<Habit | undefined> {
  return getHabitById(habitId);
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

  await refreshStats(habitId, today);
}

export async function toggleGraceDayOnce(
  habitId: string,
  targetDate: string,
  today = getLocalToday(),
): Promise<void> {
  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new HabitRuleError("Habit not found");
  }

  const completed = await isCompletedOnDate(habitId, targetDate);
  const graceHistory = await getGraceHistoryOnDate(habitId, targetDate);
  const dayState = deriveDayState({
    targetDate,
    today,
    isCompleted: completed,
    ...graceHistory,
    startDate: habit.startDate,
  });

  const { year, month, day } = getYmd(targetDate);

  if (dayState === "grace_open") {
    await markHabitDay(habitId, year, month, day, { markGrace: true });
    await refreshStats(habitId, today);
    return;
  }

  if (dayState === "grace_done_editable") {
    await unmarkHabitDay(habitId, year, month, day, { markGraceCorrection: true });
    await refreshStats(habitId, today);
    return;
  }

  throw new HabitRuleError("Only editable grace-window days can be changed");
}

export async function markGraceDayOnce(
  habitId: string,
  targetDate: string,
  today = getLocalToday(),
): Promise<void> {
  await toggleGraceDayOnce(habitId, targetDate, today);
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
  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new HabitRuleError("Habit not found");
  }

  const months = await listHabitMonths(habitId);
  const monthMap = toMonthMap(months);

  return buildMonthGrid({
    year,
    month,
    today,
    startDate: habit.startDate,
    isCompletedForDate: (date) => {
      const { year: y, month: m, day } = getYmd(date);
      const record = monthMap.get(`${y}-${m}`);
      if (!record) {
        return false;
      }
      return record.bits[day - 1] === "1";
    },
    wasGraceMarkedForDate: (date) => {
      const { year: y, month: m, day } = getYmd(date);
      const record = monthMap.get(`${y}-${m}`);
      if (!record) {
        return false;
      }
      return record.graceMarkedBits[day - 1] === "1";
    },
    wasGraceCorrectionUsedForDate: (date) => {
      const { year: y, month: m, day } = getYmd(date);
      const record = monthMap.get(`${y}-${m}`);
      if (!record) {
        return false;
      }
      return record.graceCorrectionBits[day - 1] === "1";
    },
  });
}

export async function getHabitStreaks(
  habitId: string,
  today = getLocalToday(),
): Promise<{
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}> {
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

export async function getTotalCompletions(habitId: string, today = getLocalToday()): Promise<number> {
  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new HabitRuleError("Habit not found");
  }

  const months = await listHabitMonths(habitId);
  return calculateTotalCompletionsInRange(months, habit.startDate, today);
}

export async function getHabitMetrics(habitId: string, today = getLocalToday()): Promise<HabitMetrics> {
  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new HabitRuleError("Habit not found");
  }

  const daysSinceStart = getDaysSinceStart(habit.startDate, today);
  const [streaks, totalCompletions] = await Promise.all([
    getHabitStreaks(habitId, today),
    getTotalCompletions(habitId, today),
  ]);

  return {
    startDate: habit.startDate,
    daysSinceStart,
    totalCompletions,
    completionRate: getCompletionRate(totalCompletions, daysSinceStart),
    currentStreak: streaks.currentStreak,
    longestStreak: streaks.longestStreak,
  };
}

export async function getHabitInsights(habitId: string, today = getLocalToday()): Promise<HabitInsights> {
  const habit = await getHabitById(habitId);
  if (!habit) {
    throw new HabitRuleError("Habit not found");
  }

  const months = await listHabitMonths(habitId);
  return deriveHabitInsights(months, habit.startDate, today);
}
