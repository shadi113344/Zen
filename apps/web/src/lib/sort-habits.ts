import type { Habit } from "@mottazen/core";

export function sortHabitsByOrder(habits: Habit[]): Habit[] {
  return [...habits].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}
