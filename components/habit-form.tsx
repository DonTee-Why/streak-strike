"use client";

import { useState } from "react";
import { getLocalToday } from "@/lib/date/local-date";
import { ColorPicker } from "@/components/color-picker";

interface HabitFormValues {
  name: string;
  color: string;
  startDate: string;
  endDate?: string | null;
}

interface HabitFormProps {
  onSubmit: (values: HabitFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function HabitForm({ onSubmit, isSubmitting }: HabitFormProps) {
  const today = getLocalToday();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#D4A373");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    await onSubmit({ name: name.trim(), color, startDate, endDate: endDate || null });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-line bg-white/80 p-6 shadow-sm">
      <div className="space-y-2">
        <label htmlFor="habit-name" className="text-sm font-medium">Habit name</label>
        <input
          id="habit-name"
          type="text"
          required
          maxLength={60}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-lg border border-line bg-white px-3 py-2"
          placeholder="Read for 30 mins"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Habit color</p>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="space-y-2">
        <label htmlFor="start-date" className="text-sm font-medium">Start date</label>
        <input
          id="start-date"
          type="date"
          required
          value={startDate}
          max={today}
          onChange={(event) => setStartDate(event.target.value)}
          className="w-full rounded-lg border border-line bg-white px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="end-date" className="text-sm font-medium">End Date (optional)</label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          min={startDate}
          onChange={(event) => setEndDate(event.target.value)}
          className="w-full rounded-lg border border-line bg-white px-3 py-2"
        />
        <p className="text-xs text-muted">Leave empty to track indefinitely.</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-canvas disabled:opacity-60"
      >
        {isSubmitting ? "Creating..." : "Create habit"}
      </button>
    </form>
  );
}
