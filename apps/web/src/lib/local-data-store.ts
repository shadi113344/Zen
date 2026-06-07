import type { CategoryWeights, DayLog, Goal, GoalHabitLink, Habit } from "@mottazen/core";
import type { NotificationSettings } from "@mottazen/core";
import { defaultNotificationSettings } from "@mottazen/core";
import { EMPTY_DASHBOARD_LAYOUT, type DashboardLayout } from "@/lib/dashboard-cards";
import type { ExportBundle } from "@/lib/export-import";

const LEGACY_STORAGE_KEY = "mottazen-data-snapshot";

export function snapshotStorageKey(userId: string): string {
  return `${LEGACY_STORAGE_KEY}:${userId}`;
}

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
  dashboardLayout: DashboardLayout;
  savedAt: string;
}

function parseSnapshot(raw: string): LocalDataSnapshot | null {
  try {
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
      dashboardLayout: parsed.dashboardLayout ?? { ...EMPTY_DASHBOARD_LAYOUT },
      savedAt: parsed.savedAt ?? "",
    };
  } catch {
    return null;
  }
}

export function readLocalSnapshot(userId?: string | null): LocalDataSnapshot | null {
  try {
    if (userId) {
      const userRaw = localStorage.getItem(snapshotStorageKey(userId));
      if (userRaw) return parseSnapshot(userRaw);
    }
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) return null;
    return parseSnapshot(legacyRaw);
  } catch {
    return null;
  }
}

export function writeLocalSnapshot(snapshot: Omit<LocalDataSnapshot, "savedAt">, userId?: string | null) {
  try {
    const payload = JSON.stringify({ ...snapshot, savedAt: new Date().toISOString() } satisfies LocalDataSnapshot);
    if (userId) {
      localStorage.setItem(snapshotStorageKey(userId), payload);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }
    localStorage.setItem(LEGACY_STORAGE_KEY, payload);
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
    dashboardLayout: { ...EMPTY_DASHBOARD_LAYOUT },
  };
}

export function clearLocalSnapshot(userId?: string | null) {
  try {
    if (userId) localStorage.removeItem(snapshotStorageKey(userId));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function clearAllLocalSnapshots() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${LEGACY_STORAGE_KEY}:`) || key === LEGACY_STORAGE_KEY) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
