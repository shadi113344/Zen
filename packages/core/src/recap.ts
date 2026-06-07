import { uniqueCategories, weekAverage } from "./categories";
import { logValueForHabit } from "./scoring";
import { COMEBACK_MIN_GAP, isHabitDone, longestStreak, mondayIndex } from "./streaks";
import { taskCountsForPeriod } from "./tasks";
import type { CategoryWeights, DayLog, Habit, Task } from "./types";

export type RecapPeriod = "year" | "month";

export interface RecapStat<T> {
  value: T;
  habitId: string | null;
  /** Activity name — present so the UI *can* reveal it; abstract shares omit it. */
  habitName: string | null;
}

/**
 * Aggregate "Year/Month in habits" recap (G3). Pure & output-only: every field
 * is a number or an abstract label. The share frame shows the number, never the list.
 */
export interface RecapData {
  period: RecapPeriod;
  startDate: string;
  endDate: string;
  /** Distinct calendar days with ≥1 completed activity (rest days excluded). */
  daysShowedUp: number;
  /** Total completed activity check-ins (activity×day) in the window. */
  totalCheckIns: number;
  /** Longest unbroken streak (days) reached in the window. */
  bestStreak: RecapStat<number>;
  /** Biggest comeback: most missed days recovered before a successful return. */
  biggestComeback: RecapStat<number>;
  /** Most consistent Life Area by average score, or null when no data. */
  topLifeArea: { category: string; score: number } | null;
  /** Busiest weekday (Mon=0 … Sun=6) by completed check-ins, or null. */
  busiestWeekday: { weekday: number; count: number } | null;
  /** Completed tasks in the window (count only — never titles). */
  tasksCompleted: number;
  /** Active activities tracked in the window. */
  activeActivities: number;
}

const WEEKDAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function weekdayLabel(mondayIdx: number): string {
  return WEEKDAY_LABELS[mondayIdx] ?? "";
}

/** Whole-day difference b − a for two YYYY-MM-DD keys. */
function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ms = Date.UTC(by!, bm! - 1, bd!) - Date.UTC(ay!, am! - 1, ad!);
  return Math.round(ms / 86_400_000);
}

export interface BuildRecapOptions {
  weightsByCategory?: Record<string, CategoryWeights>;
  tasks?: Task[];
}

export function buildRecap(
  habits: Habit[],
  logs: DayLog[],
  dates: string[],
  period: RecapPeriod,
  options: BuildRecapOptions = {},
): RecapData {
  const active = habits.filter((h) => !h.paused);
  const dateSet = new Set(dates);
  const start = dates[0] ?? "";
  const end = dates[dates.length - 1] ?? "";

  const daysWithCheckin = new Set<string>();
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  let totalCheckIns = 0;

  for (const habit of active) {
    for (const date of dates) {
      const value = logValueForHabit(logs, habit.id, date);
      const row = logs.find((l) => l.habitId === habit.id && l.date === date);
      const isRest = row?.isRest === true || value === -1;
      if (isRest) continue; // a rest day isn't "showing up"
      if (!isHabitDone(habit, value, row?.isRest)) continue;
      totalCheckIns++;
      daysWithCheckin.add(date);
      weekdayCounts[mondayIndex(date)]!++;
    }
  }

  // Best streak (capped to the window) + biggest comeback, per activity.
  let bestStreak: RecapStat<number> = { value: 0, habitId: null, habitName: null };
  let biggestComeback: RecapStat<number> = { value: 0, habitId: null, habitName: null };

  for (const habit of active) {
    const streak = longestStreak(habit, logs, end);
    if (streak > bestStreak.value) {
      bestStreak = { value: streak, habitId: habit.id, habitName: habit.name };
    }

    const doneDates = logs
      .filter((l) => l.habitId === habit.id && dateSet.has(l.date))
      .map((l) => l.date)
      .filter((d) => {
        const value = logValueForHabit(logs, habit.id, d);
        const row = logs.find((l) => l.habitId === habit.id && l.date === d);
        return row?.isRest !== true && value !== -1 && isHabitDone(habit, value, row?.isRest);
      })
      .sort();
    for (let i = 1; i < doneDates.length; i++) {
      const missed = dayDiff(doneDates[i - 1]!, doneDates[i]!) - 1;
      if (missed >= COMEBACK_MIN_GAP && missed > biggestComeback.value) {
        biggestComeback = { value: missed, habitId: habit.id, habitName: habit.name };
      }
    }
  }

  // Top Life Area by average score over the window.
  let topLifeArea: { category: string; score: number } | null = null;
  for (const category of uniqueCategories(active)) {
    const score = weekAverage(category, habits, logs, dates, options.weightsByCategory?.[category]);
    if (!topLifeArea || score > topLifeArea.score) topLifeArea = { category, score };
  }

  // Busiest weekday.
  let busiestWeekday: { weekday: number; count: number } | null = null;
  for (let i = 0; i < 7; i++) {
    const count = weekdayCounts[i]!;
    if (count > 0 && (!busiestWeekday || count > busiestWeekday.count)) {
      busiestWeekday = { weekday: i, count };
    }
  }

  const tasksCompleted = options.tasks ? taskCountsForPeriod(options.tasks, dates).completed : 0;

  return {
    period,
    startDate: start,
    endDate: end,
    daysShowedUp: daysWithCheckin.size,
    totalCheckIns,
    bestStreak,
    biggestComeback,
    topLifeArea,
    busiestWeekday,
    tasksCompleted,
    activeActivities: active.length,
  };
}
