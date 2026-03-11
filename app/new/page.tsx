"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HabitForm } from "@/components/habit-form";
import { useHabits } from "@/hooks/use-habits";

export default function NewHabitPage() {
  const router = useRouter();
  const { addHabit, isLoading, error } = useHabits();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header>
        <Link href="/" className="text-sm text-muted underline">Back</Link>
        <h1 className="mt-2 text-2xl font-bold">Create Habit</h1>
      </header>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <HabitForm
        isSubmitting={isLoading}
        onSubmit={async (values) => {
          const habitId = await addHabit(values);
          router.push(`/habits?habitId=${habitId}`);
        }}
      />
    </main>
  );
}
