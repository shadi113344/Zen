import { useCallback, useEffect, useRef, useState } from "react";

const LONG_PRESS_MS = 300;
const MOVE_CANCEL_PX = 12;
const EDGE_SCROLL_ZONE = 72; // px from the viewport edge where auto-scroll kicks in
const EDGE_SCROLL_MAX = 16; // max px scrolled per animation frame
/** Vertical-only scale avoids horizontal bleed clipped by scroll containers. */
const LIFT_SCALE = "1 1.03";

interface Slot {
  id: string;
  el: HTMLElement;
  /** Vertical midpoint in pickup-time client coords. Stays constant for the drag. */
  mid: number;
}

interface DragCtx {
  pointerId: number;
  draggedId: string;
  draggedEl: HTMLElement;
  slots: Slot[];
  oldIndex: number;
  /** Height of the dragged slot incl. inter-card gap — the size of the gap that travels. */
  dragHeight: number;
  /** Pointer clientY at the moment the card was picked up. */
  pickupY: number;
  /** window.scrollY at the moment the card was picked up. */
  pickupScrollY: number;
}

/**
 * Long-press to drag-and-drop reorder, with a real "lift and shove" feel:
 *  - press & hold (~300ms) anywhere on a card to pick it up; it lifts and follows your finger
 *  - the other cards animate to open a gap where it will land
 *  - dragging near a screen edge auto-scrolls the page so distant slots are reachable
 *  - the reorder is committed on drop (not while hovering)
 *
 * A quick tap, or a press that moves before the timer fires, is left alone so
 * links/buttons/checkboxes/swipes/scrolling all keep working. The click right
 * after a real drag is suppressed so the underlying control doesn't fire.
 * Nesting (a row inside a group) is handled via stopPropagation on pointerdown.
 *
 * Touch reliability: native scrolling is suppressed with a non-passive
 * `touchmove` preventDefault that is only attached once a drag is actually
 * active. (Toggling `touch-action` mid-gesture does nothing — the browser locks
 * it at touch-start — so it cannot be relied on here.)
 */
