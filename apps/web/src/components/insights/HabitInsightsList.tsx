import { Link } from "react-router-dom";
import type { HabitConsistencyRow } from "@mottazen/core";
import { hasVisibleStreak } from "@mottazen/core";

interface HabitInsightsListProps {
  rows: HabitConsistencyRow[];
}

export function HabitInsightsList({ rows }: HabitInsightsListProps) {
  if (rows.length === 0) {
    return <p className="muted-text">No active habits.</p>;
  }

  return (
    <div className="insights-habit-list">
      {rows.map(({ habit, consistency, currentStreak: str }) => (
          <Link key={habit.id} to={`/habit/${habit.id}`} className="insights-habit-row card">
            <span className="insights-habit-row__dot" style={{ background: habit.color ?? "var(--accent)" }} />
            <span className="insights-habit-row__name">{habit.name}</span>
            <span className="insights-habit-row__meta">{habit.category}</span>
            <span className="insights-habit-row__pct">{consistency}%</span>
            {hasVisibleStreak(str) && <span className="insights-habit-row__streak">{str}d</span>}
          </Link>
        ))}
    </div>
  );
}
