import { describe, expect, it } from "vitest";
import { calculateCurrentStreak } from "@/lib/streak/streak-engine";
import type { HabitMonth } from "@/types/habit";

function makeMonth(habitId: string, year: number, month: number, doneDays: number[]): HabitMonth {
  const bits = Array.from({ length: 31 }, (_, i) => (doneDays.includes(i + 1) ? "1" : "0")).join("");
  return { habitId, year, month, bits, completedCount: doneDays.length, updatedAt: "2026-03-09" };
}

describe("current streak", () => {
  it("counts backward from yesterday if today is incomplete", async () => {
    const march = makeMonth("h", 2026, 3, [6, 7, 8]);
    const loader = async (year: number, month: number) => (year === 2026 && month === 3 ? march : undefined);
    await expect(calculateCurrentStreak("2026-03-09", loader)).resolves.toBe(3);
  });

  it("includes today when today is completed", async () => {
    const march = makeMonth("h", 2026, 3, [6, 7, 8, 9]);
    const loader = async (year: number, month: number) => (year === 2026 && month === 3 ? march : undefined);

    await expect(calculateCurrentStreak("2026-03-09", loader)).resolves.toBe(4);
  });

  it("returns 0 when both today and yesterday are incomplete", async () => {
    const march = makeMonth("h", 2026, 3, [6]);
    const loader = async (year: number, month: number) => (year === 2026 && month === 3 ? march : undefined);

    await expect(calculateCurrentStreak("2026-03-09", loader)).resolves.toBe(0);
  });

  it("crosses month boundary when today is completed", async () => {
    const march = makeMonth("h", 2026, 3, [1]);
    const feb = makeMonth("h", 2026, 2, [26, 27, 28]);
    const loader = async (year: number, month: number) => {
      if (year === 2026 && month === 3) return march;
      if (year === 2026 && month === 2) return feb;
      return undefined;
    };

    await expect(calculateCurrentStreak("2026-03-01", loader)).resolves.toBe(4);
  });

  it("crosses month boundary from yesterday when today is incomplete", async () => {
    const march = makeMonth("h", 2026, 3, []);
    const feb = makeMonth("h", 2026, 2, [26, 27, 28]);
    const loader = async (year: number, month: number) => {
      if (year === 2026 && month === 3) return march;
      if (year === 2026 && month === 2) return feb;
      return undefined;
    };

    await expect(calculateCurrentStreak("2026-03-01", loader)).resolves.toBe(3);
  });

  it("stops at the first missed day before yesterday", async () => {
    const march = makeMonth("h", 2026, 3, [6, 8]);
    const loader = async (year: number, month: number) => (year === 2026 && month === 3 ? march : undefined);

    await expect(calculateCurrentStreak("2026-03-09", loader)).resolves.toBe(1);
  });
});
