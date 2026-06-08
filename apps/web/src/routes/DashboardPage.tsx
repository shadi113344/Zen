import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { InsightsPeriod } from "@mottazen/core";
import {
  HABIT_RADAR_LIMIT,
  bestHabitByConsistency,
  currentStreak,
  datesForInsightsPeriod,
  dayScoreSeries,
  habitPerformanceRows,
  heatmapWeeksFromDates,
  insightsPeriodLabel,
  radarCategoryScores,
  radarHabitScores,
  rankHabitsByConsistency,
  taskCountsForPeriod,
  todayKey,
  visibleStreak,
} from "@mottazen/core";
import { DayScoreBars } from "@/components/insights/DayScoreBars";
import { HabitInsightsList } from "@/components/insights/HabitInsightsList";
import { HabitMetricsCard } from "@/components/insights/HabitMetricsCard";
import { HeatmapGrid } from "@/components/insights/HeatmapGrid";
import { RadarChart } from "@/components/insights/RadarChart";
import { ScreenPageBody, ScreenPageTop } from "@/components/ScreenPageTop";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useAppDate } from "@/hooks/useAppDate";
import { useCategoryWeights, useHabits, useLogs, useTasks } from "@/hooks/useData";
import { useWidgetGrid } from "@/hooks/useWidgetGrid";
import { TaskStatsCard } from "@/components/dashboard/TaskStatsCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { AddWidgetSheet } from "@/components/dashboard/AddWidgetSheet";

