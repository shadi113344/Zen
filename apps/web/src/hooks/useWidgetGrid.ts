import { useCallback, useMemo, useState } from "react";
import { useData } from "@/hooks/useData";
import {
  DASHBOARD_CARDS,
  DEFAULT_WIDGET_GRID,
  mergeCardOrder,
  mergeWidgetGrid,
  type DashboardCardId,
  type WidgetPlacement,
} from "@/lib/dashboard-cards";

const GRID_COLS = 4;

/** Check whether a placement overlaps any cell in a set of occupied cells. */
function placementCells(w: WidgetPlacement): string[] {
  const cells: string[] = [];
  for (let c = w.col; c < w.col + w.colSpan; c++) {
    for (let r = w.row; r < w.row + w.rowSpan; r++) {
      cells.push(`${c},${r}`);
    }
  }
  return cells;
}

function buildOccupied(widgets: WidgetPlacement[], excludeId?: string): Set<string> {
  const set = new Set<string>();
  for (const w of widgets) {
    if (w.id === excludeId) continue;
    for (const cell of placementCells(w)) set.add(cell);
  }
  return set;
}

/** Find the first free position that fits colSpan×rowSpan, scanning left-to-right, top-to-bottom. */
function findFreePosition(
  widgets: WidgetPlacement[],
  colSpan: number,
  rowSpan: number,
  excludeId?: string,
): { col: number; row: number } {
  const occupied = buildOccupied(widgets, excludeId);
  const maxRow = 100;
  for (let row = 0; row < maxRow; row++) {
    for (let col = 0; col <= GRID_COLS - colSpan; col++) {
      let fits = true;
      for (let c = col; c < col + colSpan && fits; c++) {
        for (let r = row; r < row + rowSpan && fits; r++) {
          if (occupied.has(`${c},${r}`)) fits = false;
        }
      }
      if (fits) return { col, row };
    }
  }
  return { col: 0, row: maxRow };
}

export function useWidgetGrid() {
  const { dashboardLayout, setDashboardLayout } = useData();
  const [editMode, setEditMode] = useState(false);

  const hiddenIds = useMemo(
    () => dashboardLayout.hidden ?? [],
    [dashboardLayout.hidden],
  );
  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);

  // Use new widget grid format if present, else migrate from legacy order
  const widgets = useMemo((): WidgetPlacement[] => {
    if (dashboardLayout.widgets && dashboardLayout.widgets.length > 0) {
      return mergeWidgetGrid(dashboardLayout.widgets, hiddenIds);
    }
    // Legacy migration: map old order to default grid positions
    const order = mergeCardOrder(dashboardLayout.order, DASHBOARD_CARDS);
    const visible = order.filter((id) => !hiddenSet.has(id));
    return DEFAULT_WIDGET_GRID.filter((w) => visible.includes(w.id as DashboardCardId));
  }, [dashboardLayout, hiddenIds, hiddenSet]);

  // All known IDs (visible + hidden)
  const allIds = useMemo(
    () => mergeCardOrder(dashboardLayout.order, DASHBOARD_CARDS),
    [dashboardLayout.order],
  );

  const visibleHiddenIds = useMemo(
    () => allIds.filter((id) => hiddenSet.has(id)),
    [allIds, hiddenSet],
  );

  const toggleEditMode = useCallback(() => setEditMode((v) => !v), []);

  const moveWidget = useCallback(
    (id: string, col: number, row: number) => {
      const widget = widgets.find((w) => w.id === id);
      if (!widget) return;
      // Clamp to grid bounds
      const clampedCol = Math.max(0, Math.min(GRID_COLS - widget.colSpan, col));
      const clampedRow = Math.max(0, row);
      const next = widgets.map((w) =>
        w.id === id ? { ...w, col: clampedCol, row: clampedRow } : w,
      );
      setDashboardLayout({ ...dashboardLayout, widgets: next });
    },
    [widgets, dashboardLayout, setDashboardLayout],
  );

  const resizeWidget = useCallback(
    (id: string, colSpan: WidgetPlacement["colSpan"], rowSpan: WidgetPlacement["rowSpan"]) => {
      const next = widgets.map((w) => (w.id === id ? { ...w, colSpan, rowSpan } : w));
      setDashboardLayout({ ...dashboardLayout, widgets: next });
    },
    [widgets, dashboardLayout, setDashboardLayout],
  );

  const hideWidget = useCallback(
    (id: string) => {
      if (hiddenSet.has(id)) return;
      const nextWidgets = widgets.filter((w) => w.id !== id);
      setDashboardLayout({
        ...dashboardLayout,
        widgets: nextWidgets,
        hidden: [...hiddenIds, id],
      });
    },
    [widgets, hiddenIds, hiddenSet, dashboardLayout, setDashboardLayout],
  );

  const showWidget = useCallback(
    (id: string) => {
      if (!hiddenSet.has(id)) return;
      const defaultPlacement = DEFAULT_WIDGET_GRID.find((w) => w.id === id);
      const { colSpan = 2, rowSpan = 1 } = defaultPlacement ?? {};
      const pos = findFreePosition(widgets, colSpan, rowSpan);
      const newWidget: WidgetPlacement = { id, col: pos.col, row: pos.row, colSpan, rowSpan };
      setDashboardLayout({
        ...dashboardLayout,
        widgets: [...widgets, newWidget],
        hidden: hiddenIds.filter((h) => h !== id),
      });
    },
    [widgets, hiddenIds, hiddenSet, dashboardLayout, setDashboardLayout],
  );

  const isOccupied = useCallback(
    (col: number, row: number, colSpan: number, rowSpan: number, excludeId?: string): boolean => {
      const occupied = buildOccupied(widgets, excludeId);
      for (let c = col; c < col + colSpan; c++) {
        for (let r = row; r < row + rowSpan; r++) {
          if (occupied.has(`${c},${r}`)) return true;
        }
      }
      return false;
    },
    [widgets],
  );

  return {
    widgets,
    hiddenIds: visibleHiddenIds,
    editMode,
    toggleEditMode,
    moveWidget,
    resizeWidget,
    hideWidget,
    showWidget,
    isOccupied,
  };
}
