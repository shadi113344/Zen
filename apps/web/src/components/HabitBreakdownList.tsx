import { Link } from "react-router-dom";
import { currentStreak, habitConsistencyInRange } from "@mottazen/core";
import type { DayLog, Habit } from "@mottazen/core";
import { SegmentedControl } from "./SegmentedControl";

export type HabitSort = "consistency" | "streak" | "name";

interface HabitBreakdownListProps {
  habits: Habit[];
  logs: DayLog[];
  dates: string[];
  today: string;
  sort: HabitSort;
  onSortChange: (s: HabitSort) => void;
}

export function HabitBreakdownList({
  habits,
  logs,
  dates,
  today,
  sort,
  onSortChange,
}: HabitBreakdownListProps) {
  const rows = habits
    .map((habit) => ({
      habit,
      consistency: habitConsistencyInRange(habit, logs, dates),
      streak: currentStreak(habit, logs, today),
    }))
    .sort((a, b) => {
      if (sort === "consistency") return b.consistency - a.consistency;
      if (sort === "streak") return b.streak - a.streak;
      return a.habit.name.localeCompare(b.habit.name);
    });

  return (
    <section className="card page-section">
      <div className="habit-breakdown__header">
        <h3 className="habit-breakdown__title">Habits in category</h3>
        <SegmentedControl
          ariaLabel="Sort habits"
          value={sort}
          onChange={onSortChange}
          options={[
            { value: "consistency", label: "Consistency" },
            { value: "streak", label: "Streak" },
            { value: "name", label: "A–Z" },
          ]}
        />
      </div>
      {rows.map(({ habit, consistency, streak: str }) => (
        <Link key={habit.id} to={`/habit/${habit.id}`} className="habit-row">
          <span className="habit-row__name">{habit.name}</span>
          <div className="habit-row__bar-wrap">
            <div className="habit-row__bar" style={{ width: `${consistency}%` }} />
          </div>
          <span className="habit-row__pct">{consistency}%</span>
          <span className="habit-row__meta">{str >= 4 ? `streak ${str}` : str === 0 ? "at risk" : `streak ${str}`}</span>
        </Link>
      ))}
    </section>
  );
}
