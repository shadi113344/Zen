import { useEffect, useRef } from "react";

/** Debounce async writes (default 800ms per Phase 2 spec). */
export function useDebouncedEffect(
  effect: () => void | Promise<void>,
  deps: unknown[],
  delayMs = 800,
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void effect();
    }, delayMs);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
