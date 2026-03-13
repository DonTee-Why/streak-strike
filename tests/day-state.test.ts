import { describe, expect, it } from "vitest";
import { deriveDayState } from "@/lib/grace/day-state";

describe("day state derivation", () => {
  const today = "2026-03-09";

  it("classifies future day", () => {
    expect(deriveDayState({ targetDate: "2026-03-10", today, isCompleted: false })).toBe("future");
  });

  it("classifies today open and done", () => {
    expect(deriveDayState({ targetDate: today, today, isCompleted: false })).toBe("today_open");
    expect(deriveDayState({ targetDate: today, today, isCompleted: true })).toBe("today_done");
  });

  it("classifies grace states", () => {
    expect(deriveDayState({ targetDate: "2026-03-08", today, isCompleted: false })).toBe("grace_open");
    expect(deriveDayState({ targetDate: "2026-03-07", today, isCompleted: true })).toBe("grace_done_locked");
  });

  it("classifies expired states", () => {
    expect(deriveDayState({ targetDate: "2026-03-05", today, isCompleted: false })).toBe("expired_missed");
    expect(deriveDayState({ targetDate: "2026-03-04", today, isCompleted: true })).toBe("expired_done");
  });

  it("reclassifies a former today as a grace day after rollover", () => {
    expect(deriveDayState({ targetDate: "2026-03-09", today: "2026-03-10", isCompleted: false })).toBe("grace_open");
  });
});