export function usePointerReorder(onSwap: (fromId: string, toId: string) => void, attr = "data-reorder-id") {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const lastPointRef = useRef({ x: 0, y: 0 });
  const ctxRef = useRef<DragCtx | null>(null);
  const targetIdRef = useRef<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const suppressClickUntilRef = useRef(0);
  const attrRef = useRef(attr);
  const onSwapRef = useRef(onSwap);
  attrRef.current = attr;
  onSwapRef.current = onSwap;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const detach = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  /** Remove all inline drag styling and reset the visual layout. */
  const resetStyles = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const d = ctx.draggedEl;
    d.style.translate = "";
    d.style.scale = "";
    d.style.transition = "";
    d.style.position = "";
    d.style.zIndex = "";
    d.style.willChange = "";
    for (const slot of ctx.slots) {
      if (slot.id === ctx.draggedId) continue;
      slot.el.style.transform = "";
      slot.el.style.transition = "";
    }
  }, []);

  /** Tear down the gesture. Returns whether an actual drag had started. */
  const finish = useCallback(() => {
    clearTimer();
    stopAutoScroll();
    detach();
    const wasDragging = ctxRef.current != null;
    ctxRef.current = null;
    targetIdRef.current = null;
    setDraggingId(null);
    setPendingId(null);
    document.body.classList.remove("reorder-active", "reorder-pending");
    document.documentElement.style.scrollBehavior = "";
    return wasDragging;
  }, [clearTimer, detach, stopAutoScroll]);

  // Suppress the click that fires right after a successful drag. Time-boxed so
  // a stale flag can never swallow an unrelated tap later on.
  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      if (Date.now() >= suppressClickUntilRef.current) return;
      suppressClickUntilRef.current = 0;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, []);

  useEffect(
    () => () => {
      resetStyles();
      finish();
    },
    [finish, resetStyles],
  );

  /** Move the lifted card with the finger and open a gap at the hovered slot. */
  const dragMove = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Track the finger even while the page auto-scrolls: fold the scroll delta
    // into the translate so the grabbed point stays under the finger, and keep
    // the comparison frame fixed to pickup-time coordinates.
    const scrollDelta = window.scrollY - ctx.pickupScrollY;
    const delta = lastPointRef.current.y - ctx.pickupY + scrollDelta;
    // Drive position via the `translate` property (no transition) so the card
    // tracks the finger 1:1, while `scale` (set once on pickup) animates the
    // shrink on its own. They are independent transform properties.
    ctx.draggedEl.style.translate = `0 ${delta}px`;

    // Drop target tracks the *finger*, not the dragged element's center. A card
    // always starts between its neighbours' midpoints, so this is neutral at
    // pickup, has built-in hysteresis (you must cross a midpoint to swap), and —
    // crucially — is independent of the dragged card's height. That last point
    // is what makes a very tall card (e.g. an expanded habit group) reorderable
    // without dragging half its height across the screen.
    const pointer = lastPointRef.current.y + scrollDelta;

    let destIndex = ctx.oldIndex;
    while (destIndex < ctx.slots.length - 1 && pointer > ctx.slots[destIndex + 1]!.mid) {
      destIndex += 1;
    }
    while (destIndex > 0 && pointer < ctx.slots[destIndex - 1]!.mid) {
      destIndex -= 1;
    }

    const targetId = destIndex === ctx.oldIndex ? null : ctx.slots[destIndex]!.id;
    if (targetId === targetIdRef.current) return;
    targetIdRef.current = targetId;

    ctx.slots.forEach((slot, idx) => {
      if (slot.id === ctx.draggedId) return;
      let ty = 0;
      if (destIndex > ctx.oldIndex && idx > ctx.oldIndex && idx <= destIndex) {
        ty = -ctx.dragHeight; // dragged moving down → items above the gap slide up
      } else if (destIndex < ctx.oldIndex && idx >= destIndex && idx < ctx.oldIndex) {
        ty = ctx.dragHeight; // dragged moving up → items below the gap slide down
      }
      slot.el.style.transform = ty ? `translateY(${ty}px)` : "";
    });
  }, []);

  /** rAF loop: auto-scroll the window when the finger nears a viewport edge. */
  const autoScrollTick = useCallback(() => {
    if (!ctxRef.current) {
      rafRef.current = null;
      return;
    }
    const y = lastPointRef.current.y;
    const vh = window.innerHeight;
    let speed = 0;
    if (y < EDGE_SCROLL_ZONE) {
      speed = -EDGE_SCROLL_MAX * Math.min(1, (EDGE_SCROLL_ZONE - y) / EDGE_SCROLL_ZONE);
    } else if (y > vh - EDGE_SCROLL_ZONE) {
      speed = EDGE_SCROLL_MAX * Math.min(1, (y - (vh - EDGE_SCROLL_ZONE)) / EDGE_SCROLL_ZONE);
    }
    if (speed !== 0) {
      const max = document.documentElement.scrollHeight - vh;
      const next = Math.max(0, Math.min(max, window.scrollY + speed));
      if (next !== window.scrollY) {
        window.scrollTo({ top: next, behavior: "instant" as ScrollBehavior });
        dragMove();
      }
    }
    rafRef.current = requestAnimationFrame(autoScrollTick);
  }, [dragMove]);

  /** Pick up the card: snapshot sibling geometry and lift the dragged element. */
  const pickUp = useCallback((id: string, pointerId: number, el: HTMLElement) => {
    const parent = el.parentElement;
    if (!parent) return;

    const sel = `[${attrRef.current}]`;
    const slots: Slot[] = Array.from(parent.querySelectorAll<HTMLElement>(sel))
      .filter((node) => node.parentElement === parent && node.getAttribute(attrRef.current))
      .map((node) => {
        const r = node.getBoundingClientRect();
        return { id: node.getAttribute(attrRef.current)!, el: node, mid: (r.top + r.bottom) / 2 };
      });

    const oldIndex = slots.findIndex((s) => s.id === id);
    if (oldIndex < 0) return;

    const selfRect = el.getBoundingClientRect();
    const below = slots[oldIndex + 1]?.el.getBoundingClientRect();
    const above = slots[oldIndex - 1]?.el.getBoundingClientRect();
    const gapAfter = below ? below.top - selfRect.bottom : 0;
    const gapBefore = above ? selfRect.top - above.bottom : 0;
    const gap = gapAfter || gapBefore || 8;
    const dragHeight = selfRect.height + gap;

    ctxRef.current = {
      pointerId,
      draggedId: id,
      draggedEl: el,
      slots,
      oldIndex,
      dragHeight,
      pickupY: lastPointRef.current.y,
      pickupScrollY: window.scrollY,
    };
    targetIdRef.current = null;

    // Force instant programmatic scrolling (the app sets scroll-behavior:smooth).
    document.documentElement.style.scrollBehavior = "auto";

    // `scale` and `box-shadow` ease in for a smooth lift; `translate` updates
    // every frame with no transition so the card tracks the finger exactly.
    el.style.transition = "scale 0.16s var(--ease-spring, ease), box-shadow 0.18s var(--ease-out)";
    el.style.position = "relative";
    el.style.zIndex = "30";
    el.style.willChange = "translate, scale";
    // A finished CSS entrance animation with fill-mode `both` (see glass.css
    // .habit-group / .card) keeps `transform` under animation control and pins
    // opacity, overriding the drag's transforms and the dim-others effect.
    // Disable it so the lift/follow is visible. We never restore it: it is a
    // one-shot mount animation that already played; restoring replays it (a
    // flash) on every drop.
    el.style.animation = "none";
    el.style.translate = "0 0px";
    el.style.scale = String(LIFT_SCALE);
    for (const slot of slots) {
      if (slot.id === id) continue;
      slot.el.style.animation = "none";
      slot.el.style.transition = "transform 0.2s var(--ease-spring, ease)";
    }
  }, []);

  const begin = useCallback(
    (id: string, pointerId: number, el: HTMLElement, x: number, y: number) => {
      // Fully tear down any leftover gesture before starting a new one. If a
      // prior drag's pointerup/cancel never arrived (capture lost, or the node
      // moved during the swap re-render), its context would otherwise linger and
      // block every future drag. Resetting here makes the gesture self-healing.
      resetStyles();
      clearTimer();
      stopAutoScroll();
      detach();
      ctxRef.current = null;
      targetIdRef.current = null;
      setDraggingId(null);
      document.body.classList.remove("reorder-active", "reorder-pending");
      document.documentElement.style.scrollBehavior = "";

      startRef.current = { x, y };
      lastPointRef.current = { x, y };
      setPendingId(id);
      document.body.classList.add("reorder-pending");

      const onMove = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        lastPointRef.current = { x: e.clientX, y: e.clientY };

        if (!ctxRef.current) {
          // Waiting for long-press: real movement means scroll/swipe/tap intent.
          const dx = Math.abs(e.clientX - startRef.current.x);
          const dy = Math.abs(e.clientY - startRef.current.y);
          if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
            clearTimer();
            detach();
            setPendingId(null);
            document.body.classList.remove("reorder-pending");
          }
          return;
        }

        e.preventDefault();
        dragMove();
      };

      const onUp = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        const ctx = ctxRef.current;
        const target = targetIdRef.current;
        const draggedId = ctx?.draggedId ?? null;

        resetStyles();
        const wasDragging = finish();
        if (wasDragging) suppressClickUntilRef.current = Date.now() + 500;
        try {
          el.releasePointerCapture(pointerId);
        } catch {
          /* ignore */
        }

        if (draggedId && target && target !== draggedId) {
          onSwapRef.current(draggedId, target);
        }
      };

      // Non-passive: lets us cancel native scrolling once a drag is active.
      const blockTouchScroll = (e: TouchEvent) => {
        if (ctxRef.current) e.preventDefault();
      };

      document.addEventListener("pointermove", onMove, { passive: false });
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
      document.addEventListener("touchmove", blockTouchScroll, { passive: false });
      cleanupRef.current = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        document.removeEventListener("touchmove", blockTouchScroll);
      };

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setPendingId(null);
        setDraggingId(id);
        document.body.classList.remove("reorder-pending");
        document.body.classList.add("reorder-active");
        try {
          el.setPointerCapture(pointerId);
        } catch {
          /* ignore */
        }
        pickUp(id, pointerId, el);
        dragMove();
        rafRef.current = requestAnimationFrame(autoScrollTick);
      }, LONG_PRESS_MS);
    },
    [autoScrollTick, clearTimer, detach, dragMove, finish, pickUp, resetStyles, stopAutoScroll],
  );

  const getDragProps = useCallback(
    (id: string, disabled = false) => ({
      [attr]: id,
      onPointerDown: (e: React.PointerEvent) => {
        if (disabled || e.button !== 0) return;
        e.stopPropagation(); // innermost reorderable wins (row over group)
        // No early-return on an existing context: begin() resets it. A stale
        // context must never permanently block dragging.
        begin(id, e.pointerId, e.currentTarget as HTMLElement, e.clientX, e.clientY);
      },
      onContextMenu: (e: React.MouseEvent) => {
        if (ctxRef.current || pendingId === id) e.preventDefault();
      },
    }),
    [attr, begin, pendingId],
  );

  return { draggingId, pendingId, getDragProps };
}
