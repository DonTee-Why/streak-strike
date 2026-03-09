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
