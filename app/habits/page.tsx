"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CalendarGrid } from "@/components/calendar-grid";
import { StreakSummary } from "@/components/streak-summary";
import { useHabitCalendar } from "@/hooks/use-habit-calendar";

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1, 12).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function HabitCalendarScreen() {
  const searchParams = useSearchParams();
  const habitId = searchParams.get("habitId") ?? "";

  const {
    calendarDays,
    viewedYear,
    viewedMonth,
    currentStreak,
    longestStreak,
    totalCompletions,
    isLoading,
    error,
    loadHabitCalendar,
    moveMonth,
    toggleDate,
  } = useHabitCalendar();

  useEffect(() => {
    if (habitId) {
      void loadHabitCalendar(habitId);
    }
  }, [habitId, loadHabitCalendar]);

  if (!habitId) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm text-muted underline">Back</Link>
        </header>
        <p className="rounded-lg border border-line bg-white/80 p-4 text-sm text-muted">
          No habit selected.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-muted underline">Back</Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Habit Calendar</p>
      </header>

      <StreakSummary currentStreak={currentStreak} longestStreak={longestStreak} totalCompletions={totalCompletions} />

      <section className="rounded-2xl border border-line bg-white/85 p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => void moveMonth(habitId, -1)}
            className="rounded-lg border border-line px-3 py-1 text-sm"
          >
            Prev
          </button>
          <h1 className="text-lg font-semibold">{monthLabel(viewedYear, viewedMonth)}</h1>
          <button
            type="button"
            onClick={() => void moveMonth(habitId, 1)}
            className="rounded-lg border border-line px-3 py-1 text-sm"
          >
            Next
          </button>
        </div>

        <CalendarGrid days={calendarDays} onTapDay={(date) => void toggleDate(habitId, date)} />
      </section>

      <section className="rounded-2xl border border-line bg-white/80 p-4 text-sm text-muted">
        <p>Legend: X = completed, highlighted = markable, muted = locked/missed.</p>
      </section>

      {isLoading ? <p className="text-sm text-muted">Syncing...</p> : null}
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    </main>
  );
}

export default function HabitCalendarPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
          <p className="text-sm text-muted">Loading calendar...</p>
        </main>
      }
    >
      <HabitCalendarScreen />
    </Suspense>
  );
}
