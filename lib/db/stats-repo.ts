import { db } from "@/lib/db/dexie";
import type { HabitStats } from "@/types/habit";

export async function getHabitStats(habitId: string): Promise<HabitStats | undefined> {
  return db.habitStats.get(habitId);
}

export async function upsertHabitStats(stats: HabitStats): Promise<void> {
  await db.habitStats.put(stats);
}
