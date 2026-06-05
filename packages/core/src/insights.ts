import { habitScoreOverPeriod } from "./goals";
import { dayScore, habitScore, logValueForHabit } from "./scoring";
import { addDays, consistency30d, lastNDays } from "./streaks";
import { weekAverage, uniqueCategories } from "./categories";
import type { CategoryWeights, DayLog, Habit } from "./types";

/** Max habits on the activity radar so labels stay readable */
export const HABIT_RADAR_LIMIT = 6;

export type ActivityCellLevel = 0 | 1 | 2 | 3 | "rest" | "none";

/** Single-habit activity strength for calendar cells. */
export function habitActivityLevel(habit: Habit, logs: DayLog[], date: string): ActivityCellLevel {
  const value = logValueForHabit(logs, habit.id, date);
  const row = logs.find((l) => l.habitId === habit.id && l.date === date);
  if (value === null && !row?.isRest) return "none";
  const score = habitScore(habit, value, row?.isRest);
  if (score === null) return "rest";
  if (score >= 80) return 3;
  if (score >= 40) return 2;
  if (score > 0) return 1;
  return 0;
}

/** Global day strength from overall dayScore. */
export function dayActivityLevel(habits: Habit[], logs: DayLog[], date: string): ActivityCellLevel {
  const active = habits.filter((h) => !h.paused);
  if (active.length === 0) return "none";

  const anyLog = active.some((h) => {
    const v = logValueForHabit(logs, h.id, date);
    const row = logs.find((l) => l.habitId === h.id && l.date === date);
    return v !== null || row?.isRest;
  });
  if (!anyLog) return "none";

  const score = dayScore(habits, logs, date);
  if (score >= 80) return 3;
  if (score >= 40) return 2;
  if (score > 0) return 1;
  return 0;
}

export interface RadarPoint {
  category: string;
  score: number;
}

export function radarCategoryScores(
  habits: Habit[],
  logs: DayLog[],
  dates: string[],
  weightsByCategory?: Record<string, CategoryWeights>,
): RadarPoint[] {
  return uniqueCategories(habits.filter((h) => !h.paused)).map((category) => ({
    category,
    score: weekAverage(category, habits, logs, dates, weightsByCategory?.[category]),
  }));
}

/** Top activities by consistency for the activity radar chart */
export function radarHabitScores(
  habits: Habit[],
  logs: DayLog[],
  dates: string[],
  limit = HABIT_RADAR_LIMIT,
): RadarPoint[] {
  return rankHabitsByConsistency(habits, logs, dates, () => 0)
    .slice(0, limit)
    .map(({ habit, consistency }) => ({
      category: habit.name,
      score: consistency,
    }));
}

export interface HabitMetricRow {
  habit: Habit;
  value: number;
}

/** Average logged-day score (0–100) per activity over the period */
export function habitPerformanceRows(habits: Habit[], logs: DayLog[], dates: string[]): HabitMetricRow[] {
  return habits
    .filter((h) => !h.paused)
    .map((habit) => ({
      habit,
      value: habitScoreOverPeriod(habit, logs, dates),
    }))
    .sort((a, b) => b.value - a.value);
}

export interface HabitConsistencyRow {
  habit: Habit;
  consistency: number;
  currentStreak: number;
}

export function rankHabitsByConsistency(
  habits: Habit[],
  logs: DayLog[],
  dates: string[],
  streakFn: (habit: Habit) => number,
): HabitConsistencyRow[] {
  return habits
    .filter((h) => !h.paused)
    .map((habit) => ({
      habit,
      consistency: consistency30d(habit, logs, dates),
      currentStreak: streakFn(habit),
    }))
    .sort((a, b) => b.consistency - a.consistency);
}

export function bestHabitByConsistency(
  habits: Habit[],
  logs: DayLog[],
  dates: string[],
): Habit | null {
  const ranked = rankHabitsByConsistency(habits, logs, dates, () => 0);
  return ranked[0]?.habit ?? null;
}

export function categoryHabitExtremes(
  habits: Habit[],
  logs: DayLog[],
  category: string,
  dates: string[],
): { best: Habit | null; weakest: Habit | null } {
  const scoped = habits.filter((h) => h.category === category && !h.paused);
  const ranked = rankHabitsByConsistency(scoped, logs, dates, () => 0);
  const best = ranked[0]?.habit ?? null;
  const weakest = ranked.length > 0 ? ranked[ranked.length - 1]!.habit : null;
  return { best, weakest };
}

/** Last N weeks as rows of 7 days (Sun–Sat columns). */
export function heatmapWeeks(end: string, weeks: number): string[][] {
  const totalDays = weeks * 7;
  const days = lastNDays(end, totalDays);
  const rows: string[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }
  return rows;
}

export interface HeatmapDayCell {
  date: string;
  /** False for padding days outside the selected analysis period. */
  inRange: boolean;
}

/** Week rows (Sun–Sat) covering an analysis period, padded to full weeks. */
export function heatmapWeeksFromDates(dates: string[]): HeatmapDayCell[][] {
  if (dates.length === 0) return [];
  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  const firstDow = new Date(first + "T12:00:00").getDay();
  const lastDow = new Date(last + "T12:00:00").getDay();
  const start = addDays(first, -firstDow);
  const end = addDays(last, 6 - lastDow);
  const cells: HeatmapDayCell[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    cells.push({ date: d, inRange: d >= first && d <= last });
  }
  const rows: HeatmapDayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export interface HabitDayRow {
  date: string;
  value: number | null;
  isRest: boolean;
  score: number | null;
  label: string;
}

export function habitDayHistory(habit: Habit, logs: DayLog[], dates: string[]): HabitDayRow[] {
  return [...dates].reverse().map((date) => {
    const value = logValueForHabit(logs, habit.id, date);
    const row = logs.find((l) => l.habitId === habit.id && l.date === date);
    const isRest = row?.isRest === true || value === -1;
    const score = habitScore(habit, value, row?.isRest);
    return {
      date,
      value: isRest ? -1 : value,
      isRest,
      score,
      label: formatDayLabel(date),
    };
  });
}

function formatDayLabel(dateKey: string): string {
  const d = new Date(dateKey + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
