import { ChartChrome } from "@/components/charts/ChartChrome";

interface CategoryBarChartProps {
  dates: string[];
  values: Array<number | null>;
  scrollable?: boolean;
  onRemove?: () => void;
}

export function CategoryBarChart({ dates, values, scrollable = false, onRemove }: CategoryBarChartProps) {
  const numeric = values.filter((v): v is number => v !== null && v >= 0);
  const max = Math.max(...numeric, 1);

  const chartClass = ["bar-chart", scrollable ? "bar-chart--scroll" : ""].filter(Boolean).join(" ");

  return (
    <ChartChrome onRemove={onRemove}>
      <div className={scrollable ? "bar-chart-scroll" : undefined}>
        <div className={chartClass} role="img" aria-label="Daily scores">
          {values.map((v, i) => {
            const height = v === null || v < 0 ? 2 : Math.max(4, (v / max) * 100);
            return (
              <div key={dates[i]} className="bar-chart__bar-wrap">
                <div className="bar-chart__bar" style={{ height: `${height}%`, opacity: v === null ? 0.3 : 1 }} />
                <span className="bar-chart__label">{formatDayLabel(dates[i]!, scrollable)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </ChartChrome>
  );
}

function formatDayLabel(dateKey: string, compact: boolean): string {
  const d = new Date(dateKey + "T12:00:00");
  if (compact) {
    return d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { weekday: "narrow" });
}
