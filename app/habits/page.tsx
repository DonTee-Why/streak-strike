"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CalendarGrid } from "@/components/calendar-grid";
import { StreakSummary } from "@/components/streak-summary";
import { parseLocalDate } from "@/lib/date/local-date";
import { useHabitCalendar } from "@/hooks/use-habit-calendar";
import { useHabits } from "@/hooks/use-habits";

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1, 12).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function fullDateLabel(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function HabitCalendarScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const habitId = searchParams.get("habitId") ?? "";
  const { loadHabits } = useHabits();

  const {
    today,
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

  async function handleBack() {
    await loadHabits();
    router.push("/");
  }

  if (!habitId) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6">
        <header className="flex items-center justify-between">
          <button type="button" onClick={() => void handleBack()} className="text-sm text-muted underline">
            Back
          </button>
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
        <button type="button" onClick={() => void handleBack()} className="text-sm text-muted underline">
          Back
        </button>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Habit Calendar</p>
      </header>

      <StreakSummary currentStreak={currentStreak} longestStreak={longestStreak} totalCompletions={totalCompletions} />

      <section className="rounded-2xl border border-line bg-white/85 p-4 shadow-sm sm:p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Today: {fullDateLabel(today)}
        </p>
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

      <section className="space-y-3 rounded-2xl border border-line bg-white/80 p-4 text-sm text-muted">
        <p>Legend: X = completed, highlighted = markable, muted = locked/missed.</p>
        <div className="rounded-xl border border-line bg-[#fff7ea] p-3 text-[#5e3a10]">
          <p className="text-xs font-semibold uppercase tracking-wide">Grace Period Rules</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Today can be marked and unmarked.</li>
            <li>The previous 1-3 days can be marked only if currently unmarked.</li>
            <li>Once a grace day is marked, it becomes permanently locked.</li>
            <li>Days older than 3 days are permanently locked.</li>
          </ul>
        </div>
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
