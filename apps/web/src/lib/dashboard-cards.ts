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

// ——— Widget Grid types ———

export interface WidgetPlacement {
  id: string;
  col: number;    // 0-based column start (0–3 on desktop 4-col grid)
  row: number;    // 0-based row start
  colSpan: 1 | 2 | 4;
  rowSpan: 1 | 2 | 3;
}

/** Per-user dashboard layout, synced via user_settings.dashboard_layout. */
export interface DashboardLayout {
  order: string[];
  hidden: string[];
  /** New widget grid format. When present, overrides the legacy order-based layout. */
  widgets?: WidgetPlacement[];
}

export const EMPTY_DASHBOARD_LAYOUT: DashboardLayout = { order: [], hidden: [] };

/** Default grid placements for all cards. */
export const DEFAULT_WIDGET_GRID: WidgetPlacement[] = [
  { id: "taskStats",     col: 0, row: 0, colSpan: 2, rowSpan: 1 },
  { id: "activityRadar", col: 2, row: 0, colSpan: 2, rowSpan: 2 },
  { id: "categoryRadar", col: 0, row: 1, colSpan: 2, rowSpan: 2 },
  { id: "dayScores",     col: 0, row: 3, colSpan: 4, rowSpan: 2 },
  { id: "heatmap",       col: 0, row: 5, colSpan: 4, rowSpan: 2 },
  { id: "metrics",       col: 0, row: 7, colSpan: 2, rowSpan: 2 },
  { id: "bestHabit",     col: 2, row: 7, colSpan: 2, rowSpan: 1 },
  { id: "activityList",  col: 2, row: 8, colSpan: 2, rowSpan: 2 },
  { id: "browse",        col: 0, row: 9, colSpan: 2, rowSpan: 1 },
];

/**
 * Merge saved widget placements with defaults: keep valid saved placements,
 * append any defaults not present in saved, drop ids no longer defined.
 */
export function mergeWidgetGrid(
  saved: WidgetPlacement[] | undefined,
  hidden: string[],
): WidgetPlacement[] {
  const validIds = new Set(DASHBOARD_CARDS as readonly string[]);
  const hiddenSet = new Set(hidden);
  if (!saved || saved.length === 0) {
    return DEFAULT_WIDGET_GRID.filter((w) => !hiddenSet.has(w.id));
  }
  const savedIds = new Set(saved.map((w) => w.id));
  const valid = saved.filter((w) => validIds.has(w.id) && !hiddenSet.has(w.id));
  // Append defaults for any ids missing from saved (excluding hidden)
  const missing = DEFAULT_WIDGET_GRID.filter(
    (w) => !savedIds.has(w.id) && !hiddenSet.has(w.id),
  );
  return [...valid, ...missing];
}

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

