import { useCallback, useEffect, useRef, useState } from "react";
import type { WidgetPlacement } from "@/lib/dashboard-cards";

const LONG_PRESS_MS = 280;
const MOVE_CANCEL_PX = 8;
const GRID_COLS = 4;

interface DragState {
  id: string;
  pointerId: number;
  el: HTMLElement;
  ghost: HTMLDivElement;
  containerRect: DOMRect;
  cellW: number;
  rowHeights: number[];       // measured row heights from grid
  rowTops: number[];          // cumulative top offsets per row
  offsetX: number;            // pointer offset within the picked-up card
  offsetY: number;
  colSpan: number;
  rowSpan: number;
}

export interface DropTarget {
  col: number;
  row: number;
  valid: boolean;
}

interface UseGridDragOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  widgets: WidgetPlacement[];
  onMove: (id: string, col: number, row: number) => void;
  isOccupied: (col: number, row: number, colSpan: number, rowSpan: number, excludeId?: string) => boolean;
}

export function useGridDrag({ containerRef, widgets, onMove, isOccupied }: UseGridDragOptions) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  const stateRef = useRef<DragState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });
  const cleanupRef = useRef<(() => void) | null>(null);
  const suppressClickRef = useRef(0);
  const onMoveRef = useRef(onMove);
  const isOccupiedRef = useRef(isOccupied);
  const widgetsRef = useRef(widgets);
  onMoveRef.current = onMove;
  isOccupiedRef.current = isOccupied;
  widgetsRef.current = widgets;

  // Suppress click after drag
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (Date.now() >= suppressClickRef.current) return;
      suppressClickRef.current = 0;
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  const removeGhost = useCallback(() => {
    stateRef.current?.ghost.remove();
  }, []);

  const finish = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    cleanupRef.current?.(); cleanupRef.current = null;
    removeGhost();
    stateRef.current = null;
    setDraggingId(null);
    setPendingId(null);
    setDropTarget(null);
    document.body.classList.remove("widget-drag-active", "widget-drag-pending");
  }, [removeGhost]);

  const calcDropTarget = useCallback((x: number, y: number): DropTarget | null => {
    const s = stateRef.current;
    if (!s) return null;
    const { containerRect, cellW, rowTops, colSpan, rowSpan, id } = s;

    // Pointer position relative to container
    const rx = x - containerRect.left;
    const ry = y - containerRect.top + window.scrollY - (containerRect.top + window.scrollY - containerRect.top);
    const scrollOffset = window.scrollY - (window.scrollY - (containerRect.top + window.scrollY - containerRect.top));

    // Simpler: use client coords adjusted for scroll
    const relX = x - containerRect.left;
    const absY = y + window.scrollY;
    const relY = absY - (containerRect.top + window.scrollY);

    void rx; void ry; void scrollOffset;

    const col = Math.max(0, Math.min(GRID_COLS - colSpan, Math.floor(relX / cellW)));
    // Find row by scanning rowTops
    let row = 0;
    for (let r = rowTops.length - 1; r >= 0; r--) {
      if (relY >= rowTops[r]!) { row = r; break; }
    }
    row = Math.max(0, row);

    const valid = !isOccupiedRef.current(col, row, colSpan, rowSpan, id);
    return { col, row, valid };
  }, []);

  const updateGhost = useCallback((x: number, y: number) => {
    const s = stateRef.current;
    if (!s) return;
    const gx = x - s.offsetX;
    const gy = y - s.offsetY;
    s.ghost.style.transform = `translate(${gx}px, ${gy}px)`;

    const dt = calcDropTarget(x, y);
    setDropTarget(dt);
  }, [calcDropTarget]);

  const measureGrid = useCallback((container: HTMLElement, id: string): Omit<DragState, "id"|"pointerId"|"el"|"ghost"|"offsetX"|"offsetY"|"colSpan"|"rowSpan"> => {
    const containerRect = container.getBoundingClientRect();
    const gap = 14; // matches --widget-gap CSS var
    const cellW = (containerRect.width + gap) / GRID_COLS;

    // Measure row heights by looking at placed widget elements
    const rowMap = new Map<number, number>();
    const allWidgets = widgetsRef.current;
    for (const w of allWidgets) {
      const el = container.querySelector<HTMLElement>(`[data-widget-id="${w.id}"]`);
      if (!el) continue;
      for (let r = w.row; r < w.row + w.rowSpan; r++) {
        const rect = el.getBoundingClientRect();
        const rowH = rect.height / w.rowSpan;
        rowMap.set(r, Math.max(rowMap.get(r) ?? 0, rowH));
      }
    }

    // Build rowTops array
    const maxRow = Math.max(...allWidgets.map((w) => w.row + w.rowSpan), 10);
    const rowHeights: number[] = [];
    const rowTops: number[] = [];
    let top = 0;
    for (let r = 0; r < maxRow; r++) {
      rowTops.push(top);
      const h = rowMap.get(r) ?? 160;
      rowHeights.push(h);
      top += h + gap;
    }

    return { containerRect, cellW, rowHeights, rowTops };
  }, []);

  const begin = useCallback((id: string, pointerId: number, el: HTMLElement, x: number, y: number) => {
    // Reset any leftover state
    finish();

    const widget = widgetsRef.current.find((w) => w.id === id);
    if (!widget) return;

    startRef.current = { x, y };
    lastPosRef.current = { x, y };
    setPendingId(id);
    document.body.classList.add("widget-drag-pending");

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      lastPosRef.current = { x: e.clientX, y: e.clientY };

      if (!stateRef.current) {
        const dx = Math.abs(e.clientX - startRef.current.x);
        const dy = Math.abs(e.clientY - startRef.current.y);
        if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
          clearTimeout(timerRef.current!);
          timerRef.current = null;
          cleanupRef.current?.(); cleanupRef.current = null;
          setPendingId(null);
          document.body.classList.remove("widget-drag-pending");
        }
        return;
      }
      e.preventDefault();
      updateGhost(e.clientX, e.clientY);
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const s = stateRef.current;
      const dt = dropTarget;
      const didDrag = s != null;

      finish();
      if (didDrag) suppressClickRef.current = Date.now() + 500;
      try { el.releasePointerCapture(pointerId); } catch { /* ignore */ }

      if (s && dt && dt.valid) {
        onMoveRef.current(s.id, dt.col, dt.row);
      }
    };

    const blockScroll = (e: TouchEvent) => { if (stateRef.current) e.preventDefault(); };

    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    document.addEventListener("touchmove", blockScroll, { passive: false });
    cleanupRef.current = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      document.removeEventListener("touchmove", blockScroll);
    };

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const container = containerRef.current;
      if (!container) { setPendingId(null); return; }

      const { containerRect, cellW, rowHeights, rowTops } = measureGrid(container, id);
      const elRect = el.getBoundingClientRect();

      // Create ghost
      const ghost = document.createElement("div");
      ghost.className = "widget-ghost";
      ghost.style.cssText = [
        `width:${elRect.width}px`,
        `height:${elRect.height}px`,
        `position:fixed`,
        `top:0`,
        `left:0`,
        `pointer-events:none`,
        `z-index:9999`,
        `border-radius:var(--radius)`,
        `box-shadow:var(--shadow-drag)`,
        `opacity:0.85`,
        `will-change:transform`,
        `transition:box-shadow 0.15s var(--ease-out)`,
      ].join(";");
      document.body.appendChild(ghost);

      // Clone the widget content into the ghost
      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.cssText = "width:100%;height:100%;overflow:hidden;border-radius:var(--radius);pointer-events:none;";
      ghost.appendChild(clone);

      const offsetX = x - elRect.left;
      const offsetY = y - elRect.top;

      stateRef.current = {
        id,
        pointerId,
        el,
        ghost,
        containerRect,
        cellW,
        rowHeights,
        rowTops,
        offsetX,
        offsetY,
        colSpan: widget.colSpan,
        rowSpan: widget.rowSpan,
      };

      // Mark original as transparent
      el.style.opacity = "0.25";
      el.style.transition = "opacity 0.15s var(--ease-out)";

      setPendingId(null);
      setDraggingId(id);
      document.body.classList.remove("widget-drag-pending");
      document.body.classList.add("widget-drag-active");

      try { el.setPointerCapture(pointerId); } catch { /* ignore */ }
      updateGhost(lastPosRef.current.x, lastPosRef.current.y);
    }, LONG_PRESS_MS);
  }, [containerRef, finish, measureGrid, updateGhost]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up ghost opacity on drag end
  useEffect(() => {
    if (!draggingId) {
      const container = containerRef.current;
      if (container) {
        const el = container.querySelector<HTMLElement>(`[data-widget-id="${draggingId}"]`);
        if (el) { el.style.opacity = ""; el.style.transition = ""; }
        // Reset all widget opacities (in case draggingId changed before effect ran)
        container.querySelectorAll<HTMLElement>("[data-widget-id]").forEach((node) => {
          node.style.opacity = "";
          node.style.transition = "";
        });
      }
    }
  }, [draggingId, containerRef]);

  const getDragProps = useCallback(
    (id: string) => ({
      "data-widget-id": id,
      onPointerDown: (e: React.PointerEvent) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        begin(id, e.pointerId, e.currentTarget as HTMLElement, e.clientX, e.clientY);
      },
      onContextMenu: (e: React.MouseEvent) => {
        if (stateRef.current || pendingId === id) e.preventDefault();
      },
    }),
    [begin, pendingId],
  );

  return { draggingId, pendingId, dropTarget, getDragProps };
}
