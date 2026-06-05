import { useCallback, useLayoutEffect, useState, type DependencyList, type RefObject } from "react";

export interface SlidingIndicatorStyle {
  left: number;
  width: number;
  ready: boolean;
}

function readPosition(container: HTMLElement, el: HTMLElement) {
  const c = container.getBoundingClientRect();
  const a = el.getBoundingClientRect();
  return { left: a.left - c.left, width: a.width };
}

/**
 * Positions a sliding pill behind the active item in a tab/segment row.
 */
export function useSlidingIndicator(
  containerRef: RefObject<HTMLElement | null>,
  activeSelector: string,
  deps: DependencyList,
): SlidingIndicatorStyle {
  const [style, setStyle] = useState({ left: 0, width: 0, ready: false });

  const applyMeasure = useCallback((container: HTMLElement, el: HTMLElement, markReady = true) => {
    const { left, width } = readPosition(container, el);
    setStyle((prev) => {
      if (prev.left === left && prev.width === width && prev.ready === markReady) return prev;
      return { left, width, ready: markReady };
    });
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const active = container.querySelector<HTMLElement>(activeSelector);
      if (!active) {
        setStyle((prev) => (prev.ready ? { left: prev.left, width: prev.width, ready: false } : prev));
        return;
      }
      applyMeasure(container, active, true);
    };

    measure();

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(container);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps forwarded from caller
  }, [activeSelector, containerRef, applyMeasure, ...deps]);

  return style;
}
