import { useCallback, useState } from "react";

const STORAGE_KEY = "mottazen-category-order";

function readOrder(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((c) => typeof c === "string") : [];
  } catch {
    return [];
  }
}

export function useCategoryOrder() {
  const [order, setOrderState] = useState<string[]>(readOrder);

  const sortCategories = useCallback(
    (categories: string[]) => {
      if (!order.length) return [...categories].sort((a, b) => a.localeCompare(b));
      return [...categories].sort((a, b) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    },
    [order],
  );

  const setCategoryOrder = useCallback((categories: string[]) => {
    setOrderState(categories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, []);

  return { sortCategories, setCategoryOrder };
}
