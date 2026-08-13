import Link from "next/link";
import { parseLocalDate } from "@/lib/date/local-date";
import { getHabitStatus } from "@/lib/habit/lifecycle";
import type { Habit } from "@/types/habit";

interface HabitCardProps {
  habit: Habit;
  currentStreak: number;
  today: string;
}

function compactDateLabel(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HabitCard({ habit, currentStreak, today }: HabitCardProps) {
  const status = getHabitStatus(habit, today);

  return (
    <Link href={`/habits?habitId=${habit.id}`} className="block rounded-2xl border border-line bg-white/80 p-4 shadow-sm transition hover:translate-y-[-1px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
          <h2 className="text-base font-semibold text-ink">{habit.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          {status === "ended" ? (
            <span className="rounded-full border border-line bg-canvas px-2 py-1 text-xs font-medium text-muted">
              Ended
            </span>
          ) : null}
          <p className="text-sm text-muted">{currentStreak} day streak</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">
        {habit.endDate
          ? `${compactDateLabel(habit.startDate)} - ${compactDateLabel(habit.endDate)}`
          : `Started ${habit.startDate}`}
      </p>
    </Link>
  );
}
