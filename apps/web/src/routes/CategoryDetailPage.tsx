import { useMemo, useState } from "react";
import type { DateRange } from "@mottazen/core";
import {
  activeHabitCount,
  bestDayInRange,
  categoryGoalsProgress,
  categoryGroupScore,
  categorySeries,
  countLogsInRange,
  datesForRange,
  slugToCategory,
  totalHabitCount,
  weekAverage,
} from "@mottazen/core";
import { ActivityCalendar } from "@/components/ActivityCalendar";
import { CategoryGoalsSection } from "@/components/categories/CategoryGoalsSection";
import { CategoryWeightsSection } from "@/components/categories/CategoryWeightsSection";
import { CategoryBarChart } from "@/components/CategoryBarChart";
import { CategoryHero } from "@/components/CategoryHero";
import { EmptyState } from "@/components/EmptyState";
import { HabitBreakdownList, type HabitSort } from "@/components/HabitBreakdownList";
import { AddHabitModal } from "@/components/log/AddHabitModal";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useAppDate } from "@/hooks/useAppDate";
import { useCategoryWeights, useGoals, useHabits, useLogs } from "@/hooks/useData";
import { useParams } from "react-router-dom";

export function CategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { habits } = useHabits();
  const { logs } = useLogs();
  const { goals, goalHabits } = useGoals();
  const { getWeights, allWeights } = useCategoryWeights();
  const [range, setRange] = useState<DateRange>("week");
  const [sort, setSort] = useState<HabitSort>("consistency");
  const [addOpen, setAddOpen] = useState(false);
  const { selectedDate } = useAppDate();

  const categoryName = useMemo(() => {
    if (!slug) return null;
    return slugToCategory(slug, [...new Set(habits.map((h) => h.category))]);
  }, [slug, habits]);

  const categoryHabits = useMemo(
    () => habits.filter((h) => h.category === categoryName && !h.paused),
    [habits, categoryName],
  );

  const weights = useMemo(
    () => (categoryName ? getWeights(categoryName) : undefined),
    [categoryName, habits, allWeights],
  );

  const dates = useMemo(() => datesForRange(range, selectedDate), [range, selectedDate]);
  const last7 = useMemo(() => datesForRange("week", selectedDate), [selectedDate]);

  if (!slug || !categoryName) {
    return <EmptyState title="Category not found" message="This category doesn't exist in your habits." />;
  }

  if (categoryHabits.length === 0 && totalHabitCount(habits, categoryName) === 0) {
    return (
      <>
        <EmptyState
          title={`No activities in ${categoryName} yet`}
          message="Add an activity in this life area to track progress."
          action={
            <button type="button" className="btn btn--primary" onClick={() => setAddOpen(true)}>
              Add activity
            </button>
          }
        />
        <AddHabitModal open={addOpen} onClose={() => setAddOpen(false)} defaultCategory={categoryName} />
      </>
    );
  }

  const dayResult = categoryGroupScore(categoryName, habits, logs, selectedDate, goals, goalHabits, weights);
  const dayScore = dayResult.kind === "score" ? dayResult.value : null;
  const goalsPct = categoryGoalsProgress(categoryName, goals, goalHabits, habits, logs, selectedDate);
  const statusLabel =
    dayResult.kind === "rest"
      ? "Rest day"
      : dayResult.kind === "empty"
        ? goalsPct != null
          ? "Targets only"
          : "No logs"
        : goalsPct != null
          ? "Activities + targets"
          : undefined;
  const avg7 = weekAverage(categoryName, habits, logs, last7, weights);
  const delta = dayScore !== null ? dayScore - avg7 : null;
  const best = bestDayInRange(categoryName, habits, logs, dates, weights);
  const active = activeHabitCount(habits, categoryName);
  const total = totalHabitCount(habits, categoryName);
  const logCount = countLogsInRange(categoryName, habits, logs, dates);
  const series = categorySeries(categoryName, habits, logs, dates, weights);
  const calDates = range === "month" ? dates : last7;

  return (
    <>
      <SegmentedControl
        ariaLabel="Date range"
        value={range}
        onChange={setRange}
        options={[
          { value: "day", label: "Day" },
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
          { value: "all", label: "All" },
        ]}
      />

      <div style={{ marginTop: 16 }}>
        <CategoryHero
          categoryName={categoryName}
          score={dayScore}
          statusLabel={statusLabel}
          delta={delta}
          stats={[
            { label: "7-day avg", value: `${avg7}%` },
            ...(goalsPct != null ? [{ label: "Targets avg", value: `${goalsPct}%` }] : []),
            { label: "Best day", value: best ? `${best.score}%` : "—" },
            { label: "Active activities", value: `${active} of ${total}` },
            { label: "Total logs", value: logCount },
          ]}
        />
      </div>

      <div className="category-detail__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setAddOpen(true)}>
          Add activity in {categoryName}
        </button>
      </div>

      <CategoryGoalsSection category={categoryName} />

      <CategoryWeightsSection key={categoryName} category={categoryName} />

      <section className="card page-section">
        <h3 className="page-section__title">Activity</h3>
        <ActivityCalendar category={categoryName} habits={habits} logs={logs} dates={calDates} weights={weights} />
      </section>

      <HabitBreakdownList
        habits={categoryHabits}
        logs={logs}
        dates={dates}
        today={selectedDate}
        sort={sort}
        onSortChange={setSort}
      />

      <section className="card page-section">
        <h3 className="page-section__title">Daily scores</h3>
        <CategoryBarChart
          dates={dates.length > 14 ? dates.slice(-14) : dates}
          values={series.length > 14 ? series.slice(-14) : series}
        />
      </section>

      <AddHabitModal open={addOpen} onClose={() => setAddOpen(false)} defaultCategory={categoryName} />
    </>
  );
}
