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

// ——— Widget grid types ———

/**
 * Four sizes. Column span only — no grid-row: span, no dense flow.
 * DOM order always equals visual order; dnd-kit and framer-motion never conflict.
 *
 *  bar   → full 4-col strip, min-height 72px   (key numbers only)
 *  small → 1-col,            min-height 180px  (compact card)
 *  large → 1-col,            min-height 360px  (chart, no details)
 *  full  → 2-col,            min-height 360px  (chart + detail list)
 */
export type WidgetSize = "bar" | "small" | "large" | "full" | "max1" | "max2";

export const WIDGET_SIZE_LABELS: Record<WidgetSize, string> = {
  bar:   "Bar",
  small: "Small",
  large: "Large",
  full:  "Full",
  max1:  "Max",
  max2:  "Max+",
};

export const WIDGET_SIZE_ORDER: readonly WidgetSize[] = ["bar", "small", "large", "full", "max1", "max2"] as const;

/** Normalise any historic size value to the current model. */
const SIZE_MIGRATION: Record<string, WidgetSize> = {
  // previous "half/full" model
  half: "small",
  // old sm/md/lg/wide model
  sm:   "small",
  md:   "small",
  lg:   "large",
  wide: "full",
  // current
  bar:   "bar",
  small: "small",
  large: "large",
  full:  "full",
  max1:  "max1",
  max2:  "max2",
};

export function normalizeWidgetSize(size: string): WidgetSize {
  return (SIZE_MIGRATION[size] as WidgetSize | undefined) ?? "small";
}

/** An ordered, sized widget tile. */
export interface WidgetItem {
  id: DashboardCardId;
  size: WidgetSize;
}

/** A folder of widgets shown as a mosaic tile. */
export interface FolderItem {
  type: "folder";
  id: string;               // "folder-<timestamp>"
  childIds: DashboardCardId[];
  name?: string;
}

export type DashboardTile = WidgetItem | FolderItem;

export function isFolderItem(tile: DashboardTile): tile is FolderItem {
  return (tile as FolderItem).type === "folder";
}

/** Per-user dashboard layout, synced via user_settings.dashboard_layout. */
export interface DashboardLayout {
  order: string[];
  hidden: string[];
  /** New format: source of truth when present. Can include FolderItems. */
  items?: DashboardTile[];
}

export const EMPTY_DASHBOARD_LAYOUT: DashboardLayout = { order: [], hidden: [] };

/** Sensible default size per widget. */
export const DEFAULT_WIDGET_SIZES: Record<DashboardCardId, WidgetSize> = {
  taskStats:     "small",
  activityRadar: "large",
  categoryRadar: "large",
  metrics:       "large",
  heatmap:       "large",
  dayScores:     "large",
  bestHabit:     "small",
  activityList:  "large",
  browse:        "bar",
};

/** Default ordered tiles for a fresh dashboard. */
export const DEFAULT_WIDGET_ITEMS: WidgetItem[] = DASHBOARD_CARDS.map((id) => ({
  id,
  size: DEFAULT_WIDGET_SIZES[id],
}));

/**
 * Resolve the visible widget tiles from a layout, migrating legacy formats.
 * Returns only WidgetItems (folders are preserved as-is in the raw items array
 * but are filtered from the resolved list used by most callers).
 */
export function resolveWidgetItems(layout: DashboardLayout): WidgetItem[] {
  const validIds = new Set(DASHBOARD_CARDS as readonly string[]);
  const hidden = new Set(layout.hidden ?? []);

  if (layout.items && layout.items.length > 0) {
    const seen = new Set<string>();
    const valid: WidgetItem[] = [];

    for (const tile of layout.items) {
      if (isFolderItem(tile)) {
        // Folder tiles are resolved elsewhere (FolderSheet); skip here.
        tile.childIds.forEach((id) => seen.add(id));
        continue;
      }
      if (!validIds.has(tile.id) || hidden.has(tile.id) || seen.has(tile.id)) continue;
      seen.add(tile.id);
      valid.push({ id: tile.id, size: normalizeWidgetSize(tile.size) });
    }

    const missing = DASHBOARD_CARDS.filter((id) => !seen.has(id) && !hidden.has(id)).map(
      (id): WidgetItem => ({ id, size: DEFAULT_WIDGET_SIZES[id] }),
    );
    return [...valid, ...missing];
  }

  // Legacy migration: order[] → sized tiles.
  const order = mergeCardOrder(layout.order, DASHBOARD_CARDS).filter((id) => !hidden.has(id));
  return order.map((id): WidgetItem => ({ id, size: DEFAULT_WIDGET_SIZES[id] }));
}

/**
 * Resolve ALL tiles (WidgetItems + FolderItems) for the grid.
 */
export function resolveAllTiles(layout: DashboardLayout): DashboardTile[] {
  const validIds = new Set(DASHBOARD_CARDS as readonly string[]);
  const hidden = new Set(layout.hidden ?? []);

  if (layout.items && layout.items.length > 0) {
    const seen = new Set<string>();
    const result: DashboardTile[] = [];

    for (const tile of layout.items) {
      if (isFolderItem(tile)) {
        // Keep folder; mark its children as "seen" so they don't re-appear.
        tile.childIds.forEach((id) => seen.add(id));
        result.push(tile);
        continue;
      }
      if (!validIds.has(tile.id) || hidden.has(tile.id) || seen.has(tile.id)) continue;
      seen.add(tile.id);
      result.push({ id: tile.id, size: normalizeWidgetSize(tile.size) });
    }

    const missing = DASHBOARD_CARDS.filter((id) => !seen.has(id) && !hidden.has(id)).map(
      (id): WidgetItem => ({ id, size: DEFAULT_WIDGET_SIZES[id] }),
    );
    return [...result, ...missing];
  }

  const order = mergeCardOrder(layout.order, DASHBOARD_CARDS).filter((id) => !hidden.has(id));
  return order.map((id): WidgetItem => ({ id, size: DEFAULT_WIDGET_SIZES[id] }));
}

/**
 * Merge a saved order with the canonical defaults.
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
