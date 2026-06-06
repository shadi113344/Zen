import { habitScore, isNumericLikeHabit, isNumericStreakDay, isRestLog, logValueForHabit } from "./scoring";
import type { DayLog, Habit, StreakResult } from "./types";

/**
 * Whether a habit counts as done for streak purposes.
 * Numeric/milestone follows progressScoring:
 * - scale: max reached that day
 * - any: any value > 0 that day
 */
export function isHabitDone(habit: Habit, value: number | null, isRest?: boolean): boolean {
  if (isRestLog(value, isRest)) return true;
  if (value === null) return false;
  if (habit.type === "check" || habit.type === "onetime") return value > 0;
  if (isNumericLikeHabit(habit)) return isNumericStreakDay(habit, value);
  return false;
}

/** Streak count and 🔥 UI appear from this many consecutive days onward. */
export const STREAK_VISIBLE_MIN = 2;

export function hasVisibleStreak(days: number): boolean {
  return days >= STREAK_VISIBLE_MIN;
}

/** Streak value for display; 0 until {@link STREAK_VISIBLE_MIN} days. */
export function visibleStreak(days: number): number {
  return hasVisibleStreak(days) ? days : 0;
}

export function streak(habitId: string, habit: Habit, logs: DayLog[], today: string): StreakResult {
  const current = currentStreak(habit, logs, today);
  const best = longestStreak(habit, logs, today);
  return { current, best };
}

export function currentStreak(habit: Habit, logs: DayLog[], today: string): number {
  let count = 0;
  let cursor = today;
  const todayVal = logValueForHabit(logs, habit.id, today);
  const todayRow = logs.find((l) => l.habitId === habit.id && l.date === today);
  const todayDone = isHabitDone(habit, todayVal, todayRow?.isRest);

  if (!todayDone) {
    cursor = addDays(cursor, -1);
  }

  for (let i = 0; i < 3650; i++) {
    const value = logValueForHabit(logs, habit.id, cursor);
    const row = logs.find((l) => l.habitId === habit.id && l.date === cursor);
    if (isHabitDone(habit, value, row?.isRest)) {
      count++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return count;
}

export function longestStreak(habit: Habit, logs: DayLog[], today: string): number {
  const dates = [...new Set(logs.filter((l) => l.habitId === habit.id).map((l) => l.date))].sort();
  if (dates.length === 0) return 0;

  let best = 0;
  let run = 0;
  let cursor = dates[0]!;

  while (cursor <= today) {
    const value = logValueForHabit(logs, habit.id, cursor);
    const row = logs.find((l) => l.habitId === habit.id && l.date === cursor);
    if (isHabitDone(habit, value, row?.isRest)) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }
    cursor = addDays(cursor, 1);
  }
  return best;
}

export function consistency30d(habit: Habit, logs: DayLog[], dates: string[]): number {
  const scores = dates
    .map((date) => {
      const value = logValueForHabit(logs, habit.id, date);
      const row = logs.find((l) => l.habitId === habit.id && l.date === date);
      return habitScore(habit, value, row?.isRest);
    })
    .filter((s): s is number => s !== null);
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function addDays(dateKey: string, delta: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function lastNDays(end: string, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(addDays(end, -i));
  }
  return out;
}

export function datesForRange(range: "day" | "week" | "month" | "all", end: string, earliest?: string): string[] {
  switch (range) {
    case "day":
      return [end];
    case "week":
      return lastNDays(end, 7);
    case "month":
      return lastNDays(end, 30);
    case "all": {
      if (!earliest) return lastNDays(end, 90);
      const out: string[] = [];
      let cursor = earliest;
      while (cursor <= end) {
        out.push(cursor);
        cursor = addDays(cursor, 1);
      }
      return out;
    }
  }
}

export type InsightsPeriod = "today" | "week" | "month" | "year" | "all";

export function datesForInsightsPeriod(period: InsightsPeriod, end: string, earliest?: string): string[] {
  switch (period) {
    case "today":
      return [end];
    case "week":
      return lastNDays(end, 7);
    case "month":
      return lastNDays(end, 30);
    case "year":
      return lastNDays(end, 365);
    case "all":
      return datesForRange("all", end, earliest);
  }
}

export function insightsHeatmapWeeks(period: InsightsPeriod, end: string, earliest?: string): number {
  switch (period) {
    case "today":
      return 1;
    case "week":
      return 5;
    case "month":
      return 5;
    case "year":
      return 52;
    case "all": {
      const days = datesForInsightsPeriod("all", end, earliest);
      return Math.min(52, Math.max(4, Math.ceil(days.length / 7)));
    }
  }
}

export function insightsPeriodLabel(period: InsightsPeriod): string {
  switch (period) {
    case "today":
      return "Today";
    case "week":
      return "Week";
    case "month":
      return "Month";
    case "year":
      return "Year";
    case "all":
      return "All";
  }
}

/** Title for the daily score bar chart on Insights */
export function insightsDayScoreTitle(period: InsightsPeriod, dayCount: number): string {
  const span = insightsPeriodLabel(period);
  switch (period) {
    case "today":
      return `Score · ${span}`;
    case "week":
      return `7-day score · ${span}`;
    case "month":
      return `${dayCount}-day score · ${span}`;
    case "year":
      return `Daily score · ${span}`;
    case "all":
      return `Daily score · ${span} (${dayCount}d)`;
  }
}
