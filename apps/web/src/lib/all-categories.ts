import { uniqueCategories } from "@mottazen/core";
import type { Habit } from "@mottazen/core";

/** Categories from habits plus any saved in theme colors (no habits yet). */
export function allCategories(habits: Habit[], categoryColors: Record<string, string>): string[] {
  const names = new Set<string>();
  for (const h of habits) {
    if (h.category?.trim()) names.add(h.category.trim());
  }
  for (const key of Object.keys(categoryColors)) {
    if (key.trim()) names.add(key.trim());
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function categorySelectOptions(
  habits: Habit[],
  categoryColors: Record<string, string>,
  current?: string,
): string[] {
  const base = allCategories(habits, categoryColors);
  const extras = ["Health", "Mind", "Movement"];
  const set = new Set([...base, ...extras]);
  if (current?.trim()) set.add(current.trim());
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function hasCategoryName(
  name: string,
  habits: Habit[],
  categoryColors: Record<string, string>,
): boolean {
  const key = name.trim().toLowerCase();
  if (!key) return true;
  return allCategories(habits, categoryColors).some((c) => c.toLowerCase() === key);
}
