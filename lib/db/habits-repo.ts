import { db } from "@/lib/db/dexie";
import type { Habit } from "@/types/habit";

export async function listHabits(): Promise<Habit[]> {
  return db.habits.orderBy("createdAt").reverse().toArray();
}

export async function getHabitById(habitId: string): Promise<Habit | undefined> {
  return db.habits.get(habitId);
}

export async function createHabitRecord(habit: Habit): Promise<void> {
  await db.habits.put(habit);
}

export async function deleteHabitRecord(habitId: string): Promise<void> {
  await db.habits.delete(habitId);
}
