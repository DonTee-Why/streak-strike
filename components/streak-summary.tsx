interface StreakSummaryProps {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

export function StreakSummary({ currentStreak, longestStreak, totalCompletions }: StreakSummaryProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-line bg-white/80 p-3 text-center">
        <p className="text-xs text-muted">Current</p>
        <p className="text-xl font-semibold">{currentStreak}</p>
      </div>
      <div className="rounded-xl border border-line bg-white/80 p-3 text-center">
        <p className="text-xs text-muted">Longest</p>
        <p className="text-xl font-semibold">{longestStreak}</p>
      </div>
      <div className="rounded-xl border border-line bg-white/80 p-3 text-center">
        <p className="text-xs text-muted">Total X</p>
        <p className="text-xl font-semibold">{totalCompletions}</p>
      </div>
    </div>
  );
}
