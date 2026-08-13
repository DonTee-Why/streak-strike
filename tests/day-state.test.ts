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

  it("keeps the habit start day editable when start date is today", () => {
    expect(deriveDayState({ targetDate: today, today, isCompleted: false, startDate: today })).toBe("today_open");
    expect(deriveDayState({ targetDate: today, today, isCompleted: true, startDate: today })).toBe("today_done");
  });

  it("classifies days before the habit start date as pre-start", () => {
    expect(deriveDayState({ targetDate: "2026-03-08", today, isCompleted: false, startDate: today })).toBe(
      "pre_start",
    );
  });

  it("classifies days after the habit end date as post-end", () => {
    expect(
      deriveDayState({
        targetDate: "2026-03-11",
        today,
        isCompleted: false,
        startDate: "2026-03-01",
        endDate: "2026-03-10",
      }),
    ).toBe("post_end");
  });

  it("treats the habit end date as a normal active-range day", () => {
    expect(
      deriveDayState({
        targetDate: "2026-03-09",
        today,
        isCompleted: false,
        startDate: "2026-03-01",
        endDate: "2026-03-09",
      }),
    ).toBe("today_open");
  });

  it("classifies grace states", () => {
    expect(deriveDayState({ targetDate: "2026-03-08", today, isCompleted: false })).toBe("grace_open");
    expect(deriveDayState({ targetDate: "2026-03-07", today, isCompleted: true })).toBe("grace_done_locked");
    expect(
      deriveDayState({
        targetDate: "2026-03-07",
        today,
        isCompleted: true,
        wasGraceMarked: true,
        wasGraceCorrectionUsed: false,
      }),
    ).toBe("grace_done_editable");
    expect(
      deriveDayState({
        targetDate: "2026-03-07",
        today,
        isCompleted: true,
        wasGraceMarked: true,
        wasGraceCorrectionUsed: true,
      }),
    ).toBe("grace_done_locked");
  });

  it("keeps grace days markable after the habit has started", () => {
    expect(
      deriveDayState({ targetDate: "2026-03-08", today, isCompleted: false, startDate: "2026-03-07" }),
    ).toBe("grace_open");
  });

  it("classifies expired states", () => {
    expect(deriveDayState({ targetDate: "2026-03-05", today, isCompleted: false })).toBe("expired_missed");
    expect(deriveDayState({ targetDate: "2026-03-04", today, isCompleted: true })).toBe("expired_done");
  });

  it("reclassifies a former today as a grace day after rollover", () => {
    expect(deriveDayState({ targetDate: "2026-03-09", today: "2026-03-10", isCompleted: false })).toBe("grace_open");
  });
});
