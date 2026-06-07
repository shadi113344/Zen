import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { activeGoals, categoryToSlug, todayKey } from "@mottazen/core";
import { GoalDetailCard } from "@/components/goals/GoalDetailCard";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { useData } from "@/hooks/useData";
import { useToast } from "@/components/Toast";

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { goals, goalHabits, habits, logs, deleteGoal } = useData();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const today = todayKey();

  const goal = goals.find((g) => g.id === id);
  const isActiveToday = useMemo(
    () => (goal ? activeGoals(goals, today).some((g) => g.id === goal.id) : false),
    [goal, goals, today],
  );

  if (!id) return <Navigate to="/goals" replace />;
  if (!goal) {
    return (
      <div className="goals-screen">
        <header className="log-header tab-screen-header goals-screen__header">
          <div className="log-header__title-row">
            <h1 className="log-header__title">Target</h1>
          </div>
        </header>
        <p className="goals-screen__missing">
          Target not found.{" "}
          <Link to="/goals" className="goals-screen__missing-link">
            Back to Targets
          </Link>
        </p>
      </div>
    );
  }

  const confirmDelete = () => {
    if (!window.confirm(`Remove target “${goal.name}”? Activities stay; only the target is removed.`)) return;
    deleteGoal(goal.id);
    showToast("Target removed");
  };

  return (
    <div className="goals-screen goals-screen--detail">
      <header className="log-header tab-screen-header goals-screen__header">
        <div className="log-header__title-row">
          <Link to="/goals" className="page-header__back goals-screen__back">
            ← Targets
          </Link>
          <h1 className="log-header__title">{goal.name}</h1>
        </div>
        {goal.category ? (
          <Link to={`/categories/${categoryToSlug(goal.category)}`} className="goals-screen__group-link">
            {goal.category} life area →
          </Link>
        ) : null}
      </header>

      <div className="goals-screen__body goals-screen__body--detail">
        <GoalDetailCard
          goal={goal}
          habits={habits}
          logs={logs}
          goalHabits={goalHabits}
          date={today}
          isActiveToday={isActiveToday}
          onEdit={() => setEditOpen(true)}
          onDelete={confirmDelete}
        />
      </div>

      <GoalFormModal open={editOpen} onClose={() => setEditOpen(false)} goalToEdit={goal} />
    </div>
  );
}
