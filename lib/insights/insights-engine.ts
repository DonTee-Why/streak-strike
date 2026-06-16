import { addDays, daysInMonth, diffCalendarDays, getYmd, parseLocalDate } from "@/lib/date/local-date";
import type { HabitInsights, HabitMonth, PeriodRecord, PeriodStats, TrendDirection, WeekdayStats } from "@/types/habit";

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function completionRate(completedDays: number, eligibleDays: number): number {
  return eligibleDays === 0 ? 0 : completedDays / eligibleDays;
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

function toMonthMap(monthRecords: HabitMonth[]): Map<string, HabitMonth> {
  const map = new Map<string, HabitMonth>();
  for (const record of monthRecords) {
    map.set(monthKey(record.year, record.month), record);
  }
  return map;
}

function isCompletedOnDate(monthMap: Map<string, HabitMonth>, date: string): boolean {
  const { year, month, day } = getYmd(date);
  const record = monthMap.get(monthKey(year, month));
  return record?.bits[day - 1] === "1";
}

function maxDate(a: string, b: string): string {
  return a > b ? a : b;
}

function minDate(a: string, b: string): string {
  return a < b ? a : b;
}

function getMondayWeekStart(date: string): string {
  const parsed = parseLocalDate(date);
  const sundayBasedDay = parsed.getDay();
  const mondayBasedOffset = (sundayBasedDay + 6) % 7;
  return addDays(date, -mondayBasedOffset);
}

function getMonthStart(date: string): string {
  const { year, month } = getYmd(date);
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function getMonthEnd(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth(year, month)).padStart(2, "0")}`;
}

function getPreviousMonthStart(date: string): string {
  const { year, month } = getYmd(date);
  const previous = new Date(year, month - 2, 1, 12);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}-01`;
}

