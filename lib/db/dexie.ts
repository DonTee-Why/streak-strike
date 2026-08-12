import Dexie, { type EntityTable } from "dexie";
import { createEmptyMonthBits } from "@/lib/bitset/month-bitset";
import type { Habit, HabitMonth, HabitStats } from "@/types/habit";

export class StreakStrikeDB extends Dexie {
  habits!: EntityTable<Habit, "id">;
  habitMonths!: Dexie.Table<HabitMonth, [string, number, number]>;
  habitStats!: EntityTable<HabitStats, "habitId">;

  constructor() {
    super("streak-strike-db");

    this.version(1).stores({
      habits: "id, name, createdAt",
      habitMonths: "[habitId+year+month], habitId, year, month",
      habitStats: "habitId",
    });

    this.version(2)
      .stores({
        habits: "id, name, createdAt",
        habitMonths: "[habitId+year+month], habitId, year, month",
        habitStats: "habitId",
      })
      .upgrade(async (tx) => {
        await tx
          .table("habitMonths")
          .toCollection()
          .modify((month: Partial<HabitMonth>) => {
            month.graceMarkedBits ??= createEmptyMonthBits();
            month.graceCorrectionBits ??= createEmptyMonthBits();
          });
      });
  }
}

export const db = new StreakStrikeDB();
