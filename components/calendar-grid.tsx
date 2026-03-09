"use client";

import { DayCell } from "@/components/day-cell";
import type { MonthGridDay } from "@/lib/calendar/month-grid";

interface CalendarGridProps {
  days: MonthGridDay[];
  onTapDay: (date: string) => void;
}

const WEEK_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({ days, onTapDay }: CalendarGridProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted">
        {WEEK_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <DayCell key={day.date} day={day} onTap={onTapDay} />
        ))}
      </div>
    </div>
  );
}
