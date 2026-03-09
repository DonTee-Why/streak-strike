import Dexie, { type EntityTable } from "dexie";
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
  }
}

export const db = new StreakStrikeDB();
