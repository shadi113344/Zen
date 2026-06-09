import { useRef, useState, useEffect, useCallback } from "react";
import type { Habit } from "@mottazen/core";
import { ChartChrome } from "@/components/charts/ChartChrome";

export interface HabitMetricBarRow {
  habit: Habit;
  value: number;
}

interface HabitMetricBarsProps {
  rows: HabitMetricBarRow[];
  maxValue?: number;
  valueSuffix?: string;
  emptyMessage?: string;
  onRemove?: () => void;
}

export function HabitMetricBars({
  rows,
  maxValue = 100,
  valueSuffix = "%",
  emptyMessage = "No activities to compare.",
  onRemove,
}: HabitMetricBarsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canUp, setCanUp] = useState(false);
  const [canDown, setCanDown] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanUp(el.scrollTop > 4);
    setCanDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateArrows); ro.disconnect(); };
  }, [updateArrows]);

  if (rows.length === 0) {
    return <p className="muted-text">{emptyMessage}</p>;
  }

  const cap = Math.max(maxValue, 1, ...rows.map((r) => r.value));

  const scroll = (dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ top: dir * 72, behavior: "smooth" });
  };

  return (
    <ChartChrome onRemove={onRemove}>
      <div className="habit-metric-bars__wrap">
        {canUp && (
          <button
            type="button"
            className="habit-metric-bars__arrow habit-metric-bars__arrow--up"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => scroll(-1)}
            aria-label="Scroll up"
          >
            ▲
          </button>
        )}
        <div
          ref={scrollRef}
          className="habit-metric-bars"
          role="list"
        >
          {rows.map(({ habit, value }) => (
            <div key={habit.id} className="habit-metric-bars__row" role="listitem">
              <span className="habit-metric-bars__dot" style={{ background: habit.color ?? "var(--accent)" }} aria-hidden />
              <span className="habit-metric-bars__name" title={habit.name}>
                {habit.name}
              </span>
              <div className="habit-metric-bars__track" aria-hidden>
                <div
                  className="habit-metric-bars__fill"
                  style={{ width: `${Math.min(100, (value / cap) * 100)}%` }}
                />
              </div>
              <span className="habit-metric-bars__value">
                {value}{valueSuffix}
              </span>
            </div>
          ))}
        </div>
        {canDown && (
          <button
            type="button"
            className="habit-metric-bars__arrow habit-metric-bars__arrow--down"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => scroll(1)}
            aria-label="Scroll down"
          >
            ▼
          </button>
        )}
      </div>
    </ChartChrome>
  );
}
