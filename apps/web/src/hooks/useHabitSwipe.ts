import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 56;
const MAX_OFFSET = 88;
const AXIS_LOCK_PX = 10;

export function useHabitSwipe(onSkip: () => void, onRest: () => void, enabled = true) {
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const active = useRef(false);

  const reset = useCallback(() => {
    tracking.current = false;
    active.current = false;
    offsetRef.current = 0;
    setOffset(0);
  }, []);

  useEffect(() => {
    if (!enabled) reset();
  }, [enabled, reset]);

  // Only an in-progress drag blocks swiping. The brief "pending" window (while
  // the long-press timer runs) must still allow a horizontal swipe to begin —
  // moving horizontally cancels the pending reorder anyway.
  const reorderBlocksSwipe = () => document.body.classList.contains("reorder-active");

  const onStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || reorderBlocksSwipe()) return;
      startX.current = clientX;
      startY.current = clientY;
      tracking.current = true;
      active.current = false;
    },
    [enabled],
  );

  const tryActivate = useCallback((clientX: number, clientY: number) => {
    if (!tracking.current || active.current) return false;
    if (reorderBlocksSwipe()) {
      tracking.current = false;
      return false;
    }
    const dx = Math.abs(clientX - startX.current);
    const dy = Math.abs(clientY - startY.current);
    if (dx < AXIS_LOCK_PX && dy < AXIS_LOCK_PX) return false;
    if (dy >= dx) {
      tracking.current = false;
      return false;
    }
    active.current = true;
    return true;
  }, []);

  const onMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !tracking.current) return;
      if (!active.current && !tryActivate(clientX, clientY)) return;
      if (!active.current) return;
      const dx = clientX - startX.current;
      const next = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, dx));
      offsetRef.current = next;
      setOffset(next);
    },
    [enabled, tryActivate],
  );

  const onEnd = useCallback(() => {
    if (!enabled || !tracking.current) return;
    if (active.current) {
      const o = offsetRef.current;
      if (o < -THRESHOLD) onRest();
      else if (o > THRESHOLD) onSkip();
    }
    reset();
  }, [enabled, onRest, onSkip, reset]);

  const bind = enabled
    ? {
        onTouchStart: (e: React.TouchEvent) => {
          if ((e.target as HTMLElement).closest(".habit-card__menu-btn")) return;
          onStart(e.touches[0].clientX, e.touches[0].clientY);
        },
        onTouchMove: (e: React.TouchEvent) => {
          if (!tracking.current) return;
          const t = e.touches[0];
          if (!active.current && !tryActivate(t.clientX, t.clientY)) return;
          if (!active.current) return;
          if (Math.abs(offsetRef.current) > 4) e.preventDefault();
          onMove(t.clientX, t.clientY);
        },
        onTouchEnd: onEnd,
        onTouchCancel: reset,
        onPointerDown: (e: React.PointerEvent) => {
          if (e.pointerType === "touch") return;
          if ((e.target as HTMLElement).closest(".habit-card__menu-btn")) return;
          onStart(e.clientX, e.clientY);
        },
        onPointerMove: (e: React.PointerEvent) => {
          if (e.pointerType === "touch" || !tracking.current) return;
          if (!active.current && !tryActivate(e.clientX, e.clientY)) return;
          if (!active.current) return;
          onMove(e.clientX, e.clientY);
        },
        onPointerUp: (e: React.PointerEvent) => {
          if (e.pointerType === "touch") return;
          onEnd();
        },
      }
    : {};

  return { offset, bind, reset };
}
