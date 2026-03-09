import { daysInMonth } from "@/lib/date/local-date";

export const MONTH_BIT_LENGTH = 31;

export function createEmptyMonthBits(): string {
  return "0".repeat(MONTH_BIT_LENGTH);
}

export function validateDayOfMonth(day: number, year: number, month: number): void {
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`Invalid day ${day} for ${year}-${month}`);
  }
}

function withBit(bits: string, index: number, value: "0" | "1"): string {
  if (bits.length !== MONTH_BIT_LENGTH) {
    throw new Error("Invalid bitset length");
  }
  return `${bits.slice(0, index)}${value}${bits.slice(index + 1)}`;
}

export function isDayCompleted(bits: string, day: number, year: number, month: number): boolean {
  validateDayOfMonth(day, year, month);
  const idx = day - 1;
  return bits[idx] === "1";
}

export function markDay(bits: string, day: number, year: number, month: number): string {
  validateDayOfMonth(day, year, month);
  return withBit(bits, day - 1, "1");
}

export function unmarkDay(bits: string, day: number, year: number, month: number): string {
  validateDayOfMonth(day, year, month);
  return withBit(bits, day - 1, "0");
}

export function countCompleted(bits: string, year: number, month: number): number {
  const days = daysInMonth(year, month);
  let count = 0;
  for (let i = 0; i < days; i += 1) {
    if (bits[i] === "1") {
      count += 1;
    }
  }
  return count;
}
