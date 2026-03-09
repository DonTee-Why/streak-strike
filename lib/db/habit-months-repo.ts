import { createEmptyMonthBits, countCompleted, markDay, unmarkDay } from "@/lib/bitset/month-bitset";
import { db } from "@/lib/db/dexie";
import { getLocalToday } from "@/lib/date/local-date";
import type { HabitMonth } from "@/types/habit";

export function monthRecordKey(habitId: string, year: number, month: number): [string, number, number] {
  return [habitId, year, month];
}

export async function getHabitMonth(habitId: string, year: number, month: number): Promise<HabitMonth | undefined> {
  return db.habitMonths.get(monthRecordKey(habitId, year, month));
}

export async function listHabitMonths(habitId: string): Promise<HabitMonth[]> {
  return db.habitMonths.where("habitId").equals(habitId).toArray();
}

export async function getOrCreateHabitMonth(habitId: string, year: number, month: number): Promise<HabitMonth> {
  const found = await getHabitMonth(habitId, year, month);
  if (found) {
    return found;
  }

  const created: HabitMonth = {
    habitId,
    year,
    month,
    bits: createEmptyMonthBits(),
    completedCount: 0,
    updatedAt: getLocalToday(),
  };

  await db.habitMonths.put(created);
  return created;
}

export async function markHabitDay(habitId: string, year: number, month: number, day: number): Promise<HabitMonth> {
  return db.transaction("rw", db.habitMonths, async () => {
    const record = await getOrCreateHabitMonth(habitId, year, month);
    const updatedBits = markDay(record.bits, day, year, month);

    const next: HabitMonth = {
      ...record,
      bits: updatedBits,
      completedCount: countCompleted(updatedBits, year, month),
      updatedAt: getLocalToday(),
    };

    await db.habitMonths.put(next);
    return next;
  });
}

export async function unmarkHabitDay(habitId: string, year: number, month: number, day: number): Promise<HabitMonth> {
  return db.transaction("rw", db.habitMonths, async () => {
    const record = await getOrCreateHabitMonth(habitId, year, month);
    const updatedBits = unmarkDay(record.bits, day, year, month);

    const next: HabitMonth = {
      ...record,
      bits: updatedBits,
      completedCount: countCompleted(updatedBits, year, month),
      updatedAt: getLocalToday(),
    };

    await db.habitMonths.put(next);
    return next;
  });
}
