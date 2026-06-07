import { useMemo } from "react";
import { Link } from "react-router-dom";
import { activeGoals, goalHeaderMeta } from "@mottazen/core";
import { GoalColorDot } from "@/components/goals/GoalColorDot";
import { useGoals } from "@/hooks/useData";

interface GoalChipsRowProps {
  date: string;
}

export function GoalChipsRow({ date }: GoalChipsRowProps) {
  const { goals, goalHabits, habits, logs } = useGoals();
  const active = useMemo(() => activeGoals(goals, date), [goals, date]);

  if (active.length === 0) return null;

  return (
    <div className="chips-row goals-chips-row">
      <span className="chips-row__label">Today&apos;s targets</span>
      <div className="chips-row__scroll" role="list" aria-label="Active targets today">
        {active.map((goal) => {
          const header = goalHeaderMeta(goal, goalHabits, habits, logs, date);
          return (
            <Link
              key={goal.id}
              to={`/goals/${goal.id}`}
              className="goal-chip card"
              role="listitem"
            >
              <GoalColorDot goal={goal} />
              <span className="goal-chip__name">{goal.name}</span>
              <span className="goal-chip__pct">{header.progressPct}%</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
