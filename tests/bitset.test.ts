import { describe, expect, it } from "vitest";
import {
  countCompleted,
  createEmptyMonthBits,
  isDayCompleted,
  markDay,
  unmarkDay,
  validateDayOfMonth,
} from "@/lib/bitset/month-bitset";

describe("month bitset", () => {
  it("sets and gets day completion", () => {
    const empty = createEmptyMonthBits();
    const marked = markDay(empty, 1, 2026, 3);
    expect(isDayCompleted(marked, 1, 2026, 3)).toBe(true);
    expect(isDayCompleted(marked, 2, 2026, 3)).toBe(false);
  });

  it("unsets day completion", () => {
    const empty = createEmptyMonthBits();
    const marked = markDay(empty, 15, 2026, 3);
    const unmarked = unmarkDay(marked, 15, 2026, 3);
    expect(isDayCompleted(unmarked, 15, 2026, 3)).toBe(false);
  });

  it("counts only valid month days", () => {
    let bits = createEmptyMonthBits();
    bits = markDay(bits, 1, 2026, 2);
    bits = markDay(bits, 28, 2026, 2);
    expect(countCompleted(bits, 2026, 2)).toBe(2);
  });

  it("rejects invalid day for month", () => {
    expect(() => validateDayOfMonth(31, 2026, 2)).toThrow();
  });
});
