import { useCallback, useMemo, useState } from "react";
import type { DayLog, Habit } from "@mottazen/core";
import { habitScore, lastNDays, logValueForHabit } from "@mottazen/core";
import { CategoryBarChart } from "@/components/CategoryBarChart";
import { ChartChrome } from "@/components/charts/ChartChrome";

const DEFAULT_CHARTS = ["scores", "weekday", "values"] as const;
type HabitChartId = (typeof DEFAULT_CHARTS)[number];

function storageKey(habitId: string) {
  return `mottazen-habit-charts-${habitId}`;
}

function defaultChartsFor(habit: Habit): HabitChartId[] {
  if (habit.type === "numeric" || habit.type === "milestone" || habit.type === "onetime") {
    return ["scores", "weekday", "values"];
  }
  return ["scores", "weekday"];
}

function loadVisible(habit: Habit): HabitChartId[] {
  const defaults = defaultChartsFor(habit);
  try {
    const raw = localStorage.getItem(storageKey(habit.id));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaults;
    return defaults.filter((id) => parsed.includes(id));
  } catch {
    return defaults;
  }
}

function weekdayAverages(habit: Habit, logs: DayLog[], dates: string[]): number[] {
  const sums = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const date of dates) {
    const value = logValueForHabit(logs, habit.id, date);
    const row = logs.find((l) => l.habitId === habit.id && l.date === date);
    const score = habitScore(habit, value, row?.isRest);
    if (score === null) continue;
    const dow = new Date(date + "T12:00:00").getDay();
    sums[dow] += score;
    counts[dow] += 1;
  }
  return sums.map((s, i) => (counts[i] ? Math.round(s / counts[i]) : 0));
}

interface HabitDetailChartsProps {
  habit: Habit;
  logs: DayLog[];
  today: string;
}

export function HabitDetailCharts({ habit, logs, today }: HabitDetailChartsProps) {
  const [visible, setVisible] = useState<HabitChartId[]>(() => loadVisible(habit));

  const hide = useCallback(
    (id: HabitChartId) => {
      setVisible((prev) => {
        const next = prev.filter((c) => c !== id);
        localStorage.setItem(storageKey(habit.id), JSON.stringify(next));
        return next;
      });
    },
    [habit.id],
  );

  const dates30 = useMemo(() => lastNDays(today, 30), [today]);

  const scoreSeries = useMemo(() => {
    return dates30.map((date) => {
      const value = logValueForHabit(logs, habit.id, date);
      const row = logs.find((l) => l.habitId === habit.id && l.date === date);
      return habitScore(habit, value, row?.isRest);
    });
  }, [dates30, habit, logs]);

  const valueSeries = useMemo(() => {
    if (habit.type !== "numeric" && habit.type !== "milestone") return null;
    return dates30.map((date) => {
      const value = logValueForHabit(logs, habit.id, date);
      const row = logs.find((l) => l.habitId === habit.id && l.date === date);
      if (row?.isRest || value === -1 || value === null) return null;
      return Number(value);
    });
  }, [dates30, habit, logs]);

  const weekday = useMemo(() => weekdayAverages(habit, logs, dates30), [habit, logs, dates30]);
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (visible.length === 0) {
    return <p className="muted-text">Charts hidden. Reload the page to restore defaults.</p>;
  }

  return (
    <div className="habit-detail-charts">
      {visible.includes("scores") && (
        <section className="card page-section">
          <h3 className="page-section__title">Daily score · 30 days</h3>
          <CategoryBarChart
            dates={dates30}
            values={scoreSeries}
            scrollable={dates30.length > 7}
            onRemove={() => hide("scores")}
          />
        </section>
      )}

      {visible.includes("weekday") && (
        <section className="card page-section">
          <h3 className="page-section__title">Average by weekday</h3>
          <ChartChrome onRemove={() => hide("weekday")}>
            <CategoryBarChart dates={weekdayLabels} values={weekday} />
          </ChartChrome>
        </section>
      )}

      {visible.includes("values") && valueSeries && (
        <section className="card page-section">
          <h3 className="page-section__title">
            {habit.type === "milestone" ? "Milestone progress" : "Logged values"} · 30 days
          </h3>
          <CategoryBarChart
            dates={dates30}
            values={valueSeries}
            scrollable
            onRemove={() => hide("values")}
          />
        </section>
      )}

      {visible.includes("values") && !valueSeries && habit.type === "onetime" && (
        <section className="card page-section">
          <h3 className="page-section__title">One-time completion</h3>
          <ChartChrome onRemove={() => hide("values")}>
            <p className="muted-text">
              {logs.some((l) => l.habitId === habit.id && (l.value ?? 0) > 0)
                ? "Marked complete on your log history."
                : "Not completed yet — log it once on Today when done."}
            </p>
          </ChartChrome>
        </section>
      )}
    </div>
  );
}
