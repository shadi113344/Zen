import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import type { Habit } from "@mottazen/core";
import {
  categoryToSlug,
  consistency30d,
  habitScore,
  lastNDays,
  logValueForHabit,
  streak,
  todayKey,
  visibleStreak,
} from "@mottazen/core";
import { EditHabitModal } from "@/components/habit/EditHabitModal";
import { HabitMonthCalendar } from "@/components/habit/HabitMonthCalendar";
import { ScoreLineChart } from "@/components/charts/ScoreLineChart";
import { HabitDetailCharts } from "@/components/habit/HabitDetailCharts";
import { StreakPills } from "@/components/habit/StreakPills";
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
  const [editOpen, setEditOpen] = useState(false);

  const fromToday = location.state?.fromToday === true;

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
          <h1 className="page-header__title">Activity</h1>
        </header>
        <EmptyState title="Activity not found" message="It may have been deleted." />
      </>
    );
  }

  const { current, best } = streak(habit.id, habit, logs, today);
  const consistency = consistency30d(habit, logs, lastNDays(today, 30));

  return (
    <div className={`habit-detail${fromToday ? " habit-detail--flash" : ""}`}>
      <header className="page-header">
        <button type="button" className="page-header__back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="page-header__title">{habit.name}</h1>
        <button type="button" className="habit-detail__edit-btn" onClick={() => setEditOpen(true)} aria-label="Edit activity">
          ✎
        </button>
      </header>

      <div className="habit-detail__meta card">
        <Link to={`/categories/${categoryToSlug(habit.category)}`} className="habit-detail__category">
          {habit.category}
        </Link>
        <span className="habit-detail__type">{habitTypeLabel(habit.type)}</span>
      </div>

      <StreakPills current={visibleStreak(current)} best={visibleStreak(best)} consistency30={consistency} />

      <section className="card page-section habit-detail__trend">
        <h3 className="page-section__title">Score trend · 30 days</h3>
        <ScoreLineChart dates={trendDates} values={trendScores} scrollable />
      </section>

      <HabitDetailCharts habit={habit} logs={logs} today={today} />

      <section className="card page-section">
        <h3 className="page-section__title">Calendar</h3>
        <HabitMonthCalendar habit={habit} logs={logs} today={today} />
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
