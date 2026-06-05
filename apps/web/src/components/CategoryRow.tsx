import { Link } from "react-router-dom";
import { categoryToSlug } from "@mottazen/core";
import { categoryTintStyle, resolveCategoryTint } from "@/lib/category-tint";
import { useCategoryColors } from "@/hooks/useData";

interface CategoryRowProps {
  name: string;
  todayPercent: number | null;
  avg7: number;
  habitCount: number;
  pausedCount?: number;
  bestHabitName?: string;
  weakestHabitName?: string;
  sparkline: number[];
}

export function CategoryRow({
  name,
  todayPercent,
  avg7,
  habitCount,
  pausedCount = 0,
  bestHabitName,
  weakestHabitName,
  sparkline,
}: CategoryRowProps) {
  const { categoryColors } = useCategoryColors();
  const slug = categoryToSlug(name);
  const points = sparklineToPolyline(sparkline);
  const tint = resolveCategoryTint(name, categoryColors);

  return (
    <Link
      to={`/categories/${slug}`}
      className="category-row card category-card-tint"
      style={categoryTintStyle(tint)}
    >
      <div className="category-row__inner">
        <span className="category-row__dot" aria-hidden />
        <div className="category-row__body">
          <div className="category-row__top">
            <span className="category-row__name">{name}</span>
            <span className="category-row__pct">{todayPercent === null ? "—" : `${todayPercent}%`}</span>
          </div>
          <div className="category-row__meta">
            {habitCount} active
            {pausedCount > 0 ? ` · ${pausedCount} paused` : ""} · 7-day avg {avg7}%
            {bestHabitName && (
              <>
                <br />
                <span className="muted-text">
                  Best: {bestHabitName}
                  {weakestHabitName && weakestHabitName !== bestHabitName ? ` · Watch: ${weakestHabitName}` : ""}
                </span>
              </>
            )}
          </div>
          <svg className="sparkline" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
            <polyline points={points} />
          </svg>
        </div>
        <span aria-hidden style={{ color: "var(--muted)" }}>
          ›
        </span>
      </div>
    </Link>
  );
}

function sparklineToPolyline(values: number[]): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  return values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 100;
      const y = 32 - (v / max) * 28;
      return `${x},${y}`;
    })
    .join(" ");
}
