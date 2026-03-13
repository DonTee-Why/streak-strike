"use client";

import type { MonthGridDay } from "@/lib/calendar/month-grid";

interface DayCellProps {
  day: MonthGridDay;
  onTap: (date: string) => void;
}

function stateClass(state: MonthGridDay["state"]): string {
  switch (state) {
    case "today_open":
      return "border-ink bg-white text-ink";
    case "today_done":
      return "border-[#2f6f4f] bg-[#dcefdc] text-ink";
    case "grace_open":
      return "border-[#b66a1a] bg-[#fff1de] text-[#5e3a10]";
    case "grace_done_locked":
      return "border-[#4b7f60] bg-[#d7ead9] text-ink";
    case "expired_done":
      return "border-[#6d846f] bg-[#c8dec9] text-ink";
    case "expired_missed":
      return "border-[#8f958c] bg-[#eceee9] text-[#687064]";
    case "future":
    default:
      return "border-[#cfd5c5] bg-[#f7f8f3] text-[#9aa191]";
  }
}

export function DayCell({ day, onTap }: DayCellProps) {
  const canTap = day.inMonth && day.markable;
  const isToday = day.state === "today_open" || day.state === "today_done";

  return (
    <button
      type="button"
      onClick={() => canTap && onTap(day.date)}
      disabled={!canTap}
      className={`relative flex h-12 w-full items-center justify-center rounded-lg border text-sm ${stateClass(day.state)} ${
        day.inMonth ? "" : "opacity-45"
      } ${canTap ? "cursor-pointer" : "cursor-not-allowed"} ${isToday ? "ring-2 ring-[#2f6f4f]/25 ring-offset-1" : ""}`}
      aria-label={`${day.date} ${day.state}`}
    >
      {isToday ? (
        <span className="absolute left-1 top-1 rounded-full bg-[#2f6f4f] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
          Today
        </span>
      ) : null}
      <span className="relative z-10 font-semibold">{day.day}</span>
      {day.completed ? (
        <span className="pointer-events-none absolute inset-0 z-20 animate-draw-x">
          <span className="absolute left-1/2 top-1/2 h-[3px] w-[88%] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-[#c93f32]" />
          <span className="absolute left-1/2 top-1/2 h-[3px] w-[88%] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-[#c93f32]" />
        </span>
      ) : null}
    </button>
  );
}
