export type HabitType = "check" | "numeric" | "milestone" | "onetime";
export type LogValue = number | null;
/** Numeric/milestone: linear 0–100 by value, or any logged value > 0 counts as complete. */
export type ProgressScoring = "scale" | "any";

export interface Habit {
  id: string;
  name: string;
  category: string;
  type: HabitType;
  min?: number;
  max?: number;
  step?: number;
  paused?: boolean;
  orderIndex?: number;
  color?: string;
  remindAt?: string;
  why?: string;
  progressScoring?: ProgressScoring;
  /** "avoid" = a quit/abstinence activity; a logged day means "stayed clean". Default "do". */
  goalDirection?: "do" | "avoid";
  notify?: HabitNotifySettings;
}

export interface HabitNotifySettings {
  enabled?: boolean;
  times?: string[];
  days?: number[];
  message?: string;
  missedAlert?: boolean;
  remindAt?: string;
}

export interface NotificationSettings {
  enabled: boolean;
  quietHours: { start: string; end: string };
  maxPerDay: number;
  tone: "gentle" | "direct";
  vacationMode: boolean;
  dailyCheckIn: { enabled: boolean; time: string };
  smartMissed: { enabled: boolean; delayMinutes: number };
  motivation: { enabled: boolean };
  recovery: { enabled: boolean };
  lowScore: { enabled: boolean; threshold: number };
  reflection: { enabled: boolean; time: string };
  categoryRules: Array<{ category: string; enabled: boolean; time?: string }>;
}

export interface DayLog {
  habitId: string;
  date: string;
  value: LogValue;
  isRest?: boolean;
}

/**
 * One-off to-do. Lives alongside the daily ledger — never inside {@link DayLog}
 * — and is intentionally excluded from all scoring (it has no `value`/streak).
 */
export interface Task {
  id: string;
  title: string;
  /** Optional Life Area tag (reuses existing category strings). */
  category?: string;
  done: boolean;
  /** Optional deadline (YYYY-MM-DD). */
  dueDate?: string;
  note?: string;
  createdAt: string;
  /** Calendar day the task was added (YYYY-MM-DD). */
  createdDate?: string;
  /** Calendar day the task was marked done (YYYY-MM-DD). */
  completedDate?: string;
  completedAt?: string;
  /** User sort order (lower = higher in the open list). */
  orderIndex?: number;
  /** Optional daily reminder time (HH:MM). */
  remindAt?: string;
}

/**
 * Identity-based grouping — "who you're becoming" (G5). Private, owner-only;
 * groups Activities by an identity ("a runner", "a calm person"). Default-off mode.
 */
export interface Identity {
  id: string;
  label: string;
  color?: string;
  habitIds: string[];
}

export type ScoreResult = number | null;

export interface StreakResult {
  current: number;
  best: number;
}

export type DateRange = "day" | "week" | "month" | "all";

export type CategoryWeights = Record<string, number>;

export type CategoryScoreResult =
  | { kind: "score"; value: number }
  | { kind: "rest" }
  | { kind: "empty" };

/** @deprecated Legacy bucket goals — use kind "consistency" | "cumulative". */
export type GoalPeriod = "daily" | "weekly";

export type GoalKind = "consistency" | "cumulative" | "legacy";

/** Consistency cadence window: a calendar week (Mon–Sun) or calendar month. */
export type GoalCadencePeriod = "week" | "month";

/** Consistency target: `count` qualifying days per `period`. */
export interface GoalCadence {
  count: number;
  period: GoalCadencePeriod;
}

export interface Goal {
  id: string;
  name: string;
  kind: GoalKind;
  /** Category group for scoring and category pages (e.g. Movement, Mind). */
  category?: string;
  startDate: string;
  endDate: string;
  /** Consistency cadence ({@link GoalCadence}). Supersedes `daysPerWeek`. */
  cadence?: GoalCadence;
  /** @deprecated Consistency: days/week. Back-compat input for `cadence` ({period:"week"}). */
  daysPerWeek?: number;
  /** Cumulative: target units (e.g. 10 hours). */
  targetTotal?: number;
  unit?: string;
  /** Cumulative plan hint (optional display). */
  planIntervalDays?: number;
  planAmountPerSession?: number;
  /** Legacy daily/weekly habit score blend. */
  period?: GoalPeriod;
  targetPercent?: number;
  /** Optional accent color (hex). Falls back to a stable hash of id. */
  color?: string;
}

export interface GoalHabitLink {
  goalId: string;
  habitId: string;
  weight: number;
  required: boolean;
}

export interface GoalHabitWeekMeta {
  done: number;
  target: number;
}

export interface GoalConsistencyMeta {
  kind: "consistency";
  /** Cadence window these counts are measured over. */
  period: GoalCadencePeriod;
  /** Current-period progress (named `week` for back-compat; means current period). */
  week: GoalHabitWeekMeta;
  /** Periods (weeks or months) met / total / remaining for the cadence period. */
  weeksMet: number;
  weeksTotal: number;
  weeksRemaining: number;
  progressPct: number;
}

export interface GoalCumulativeMeta {
  kind: "cumulative";
  logged: number;
  target: number;
  unit: string;
  progressPct: number;
}

export type GoalProgressMeta = GoalConsistencyMeta | GoalCumulativeMeta;

export interface GoalHeaderMeta {
  goalId: string;
  name: string;
  kind: GoalKind;
  progressPct: number;
  summary: string;
  daysRemaining: number;
}
