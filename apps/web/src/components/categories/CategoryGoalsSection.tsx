import { useMemo } from "react";
import { activeGoals, goalHeaderMeta, goalsForCategory } from "@mottazen/core";
import { useGoals } from "@/hooks/useData";
import { useAppDate } from "@/hooks/useAppDate";

interface CategoryGoalsSectionProps {
  category: string;
}

export function CategoryGoalsSection({ category }: CategoryGoalsSectionProps) {
  const { goals, goalHabits, habits, logs } = useGoals();
  const { selectedDate } = useAppDate();

  const items = useMemo(() => {
    const scoped = activeGoals(goalsForCategory(goals, goalHabits, habits, category), selectedDate);
    return scoped.map((goal) => ({
      goal,
      header: goalHeaderMeta(goal, goalHabits, habits, logs, selectedDate),
    }));
  }, [goals, goalHabits, habits, logs, category, selectedDate]);

  if (items.length === 0) return null;

  return (
    <section className="card page-section category-goals">
      <h3 className="page-section__title">Targets in {category}</h3>
      <p className="category-goals__intro">
        These targets count toward this life area&apos;s group score (averaged with today&apos;s activity score).
      </p>
      <ul className="linked-goals">
        {items.map(({ goal, header }) => (
          <li key={goal.id}>
            <div className="linked-goals__row">
              <span className="linked-goals__main">
                <span className="linked-goals__name">{header.name}</span>
                <span className="linked-goals__summary">{header.summary}</span>
              </span>
              <span className="linked-goals__pct">{header.progressPct}%</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
