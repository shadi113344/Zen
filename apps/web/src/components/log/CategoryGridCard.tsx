import { categoryScoreNumeric } from "@mottazen/core";
import type { Habit } from "@mottazen/core";
import { categoryTintStyle, resolveCategoryTint } from "@/lib/category-tint";
import { useCategoryColors, useCategoryWeights, useHabits, useLogs } from "@/hooks/useData";
import { HabitGridTile } from "@/components/log/HabitGridTile";

interface CategoryGridCardProps {
  category: string;
  habits: Habit[];
  date: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function CategoryGridCard({
  category,
  habits,
  date,
  collapsed,
  onToggleCollapse,
}: CategoryGridCardProps) {
  const { habits: allHabits } = useHabits();
  const { logs } = useLogs();
  const { getWeights } = useCategoryWeights();
  const { categoryColors } = useCategoryColors();

  const score = categoryScoreNumeric(category, allHabits, logs, date, getWeights(category));
  const tint = resolveCategoryTint(category, categoryColors);

  return (
    <section
      className="category-grid-card card category-card-tint"
      style={categoryTintStyle(tint)}
      aria-label={`${category} category`}
    >
      <button
        type="button"
        className="category-grid-card__head"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
      >
        <span className="category-grid-card__name">{category}</span>
        <span className="category-grid-card__score">{score === null ? "—" : `${score}%`}</span>
        <span className="category-grid-card__chev" aria-hidden>
          {collapsed ? "▸" : "▾"}
        </span>
      </button>
      {!collapsed && (
        <div className="category-grid-card__habits">
          {habits.map((habit) => (
            <HabitGridTile key={habit.id} habit={habit} date={date} />
          ))}
        </div>
      )}
    </section>
  );
}
