export type DashboardCardId =
  | "taskStats"
  | "activityRadar"
  | "categoryRadar"
  | "metrics"
  | "heatmap"
  | "dayScores"
  | "bestHabit"
  | "activityList"
  | "browse";

/** Canonical card set + default order for the Dashboard. */
export const DASHBOARD_CARDS: readonly DashboardCardId[] = [
  "taskStats",
  "activityRadar",
  "categoryRadar",
  "metrics",
  "heatmap",
  "dayScores",
  "bestHabit",
  "activityList",
  "browse",
] as const;

/** Labels for the "add chart" menu when a card is hidden. */
export const DASHBOARD_CARD_LABELS: Record<DashboardCardId, string> = {
  taskStats: "Tasks",
  activityRadar: "Activity balance",
  categoryRadar: "Balance by life area",
  metrics: "Metrics",
  heatmap: "Activity heatmap",
  dayScores: "Day scores",
  bestHabit: "Best activity",
  activityList: "All activities",
  browse: "Browse by life area",
};

/** Per-user dashboard layout, synced via user_settings.dashboard_layout. */
export interface DashboardLayout {
  order: string[];
  hidden: string[];
}

export const EMPTY_DASHBOARD_LAYOUT: DashboardLayout = { order: [], hidden: [] };

/**
 * Merge a saved order with the canonical defaults: keep saved ids that still
 * exist (in saved order), append any new defaults, drop ids no longer defined.
 */
export function mergeCardOrder(
  saved: string[] | undefined,
  defaults: readonly DashboardCardId[],
): DashboardCardId[] {
  const valid = (saved ?? []).filter((id): id is DashboardCardId =>
    defaults.includes(id as DashboardCardId),
  );
  const missing = defaults.filter((id) => !valid.includes(id));
  const prepend = missing.filter((id) => id === "taskStats");
  const append = missing.filter((id) => id !== "taskStats");
  return [...prepend, ...valid, ...append];
}
