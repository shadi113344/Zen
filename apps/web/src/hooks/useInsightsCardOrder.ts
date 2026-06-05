import { useCallback, useMemo, useState } from "react";

function loadOrder<T extends string>(storageKey: string, defaults: readonly T[]): T[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [...defaults];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...defaults];
    const saved = parsed.filter((id): id is T => typeof id === "string" && defaults.includes(id as T));
    const missing = defaults.filter((id) => !saved.includes(id));
    return [...saved, ...missing];
  } catch {
    return [...defaults];
  }
}

function hiddenKey(storageKey: string) {
  return `${storageKey}-hidden`;
}

function loadHidden<T extends string>(storageKey: string): Set<T> {
  try {
    const raw = localStorage.getItem(hiddenKey(storageKey));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is T => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function useInsightsCardOrder<T extends string>(storageKey: string, defaults: readonly T[]) {
  const [order, setOrder] = useState<T[]>(() => loadOrder(storageKey, defaults));
  const [hidden, setHidden] = useState<Set<T>>(() => loadHidden(storageKey));

  const visibleOrder = useMemo(
    () => order.filter((id) => defaults.includes(id) && !hidden.has(id)),
    [order, defaults, hidden],
  );

  const hide = useCallback(
    (id: T) => {
      setHidden((prev) => {
        const next = new Set(prev);
        next.add(id);
        localStorage.setItem(hiddenKey(storageKey), JSON.stringify([...next]));
        return next;
      });
    },
    [storageKey],
  );

  const show = useCallback(
    (id: T) => {
      setHidden((prev) => {
        const next = new Set(prev);
        next.delete(id);
        localStorage.setItem(hiddenKey(storageKey), JSON.stringify([...next]));
        return next;
      });
    },
    [storageKey],
  );

  const hiddenIds = useMemo(() => order.filter((id) => hidden.has(id)), [order, hidden]);

  const swap = useCallback(
    (fromId: string, toId: string) => {
      setOrder((prev) => {
        const fromIdx = prev.indexOf(fromId as T);
        const toIdx = prev.indexOf(toId as T);
        if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev;
        // Move fromId into toId's slot (insertion), matching the drag preview.
        const next = [...prev];
        next.splice(fromIdx, 1);
        next.splice(toIdx, 0, fromId as T);
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey],
  );

  return { order: visibleOrder, hiddenIds, swap, hide, show };
}

export const ACTIVITY_INSIGHT_CARDS = ["radar", "metrics", "strongest", "heatmap", "list"] as const;
export type ActivityInsightCardId = (typeof ACTIVITY_INSIGHT_CARDS)[number];
export const ACTIVITY_INSIGHTS_ORDER_KEY = "mottazen-insights-activities-order";
export const ACTIVITY_INSIGHT_CHART_LABELS: Record<ActivityInsightCardId, string> = {
  radar: "Activity balance",
  metrics: "Metrics",
  strongest: "Strongest activity",
  heatmap: "Activity heatmap",
  list: "All activities",
};

export const CATEGORY_INSIGHT_CARDS = ["radar", "dayScores", "best", "browse"] as const;
export type CategoryInsightCardId = (typeof CATEGORY_INSIGHT_CARDS)[number];
export const CATEGORY_INSIGHTS_ORDER_KEY = "mottazen-insights-categories-order";
export const CATEGORY_INSIGHT_CHART_LABELS: Record<CategoryInsightCardId, string> = {
  radar: "Balance by category",
  dayScores: "Day scores",
  best: "Best habit",
  browse: "Browse categories",
};
