import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

const PULL_THRESHOLD = 72;
const PULL_MAX = 110;

interface PullToRefreshState {
  pullY: number;
  pulling: boolean;
  refreshing: boolean;
}

export function usePullToRefresh(
  containerRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<void>,
  enabled = true,
): PullToRefreshState {
  const [pullY, setPullY] = useState(0);
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);
  const pullYRef = useRef(0);
  const refreshingRef = useRef(false);

  const runRefresh = useCallback(async () => {
    refreshingRef.current = true;
    setRefreshing(true);
    setPullY(PULL_THRESHOLD);
    try {
      await onRefresh();
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
      pullYRef.current = 0;
      setPullY(0);
      setPulling(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      if (el.scrollTop > 0) return;
      startY.current = e.touches[0]?.clientY ?? 0;
      active.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active.current || refreshingRef.current) return;
      const touchY = e.touches[0]?.clientY ?? 0;
      const dy = touchY - startY.current;
      if (dy <= 0 || el.scrollTop > 0) {
        pullYRef.current = 0;
        setPullY(0);
        setPulling(false);
        if (el.scrollTop > 0) active.current = false;
        return;
      }
      e.preventDefault();
      const y = Math.min(PULL_MAX, dy * 0.5);
      pullYRef.current = y;
      setPullY(y);
      setPulling(y > 10);
    };

    const finish = () => {
      if (!active.current) return;
      active.current = false;
      if (pullYRef.current >= PULL_THRESHOLD && !refreshingRef.current) {
        void runRefresh();
        return;
      }
      pullYRef.current = 0;
      setPullY(0);
      setPulling(false);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", finish);
    el.addEventListener("touchcancel", finish);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", finish);
      el.removeEventListener("touchcancel", finish);
    };
  }, [containerRef, enabled, runRefresh]);

  return { pullY, pulling, refreshing };
}
