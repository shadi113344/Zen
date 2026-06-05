import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import type { DateRange, Habit } from "@mottazen/core";
import {
  categoryToSlug,
  consistency30d,
  datesForRange,
  habitDayHistory,
  habitScore,
  lastNDays,
  logValueForHabit,
  streak,
  todayKey,
} from "@mottazen/core";
import { EditHabitModal } from "@/components/habit/EditHabitModal";
import { HabitActivityCalendar } from "@/components/habit/HabitActivityCalendar";
import { ScoreLineChart } from "@/components/charts/ScoreLineChart";
import { HabitDetailCharts } from "@/components/habit/HabitDetailCharts";
import { HabitHistoryTable } from "@/components/habit/HabitHistoryTable";
import { StreakPills } from "@/components/habit/StreakPills";
import { SegmentedControl } from "@/components/SegmentedControl";
import { EmptyState } from "@/components/EmptyState";
import { useHabits, useLogs } from "@/hooks/useData";

export function HabitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { habits } = useHabits();
  const { logs } = useLogs();
  const habit = habits.find((h) => h.id === id);
  const today = todayKey();
  const [range, setRange] = useState<DateRange>("month");
  const [editOpen, setEditOpen] = useState(false);

  const fromToday = location.state?.fromToday === true;

  const dates = useMemo(() => {
    if (!habit) return [];
    const earliest = logs.filter((l) => l.habitId === habit.id).map((l) => l.date).sort()[0];
    return datesForRange(range, today, earliest);
  }, [habit, logs, range, today]);

  const calDates = useMemo(() => lastNDays(today, 30), [today]);
  const trendDates = useMemo(() => lastNDays(today, 30), [today]);
  const trendScores = useMemo(
    () =>
      trendDates.map((date) => {
        const value = logValueForHabit(logs, habit?.id ?? "", date);
        const row = logs.find((l) => l.habitId === habit?.id && l.date === date);
        return habit && habit.id ? habitScore(habit, value, row?.isRest) : null;
      }),
    [trendDates, habit, logs],
  );

  if (!habit) {
    return (
      <>
        <header className="page-header">
          <button type="button" className="page-header__back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h1 className="page-header__title">Habit</h1>
        </header>
        <EmptyState title="Habit not found" message="It may have been deleted." />
      </>
    );
  }

  const { current, best } = streak(habit.id, habit, logs, today);
  const consistency = consistency30d(habit, logs, lastNDays(today, 30));
  const history = habitDayHistory(habit, logs, dates);

  return (
    <div className={`habit-detail${fromToday ? " habit-detail--flash" : ""}`}>
      <header className="page-header">
        <button type="button" className="page-header__back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-header__title">{habit.name}</h1>
        <button type="button" className="habit-detail__edit-btn" onClick={() => setEditOpen(true)} aria-label="Edit habit">
          ✎
        </button>
      </header>

      <div className="habit-detail__meta card">
        <Link to={`/categories/${categoryToSlug(habit.category)}`} className="habit-detail__category">
          {habit.category}
        </Link>
        <span className="habit-detail__type">{habitTypeLabel(habit.type)}</span>
      </div>

      <StreakPills current={current} best={best} consistency30={consistency} />

      <section className="card page-section habit-detail__trend">
        <h3 className="page-section__title">Score trend · 30 days</h3>
        <ScoreLineChart dates={trendDates} values={trendScores} scrollable />
      </section>

      <HabitDetailCharts habit={habit} logs={logs} today={today} />

      <section className="card page-section">
        <h3 className="page-section__title">Activity</h3>
        <HabitActivityCalendar habit={habit} logs={logs} dates={calDates} />
      </section>

      <div className="page-section">
        <SegmentedControl
          ariaLabel="History range"
          value={range}
          onChange={setRange}
          options={[
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      <section className="card page-section">
        <h3 className="page-section__title">History</h3>
        <HabitHistoryTable habit={habit} rows={history} />
      </section>

      <EditHabitModal
        habit={habit}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onDeleted={() => navigate("/log")}
      />
    </div>
  );
}

function habitTypeLabel(type: Habit["type"]): string {
  switch (type) {
    case "numeric":
      return "Numeric";
    case "milestone":
      return "Milestone";
    case "onetime":
      return "One-time";
    default:
      return "Checkbox";
  }
}
