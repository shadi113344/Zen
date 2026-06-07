import type { CategoryWeights, DayLog, Goal, GoalHabitLink, Habit, Task } from "@mottazen/core";
import type { NotificationSettings } from "@mottazen/core";
import { defaultNotificationSettings, runSchemaMigrations, type SchemaMigrations } from "@mottazen/core";
import { EMPTY_DASHBOARD_LAYOUT, type DashboardLayout } from "@/lib/dashboard-cards";
import type { ExportBundle } from "@/lib/export-import";

const LEGACY_STORAGE_KEY = "mottazen-data-snapshot";

export function snapshotStorageKey(userId: string): string {
  return `${LEGACY_STORAGE_KEY}:${userId}`;
}

/** Bump when the on-disk snapshot shape changes; add a step to SNAPSHOT_MIGRATIONS. */
export const CURRENT_SCHEMA_VERSION = 1;

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
  tasks: Task[];
  dashboardLayout: DashboardLayout;
  savedAt: string;
  /** On-disk schema version; stamped on write, migrated forward on read. */
  schemaVersion: number;
}

/** The logical snapshot the app builds; the store stamps version + savedAt. */
export type SnapshotData = Omit<LocalDataSnapshot, "savedAt" | "schemaVersion">;

/** Forward migrations for old local snapshots. `[n]` upgrades v(n-1) → v(n). */
const SNAPSHOT_MIGRATIONS: SchemaMigrations<Record<string, unknown> & { schemaVersion?: number }> = {
  // v1 is the baseline. Future reshape example:
  // 2: (raw) => ({ ...raw, tasks: Array.isArray(raw.tasks) ? raw.tasks : [] }),
};

function parseSnapshot(raw: string): LocalDataSnapshot | null {
  try {
    const rawObj = JSON.parse(raw) as Record<string, unknown> & { schemaVersion?: number };
    if (!Array.isArray(rawObj.habits) || !Array.isArray(rawObj.logs)) return null;
    const parsed = runSchemaMigrations(
      rawObj,
      CURRENT_SCHEMA_VERSION,
      SNAPSHOT_MIGRATIONS,
    ) as Partial<LocalDataSnapshot>;
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      habits: parsed.habits ?? [],
      logs: parsed.logs ?? [],
      categoryWeights: parsed.categoryWeights ?? {},
      categoryColors: parsed.categoryColors ?? {},
      dailyNotes: parsed.dailyNotes ?? {},
      notificationSettings: parsed.notificationSettings ?? defaultNotificationSettings(),
      timezone: parsed.timezone ?? "UTC",
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      goalHabits: Array.isArray(parsed.goalHabits) ? parsed.goalHabits : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
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

export function writeLocalSnapshot(snapshot: SnapshotData, userId?: string | null) {
  try {
    const payload = JSON.stringify({
      ...snapshot,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
    } satisfies LocalDataSnapshot);
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

export function snapshotFromBundle(bundle: ExportBundle): SnapshotData {
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
    tasks: bundle.tasks ?? [],
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
