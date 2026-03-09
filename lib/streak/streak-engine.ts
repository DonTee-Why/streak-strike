import { addDays, daysInMonth, getYmd } from "@/lib/date/local-date";
import type { HabitMonth } from "@/types/habit";

export type MonthLoader = (year: number, month: number) => Promise<HabitMonth | undefined>;

function isDateCompletedInMonth(record: HabitMonth | undefined, day: number): boolean {
  if (!record) {
    return false;
  }
  return record.bits[day - 1] === "1";
}

export async function calculateCurrentStreak(
  today: string,
  monthLoader: MonthLoader,
): Promise<number> {
  const todayYmd = getYmd(today);
  const todayRecord = await monthLoader(todayYmd.year, todayYmd.month);

  if (!isDateCompletedInMonth(todayRecord, todayYmd.day)) {
    return 0;
  }

  let streak = 0;
  let cursor = today;

  while (true) {
    const { year, month, day } = getYmd(cursor);
    const record = await monthLoader(year, month);
    if (!isDateCompletedInMonth(record, day)) {
      break;
    }
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function monthKey(year: number, month: number): number {
  return year * 100 + month;
}

export function calculateTotalCompletions(monthRecords: HabitMonth[]): number {
  return monthRecords.reduce((sum, record) => sum + record.completedCount, 0);
}

export function calculateLongestStreak(monthRecords: HabitMonth[]): number {
  if (monthRecords.length === 0) {
    return 0;
  }

  const sorted = [...monthRecords].sort((a, b) => monthKey(a.year, a.month) - monthKey(b.year, b.month));

  let current = 0;
  let longest = 0;

  for (const record of sorted) {
    const monthDays = daysInMonth(record.year, record.month);
    for (let day = 1; day <= monthDays; day += 1) {
      if (record.bits[day - 1] === "1") {
        current += 1;
        if (current > longest) {
          longest = current;
        }
      } else {
        current = 0;
      }
    }
  }

  return longest;
}
