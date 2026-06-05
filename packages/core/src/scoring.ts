import type { DayLog, Habit, LogValue } from "./types";

/** Rest is stored as value -1 or isRest flag. */
export function isRestLog(value: LogValue, isRest?: boolean): boolean {
  return isRest === true || value === -1;
}

/** Not logged — excluded from category/day averages. */
export function isNotLogged(value: LogValue, isRest?: boolean): boolean {
  return value === null && !isRest;
}

/**
 * Score a single habit for one day: 0–100.
 * Returns null when rest (excluded from aggregates).
 */
export function habitScore(habit: Habit, value: LogValue, isRest?: boolean): number | null {
  if (isRestLog(value, isRest)) return null;
  if (isNotLogged(value, isRest)) return null;

  if (habit.type === "check" || habit.type === "onetime") {
    return value! > 0 ? 100 : 0;
  }

  const v = Number(value ?? 0);
  if (v <= 0) return 0;

  const min = Number(habit.min ?? 0);
  const max = Number(habit.max ?? 1);
  if (max <= min) return v >= max ? 100 : 0;

  const ratio = Math.min(Math.max((v - min) / (max - min), 0), 1);
  return Math.round(ratio * 100);
}

export function logValueForHabit(logs: DayLog[], habitId: string, date: string): LogValue {
  const row = logs.find((l) => l.habitId === habitId && l.date === date);
  if (!row) return null;
  if (row.isRest || row.value === -1) return -1;
  return row.value;
}

/** Increment or decrement a numeric habit log by its configured step (always a fixed step size). */
export function bumpNumericLogValue(
  current: LogValue,
  direction: 1 | -1,
  habit: Pick<Habit, "min" | "max" | "step">,
): number {
  const min = Number(habit.min ?? 0);
  const max = Number(habit.max ?? 100);
  const step = Math.max(1, Number(habit.step) || 1);
  const cur = Number(current ?? 0);
  const base = Number.isFinite(cur) ? cur : 0;
  return Math.min(max, Math.max(min, base + direction * step));
}

function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.paused);
}

function scorableHabitsForDay(habits: Habit[], logs: DayLog[], date: string): Array<{ habit: Habit; score: number }> {
  const items: Array<{ habit: Habit; score: number }> = [];
  for (const habit of activeHabits(habits)) {
    const value = logValueForHabit(logs, habit.id, date);
    const row = logs.find((l) => l.habitId === habit.id && l.date === date);
    const score = habitScore(habit, value, row?.isRest);
    if (score === null) continue;
    items.push({ habit, score });
  }
  return items;
}

/** Average habit scores for one day; 0 if no scorable habits. */
export function dayScore(habits: Habit[], logs: DayLog[], date: string): number {
  const items = scorableHabitsForDay(habits, logs, date);
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, i) => acc + i.score, 0);
  return Math.round(sum / items.length);
}

/** Whether every active habit in scope is on rest for the date. */
export function isAllRestDay(habits: Habit[], logs: DayLog[], date: string, category?: string): boolean {
  const scoped = activeHabits(habits).filter((h) => !category || h.category === category);
  if (scoped.length === 0) return false;
  return scoped.every((h) => {
    const value = logValueForHabit(logs, h.id, date);
    const row = logs.find((l) => l.habitId === h.id && l.date === date);
    return isRestLog(value, row?.isRest);
  });
}

export function habitScoresOverRange(habit: Habit, logs: DayLog[], dates: string[]): number[] {
  return dates
    .map((date) => {
      const value = logValueForHabit(logs, habit.id, date);
      const row = logs.find((l) => l.habitId === habit.id && l.date === date);
      return habitScore(habit, value, row?.isRest);
    })
    .filter((s): s is number => s !== null);
}

export function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export interface HeroCopy {
  status: string;
  suggestion: string;
}

export function heroCopy(score: number): HeroCopy {
  if (score >= 100) {
    return { status: "Perfect day.", suggestion: "You showed up everywhere." };
  }
  if (score >= 80) {
    return { status: "Strong day.", suggestion: "Keep the streak alive." };
  }
  if (score >= 50) {
    return {
      status: "Solid momentum.",
      suggestion: "A few quick logs can turn this into a strong day.",
    };
  }
  if (score > 0) {
    return { status: "Building momentum.", suggestion: "Log the next small action." };
  }
  return {
    status: "Clean start.",
    suggestion: "Log the small actions—the system handles the analysis.",
  };
}
