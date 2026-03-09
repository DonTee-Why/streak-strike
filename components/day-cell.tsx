"use client";

import type { MonthGridDay } from "@/lib/calendar/month-grid";

interface DayCellProps {
  day: MonthGridDay;
  onTap: (date: string) => void;
}

function stateClass(state: MonthGridDay["state"]): string {
  switch (state) {
    case "today_open":
      return "border-ink/60 bg-white";
    case "today_done":
      return "border-ink bg-white";
    case "grace_open":
      return "border-[#D4A373]/70 bg-[#fffaf2]";
    case "grace_done_locked":
      return "border-line bg-[#eef4e4]";
    case "expired_done":
      return "border-line bg-[#e9f0df]";
    case "expired_missed":
      return "border-line bg-[#f4f5ef] text-muted";
    case "future":
    default:
      return "border-line bg-white/40 text-muted";
  }
}

export function DayCell({ day, onTap }: DayCellProps) {
  const canTap = day.inMonth && day.markable;

  return (
    <button
      type="button"
      onClick={() => canTap && onTap(day.date)}
      disabled={!canTap}
      className={`relative flex h-12 w-full items-center justify-center rounded-lg border text-sm ${stateClass(day.state)} ${
        day.inMonth ? "" : "opacity-45"
      } ${canTap ? "cursor-pointer" : "cursor-not-allowed"}`}
      aria-label={`${day.date} ${day.state}`}
    >
      <span>{day.day}</span>
      {day.completed ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-lg font-bold text-[#d14b3f] animate-draw-x">
          X
        </span>
      ) : null}
    </button>
  );
}
