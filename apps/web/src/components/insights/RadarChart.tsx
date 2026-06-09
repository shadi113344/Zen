import type { RadarPoint } from "@mottazen/core";
import { ChartChrome } from "@/components/charts/ChartChrome";

interface RadarChartProps {
  points: RadarPoint[];
  emptyMessage?: string;
  ariaLabel?: string;
  onRemove?: () => void;
}

export function RadarChart({
  points,
  emptyMessage = "Add activities to see balance.",
  ariaLabel = "Category balance radar",
  onRemove,
}: RadarChartProps) {
  if (points.length === 0) {
    return <p className="muted-text">{emptyMessage}</p>;
  }

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 80;
  const n = points.length;
  const angleStep = (Math.PI * 2) / n;

  const vertices = points.map((p, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const r = (p.score / 100) * maxR;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      labelX: cx + Math.cos(angle) * (maxR + 22),
      labelY: cy + Math.sin(angle) * (maxR + 22),
      category: p.category,
      score: p.score,
    };
  });

  const polygon = vertices.map((v) => `${v.x},${v.y}`).join(" ");
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <ChartChrome onRemove={onRemove}>
    <div className="radar-chart">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={ariaLabel} style={{ width: "100%", height: "auto" }}>
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={points
              .map((_, i) => {
                const angle = -Math.PI / 2 + i * angleStep;
                const r = maxR * level;
                return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
              })
              .join(" ")}
            fill="none"
            stroke="var(--chart-grid)"
            strokeWidth="1"
          />
        ))}
        {points.map((_, i) => {
          const angle = -Math.PI / 2 + i * angleStep;
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={cx + Math.cos(angle) * maxR}
              y2={cy + Math.sin(angle) * maxR}
              stroke="var(--chart-grid)"
              strokeWidth="1"
            />
          );
        })}
        <polygon
          points={polygon}
          fill="color-mix(in srgb, var(--accent) 28%, transparent)"
          stroke="var(--chart-series)"
          strokeWidth="2"
        />
        {vertices.map((v) => (
          <text
            key={v.category}
            x={v.labelX}
            y={v.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="radar-chart__label"
          >
            {truncateLabel(v.category, 14)}
          </text>
        ))}
      </svg>
      <ul className="radar-chart__legend">
        {points.map((p) => (
          <li key={p.category}>
            <span>{p.category}</span>
            <strong>{p.score}%</strong>
          </li>
        ))}
      </ul>
    </div>
    </ChartChrome>
  );
}

function truncateLabel(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
