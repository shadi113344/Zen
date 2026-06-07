import { categoryScoreNumeric, uniqueCategories } from "@mottazen/core";
import type { DayLog, Habit } from "@mottazen/core";
import { categoryTintStyle, resolveCategoryTint } from "@/lib/category-tint";
import { useCategoryColors, useCategoryWeights } from "@/hooks/useData";

interface CategoryChipsRowProps {
  habits: Habit[];
  logs: DayLog[];
  date: string;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export function CategoryChipsRow({
  habits,
  logs,
  date,
  selectedCategory,
  onSelectCategory,
}: CategoryChipsRowProps) {
  const { getWeights } = useCategoryWeights();
  const { categoryColors } = useCategoryColors();
  const categories = uniqueCategories(habits.filter((h) => !h.paused));
  if (categories.length === 0) return null;

  return (
    <div className="chips-row">
      <div className="chips-row__scroll" role="tablist" aria-label="Filter by life area">
        <button
          type="button"
          role="tab"
          aria-selected={selectedCategory === null}
          className={`category-chip card category-chip--filter${selectedCategory === null ? " category-chip--active" : ""}`}
          onClick={() => onSelectCategory(null)}
        >
          <span className="category-chip__name">All</span>
        </button>
        {categories.map((cat) => {
          const weights = getWeights(cat);
          const score = categoryScoreNumeric(cat, habits, logs, date, weights);
          const tint = resolveCategoryTint(cat, categoryColors);
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={active}
              className={`category-chip card category-card-tint category-chip--card category-chip--filter${active ? " category-chip--active" : ""}`}
              style={categoryTintStyle(tint)}
              onClick={() => onSelectCategory(active ? null : cat)}
            >
              <span className="category-chip__name">{cat}</span>
              <span className="category-chip__pct">{score === null ? "—" : `${score}%`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