function eachDate(startDate: string, endDate: string): string[] {
  if (startDate > endDate) {
    return [];
  }

  const dates: string[] = [];
  let cursor = startDate;
  while (cursor <= endDate) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function getPeriodStats(
  monthRecords: HabitMonth[],
  habitStartDate: string,
  today: string,
  periodStartDate: string,
  periodEndDate: string,
): PeriodStats {
  const startDate = maxDate(periodStartDate, habitStartDate);
  const endDate = minDate(periodEndDate, today);
  const monthMap = toMonthMap(monthRecords);
  const dates = eachDate(startDate, endDate);
  const completedDays = dates.reduce((count, date) => count + (isCompletedOnDate(monthMap, date) ? 1 : 0), 0);

  return {
    startDate,
    endDate,
    completedDays,
    eligibleDays: dates.length,
    completionRate: completionRate(completedDays, dates.length),
  };
}

function formatWeekLabel(startDate: string, endDate: string): string {
  return `${startDate} to ${endDate}`;
}

function formatMonthLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function compareRecords(a: PeriodRecord, b: PeriodRecord): number {
  if (a.completionRate !== b.completionRate) {
    return a.completionRate - b.completionRate;
  }
  if (a.completedDays !== b.completedDays) {
    return a.completedDays - b.completedDays;
  }
  return a.endDate.localeCompare(b.endDate);
}

function compareBestWeekday(a: WeekdayStats, b: WeekdayStats): number {
  if (a.completionRate !== b.completionRate) {
    return a.completionRate - b.completionRate;
  }
  if (a.completionCount !== b.completionCount) {
    return a.completionCount - b.completionCount;
  }
  return b.weekday - a.weekday;
}

function compareWeakestWeekday(a: WeekdayStats, b: WeekdayStats): number {
  if (a.completionRate !== b.completionRate) {
    return b.completionRate - a.completionRate;
  }
  if (a.completionCount !== b.completionCount) {
    return b.completionCount - a.completionCount;
  }
  return b.weekday - a.weekday;
}

export function getCurrentWeekStats(
  monthRecords: HabitMonth[],
  habitStartDate: string,
  today: string,
): PeriodStats {
  return getPeriodStats(monthRecords, habitStartDate, today, getMondayWeekStart(today), today);
}

export function getPreviousWeekStats(
  monthRecords: HabitMonth[],
  habitStartDate: string,
  today: string,
): PeriodStats {
  const currentWeekStart = getMondayWeekStart(today);
  const previousWeekStart = addDays(currentWeekStart, -7);
  const previousWeekEnd = addDays(currentWeekStart, -1);
  return getPeriodStats(monthRecords, habitStartDate, today, previousWeekStart, previousWeekEnd);
}

export function getCurrentMonthStats(
  monthRecords: HabitMonth[],
  habitStartDate: string,
  today: string,
): PeriodStats {
  return getPeriodStats(monthRecords, habitStartDate, today, getMonthStart(today), today);
}

export function getPreviousMonthStats(
  monthRecords: HabitMonth[],
  habitStartDate: string,
  today: string,
): PeriodStats {
  const previousMonthStart = getPreviousMonthStart(today);
  const { year, month } = getYmd(previousMonthStart);
  return getPeriodStats(monthRecords, habitStartDate, today, previousMonthStart, getMonthEnd(year, month));
}

export function getWeekdayStats(
  monthRecords: HabitMonth[],
  habitStartDate: string,
  today: string,
): WeekdayStats[] {
  const monthMap = toMonthMap(monthRecords);
  const stats = WEEKDAY_LABELS.map((label, index) => ({
    weekday: index,
    label,
    completionCount: 0,
    eligibleCount: 0,
    completionRate: 0,
  }));

  for (const date of eachDate(habitStartDate, today)) {
    const sundayBasedDay = parseLocalDate(date).getDay();
    const weekday = (sundayBasedDay + 6) % 7;
    const stat = stats[weekday];
    stat.eligibleCount += 1;
    if (isCompletedOnDate(monthMap, date)) {
      stat.completionCount += 1;
    }
  }

  return stats.map((stat) => ({
    ...stat,
    completionRate: completionRate(stat.completionCount, stat.eligibleCount),
  }));
}

export function getBestWeek(
  monthRecords: HabitMonth[],
  habitStartDate: string,
  today: string,
): PeriodRecord | undefined {
  const firstWeekStart = getMondayWeekStart(habitStartDate);
  const records: PeriodRecord[] = [];
  let cursor = firstWeekStart;

  while (cursor <= today) {
    const weekEnd = addDays(cursor, 6);
    const stats = getPeriodStats(monthRecords, habitStartDate, today, cursor, weekEnd);
    if (stats.eligibleDays > 0) {
      records.push({ ...stats, label: formatWeekLabel(stats.startDate, stats.endDate) });
    }
    cursor = addDays(cursor, 7);
  }

  return records.reduce<PeriodRecord | undefined>((best, record) => {
    if (!best || compareRecords(record, best) > 0) {
      return record;
    }
    return best;
  }, undefined);
}

export function getBestMonth(
  monthRecords: HabitMonth[],
  habitStartDate: string,
  today: string,
): PeriodRecord | undefined {
  const start = getYmd(habitStartDate);
  const end = getYmd(today);
  const records: PeriodRecord[] = [];
  let year = start.year;
  let month = start.month;

  while (year < end.year || (year === end.year && month <= end.month)) {
    const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const periodEnd = getMonthEnd(year, month);
    const stats = getPeriodStats(monthRecords, habitStartDate, today, periodStart, periodEnd);
    if (stats.eligibleDays > 0) {
      records.push({ ...stats, label: formatMonthLabel(year, month) });
    }

    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return records.reduce<PeriodRecord | undefined>((best, record) => {
    if (!best || compareRecords(record, best) > 0) {
      return record;
    }
    return best;
  }, undefined);
}

export function getTrendDirection(currentRate: number, previousRate: number): TrendDirection {
  if (currentRate > previousRate) {
    return "improving";
  }
  if (currentRate < previousRate) {
    return "declining";
  }
  return "stable";
}

export function getHabitInsights(
  monthRecords: HabitMonth[],
  habitStartDate: string,
  today: string,
): HabitInsights {
  if (diffCalendarDays(habitStartDate, today) < 0) {
    throw new Error("Start date cannot be in the future");
  }

  const currentWeek = getCurrentWeekStats(monthRecords, habitStartDate, today);
  const previousWeek = getPreviousWeekStats(monthRecords, habitStartDate, today);
  const currentMonth = getCurrentMonthStats(monthRecords, habitStartDate, today);
  const previousMonth = getPreviousMonthStats(monthRecords, habitStartDate, today);
  const weekdayStats = getWeekdayStats(monthRecords, habitStartDate, today);
  const eligibleWeekdays = weekdayStats.filter((stat) => stat.eligibleCount > 0);

  return {
    currentWeek,
    previousWeek,
    weeklyTrend: getTrendDirection(currentWeek.completionRate, previousWeek.completionRate),
    currentMonth,
    previousMonth,
    monthlyTrend: getTrendDirection(currentMonth.completionRate, previousMonth.completionRate),
    weekdayStats,
    bestDay: eligibleWeekdays.reduce<WeekdayStats | undefined>((best, stat) => {
      if (!best || compareBestWeekday(stat, best) > 0) {
        return stat;
      }
      return best;
    }, undefined),
    weakestDay: eligibleWeekdays.reduce<WeekdayStats | undefined>((weakest, stat) => {
      if (!weakest || compareWeakestWeekday(stat, weakest) > 0) {
        return stat;
      }
      return weakest;
    }, undefined),
    bestWeek: getBestWeek(monthRecords, habitStartDate, today),
    bestMonth: getBestMonth(monthRecords, habitStartDate, today),
  };
}
