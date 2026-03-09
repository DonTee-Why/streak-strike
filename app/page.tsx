"use client";

import Link from "next/link";
import { useEffect } from "react";
import { HabitCard } from "@/components/habit-card";
import { useHabits } from "@/hooks/use-habits";

export default function HabitListPage() {
  const { habits, isLoading, error, loadHabits } = useHabits();

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">StreakStrike</p>
          <h1 className="text-2xl font-bold">Your Habits</h1>
        </div>
        <Link href="/new" className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-canvas">
          New Habit
        </Link>
      </header>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {isLoading && habits.length === 0 ? <p className="text-sm text-muted">Loading habits...</p> : null}

      {habits.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-line bg-white/80 p-8 text-center">
          <p className="text-base font-semibold">No habits yet</p>
          <p className="mt-1 text-sm text-muted">Create a habit and start crossing out days.</p>
        </div>
      ) : null}

      <section className="grid gap-3">
        {habits.map((item) => (
          <HabitCard key={item.habit.id} habit={item.habit} currentStreak={item.currentStreak} />
        ))}
      </section>
    </main>
  );
}
