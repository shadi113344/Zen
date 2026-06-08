import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
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
import { AnimatePresence } from "framer-motion";
import { ScreenPageBody, ScreenPageTop } from "@/components/ScreenPageTop";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useAppDate } from "@/hooks/useAppDate";
import { useCategoryWeights, useHabits, useLogs, useTasks } from "@/hooks/useData";
import { useWidgetGrid } from "@/hooks/useWidgetGrid";
import { TaskStatsCard } from "@/components/dashboard/TaskStatsCard";
import { WidgetGrid } from "@/components/dashboard/WidgetGrid";
import { WidgetGallery } from "@/components/dashboard/WidgetGallery";
import { DashboardFab } from "@/components/dashboard/DashboardFab";
import { WidgetFolderTile } from "@/components/dashboard/WidgetFolderTile";
import { FolderSheet } from "@/components/dashboard/FolderSheet";
import {
  isFolderItem,
  type DashboardCardId,
  type WidgetSize,
} from "@/lib/dashboard-cards";

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

  const categoryRadar = useMemo(
    () => radarCategoryScores(habits, logs, rangeDates, allWeights),
    [habits, logs, rangeDates, allWeights],
  );
  const dayScores = useMemo(() => dayScoreSeries(habits, logs, rangeDates), [habits, logs, rangeDates]);
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
    tiles,
    items,
    hiddenIds,
    editMode,
    toggleEditMode,
    finalizeOrder,
    resize,
    hide,
    show,
    createFolder,
    dissolveFolder,
    openFolderId,
    setOpenFolderId,
  } = useWidgetGrid();

  const [galleryOpen, setGalleryOpen] = useState(false);

  // cards: each widget renders differently per size
  const cards = useMemo<Record<DashboardCardId, (size: WidgetSize) => ReactNode>>(
    () => ({
      taskStats: (size) => {
        if (size === "bar") {
          return (
            <div className="widget-bar">
              <span>{taskStats.pending} pending</span>
              <span className="widget-bar__sep">·</span>
              <span>{taskStats.completed} done</span>
            </div>
          );
        }
        return (
          <TaskStatsCard
            periodTitle={periodTitle}
            pending={taskStats.pending}
            completed={taskStats.completed}
            onRemove={() => hide("taskStats")}
          />
        );
      },

      activityRadar: (size) => {
        if (size === "bar") {
          const top = habitRows[0];
          return (
            <div className="widget-bar">
              <span>Top: {top ? `${top.habit.name} ${Math.round(top.consistency)}%` : "—"}</span>
            </div>
          );
        }
        return (
          <section className="card page-section">
            <h3 className="page-section__title">Activity balance · {periodTitle}</h3>
            {size !== "small" && (
              <p className="muted-text insights-activities__hint">
                Top {Math.min(HABIT_RADAR_LIMIT, activeCount)} activities by consistency
                {activeCount > HABIT_RADAR_LIMIT ? ` (${activeCount} total)` : ""}.
              </p>
            )}
            <RadarChart
              points={habitRadar}
              emptyMessage="Add activities to see balance."
              ariaLabel="Activity consistency radar"
              onRemove={() => hide("activityRadar")}
            />
          </section>
        );
      },

      categoryRadar: (size) => {
        if (size === "bar") {
          const top2 = categoryRadar.slice(0, 2);
          return (
            <div className="widget-bar">
              {top2.map((c) => (
                <span key={c.category}>{c.category} {Math.round(c.score)}%</span>
              )).reduce<ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`sep-${i}`} className="widget-bar__sep">·</span>, el], [])}
            </div>
          );
        }
        return (
          <section className="card page-section">
            <h3 className="page-section__title">Balance by category · {periodTitle}</h3>
            <RadarChart points={categoryRadar} onRemove={() => hide("categoryRadar")} />
          </section>
        );
      },

      metrics: (size) => {
        if (size === "bar") {
          const top = performanceRows[0];
          return (
            <div className="widget-bar">
              <span>{top ? `${top.habit.name} ${Math.round(top.value)}%` : "No data"}</span>
            </div>
          );
        }
        return (
          <HabitMetricsCard
            periodTitle={periodTitle}
            consistencyRows={consistencyRows}
            performanceRows={performanceRows}
            streakRows={streakRows}
            onRemoveChart={() => hide("metrics")}
          />
        );
      },

      heatmap: (size) => {
        if (size === "bar") {
          const thisWeek = rangeDates.filter((d) => logs.some((l) => l.date === d)).length;
          return (
            <div className="widget-bar">
              <span>{thisWeek} logged this period</span>
            </div>
          );
        }
        return (
          <section className="card page-section">
            <h3 className="page-section__title">Activity heatmap · {periodTitle}</h3>
            {size === "full" && <p className="muted-text">Tap a logged day to open that log.</p>}
            <HeatmapGrid
              habits={habits}
              logs={logs}
              weeks={heatmapWeeks}
              onDaySelect={(date) => navigate(date === today ? "/log" : `/log/${date}`)}
              onRemove={() => hide("heatmap")}
            />
          </section>
        );
      },

      dayScores: (size) => {
        if (size === "bar") {
          const avg = dayScores.length
            ? Math.round(dayScores.reduce((s, d) => s + d, 0) / dayScores.length)
            : 0;
          return (
            <div className="widget-bar">
              <span>Avg {avg}% this period</span>
            </div>
          );
        }
        return (
          <DayScoreBars period={period} dates={rangeDates} scores={dayScores} onRemove={() => hide("dayScores")} />
        );
      },

      bestHabit: (size) => {
        if (!best) return null;
        if (size === "bar") {
          return (
            <div className="widget-bar">
              <span>★ {best.name} · {best.category}</span>
            </div>
          );
        }
        // full / large: show top habits list
        const topHabits = habitRows.slice(0, size === "full" ? 6 : 3);
        return (
          <section className="card page-section best-habit-card">
            <h3 className="page-section__title">Top habits · {periodTitle}</h3>
            <div className="best-habit-card__list">
              {topHabits.map(({ habit, consistency }) => (
                <Link key={habit.id} to={`/habit/${habit.id}`} className="best-habit-card__row">
                  <span className="best-habit-card__dot" style={{ background: habit.color ?? "var(--green)" }} />
                  <span className="best-habit-card__name">{habit.name}</span>
                  <span className="best-habit-card__pct">{Math.round(consistency)}%</span>
                </Link>
              ))}
            </div>
          </section>
        );
      },

      activityList: (size) => {
        if (size === "bar") {
          const top2 = habitRows.slice(0, 2);
          return (
            <div className="widget-bar">
              {top2.map((r) => r.habit.name).join(" · ") || "No activities"}
            </div>
          );
        }
        return (
          <section className="page-section">
            <h3 className="page-section__title">All activities · {periodTitle}</h3>
            <HabitInsightsList rows={habitRows} />
          </section>
        );
      },

      browse: (size) => {
        if (size === "bar" || size === "small") {
          return (
            <Link to="/categories" className="insights-browse card">
              Browse by category →
            </Link>
          );
        }
        return (
          <Link to="/categories" className="card page-section browse-card">
            <h3 className="page-section__title">Browse by category</h3>
            <p className="muted-text browse-card__hint">Explore all your habits organised by life area.</p>
            <span className="browse-card__arrow">→</span>
          </Link>
        );
      },
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
      hide,
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

  // Folder cards: small-size renders only
  const folderCards = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(cards) as DashboardCardId[]).map((id) => [id, () => cards[id]("small")]),
      ) as Record<string, (size: "small") => ReactNode | null | undefined>,
    [cards],
  );

  const openFolder = tiles.find(
    (t) => isFolderItem(t) && t.id === openFolderId,
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
          tiles={tiles}
          items={items}
          cards={cards}
          editMode={editMode}
          onFinalOrder={finalizeOrder}
          onRemove={hide}
          onResize={resize}
          onCreateFolder={createFolder}
          renderFolder={(folder) => (
            <WidgetFolderTile
              folderId={folder.id}
              childIds={folder.childIds}
              cards={folderCards}
              name={folder.name}
              onClick={() => setOpenFolderId(folder.id)}
              onRemove={() => hide(folder.id)}
              editMode={editMode}
            />
          )}
        />

        {/* FAB — hidden when gallery is open */}
        <AnimatePresence>
          {!galleryOpen && (
            <DashboardFab onClick={() => setGalleryOpen(true)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {galleryOpen && (
            <WidgetGallery
              hiddenIds={hiddenIds}
              onAdd={(id, size) => {
                show(id, size);
                setGalleryOpen(false);
              }}
              onClose={() => setGalleryOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {openFolder && isFolderItem(openFolder) && (
            <FolderSheet
              folderId={openFolder.id}
              childIds={openFolder.childIds}
              cards={
                Object.fromEntries(
                  openFolder.childIds.map((id) => [id, (size: WidgetSize) => cards[id]?.(size)]),
                ) as Record<string, (size: WidgetSize) => ReactNode | null | undefined>
              }
              name={openFolder.name}
              onClose={() => setOpenFolderId(null)}
              onDissolve={() => {
                dissolveFolder(openFolder.id);
                setOpenFolderId(null);
              }}
            />
          )}
        </AnimatePresence>
      </ScreenPageBody>
    </div>
  );
}
