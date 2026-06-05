import { useCallback, useRef } from "react";

export function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      cancel();
      const el = e.currentTarget as HTMLElement;
      const block = (ev: Event) => ev.preventDefault();
      el.addEventListener("selectstart", block);
      el.addEventListener("contextmenu", block);
      cleanupRef.current = () => {
        el.removeEventListener("selectstart", block);
        el.removeEventListener("contextmenu", block);
      };
      timer.current = setTimeout(onLongPress, ms);
    },
    [cancel, onLongPress, ms],
  );

  return {
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  };
}
