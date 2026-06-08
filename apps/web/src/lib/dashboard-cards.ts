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

// ——— Widget grid types (2-column board model) ———

/**
 * Two clean widths only. On the 2-column desktop board: half = 1 column,
 * full = both columns. Mobile collapses everything to full. Keeping widths
 * to clean fractions is what makes drag accurate (DOM order == visual order,
 * no dense backfill) and gap-free (halves always pair, fulls take a row).
 */
export type WidgetSize = "half" | "full";

export const WIDGET_SIZE_LABELS: Record<WidgetSize, string> = {
  half: "Half",
  full: "Full",
};

export const WIDGET_SIZE_ORDER: readonly WidgetSize[] = ["half", "full"] as const;

/** Normalise any historic size value (sm/md/lg/wide) to the current model. */
const SIZE_MIGRATION: Record<string, WidgetSize> = {
  sm: "half",
  md: "half",
  lg: "full",
  wide: "full",
  half: "half",
  full: "full",
};

export function normalizeWidgetSize(size: string): WidgetSize {
  return SIZE_MIGRATION[size] ?? "half";
}

/** An ordered, sized widget tile. Layout is a dense flow grid — no x/y math. */
export interface WidgetItem {
  id: DashboardCardId;
  size: WidgetSize;
}

/** Per-user dashboard layout, synced via user_settings.dashboard_layout. */
export interface DashboardLayout {
  order: string[];
  hidden: string[];
  /** New widget-tile format. When present, this is the source of truth. */
  items?: WidgetItem[];
}

export const EMPTY_DASHBOARD_LAYOUT: DashboardLayout = { order: [], hidden: [] };

/** Sensible default size per widget. */
export const DEFAULT_WIDGET_SIZES: Record<DashboardCardId, WidgetSize> = {
  taskStats: "half",
  activityRadar: "half",
  categoryRadar: "half",
  metrics: "half",
  heatmap: "full",
  dayScores: "full",
  bestHabit: "half",
  activityList: "full",
  browse: "full",
};

/** Default ordered tiles for a fresh dashboard. */
export const DEFAULT_WIDGET_ITEMS: WidgetItem[] = DASHBOARD_CARDS.map((id) => ({
  id,
  size: DEFAULT_WIDGET_SIZES[id],
}));

/**
 * Resolve the visible widget tiles from a layout, migrating legacy formats:
 *  - `items` present → use it (validated, hidden removed, new cards appended)
 *  - legacy `order[]` only → map to default sizes in saved order
 */
export function resolveWidgetItems(layout: DashboardLayout): WidgetItem[] {
  const validIds = new Set(DASHBOARD_CARDS as readonly string[]);
  const hidden = new Set(layout.hidden ?? []);

  if (layout.items && layout.items.length > 0) {
    const seen = new Set<string>();
    const valid = layout.items
      .filter((w) => {
        if (!validIds.has(w.id) || hidden.has(w.id) || seen.has(w.id)) return false;
        seen.add(w.id);
        return true;
      })
      .map((w) => ({ id: w.id, size: normalizeWidgetSize(w.size) }));
    // Append any known cards missing from saved items (new features) unless hidden.
    const missing = DASHBOARD_CARDS.filter((id) => !seen.has(id) && !hidden.has(id)).map(
      (id) => ({ id, size: DEFAULT_WIDGET_SIZES[id] }),
    );
    return [...valid, ...missing];
  }

  // Legacy migration: order[] → sized tiles.
  const order = mergeCardOrder(layout.order, DASHBOARD_CARDS).filter((id) => !hidden.has(id));
  return order.map((id) => ({ id, size: DEFAULT_WIDGET_SIZES[id] }));
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