export function DashboardPage() {
  const { habits } = useHabits();
  const { logs } = useLogs();
  const { tasks } = useTasks();
  const { allWeights } = useCategoryWeights();
  const { selectedDate } = useAppDate();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<InsightsPeriod>("week");

  const today = todayKey();
  const end = selectedDate > today ? today : selectedDate;
  const periodTitle = insightsPeriodLabel(period);

  const earliest = useMemo(() => {
    const dates = logs.map((l) => l.date).sort();
    return dates[0] ?? today;
  }, [logs, today]);

  const rangeDates = useMemo(
    () => datesForInsightsPeriod(period, end, earliest),
    [period, end, earliest],
  );
  const heatmapWeeks = useMemo(() => heatmapWeeksFromDates(rangeDates), [rangeDates]);

  // Category-scoped data
  const categoryRadar = useMemo(
    () => radarCategoryScores(habits, logs, rangeDates, allWeights),
    [habits, logs, rangeDates, allWeights],
  );
  const dayScores = useMemo(() => dayScoreSeries(habits, logs, rangeDates), [habits, logs, rangeDates]);

  // Activity-scoped data
  const habitRows = useMemo(
    () => rankHabitsByConsistency(habits, logs, rangeDates, (h) => currentStreak(h, logs, end)),
    [habits, logs, rangeDates, end],
  );
  const habitRadar = useMemo(() => radarHabitScores(habits, logs, rangeDates), [habits, logs, rangeDates]);
  const performanceRows = useMemo(() => habitPerformanceRows(habits, logs, rangeDates), [habits, logs, rangeDates]);
  const consistencyRows = useMemo(
    () => habitRows.map(({ habit, consistency }) => ({ habit, value: consistency })),
    [habitRows],
  );
  const streakRows = useMemo(
    () => habitRows.map(({ habit, currentStreak: str }) => ({ habit, value: visibleStreak(str) })),
    [habitRows],
  );
  const best = useMemo(() => bestHabitByConsistency(habits, logs, rangeDates), [habits, logs, rangeDates]);
  const activeCount = habits.filter((h) => !h.paused).length;
  const taskStats = useMemo(() => taskCountsForPeriod(tasks, rangeDates), [tasks, rangeDates]);

  const {
    widgets,
    hiddenIds,
    editMode,
    toggleEditMode,
    moveWidget,
    resizeWidget,
    hideWidget,
    showWidget,
    isOccupied,
  } = useWidgetGrid();

  const [addSheetOpen, setAddSheetOpen] = useState(false);

  const cards = useMemo(
    () => ({
      taskStats: (
        <TaskStatsCard
          periodTitle={periodTitle}
          pending={taskStats.pending}
          completed={taskStats.completed}
          onRemove={() => hideWidget("taskStats")}
        />
      ),
      activityRadar: (
        <section className="card page-section">
          <h3 className="page-section__title">Activity balance · {periodTitle}</h3>
          <p className="muted-text insights-activities__hint">
            Top {Math.min(HABIT_RADAR_LIMIT, activeCount)} activities by consistency
            {activeCount > HABIT_RADAR_LIMIT ? ` (${activeCount} total)` : ""}.
          </p>
          <RadarChart
            points={habitRadar}
            emptyMessage="Add activities to see balance."
            ariaLabel="Activity consistency radar"
            onRemove={() => hideWidget("activityRadar")}
          />
        </section>
      ),
      categoryRadar: (
        <section className="card page-section">
          <h3 className="page-section__title">Balance by category · {periodTitle}</h3>
          <RadarChart points={categoryRadar} onRemove={() => hideWidget("categoryRadar")} />
        </section>
      ),
      metrics: (
        <HabitMetricsCard
          periodTitle={periodTitle}
          consistencyRows={consistencyRows}
          performanceRows={performanceRows}
          streakRows={streakRows}
          onRemoveChart={() => hideWidget("metrics")}
        />
      ),
      heatmap: (
        <section className="card page-section">
          <h3 className="page-section__title">Activity heatmap · {periodTitle}</h3>
          <p className="muted-text">Tap a logged day to open that log.</p>
          <HeatmapGrid
            habits={habits}
            logs={logs}
            weeks={heatmapWeeks}
            onDaySelect={(date) => navigate(date === today ? "/log" : `/log/${date}`)}
            onRemove={() => hideWidget("heatmap")}
          />
        </section>
      ),
      dayScores: (
        <DayScoreBars period={period} dates={rangeDates} scores={dayScores} onRemove={() => hideWidget("dayScores")} />
      ),
      bestHabit: best ? (
        <section className="card page-section best-habit-card">
          <h3 className="page-section__title">Best habit · {periodTitle}</h3>
          <Link to={`/habit/${best.id}`} className="best-habit-card__link">
            <span className="best-habit-card__dot" style={{ background: best.color ?? "var(--green)" }} />
            <span className="best-habit-card__name">{best.name}</span>
            <span className="best-habit-card__cat">{best.category}</span>
          </Link>
        </section>
      ) : null,
      activityList: (
        <section className="page-section">
          <h3 className="page-section__title">All activities · {periodTitle}</h3>
          <HabitInsightsList rows={habitRows} />
        </section>
      ),
      browse: (
        <Link to="/categories" className="insights-browse card">
          Browse by category →
        </Link>
      ),
    }),
    [
      activeCount,
      best,
      categoryRadar,
      consistencyRows,
      dayScores,
      habitRadar,
      habitRows,
      heatmapWeeks,
      habits,
      hideWidget,
      logs,
      navigate,
      performanceRows,
      period,
      periodTitle,
      rangeDates,
      streakRows,
      taskStats,
      today,
    ],
  );

  return (
    <div className="insights-page screen-page">
      <ScreenPageTop title="Dashboard" />
      <ScreenPageBody>
        <div className="dashboard-toolbar">
          <SegmentedControl
            className="insights-page__period"
            ariaLabel="Analysis period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: "today", label: "Today" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "year", label: "Year" },
              { value: "all", label: "All" },
            ]}
          />
          <div className="dashboard-toolbar__actions">
            {hiddenIds.length > 0 && (
              <button
                type="button"
                className="dashboard-toolbar__add"
                onClick={() => setAddSheetOpen(true)}
                aria-label="Add widget"
              >
                + Add
              </button>
            )}
            <button
              type="button"
              className={`dashboard-toolbar__edit${editMode ? " dashboard-toolbar__edit--active" : ""}`}
              onClick={toggleEditMode}
            >
              {editMode ? "Done" : "Edit"}
            </button>
          </div>
        </div>

        <WidgetGrid
          widgets={widgets}
          cards={cards}
          editMode={editMode}
          onMove={moveWidget}
          onRemove={hideWidget}
          onResize={resizeWidget}
          isOccupied={isOccupied}
        />

        {addSheetOpen && (
          <AddWidgetSheet
            hiddenIds={hiddenIds}
            onAdd={showWidget}
            onClose={() => setAddSheetOpen(false)}
          />
        )}
      </ScreenPageBody>
    </div>
  );
}
