import { useCallback, useMemo, useState } from "react";
import { useData } from "@/hooks/useData";
import {
  DASHBOARD_CARDS,
  DEFAULT_WIDGET_SIZES,
  resolveWidgetItems,
  type DashboardCardId,
  type WidgetItem,
  type WidgetSize,
} from "@/lib/dashboard-cards";

/**
 * Dashboard widget state on the iOS "gallery + reflow" model: an ordered list of
 * sized tiles laid out by a dense flow grid. Reorder is index-based (dnd-kit),
 * sizing is per-tile, add/remove toggles visibility. Persisted via
 * useData ↔ Supabase `dashboard_layout.items`.
 */
export function useWidgetGrid() {
  const { dashboardLayout, setDashboardLayout } = useData();
  const [editMode, setEditMode] = useState(false);

  const items = useMemo(() => resolveWidgetItems(dashboardLayout), [dashboardLayout]);

  const hiddenIds = useMemo(() => {
    const visible = new Set(items.map((w) => w.id));
    return DASHBOARD_CARDS.filter((id) => !visible.has(id));
  }, [items]);

  const commit = useCallback(
    (nextItems: WidgetItem[]) => {
      const visible = new Set(nextItems.map((w) => w.id));
      const hidden = DASHBOARD_CARDS.filter((id) => !visible.has(id));
      setDashboardLayout({
        ...dashboardLayout,
        items: nextItems,
        order: nextItems.map((w) => w.id),
        hidden,
      });
    },
    [dashboardLayout, setDashboardLayout],
  );

  const toggleEditMode = useCallback(() => setEditMode((v) => !v), []);

  /** Move tile from one index to another (dnd-kit sortable). */
  const reorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
      const next = [...items];
      const [moved] = next.splice(fromIndex, 1);
      if (!moved) return;
      next.splice(toIndex, 0, moved);
      commit(next);
    },
    [items, commit],
  );

  const resize = useCallback(
    (id: string, size: WidgetSize) => {
      commit(items.map((w) => (w.id === id ? { ...w, size } : w)));
    },
    [items, commit],
  );

  const hide = useCallback(
    (id: string) => {
      commit(items.filter((w) => w.id !== id));
    },
    [items, commit],
  );

  const show = useCallback(
    (id: string, size?: WidgetSize) => {
      if (items.some((w) => w.id === id)) return;
      const cardId = id as DashboardCardId;
      commit([...items, { id: cardId, size: size ?? DEFAULT_WIDGET_SIZES[cardId] }]);
    },
    [items, commit],
  );

  return { items, hiddenIds, editMode, toggleEditMode, reorder, resize, hide, show };
}
