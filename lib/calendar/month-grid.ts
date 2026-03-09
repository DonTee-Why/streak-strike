import { addDays, daysInMonth, formatLocalDate, getYmd } from "@/lib/date/local-date";
import { deriveDayState, isMarkableDayState } from "@/lib/grace/day-state";
import type { DayState } from "@/types/day-state";

export interface MonthGridDay {
  date: string;
  day: number;
  inMonth: boolean;
  state: DayState;
  completed: boolean;
  markable: boolean;
}

function firstDayOffset(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export function buildMonthGrid(input: {
  year: number;
  month: number;
  today: string;
  isCompletedForDate: (date: string) => boolean;
}): MonthGridDay[] {
  const { year, month, today, isCompletedForDate } = input;
  const total = daysInMonth(year, month);
  const offset = firstDayOffset(year, month);
  const firstOfMonth = formatLocalDate(new Date(year, month - 1, 1, 12));

  const cells: MonthGridDay[] = [];

  for (let i = 0; i < offset; i += 1) {
    const date = addDays(firstOfMonth, -offset + i);
    const completed = isCompletedForDate(date);
    const state = deriveDayState({ targetDate: date, today, isCompleted: completed });
    cells.push({ date, day: getYmd(date).day, inMonth: false, state, completed, markable: isMarkableDayState(state) });
  }

  for (let day = 1; day <= total; day += 1) {
    const date = formatLocalDate(new Date(year, month - 1, day, 12));
    const completed = isCompletedForDate(date);
    const state = deriveDayState({ targetDate: date, today, isCompleted: completed });
    cells.push({ date, day, inMonth: true, state, completed, markable: isMarkableDayState(state) });
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  const lastInGrid = cells[cells.length - 1]?.date ?? firstOfMonth;

  for (let i = 1; i <= trailing; i += 1) {
    const date = addDays(lastInGrid, i);
    const completed = isCompletedForDate(date);
    const state = deriveDayState({ targetDate: date, today, isCompleted: completed });
    cells.push({ date, day: getYmd(date).day, inMonth: false, state, completed, markable: isMarkableDayState(state) });
  }

  return cells;
}
