import Link from "next/link";
import type { Habit } from "@/types/habit";

interface HabitCardProps {
  habit: Habit;
  currentStreak: number;
}

export function HabitCard({ habit, currentStreak }: HabitCardProps) {
  return (
    <Link href={`/habits/${habit.id}`} className="block rounded-2xl border border-line bg-white/80 p-4 shadow-sm transition hover:translate-y-[-1px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
          <h2 className="text-base font-semibold text-ink">{habit.name}</h2>
        </div>
        <p className="text-sm text-muted">{currentStreak} day streak</p>
      </div>
      <p className="mt-2 text-xs text-muted">Started {habit.startDate}</p>
    </Link>
  );
}
