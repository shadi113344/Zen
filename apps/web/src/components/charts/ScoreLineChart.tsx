import { ChartChrome } from "@/components/charts/ChartChrome";

interface ScoreLineChartProps {
  dates: string[];
  values: Array<number | null>;
  scrollable?: boolean;
  onRemove?: () => void;
}

export function ScoreLineChart({ dates, values, scrollable = false, onRemove }: ScoreLineChartProps) {
  const numeric = values.filter((v): v is number => v !== null && v >= 0);
  const max = Math.max(...numeric, 1);
  const min = 0;
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      if (v === null || v < 0) return null;
      const x = values.length <= 1 ? 50 : (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .filter((p): p is string => p != null);

  const polyline = points.length >= 2 ? points.join(" ") : "";
  const chartClass = ["line-chart", scrollable ? "line-chart--scroll" : ""].filter(Boolean).join(" ");

  return (
    <ChartChrome onRemove={onRemove}>
      <div className={scrollable ? "line-chart-scroll" : undefined}>
        <div className={chartClass} role="img" aria-label="Score trend">
          <svg className="line-chart__svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            {polyline ? (
              <>
                <polyline className="line-chart__area" points={`0,100 ${polyline} 100,100`} />
                <polyline className="line-chart__line" points={polyline} />
              </>
            ) : null}
          </svg>
          <div className="line-chart__labels">
            {dates.map((date, i) => (
              <span key={date} className="line-chart__label">
                {formatDayLabel(date, scrollable, i, dates.length)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </ChartChrome>
  );
}

function formatDayLabel(dateKey: string, compact: boolean, index: number, total: number): string {
  const d = new Date(dateKey + "T12:00:00");
  if (!compact && total > 14 && index % Math.ceil(total / 7) !== 0) return "";
  if (compact) {
    return d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { weekday: "narrow" });
}
