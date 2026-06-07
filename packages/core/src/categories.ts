import { habitScore } from "./scoring";
import { average, dayScore, habitScoresOverRange, isAllRestDay, isRestLog, logValueForHabit } from "./scoring";
import type { CategoryScoreResult, CategoryWeights, DayLog, Habit } from "./types";

export function normalizeWeights(
  items: Array<{ habitId: string; weight: number }>,
): Array<{ habitId: string; weight: number }> {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return items.map((i) => ({ ...i, weight: Math.round(100 / items.length) }));
  return items.map((i) => ({ ...i, weight: Math.round((i.weight / total) * 100) }));
}

export function categoryToSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function slugToCategory(slug: string, known: string[]): string | null {
  return known.find((c) => categoryToSlug(c) === slug) ?? null;
}

export function uniqueCategories(habits: Habit[]): string[] {
  const set = new Set<string>();
  for (const h of habits) {
    if (h.category) set.add(h.category);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function habitsInCategory(habits: Habit[], category: string): Habit[] {
  return habits.filter((h) => h.category === category && !h.paused);
}

/** Equal split (100%) across active habits in a category. */
export function equalCategoryWeights(habits: Habit[], category: string): CategoryWeights {
  const scoped = habitsInCategory(habits, category);
  if (scoped.length === 0) return {};

  const even = Math.round(100 / scoped.length);
  const weights: CategoryWeights = {};
  scoped.forEach((h, i) => {
    weights[h.id] = i === 0 ? 100 - even * (scoped.length - 1) : even;
  });
  return weights;
}

/** Merge saved weights with current habits; fall back to equal split. */
export function resolveCategoryWeights(
  habits: Habit[],
  category: string,
  saved?: CategoryWeights,
): CategoryWeights {
  const scoped = habitsInCategory(habits, category);
  if (scoped.length === 0) return {};

  if (!saved || Object.keys(saved).length === 0) {
    return equalCategoryWeights(habits, category);
  }

  const merged: CategoryWeights = {};
  for (const h of scoped) {
    merged[h.id] = saved[h.id] ?? 0;
  }

  const total = Object.values(merged).reduce((a, b) => a + b, 0);
  if (total === 0) return equalCategoryWeights(habits, category);
  return merged;
}

/**
 * Category score for one day: weighted average of habit scores in category.
 * Weights default to equal split. Rest days excluded; unlogged habits count as 0.
 */
export function categoryScore(
  category: string,
  habits: Habit[],
  logs: DayLog[],
  date: string,
  weights?: CategoryWeights,
): CategoryScoreResult {
  const breakdown = categoryScoreBreakdown(category, habits, logs, date, weights);
  if (breakdown.kind === "score") {
    return { kind: "score", value: reconstructCategoryScore(breakdown.components) };
  }
  return breakdown;
}

export interface CategoryScoreComponent {
  habitId: string;
  weight: number;
  score: number;
}

export type CategoryScoreBreakdown =
  | { kind: "score"; components: CategoryScoreComponent[] }
  | { kind: "rest" }
  | { kind: "empty" };

/** Per-activity weighted parts that compose a Life-Area score for one day. */
export function categoryScoreBreakdown(
  category: string,
  habits: Habit[],
  logs: DayLog[],
  date: string,
  weights?: CategoryWeights,
): CategoryScoreBreakdown {
  const scoped = habitsInCategory(habits, category);
  if (scoped.length === 0) return { kind: "empty" };

  if (isAllRestDay(habits, logs, date, category)) return { kind: "rest" };

  const w = weights ?? equalCategoryWeights(habits, category);
  const components: CategoryScoreComponent[] = [];

  for (const habit of scoped) {
    const value = logValueForHabit(logs, habit.id, date);
    const row = logs.find((l) => l.habitId === habit.id && l.date === date);
    if (isRestLog(value, row?.isRest)) continue;

    const weight = w[habit.id] ?? 0;
    if (weight <= 0) continue;

    const score = habitScore(habit, value, row?.isRest) ?? 0;
    components.push({ habitId: habit.id, weight, score });
  }

  if (components.length === 0) return { kind: "empty" };
  return { kind: "score", components };
}

function reconstructCategoryScoreFromParts(weightedSum: number, weightTotal: number): number {
  if (weightTotal === 0) return 0;
  return Math.round(weightedSum / weightTotal);
}

/** Reconstruct a Life-Area score from weighted activity components (M6 guard). */
export function reconstructCategoryScore(components: CategoryScoreComponent[]): number {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const c of components) {
    weightedSum += c.weight * c.score;
    weightTotal += c.weight;
  }
  return reconstructCategoryScoreFromParts(weightedSum, weightTotal);
}

/** Display points contributed by one weighted activity score (0–100 weight, 0–100 score). */
export function weightedScoreContribution(weight: number, score: number): number {
  return Math.round((weight * score) / 100);
}

export function categorySeries(
  category: string,
  habits: Habit[],
  logs: DayLog[],
  dates: string[],
  weights?: CategoryWeights,
): Array<number | null> {
  const w = weights ?? equalCategoryWeights(habits, category);
  return dates.map((date) => {
    const result = categoryScore(category, habits, logs, date, w);
    if (result.kind === "score") return result.value;
    if (result.kind === "rest") return -1;
    return null;
  });
}

export function categoryScoreNumeric(
  category: string,
  habits: Habit[],
  logs: DayLog[],
  date: string,
  weights?: CategoryWeights,
): number | null {
  const w = weights ?? equalCategoryWeights(habits, category);
  const result = categoryScore(category, habits, logs, date, w);
  if (result.kind === "score") return result.value;
  return null;
}

export function habitConsistencyInRange(habit: Habit, logs: DayLog[], dates: string[]): number {
  return average(habitScoresOverRange(habit, logs, dates));
}

export function bestDayInRange(
  category: string,
  habits: Habit[],
  logs: DayLog[],
  dates: string[],
  weights?: CategoryWeights,
): { date: string; score: number } | null {
  const w = weights ?? equalCategoryWeights(habits, category);
  let best: { date: string; score: number } | null = null;
  for (const date of dates) {
    const result = categoryScore(category, habits, logs, date, w);
    if (result.kind !== "score") continue;
    if (!best || result.value > best.score) {
      best = { date, score: result.value };
    }
  }
  return best;
}

export function countLogsInRange(
  category: string,
  habits: Habit[],
  logs: DayLog[],
  dates: string[],
): number {
  const ids = new Set(habitsInCategory(habits, category).map((h) => h.id));
  const dateSet = new Set(dates);
  return logs.filter(
    (l) => ids.has(l.habitId) && dateSet.has(l.date) && l.value !== null && !l.isRest && l.value !== -1,
  ).length;
}

export function activityLevel(
  category: string,
  habits: Habit[],
  logs: DayLog[],
  date: string,
  weights?: CategoryWeights,
): 0 | 1 | 2 | 3 | "rest" {
  const result = categoryScore(category, habits, logs, date, weights);
  if (result.kind === "rest") return "rest";
  if (result.kind === "empty") return 0;
  if (result.value >= 80) return 3;
  if (result.value >= 40) return 2;
  return 1;
}

export function weekAverage(
  category: string,
  habits: Habit[],
  logs: DayLog[],
  dates: string[],
  weights?: CategoryWeights,
): number {
  const values = categorySeries(category, habits, logs, dates, weights).filter(
    (v): v is number => v !== null && v >= 0,
  );
  return average(values);
}

export function dayScoreSeries(habits: Habit[], logs: DayLog[], dates: string[]): number[] {
  return dates.map((d) => dayScore(habits, logs, d));
}

export function activeHabitCount(habits: Habit[], category: string): number {
  return habitsInCategory(habits, category).length;
}

export function totalHabitCount(habits: Habit[], category: string): number {
  return habits.filter((h) => h.category === category).length;
}

/** Convert weight map to editor items and normalize to 100%. */
export function categoryWeightsToItems(weights: CategoryWeights, habits: Habit[], category: string) {
  return habitsInCategory(habits, category).map((h) => ({
    habitId: h.id,
    weight: weights[h.id] ?? 0,
  }));
}

export function itemsToCategoryWeights(items: Array<{ habitId: string; weight: number }>): CategoryWeights {
  const normalized = normalizeWeights(items);
  const out: CategoryWeights = {};
  for (const item of normalized) {
    out[item.habitId] = item.weight;
  }
  return out;
}

export function habitWeightContribution(
  habitId: string,
  habitScoreValue: number | null,
  weights: CategoryWeights,
): number {
  if (habitScoreValue === null) return 0;
  const weight = weights[habitId] ?? 0;
  return Math.round((weight * habitScoreValue) / 100);
}
