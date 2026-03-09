import { describe, expect, it } from "vitest";
import { createEmptyMonthBits, markDay } from "@/lib/bitset/month-bitset";

describe("month-length handling", () => {
  it("allows day 29 in leap-year February", () => {
    const bits = markDay(createEmptyMonthBits(), 29, 2024, 2);
    expect(bits[28]).toBe("1");
  });

  it("rejects day 29 in non-leap-year February", () => {
    expect(() => markDay(createEmptyMonthBits(), 29, 2025, 2)).toThrow();
  });

  it("supports months with 30 and 31 days correctly", () => {
    const april = markDay(createEmptyMonthBits(), 30, 2026, 4);
    expect(april[29]).toBe("1");
    expect(() => markDay(createEmptyMonthBits(), 31, 2026, 4)).toThrow();

    const july = markDay(createEmptyMonthBits(), 31, 2026, 7);
    expect(july[30]).toBe("1");
  });
});
