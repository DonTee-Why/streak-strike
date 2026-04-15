"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarGrid } from "@/components/calendar-grid";
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

function compactDateLabel(date: string): string {
  return parseLocalDate(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCompletionRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function HabitCalendarScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const habitId = searchParams.get("habitId") ?? "";
  const { loadHabits } = useHabits();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    today,
    currentHabit,
    calendarDays,
    viewedYear,
    viewedMonth,
    metrics,
    isLoading,
    error,
    loadHabitCalendar,
    moveMonth,
    toggleDate,
    deleteHabit,
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

  async function handleDeleteHabit() {
    if (!habitId) {
      return;
    }

    try {
      await deleteHabit(habitId);
      setIsDeleteDialogOpen(false);
      router.push("/");
    } catch {
      // Store state already captures the user-facing error.
    }
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
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Habit Calendar</p>
          <p className="text-sm font-medium text-ink">{currentHabit?.name ?? "Loading habit..."}</p>
        </div>
      </header>

      {metrics ? (
        <section className="rounded-2xl border border-line bg-white/80 p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line bg-canvas/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Start Date</p>
              <p className="mt-1 text-sm font-medium text-ink">{compactDateLabel(metrics.startDate)}</p>
            </div>
            <div className="rounded-xl border border-line bg-canvas/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Days Since Start</p>
              <p className="mt-1 text-sm font-medium text-ink">{metrics.daysSinceStart}</p>
            </div>
            <div className="rounded-xl border border-line bg-canvas/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total Completions</p>
              <p className="mt-1 text-sm font-medium text-ink">{metrics.totalCompletions}</p>
            </div>
            <div className="rounded-xl border border-line bg-canvas/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Completion Rate</p>
              <p className="mt-1 text-sm font-medium text-ink">{formatCompletionRate(metrics.completionRate)}</p>
            </div>
            <div className="rounded-xl border border-line bg-canvas/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Current Streak</p>
              <p className="mt-1 text-sm font-medium text-ink">{metrics.currentStreak}</p>
            </div>
            <div className="rounded-xl border border-line bg-canvas/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Longest Streak</p>
              <p className="mt-1 text-sm font-medium text-ink">{metrics.longestStreak}</p>
            </div>
          </div>
        </section>
      ) : null}

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

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700"
          >
            Delete Habit
          </button>
        </div>
      </section>

      {isLoading ? <p className="text-sm text-muted">Syncing...</p> : null}
      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {isDeleteDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-xl">
            <p className="text-base font-semibold text-ink">Delete habit?</p>
            <p className="mt-2 text-sm text-muted">
              This will permanently delete this habit and all its history.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="rounded-lg border border-line px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteHabit()}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
