import { Link } from "react-router-dom";
import {
  formatHabitGoalLine,
  goalHeaderMeta,
  habitCountsForGoal,
  habitGoalProgressMeta,
  habitGoalProgressPct,
  linksForGoal,
  logValueForHabit,
  resolveGoalCadence,
  todayKey,
} from "@mottazen/core";
import type { DayLog, Goal, GoalHabitLink, GoalKind, Habit } from "@mottazen/core";
import { GoalColorDot } from "@/components/goals/GoalColorDot";
import { resolveGoalColor } from "@/lib/goal-color";

function kindLabel(kind: GoalKind): string {
  if (kind === "consistency") return "Consistency";
  if (kind === "cumulative") return "Cumulative";
  return "Legacy";
}

function todayLogLabel(habit: Habit, logs: DayLog[], date: string): string {
  const value = logValueForHabit(logs, habit.id, date);
  const row = logs.find((l) => l.habitId === habit.id && l.date === date);
  if (row?.isRest || value === -1) return "Rest today";
  if (value === null) return "Not logged today";
  if (habit.type === "check" || habit.type === "onetime") {
    return value > 0 ? "Done today" : "Not done today";
  }
  return `Logged today: ${value}`;
}

function typeDetail(goal: Goal): string {
  if (goal.kind === "consistency") {
    const { count, period } = resolveGoalCadence(goal);
    return `${count} day${count === 1 ? "" : "s"} / ${period} per activity`;
  }
  if (goal.kind === "cumulative") {
    const unit = goal.unit ? ` ${goal.unit}` : "";
    return `${goal.targetTotal ?? 0}${unit} total`;
  }
  return `${goal.period ?? "weekly"} · ${goal.targetPercent ?? 80}% target`;
}

export interface GoalDetailCardProps {
  goal: Goal;
  habits: Habit[];
  logs: DayLog[];
  goalHabits: GoalHabitLink[];
  date?: string;
  isActiveToday?: boolean;
  detailHref?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function GoalDetailCard({
  goal,
  habits,
  logs,
  goalHabits,
  date = todayKey(),
  isActiveToday = true,
  detailHref,
  onEdit,
  onDelete,
}: GoalDetailCardProps) {
  const header = goalHeaderMeta(goal, goalHabits, habits, logs, date);
  const linked = linksForGoal(goal.id, goalHabits)
    .map((l) => habits.find((h) => h.id === l.habitId))
    .filter((h): h is Habit => h != null);

  return (
    <article className="card goal-detail-card">
      <div className="goal-detail-card__hero">
        <div className="goal-detail-card__head">
          <span className="goal-detail-card__name-row">
            <GoalColorDot goal={goal} title={goal.name} />
            {detailHref ? (
              <Link to={detailHref} className="goal-detail-card__name goal-detail-card__name-link">
                {goal.name}
              </Link>
            ) : (
              <h2 className="goal-detail-card__name">{goal.name}</h2>
            )}
          </span>
          <span className="goal-detail-card__pct">{header.progressPct}%</span>
        </div>
        <p className="goal-detail-card__summary">{header.summary}</p>
        <p className="goal-detail-card__meta">
          {kindLabel(goal.kind)} · {typeDetail(goal)}
          <br />
          {goal.startDate} → {goal.endDate}
          {isActiveToday ? "" : " · not active today"}
        </p>
      </div>

      <div className="goal-detail-card__activities">
        <span className="goal-detail-card__activities-label">Linked activities</span>
        {linked.length === 0 ? (
          <p className="goal-detail-card__activities-empty">None linked</p>
        ) : (
          <ul className="goal-detail-card__habit-list">
            {linked.map((h) => {
              const meta = habitGoalProgressMeta(goal, h.id, habits, logs, date);
              const progressLine = meta ? formatHabitGoalLine(meta) : null;
              const barPct = habitGoalProgressPct(goal, h.id, habits, logs, date);
              const countsToday = habitCountsForGoal(h, logs, date);
              return (
                <li key={h.id} className="goal-detail-card__habit-item">
                  <Link to={`/habit/${h.id}`} className="goal-detail-card__habit-link">
                    <span className="goal-detail-card__habit-main">
                      <span className="goal-detail-card__habit-name">{h.name}</span>
                      {progressLine ? (
                        <span className="goal-detail-card__habit-progress">{progressLine}</span>
                      ) : null}
                      <span className="goal-detail-card__habit-today">
                        {todayLogLabel(h, logs, date)}
                        {countsToday ? " · counts for target" : ""}
                      </span>
                    </span>
                    <span className="goal-detail-card__habit-pct">{barPct}%</span>
                  </Link>
                  <div
                    className="goal-detail-card__habit-bar"
                    role="progressbar"
                    aria-valuenow={barPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${h.name} progress`}
                  >
                    <span
                      className="goal-detail-card__habit-bar-fill"
                      style={{ width: `${barPct}%`, backgroundColor: resolveGoalColor(goal) }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {onEdit || onDelete ? (
        <div className="goal-detail-card__actions">
          {onEdit ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={onEdit}>
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" className="btn btn--ghost btn--sm goal-detail-card__delete" onClick={onDelete}>
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
