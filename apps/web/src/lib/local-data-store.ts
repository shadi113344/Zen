import type { CategoryWeights, DayLog, Goal, GoalHabitLink, Habit } from "@mottazen/core";
import type { NotificationSettings } from "@mottazen/core";
import { defaultNotificationSettings } from "@mottazen/core";
import type { ExportBundle } from "@/lib/export-import";

const STORAGE_KEY = "mottazen-data-snapshot";

export interface LocalDataSnapshot {
  habits: Habit[];
  logs: DayLog[];
  categoryWeights: Record<string, CategoryWeights>;
  categoryColors: Record<string, string>;
  dailyNotes: Record<string, string>;
  notificationSettings: NotificationSettings;
  timezone: string;
  goals: Goal[];
  goalHabits: GoalHabitLink[];
  savedAt: string;
}

export function readLocalSnapshot(): LocalDataSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalDataSnapshot>;
    if (!Array.isArray(parsed.habits) || !Array.isArray(parsed.logs)) return null;
    return {
      habits: parsed.habits,
      logs: parsed.logs,
      categoryWeights: parsed.categoryWeights ?? {},
      categoryColors: parsed.categoryColors ?? {},
      dailyNotes: parsed.dailyNotes ?? {},
      notificationSettings: parsed.notificationSettings ?? defaultNotificationSettings(),
      timezone: parsed.timezone ?? "UTC",
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      goalHabits: Array.isArray(parsed.goalHabits) ? parsed.goalHabits : [],
      savedAt: parsed.savedAt ?? "",
    };
  } catch {
    return null;
  }
}

export function writeLocalSnapshot(snapshot: Omit<LocalDataSnapshot, "savedAt">) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() } satisfies LocalDataSnapshot),
    );
  } catch {
    /* quota / private mode */
  }
}

export function snapshotFromBundle(bundle: ExportBundle): Omit<LocalDataSnapshot, "savedAt"> {
  return {
    habits: bundle.habits,
    logs: bundle.logs,
    categoryWeights: bundle.categoryWeights,
    categoryColors: bundle.categoryColors,
    dailyNotes: bundle.dailyNotes,
    notificationSettings: bundle.notificationSettings,
    timezone: bundle.timezone,
    goals: bundle.goals ?? [],
    goalHabits: bundle.goalHabits ?? [],
  };
}

export function clearLocalSnapshot() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
