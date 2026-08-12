import { createEmptyMonthBits, countCompleted, markDay, unmarkDay } from "@/lib/bitset/month-bitset";
import { db } from "@/lib/db/dexie";
import { getLocalToday } from "@/lib/date/local-date";
import type { HabitMonth } from "@/types/habit";

export function monthRecordKey(habitId: string, year: number, month: number): [string, number, number] {
  return [habitId, year, month];
}

function withGraceBitsets(record: HabitMonth): HabitMonth {
  return {
    ...record,
    graceMarkedBits: record.graceMarkedBits ?? createEmptyMonthBits(),
    graceCorrectionBits: record.graceCorrectionBits ?? createEmptyMonthBits(),
  };
}

export async function getHabitMonth(habitId: string, year: number, month: number): Promise<HabitMonth | undefined> {
  const record = await db.habitMonths.get(monthRecordKey(habitId, year, month));
  return record ? withGraceBitsets(record) : undefined;
}

export async function listHabitMonths(habitId: string): Promise<HabitMonth[]> {
  const records = await db.habitMonths.where("habitId").equals(habitId).toArray();
  return records.map(withGraceBitsets);
}

export async function deleteHabitMonths(habitId: string): Promise<number> {
  return db.habitMonths.where("habitId").equals(habitId).delete();
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
    graceMarkedBits: createEmptyMonthBits(),
    graceCorrectionBits: createEmptyMonthBits(),
    completedCount: 0,
    updatedAt: getLocalToday(),
  };

  await db.habitMonths.put(created);
  return created;
}

export async function markHabitDay(
  habitId: string,
  year: number,
  month: number,
  day: number,
  options: { markGrace?: boolean } = {},
): Promise<HabitMonth> {
  return db.transaction("rw", db.habitMonths, async () => {
    const record = await getOrCreateHabitMonth(habitId, year, month);
    const updatedBits = markDay(record.bits, day, year, month);
    const graceMarkedBits = options.markGrace
      ? markDay(record.graceMarkedBits, day, year, month)
      : record.graceMarkedBits;

    const next: HabitMonth = {
      ...record,
      bits: updatedBits,
      graceMarkedBits,
      completedCount: countCompleted(updatedBits, year, month),
      updatedAt: getLocalToday(),
    };

    await db.habitMonths.put(next);
    return next;
  });
}

export async function unmarkHabitDay(
  habitId: string,
  year: number,
  month: number,
  day: number,
  options: { markGraceCorrection?: boolean } = {},
): Promise<HabitMonth> {
  return db.transaction("rw", db.habitMonths, async () => {
    const record = await getOrCreateHabitMonth(habitId, year, month);
    const updatedBits = unmarkDay(record.bits, day, year, month);
    const graceCorrectionBits = options.markGraceCorrection
      ? markDay(record.graceCorrectionBits, day, year, month)
      : record.graceCorrectionBits;

    const next: HabitMonth = {
      ...record,
      bits: updatedBits,
      graceCorrectionBits,
      completedCount: countCompleted(updatedBits, year, month),
      updatedAt: getLocalToday(),
    };

    await db.habitMonths.put(next);
    return next;
  });
}
