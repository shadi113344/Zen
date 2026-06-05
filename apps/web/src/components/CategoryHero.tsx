import type { ReactNode } from "react";
import { ScoreRing } from "./ScoreRing";

interface StatTile {
  label: string;
  value: ReactNode;
}

interface CategoryHeroProps {
  categoryName: string;
  score: number | null;
  /** Shown beside the ring when there is no score (rest / empty). Not drawn inside the ring. */
  statusLabel?: string;
  delta?: number | null;
  stats: StatTile[];
}

export function CategoryHero({ categoryName, score, statusLabel, delta, stats }: CategoryHeroProps) {
  return (
    <section className="card">
      <div className="hero-block">
        <ScoreRing value={score} size="lg" />
        <div className="hero-block__copy">
          <h2>{categoryName}</h2>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {score === null ? statusLabel ?? "No data" : `${score}%`}
          </div>
          {delta !== null && delta !== undefined && (
            <div className={`delta${delta < 0 ? " delta--down" : ""}`}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}% vs 7-day avg
            </div>
          )}
        </div>
      </div>
      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-tile">
            <div className="stat-tile__label">{s.label}</div>
            <div className="stat-tile__value">{s.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
