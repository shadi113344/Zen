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

export interface Goal {
  id: string;
  name: string;
  kind: GoalKind;
  /** Category group for scoring and category pages (e.g. Movement, Mind). */
  category?: string;
  startDate: string;
  endDate: string;
  /** Consistency: gym days required per calendar week (Mon–Sun). */
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
  week: GoalHabitWeekMeta;
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
