import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { activeGoals, categoryToSlug, todayKey } from "@mottazen/core";
import type { Goal } from "@mottazen/core";
import { GoalDetailCard } from "@/components/goals/GoalDetailCard";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { EmptyState } from "@/components/EmptyState";
import { FabButton } from "@/components/FabButton";
import { useData } from "@/hooks/useData";
import { useToast } from "@/components/Toast";

export function GoalsPage({ openAdd = false }: { openAdd?: boolean }) {
  const { goals, goalHabits, habits, logs, deleteGoal } = useData();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [addOpen, setAddOpen] = useState(openAdd);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const today = todayKey();

  useEffect(() => {
    if (location.pathname === "/goals/new") setAddOpen(true);
  }, [location.pathname]);

  const sorted = useMemo(
    () => [...goals].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [goals],
  );

  const activeToday = useMemo(() => activeGoals(goals, today), [goals, today]);

  const grouped = useMemo(() => {
    const map = new Map<string, Goal[]>();
    for (const goal of sorted) {
      const cat = goal.category?.trim() || "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(goal);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sorted]);

  const closeForm = () => {
    setAddOpen(false);
    setEditGoal(null);
    if (location.pathname === "/goals/new") navigate("/goals", { replace: true });
  };

  const confirmDelete = (goal: Goal) => {
    if (!window.confirm(`Remove target “${goal.name}”? Activities stay; only the target is removed.`)) return;
    deleteGoal(goal.id);
    showToast("Target removed");
  };

  const formOpen = addOpen || editGoal != null;

  return (
    <div className="goals-screen">
      <header className="log-header tab-screen-header goals-screen__header">
        <div className="log-header__title-row">
          <h1 className="log-header__title">Targets</h1>
          <button
            type="button"
            className="btn btn--primary btn--sm goals-screen__add"
            onClick={() => {
              setEditGoal(null);
              setAddOpen(true);
            }}
          >
            Add target
          </button>
        </div>
      </header>

      <div className="goals-screen__body">
        {sorted.length === 0 ? (
          <EmptyState
            title="No targets yet"
            message="Create a target to track activities over time and include them in a life area group score."
            action={
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setEditGoal(null);
                  setAddOpen(true);
                }}
              >
                Add your first target
              </button>
            }
          />
        ) : (
          grouped.map(([category, items]) => (
            <section key={category} className="goals-screen__group">
              <div className="goals-screen__group-head">
                <h2 className="goals-screen__group-title">{category}</h2>
                <Link to={`/categories/${categoryToSlug(category)}`} className="goals-screen__group-link">
                  Life area →
                </Link>
              </div>
              <ul className="goals-screen__list">
                {items.map((goal) => (
                  <li key={goal.id}>
                    <GoalDetailCard
                      goal={goal}
                      habits={habits}
                      logs={logs}
                      goalHabits={goalHabits}
                      date={today}
                      isActiveToday={activeToday.some((g) => g.id === goal.id)}
                      detailHref={`/goals/${goal.id}`}
                      onEdit={() => {
                        setAddOpen(false);
                        setEditGoal(goal);
                      }}
                      onDelete={() => confirmDelete(goal)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <FabButton
        label="Add target"
        onClick={() => {
          setEditGoal(null);
          setAddOpen(true);
        }}
        className="goals-screen__fab"
      />

      <GoalFormModal open={formOpen} onClose={closeForm} goalToEdit={editGoal} />
    </div>
  );
}
