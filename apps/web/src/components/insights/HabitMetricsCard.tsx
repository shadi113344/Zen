import { useState } from "react";
import type { HabitMetricBarRow } from "@/components/insights/HabitMetricBars";
import { HabitMetricBars } from "@/components/insights/HabitMetricBars";

export type ActivityMetricView = "consistency" | "performance" | "streak";

const METRIC_OPTIONS: { value: ActivityMetricView; label: string }[] = [
  { value: "consistency", label: "Consistency" },
  { value: "performance", label: "Average score" },
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
    <section className="card page-section insights-metric-card">
      <div className="insights-metric-card__head">
        <h3 className="page-section__title insights-metric-card__title">Activity metrics · {periodTitle}</h3>
        <label className="insights-metric-card__picker">
          <span className="sr-only">Metric to display</span>
          <select value={metric} onChange={(e) => setMetric(e.target.value as ActivityMetricView)}>
            {METRIC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="muted-text insights-activities__hint">{hint}</p>
      <HabitMetricBars rows={rows} maxValue={maxValue} valueSuffix={suffix} onRemove={onRemoveChart} />
    </section>
  );
}
