import { useState } from "react";
import {
  categoryHabitExtremes,
  categoryScoreNumeric,
  categorySeries,
  lastNDays,
  weekAverage,
} from "@mottazen/core";
import { AddCategoryModal } from "@/components/categories/AddCategoryModal";
import { CategoryRow } from "@/components/CategoryRow";
import { EmptyState } from "@/components/EmptyState";
import { FabButton } from "@/components/FabButton";
import { allCategories } from "@/lib/all-categories";
import { useAppDate } from "@/hooks/useAppDate";
import { useCategoryColors, useCategoryWeights, useHabits, useLogs } from "@/hooks/useData";

export function CategoriesIndexPage() {
  const { habits } = useHabits();
  const { logs } = useLogs();
  const { getWeights } = useCategoryWeights();
  const { categoryColors } = useCategoryColors();
  const { selectedDate, isToday } = useAppDate();
  const [addOpen, setAddOpen] = useState(false);
  const last7 = lastNDays(selectedDate, 7);
  const last30 = lastNDays(selectedDate, 30);
  const categories = allCategories(habits, categoryColors);

  if (categories.length === 0) {
    return (
      <>
        <EmptyState
          title="No categories yet"
          message="Add a category to organize activities and set its color."
          action={
            <button type="button" className="btn btn--primary" onClick={() => setAddOpen(true)}>
              Add category
            </button>
          }
        />
        <FabButton label="Add category" onClick={() => setAddOpen(true)} />
        <AddCategoryModal open={addOpen} onClose={() => setAddOpen(false)} />
      </>
    );
  }

  const rows = categories.map((cat) => {
    const weights = getWeights(cat);
    const inCat = habits.filter((h) => h.category === cat);
    const active = inCat.filter((h) => !h.paused).length;
    const paused = inCat.length - active;
    const { best, weakest } = categoryHabitExtremes(habits, logs, cat, last30);
    return {
      name: cat,
      todayPercent: categoryScoreNumeric(cat, habits, logs, selectedDate, weights),
      avg7: weekAverage(cat, habits, logs, last7, weights),
      habitCount: active,
      pausedCount: paused,
      bestHabitName: best?.name,
      weakestHabitName: weakest?.name,
      sparkline: categorySeries(cat, habits, logs, last7, weights).map((v) => (v === null || v < 0 ? 0 : v)),
    };
  });

  rows.sort((a, b) => a.avg7 - b.avg7);
  const weakest = rows[0];
  const weekAvgAll = Math.round(rows.reduce((s, r) => s + r.avg7, 0) / rows.length);

  return (
    <>
      <p className="categories-layout__sub">
        {formatCategoriesSubtitle(selectedDate, isToday)} · avg {weekAvgAll}% · tap a category
      </p>
      <div className="categories-grid">
        {rows.map((row) => (
          <CategoryRow key={row.name} {...row} />
        ))}
      </div>
      {weakest && weakest.habitCount > 0 && (
        <div className="coach-hint">
          Suggest: <strong>{weakest.name}</strong> is lowest — tap to plan one win today.
        </div>
      )}
      <FabButton label="Add category" onClick={() => setAddOpen(true)} />
      <AddCategoryModal open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

function formatCategoriesSubtitle(dateKey: string, isToday: boolean): string {
  if (isToday) return "Today";
  const d = new Date(dateKey + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
