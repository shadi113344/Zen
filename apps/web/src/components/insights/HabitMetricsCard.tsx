import { useState, useEffect, useRef } from "react";
import type { HabitMetricBarRow } from "@/components/insights/HabitMetricBars";
import { HabitMetricBars } from "@/components/insights/HabitMetricBars";

export type ActivityMetricView = "consistency" | "performance" | "streak";

const METRIC_OPTIONS: { value: ActivityMetricView; label: string }[] = [
  { value: "consistency", label: "Consistency" },
  { value: "performance", label: "Avg score" },
  { value: "streak", label: "Streaks" },
];

interface HabitMetricsCardProps {
  periodTitle: string;
  consistencyRows: HabitMetricBarRow[];
  performanceRows: HabitMetricBarRow[];
  streakRows: HabitMetricBarRow[];
  onRemoveChart?: () => void;
}

export function HabitMetricsCard({
  periodTitle,
  consistencyRows,
  performanceRows,
  streakRows,
  onRemoveChart,
}: HabitMetricsCardProps) {
  const [metric, setMetric] = useState<ActivityMetricView>("consistency");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  const hint =
    metric === "consistency"
      ? "Share of days logged vs. skipped in range."
      : metric === "performance"
        ? "Mean daily score on logged days (rest days excluded)."
        : "Consecutive days logged through today.";

  const rows =
    metric === "consistency" ? consistencyRows : metric === "performance" ? performanceRows : streakRows;

  const suffix = metric === "streak" ? "d" : "%";
  const maxValue = metric === "streak" ? undefined : 100;

  return (
    <section ref={rootRef} className="card page-section insights-metric-card">
      <h3 className="page-section__title insights-metric-card__title">
        Activity metrics · {periodTitle}
      </h3>

      {/* Compact metric-picker — sits in the absolute button row alongside
          size-toggle (right:44px) and chart-chrome trigger (right:16px) */}
      <button
        type="button"
        className="metric-picker__trigger"
        aria-label="Switch metric"
        aria-haspopup="menu"
        aria-expanded={open}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      />
      {open && (
        <div className="metric-picker__menu" role="menu">
          {METRIC_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitem"
              className={`metric-picker__item${metric === o.value ? " is-active" : ""}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => {
                setMetric(o.value);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <p className="muted-text insights-activities__hint">{hint}</p>
      <HabitMetricBars rows={rows} maxValue={maxValue} valueSuffix={suffix} onRemove={onRemoveChart} />
    </section>
  );
}
