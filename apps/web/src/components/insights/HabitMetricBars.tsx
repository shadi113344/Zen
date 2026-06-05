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
  if (rows.length === 0) {
    return <p className="muted-text">{emptyMessage}</p>;
  }

  const cap = Math.max(maxValue, 1, ...rows.map((r) => r.value));

  return (
    <ChartChrome onRemove={onRemove}>
    <div className="habit-metric-bars" role="list">
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
            {value}
            {valueSuffix}
          </span>
        </div>
      ))}
    </div>
    </ChartChrome>
  );
}
