const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toLocalDateObject(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentLocalDate(now: Date = new Date()): string {
  return formatLocalDate(now);
}

export function getLocalToday(): string {
  return getCurrentLocalDate();
}

export function getNextLocalMidnight(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
}

export function getMsUntilNextLocalMidnight(now: Date = new Date()): number {
  return Math.max(0, getNextLocalMidnight(now).getTime() - now.getTime());
}

export function parseLocalDate(dateStr: string): Date {
  const match = LOCAL_DATE_RE.exec(dateStr);
  if (!match) {
    throw new Error(`Invalid local date format: ${dateStr}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = toLocalDateObject(year, month, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day
  ) {
    throw new Error(`Invalid local date value: ${dateStr}`);
  }

  return parsed;
}

export function isValidLocalDate(dateStr: string): boolean {
  try {
    parseLocalDate(dateStr);
    return true;
  } catch {
    return false;
  }
}

export function addDays(dateStr: string, amount: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + amount);
  return formatLocalDate(date);
}

export function diffCalendarDays(fromDate: string, toDate: string): number {
  const from = parseLocalDate(fromDate);
  const to = parseLocalDate(toDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

export function getYmd(dateStr: string): { year: number; month: number; day: number } {
  const date = parseLocalDate(dateStr);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
