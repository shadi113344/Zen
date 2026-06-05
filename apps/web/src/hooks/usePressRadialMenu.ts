import { useCallback, useEffect, useRef, useState } from "react";

export interface PressMenuOption {
  id: string;
  label: string;
  icon: string;
  onSelect: () => void;
}

export function usePressRadialMenu(options: PressMenuOption[]) {
  const [open, setOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const highlightRef = useRef<string | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const openRef = useRef(false);

  const close = useCallback(() => {
    openRef.current = false;
    setOpen(false);
    setHighlightId(null);
    highlightRef.current = null;
    document.body.classList.remove("habit-menu-active");
    window.getSelection()?.removeAllRanges();
  }, []);

  const lastPoint = useRef({ x: 0, y: 0 });

  const pickAt = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const btn = el?.closest<HTMLElement>("[data-menu-option]");
    const id = btn?.dataset.menuOption ?? null;
    highlightRef.current = id;
    setHighlightId(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("touchmove", block, { passive: false });
    document.addEventListener("selectstart", block);
    document.addEventListener("contextmenu", block);
    window.getSelection()?.removeAllRanges();
    pickAt(lastPoint.current.x, lastPoint.current.y);
    return () => {
      document.removeEventListener("touchmove", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [open, pickAt]);

  const bindTrigger = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      lastPoint.current = { x: e.clientX, y: e.clientY };
      window.getSelection()?.removeAllRanges();
      openRef.current = true;
      setOpen(true);
      document.body.classList.add("habit-menu-active");
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!openRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      pickAt(e.clientX, e.clientY);
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (!openRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const id = highlightRef.current;
      const opt = options.find((o) => o.id === id);
      opt?.onSelect();
      close();
    },
    onPointerCancel: () => close(),
  };

  return { open, highlightId, btnRef, bindTrigger, close };
}
