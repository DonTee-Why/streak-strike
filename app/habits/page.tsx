"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarGrid } from "@/components/calendar-grid";
import { parseLocalDate } from "@/lib/date/local-date";
import { useHabitCalendar } from "@/hooks/use-habit-calendar";
import { useHabits } from "@/hooks/use-habits";
import type { PeriodRecord, PeriodStats, TrendDirection, WeekdayStats } from "@/types/habit";

type HabitTab = "calendar" | "insights";

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

function periodLabel(period: PeriodStats | PeriodRecord): string {
  if (period.eligibleDays === 0) {
    return "No eligible days";
  }

  if ("label" in period) {
    return period.label;
  }

  if (period.startDate === period.endDate) {
    return compactDateLabel(period.startDate);
  }

  return `${compactDateLabel(period.startDate)} - ${compactDateLabel(period.endDate)}`;
}

function trendLabel(trend: TrendDirection): string {
  switch (trend) {
    case "improving":
      return "Improving";
    case "declining":
      return "Declining";
    case "stable":
    default:
      return "Stable";
  }
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-canvas/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function PeriodCard({ title, stats }: { title: string; stats: PeriodStats }) {
  return (
    <div className="rounded-lg border border-line bg-white/80 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
          <p className="mt-1 text-sm font-medium text-ink">{periodLabel(stats)}</p>
        </div>
        <p className="text-lg font-semibold text-ink">{formatCompletionRate(stats.completionRate)}</p>
      </div>
      <p className="mt-3 text-xs text-muted">
        {stats.completedDays} of {stats.eligibleDays} days crossed out
      </p>
    </div>
  );
}

function RecordCard({ title, record }: { title: string; record?: PeriodRecord }) {
  return (
    <div className="rounded-lg border border-line bg-white/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      {record ? (
        <>
          <p className="mt-1 text-sm font-medium text-ink">{periodLabel(record)}</p>
          <p className="mt-2 text-xs text-muted">
            {formatCompletionRate(record.completionRate)} with {record.completedDays} completed day
            {record.completedDays === 1 ? "" : "s"}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted">No eligible record yet</p>
      )}
    </div>
  );
}

function DayPatternRow({ stat }: { stat: WeekdayStats }) {
  const width = `${Math.round(stat.completionRate * 100)}%`;

  return (
    <div className="grid grid-cols-[88px_1fr_86px] items-center gap-3 text-sm">
      <p className="font-medium text-ink">{stat.label}</p>
      <div className="h-2 overflow-hidden rounded-full bg-[#e4e7df]">
        <div className="h-full rounded-full bg-[#2f6f4f]" style={{ width }} />
      </div>
      <p className="text-right text-xs text-muted">
        {formatCompletionRate(stat.completionRate)} ({stat.completionCount})
      </p>
    </div>
  );
}

function HabitCalendarScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const habitId = searchParams.get("habitId") ?? "";
  const { loadHabits } = useHabits();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HabitTab>("calendar");

  const {
    today,
    currentHabit,
    calendarDays,
    viewedYear,
    viewedMonth,
    metrics,
    insights,
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

      <nav className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-white/80 p-1 text-sm font-medium shadow-sm">
        {(["calendar", "insights"] as HabitTab[]).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md px-3 py-2 capitalize ${
              activeTab === tab ? "bg-ink text-white" : "text-muted hover:bg-canvas"
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "calendar" ? (
        <section className="rounded-lg border border-line bg-white/85 p-4 shadow-sm sm:p-5">
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
      ) : null}

      {activeTab === "insights" && metrics && insights ? (
        <section className="space-y-4">
          <div className="rounded-lg border border-line bg-white/85 p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label="Start Date" value={compactDateLabel(metrics.startDate)} />
              <MetricCard label="Days Since Start" value={metrics.daysSinceStart} />
              <MetricCard label="Total Completions" value={metrics.totalCompletions} />
              <MetricCard label="Completion Rate" value={formatCompletionRate(metrics.completionRate)} />
              <MetricCard label="Current Streak" value={metrics.currentStreak} />
              <MetricCard label="Longest Streak" value={metrics.longestStreak} />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white/85 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">Weekly Performance</h2>
              <span className="rounded-full border border-line px-2 py-1 text-xs text-muted">
                {trendLabel(insights.weeklyTrend)}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PeriodCard title="This Week" stats={insights.currentWeek} />
              <PeriodCard title="Previous Week" stats={insights.previousWeek} />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white/85 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-ink">Monthly Performance</h2>
              <span className="rounded-full border border-line px-2 py-1 text-xs text-muted">
                {trendLabel(insights.monthlyTrend)}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PeriodCard title="This Month" stats={insights.currentMonth} />
              <PeriodCard title="Previous Month" stats={insights.previousMonth} />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white/85 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Weekday Pattern</h2>
            <div className="mt-4 space-y-3">
              {insights.weekdayStats.map((stat) => (
                <DayPatternRow key={stat.label} stat={stat} />
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Best Day"
                value={
                  insights.bestDay
                    ? `${insights.bestDay.label} (${formatCompletionRate(insights.bestDay.completionRate)})`
                    : "No eligible day"
                }
              />
              <MetricCard
                label="Weakest Day"
                value={
                  insights.weakestDay
                    ? `${insights.weakestDay.label} (${formatCompletionRate(insights.weakestDay.completionRate)})`
                    : "No eligible day"
                }
              />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white/85 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-ink">Records</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <RecordCard title="Best Week" record={insights.bestWeek} />
              <RecordCard title="Best Month" record={insights.bestMonth} />
              <MetricCard label="Longest Streak" value={metrics.longestStreak} />
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-lg border border-line bg-white/80 p-4 text-sm text-muted">
        {activeTab === "calendar" ? <p>Legend: X = completed, highlighted = markable, muted = locked/missed.</p> : null}
        <button
          type="button"
          onClick={() => setIsRulesModalOpen(true)}
          className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink"
        >
          How StreakStrike Works
        </button>

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

      {isRulesModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4">
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-ink">How StreakStrike Works</p>
                <p className="mt-1 text-sm text-muted">Completion history is the source of truth.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="rounded-lg border border-line px-3 py-1 text-sm"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-muted">
              <section>
                <h2 className="font-semibold text-ink">Grace Rules</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Today can be marked and unmarked.</li>
                  <li>The previous 1-3 days can be marked only if currently unmarked.</li>
                  <li>Previous days before the habit start date are never markable.</li>
                  <li>Once a grace day is marked, it becomes permanently locked.</li>
                  <li>Days older than the grace window are permanently locked.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-semibold text-ink">Day States</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Future days are locked.</li>
                  <li>Pre-start days are locked.</li>
                  <li>Open days can be crossed out.</li>
                  <li>Completed past days are locked.</li>
                  <li>Expired missed days remain unmarked and locked.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-semibold text-ink">Streak Rules</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Streaks are derived from crossed-out calendar dates.</li>
                  <li>If today is incomplete, the current streak may continue from yesterday.</li>
                  <li>The longest streak is the longest uninterrupted run of completed days.</li>
                  <li>Monthly bitsets remain the source of truth for all metrics.</li>
                </ul>
              </section>
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
