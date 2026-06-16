export interface Habit {
  id: string;
  name: string;
  color: string;
  startDate: string;
  createdAt: string;
}

export interface HabitMonth {
  habitId: string;
  year: number;
  month: number;
  bits: string;
  completedCount: number;
  updatedAt: string;
}

export interface HabitStats {
  habitId: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  updatedAt: string;
}

export interface HabitMetrics {
  startDate: string;
  daysSinceStart: number;
  totalCompletions: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
}

export type TrendDirection = "improving" | "declining" | "stable";

export interface PeriodStats {
  startDate: string;
  endDate: string;
  completedDays: number;
  eligibleDays: number;
  completionRate: number;
}

export interface WeekdayStats {
  weekday: number;
  label: string;
  completionCount: number;
  eligibleCount: number;
  completionRate: number;
}

export interface PeriodRecord extends PeriodStats {
  label: string;
}

export interface HabitInsights {
  currentWeek: PeriodStats;
  previousWeek: PeriodStats;
  weeklyTrend: TrendDirection;
  currentMonth: PeriodStats;
  previousMonth: PeriodStats;
  monthlyTrend: TrendDirection;
  weekdayStats: WeekdayStats[];
  bestDay?: WeekdayStats;
  weakestDay?: WeekdayStats;
  bestWeek?: PeriodRecord;
  bestMonth?: PeriodRecord;
}
