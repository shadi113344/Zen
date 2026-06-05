import { addDays, lastNDays } from "./streaks";
import { habitScore, logValueForHabit } from "./scoring";
import { categoryScore } from "./categories";
import type {
  CategoryScoreResult,
  CategoryWeights,
  DayLog,
  Goal,
  GoalConsistencyMeta,
  GoalCumulativeMeta,
  GoalHabitLink,
  GoalHabitWeekMeta,
  GoalHeaderMeta,
  GoalKind,
  GoalPeriod,
  GoalProgressMeta,
  Habit,
} from "./types";

/** Dates included in one goal evaluation period ending on `endDate`. */
export function goalPeriodDates(period: GoalPeriod, endDate: string): string[] {
  if (period === "daily") return [endDate];
  return lastNDays(endDate, 7);
}

/** Average habit score across dates in range; null scores (rest/unlogged) excluded. */
export function habitScoreOverPeriod(habit: Habit, logs: DayLog[], dates: string[]): number {
  const scores: number[] = [];
  for (const date of dates) {
    const value = logValueForHabit(logs, habit.id, date);
    const row = logs.find((l) => l.habitId === habit.id && l.date === date);
    const score = habitScore(habit, value, row?.isRest);
    if (score !== null) scores.push(score);
  }
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function addDaysLocal(dateKey: string, delta: number): string {
  const d = new Date(dateKey + "T12:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function parseDate(dateKey: string): Date {
  return new Date(dateKey + "T12:00:00");
}

function daysBetween(start: string, end: string): number {
  const a = parseDate(start).getTime();
  const b = parseDate(end).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

/** Monday–Sunday week containing `dateKey`. */
export function weekRangeContaining(dateKey: string): { start: string; end: string } {
  const d = parseDate(dateKey);
  const dow = d.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const start = addDaysLocal(dateKey, mondayOffset);
  const end = addDaysLocal(start, 6);
  return { start, end };
}

export function datesFromTo(start: string, end: string): string[] {
  if (end < start) return [];
  const out: string[] = [];
  for (let d = start; d <= end; d = addDaysLocal(d, 1)) {
    out.push(d);
  }
  return out;
}

/** True when habit counts as “done” for goal cadence (not rest, has progress). */
export function habitCountsForGoal(habit: Habit, logs: DayLog[], date: string): boolean {
  const value = logValueForHabit(logs, habit.id, date);
  const row = logs.find((l) => l.habitId === habit.id && l.date === date);
  if (row?.isRest || value === -1) return false;
  if (value === null) return false;
  if (habit.type === "check" || habit.type === "onetime") return value > 0;
  return Number(value) > Number(habit.min ?? 0);
}

export function countHabitDaysInWeek(
  habitId: string,
  habits: Habit[],
  logs: DayLog[],
  weekEndDate: string,
): number {
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return 0;
  const { start, end } = weekRangeContaining(weekEndDate);
  let count = 0;
  for (const date of datesFromTo(start, end)) {
    if (habitCountsForGoal(habit, logs, date)) count += 1;
  }
  return count;
}

export function habitWeekMeta(
  habitId: string,
  habits: Habit[],
  logs: DayLog[],
  asOfDate: string,
  daysPerWeek: number,
): GoalHabitWeekMeta {
  const { end } = weekRangeContaining(asOfDate);
  const done = countHabitDaysInWeek(habitId, habits, logs, end);
  return { done, target: daysPerWeek };
}

export function weekEndingDatesInRange(startDate: string, endDate: string, asOfDate: string): string[] {
  const cap = asOfDate < endDate ? asOfDate : endDate;
  if (cap < startDate) return [];
  const seen = new Set<string>();
  for (const date of datesFromTo(startDate, cap)) {
    seen.add(weekRangeContaining(date).end);
  }
  return [...seen].sort();
}

export function goalIsActive(goal: Goal, date: string): boolean {
  return date >= goal.startDate && date <= goal.endDate;
}

export function activeGoals(goals: Goal[], date: string): Goal[] {
  return goals.filter((g) => goalIsActive(g, date));
}

export function linksForGoal(goalId: string, links: GoalHabitLink[]): GoalHabitLink[] {
  return links.filter((l) => l.goalId === goalId);
}

export function goalsForHabit(
  goals: Goal[],
  links: GoalHabitLink[],
  habitId: string,
  date: string,
): Goal[] {
  const goalIds = new Set(links.filter((l) => l.habitId === habitId).map((l) => l.goalId));
  return activeGoals(goals, date).filter((g) => goalIds.has(g.id));
}

export function habitIdsForGoal(goalId: string, links: GoalHabitLink[]): string[] {
  return links.filter((l) => l.goalId === goalId).map((l) => l.habitId);
}

export function cumulativeTotalForHabit(habitId: string, habits: Habit[], logs: DayLog[], dates: string[]): number {
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return 0;
  let sum = 0;
  for (const date of dates) {
    const value = logValueForHabit(logs, habit.id, date);
    const row = logs.find((l) => l.habitId === habit.id && l.date === date);
    if (row?.isRest || value === -1 || value === null) continue;
    sum += Number(value);
  }
  return sum;
}

export function goalConsistencyMeta(
  goal: Goal,
  links: GoalHabitLink[],
  habits: Habit[],
  logs: DayLog[],
  asOfDate: string,
): GoalConsistencyMeta {
  const daysPerWeek = goal.daysPerWeek ?? 5;
  const weekEnds = weekEndingDatesInRange(goal.startDate, goal.endDate, asOfDate);
  let weeksMet = 0;
  const scoped = linksForGoal(goal.id, links);
  for (const weekEnd of weekEnds) {
    let weekOk = true;
    for (const link of scoped) {
      const done = countHabitDaysInWeek(link.habitId, habits, logs, weekEnd);
      if (link.required && done < daysPerWeek) {
        weekOk = false;
        break;
      }
      if (!link.required && done < daysPerWeek) {
        weekOk = false;
      }
    }
    if (scoped.length === 0) weekOk = false;
    if (weekOk) weeksMet += 1;
  }
  const allWeekEnds = weekEndingDatesInRange(goal.startDate, goal.endDate, goal.endDate);
  const weeksTotal = allWeekEnds.length;
  const weeksRemaining = Math.max(0, weeksTotal - weekEnds.length);
  const progressPct = weeksTotal > 0 ? Math.round((weeksMet / weeksTotal) * 100) : 0;
  const primary = scoped[0];
  const week =
    primary != null
      ? habitWeekMeta(primary.habitId, habits, logs, asOfDate, daysPerWeek)
      : { done: 0, target: daysPerWeek };

  return {
    kind: "consistency",
    week,
    weeksMet,
    weeksTotal,
    weeksRemaining,
    progressPct,
  };
}

export function goalCumulativeMeta(
  goal: Goal,
  links: GoalHabitLink[],
  habits: Habit[],
  logs: DayLog[],
  asOfDate: string,
): GoalCumulativeMeta {
  const target = goal.targetTotal ?? 1;
  const unit = goal.unit ?? "";
  const scoped = linksForGoal(goal.id, links);
  const end = asOfDate < goal.endDate ? asOfDate : goal.endDate;
  const dates = datesFromTo(goal.startDate, end);
  let logged = 0;
  for (const link of scoped) {
    logged += cumulativeTotalForHabit(link.habitId, habits, logs, dates);
  }
  const progressPct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0;
  return { kind: "cumulative", logged, target, unit, progressPct };
}

export function goalHeaderMeta(
  goal: Goal,
  links: GoalHabitLink[],
  habits: Habit[],
  logs: DayLog[],
  asOfDate: string,
): GoalHeaderMeta {
  const daysRemaining = daysBetween(asOfDate, goal.endDate);
  if (goal.kind === "cumulative") {
    const m = goalCumulativeMeta(goal, links, habits, logs, asOfDate);
    const logged = formatAmount(m.logged, m.unit);
    const target = formatAmount(m.target, m.unit);
    return {
      goalId: goal.id,
      name: goal.name,
      kind: goal.kind,
      progressPct: m.progressPct,
      daysRemaining,
      summary: `${logged} / ${target}${daysRemaining > 0 ? ` · ${daysRemaining}d left` : ""}`,
    };
  }
  const m = goalConsistencyMeta(goal, links, habits, logs, asOfDate);
  return {
    goalId: goal.id,
    name: goal.name,
    kind: goal.kind,
    progressPct: m.progressPct,
    daysRemaining,
    summary: `${m.weeksMet}/${m.weeksTotal} weeks on plan${daysRemaining > 0 ? ` · ${daysRemaining}d left` : ""}`,
  };
}

export function habitGoalProgressMeta(
  goal: Goal,
  habitId: string,
  habits: Habit[],
  logs: DayLog[],
  asOfDate: string,
): GoalProgressMeta | null {
  if (goal.kind === "cumulative") {
    const target = goal.targetTotal ?? 1;
    const end = asOfDate < goal.endDate ? asOfDate : goal.endDate;
    const dates = datesFromTo(goal.startDate, end);
    const logged = cumulativeTotalForHabit(habitId, habits, logs, dates);
    const unit = goal.unit ?? "";
    const progressPct = target > 0 ? Math.min(100, Math.round((logged / target) * 100)) : 0;
    return { kind: "cumulative", logged, target, unit, progressPct };
  }
  if (goal.kind === "consistency") {
    const daysPerWeek = goal.daysPerWeek ?? 5;
    const week = habitWeekMeta(habitId, habits, logs, asOfDate, daysPerWeek);
    const weekEnds = weekEndingDatesInRange(goal.startDate, goal.endDate, asOfDate);
    let weeksMet = 0;
    for (const weekEnd of weekEnds) {
      const done = countHabitDaysInWeek(habitId, habits, logs, weekEnd);
      if (done >= daysPerWeek) weeksMet += 1;
    }
  const allWeekEnds = weekEndingDatesInRange(goal.startDate, goal.endDate, goal.endDate);
  const weeksTotal = allWeekEnds.length;
  const weeksRemaining = Math.max(0, weeksTotal - weekEnds.length);
  const progressPct = weeksTotal > 0 ? Math.round((weeksMet / weeksTotal) * 100) : 0;
  return { kind: "consistency", week, weeksMet, weeksTotal, weeksRemaining, progressPct };
}
  return null;
}

function formatAmount(n: number, unit: string): string {
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return unit ? `${rounded} ${unit}` : rounded;
}

/** Short line for habit row under Today (e.g. "3/5 this week", "4/10 h"). */
export function formatHabitGoalLine(meta: GoalProgressMeta): string {
  if (meta.kind === "consistency") {
    return `${meta.week.done}/${meta.week.target} this week`;
  }
  const unit = meta.unit ? ` ${meta.unit}` : "";
  return `${formatAmount(meta.logged, "")}/${formatAmount(meta.target, "")}${unit}`;
}

/**
 * Overall goal progress 0–100.
 * Legacy goals use weighted habit scores; consistency/cumulative use dedicated math.
 */
export function goalProgress(
  goal: Goal,
  links: GoalHabitLink[],
  habits: Habit[],
  logs: DayLog[],
  endDate: string,
): number {
  const kind: GoalKind = goal.kind ?? "legacy";
  if (kind === "consistency") return goalConsistencyMeta(goal, links, habits, logs, endDate).progressPct;
  if (kind === "cumulative") return goalCumulativeMeta(goal, links, habits, logs, endDate).progressPct;

  const scoped = links.filter((l) => l.goalId === goal.id);
  if (scoped.length === 0) return 0;
  const period = goal.period ?? "weekly";
  const dates = goalPeriodDates(period, endDate);
  let weightedSum = 0;
  let weightTotal = 0;
  for (const link of scoped) {
    const habit = habits.find((h) => h.id === link.habitId);
    if (!habit || habit.paused) continue;
    const avg = habitScoreOverPeriod(habit, logs, dates);
    const contribution = link.required && avg < 100 ? 0 : avg;
    weightedSum += link.weight * contribution;
    weightTotal += link.weight;
  }
  if (weightTotal <= 0) return 0;
  return Math.round(weightedSum / weightTotal);
}

export function goalMet(
  goal: Goal,
  links: GoalHabitLink[],
  habits: Habit[],
  logs: DayLog[],
  endDate: string,
): boolean {
  const target = goal.targetPercent ?? 80;
  return goalProgress(goal, links, habits, logs, endDate) >= target;
}

/** Last N period end dates (daily = days, weekly = week-ending days). */
export function goalHistoryPeriodEnds(period: GoalPeriod, endDate: string, count: number): string[] {
  const ends: string[] = [];
  let cursor = endDate;
  for (let i = 0; i < count; i++) {
    ends.push(cursor);
    cursor = period === "daily" ? addDaysLocal(cursor, -1) : addDaysLocal(cursor, -7);
  }
  return ends;
}

export function goalHistory(
  goal: Goal,
  links: GoalHabitLink[],
  habits: Habit[],
  logs: DayLog[],
  endDate: string,
  periods = 7,
): Array<{ endDate: string; progress: number; met: boolean }> {
  const target = goal.targetPercent ?? 80;
  if ((goal.kind ?? "legacy") === "legacy" && goal.period) {
    return goalHistoryPeriodEnds(goal.period, endDate, periods).map((d) => {
      const progress = goalProgress(goal, links, habits, logs, d);
      return { endDate: d, progress, met: progress >= target };
    });
  }
  return weekEndingDatesInRange(goal.startDate, endDate, endDate)
    .slice(-periods)
    .map((d) => {
      const progress = goalProgress(goal, links, habits, logs, d);
      return { endDate: d, progress, met: progress >= (goal.targetPercent ?? 80) };
    });
}

/** Pick category from linked habits (mode of categories, else first habit). */
export function inferGoalCategory(habits: Habit[], habitIds: string[]): string | undefined {
  const cats = habitIds
    .map((id) => habits.find((h) => h.id === id)?.category?.trim())
    .filter((c): c is string => !!c);
  if (cats.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const c of cats) counts.set(c, (counts.get(c) ?? 0) + 1);
  let best = cats[0]!;
  let max = 0;
  for (const [cat, n] of counts) {
    if (n > max) {
      max = n;
      best = cat;
    }
  }
  return best;
}

/** Goals assigned to this category, or inferred via linked habits in the category. */
export function goalsForCategory(
  goals: Goal[],
  links: GoalHabitLink[],
  habits: Habit[],
  category: string,
): Goal[] {
  const cat = category.trim();
  const habitIdsInCat = new Set(habits.filter((h) => h.category === cat).map((h) => h.id));
  return goals.filter((g) => {
    if (g.category?.trim() === cat) return true;
    const linked = linksForGoal(g.id, links);
    return linked.some((l) => habitIdsInCat.has(l.habitId));
  });
}

/** Average progress (0–100) of active goals in a category on `date`; null if none. */
export function categoryGoalsProgress(
  category: string,
  goals: Goal[],
  links: GoalHabitLink[],
  habits: Habit[],
  logs: DayLog[],
  date: string,
): number | null {
  const scoped = activeGoals(goalsForCategory(goals, links, habits, category), date);
  if (scoped.length === 0) return null;
  const total = scoped.reduce((sum, g) => sum + goalProgress(g, links, habits, logs, date), 0);
  return Math.round(total / scoped.length);
}

/**
 * Category group score: blends habit category score with active goal progress when goals exist.
 * 50/50 when both are available; goals-only or habits-only otherwise.
 */
export function categoryGroupScore(
  category: string,
  habits: Habit[],
  logs: DayLog[],
  date: string,
  goals: Goal[],
  goalLinks: GoalHabitLink[],
  weights?: CategoryWeights,
): CategoryScoreResult {
  const habitResult = categoryScore(category, habits, logs, date, weights);
  const goalPct = categoryGoalsProgress(category, goals, goalLinks, habits, logs, date);

  if (goalPct === null) return habitResult;
  if (habitResult.kind === "score") {
    return { kind: "score", value: Math.round((habitResult.value + goalPct) / 2) };
  }
  return { kind: "score", value: goalPct };
}

/** Numeric 0–100 for category group score; null when empty. */
export function categoryGroupScoreNumeric(
  category: string,
  habits: Habit[],
  logs: DayLog[],
  date: string,
  goals: Goal[],
  goalLinks: GoalHabitLink[],
  weights?: CategoryWeights,
): number | null {
  const result = categoryGroupScore(category, habits, logs, date, goals, goalLinks, weights);
  return result.kind === "score" ? result.value : null;
}

/** Normalize goals loaded without kind (treat as legacy). */
export function normalizeGoal(raw: Goal): Goal {
  const base = raw.kind
    ? raw
    : {
        ...raw,
        kind: "legacy" as const,
        startDate: raw.startDate ?? "2020-01-01",
        endDate: raw.endDate ?? "2099-12-31",
        period: raw.period ?? "weekly",
        targetPercent: raw.targetPercent ?? 80,
      };
  return base;
}
