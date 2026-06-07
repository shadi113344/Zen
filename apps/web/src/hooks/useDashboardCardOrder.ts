import { useCallback, useMemo } from "react";
import { useData } from "@/hooks/useData";
import { DASHBOARD_CARDS, mergeCardOrder, type DashboardCardId } from "@/lib/dashboard-cards";

/**
 * Drag-order + hide/show for the Dashboard cards, backed by the per-user
 * `dashboardLayout` synced through useData ↔ Supabase (instead of localStorage).
 * Returns the same shape as the old useInsightsCardOrder so InsightsReorderStack
 * and InsightsAddCharts can be reused unchanged.
 */
export function useDashboardCardOrder() {
  const { dashboardLayout, setDashboardLayout } = useData();

  const order = useMemo(
    () => mergeCardOrder(dashboardLayout.order, DASHBOARD_CARDS),
    [dashboardLayout.order],
  );
  const hidden = useMemo(() => new Set(dashboardLayout.hidden ?? []), [dashboardLayout.hidden]);

  const visibleOrder = useMemo(() => order.filter((id) => !hidden.has(id)), [order, hidden]);
  const hiddenIds = useMemo(() => order.filter((id) => hidden.has(id)), [order, hidden]);

  const swap = useCallback(
    (fromId: string, toId: string) => {
      const fromIdx = order.indexOf(fromId as DashboardCardId);
      const toIdx = order.indexOf(toId as DashboardCardId);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
      // Move fromId into toId's slot (insertion), matching the drag preview.
      const next = [...order];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromId as DashboardCardId);
      setDashboardLayout({ order: next, hidden: [...hidden] });
    },
    [order, hidden, setDashboardLayout],
  );

  const hide = useCallback(
    (id: string) => {
      if (hidden.has(id)) return;
      setDashboardLayout({ order: [...order], hidden: [...hidden, id] });
    },
    [order, hidden, setDashboardLayout],
  );

  const show = useCallback(
    (id: string) => {
      if (!hidden.has(id)) return;
      setDashboardLayout({ order: [...order], hidden: [...hidden].filter((h) => h !== id) });
    },
    [order, hidden, setDashboardLayout],
  );

  return { order: visibleOrder, hiddenIds, swap, hide, show };
}
