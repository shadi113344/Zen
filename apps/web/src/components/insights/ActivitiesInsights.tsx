import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { HeatmapDayCell, InsightsPeriod } from "@mottazen/core";
import {
  HABIT_RADAR_LIMIT,
  bestHabitByConsistency,
  habitPerformanceRows,
  insightsPeriodLabel,
  radarHabitScores,
  rankHabitsByConsistency,
  currentStreak,
  todayKey,
} from "@mottazen/core";
import type { DayLog, Habit } from "@mottazen/core";
import { HeatmapGrid } from "@/components/insights/HeatmapGrid";
import { HabitInsightsList } from "@/components/insights/HabitInsightsList";
import { HabitMetricsCard } from "@/components/insights/HabitMetricsCard";
import { InsightsAddCharts } from "@/components/insights/InsightsAddCharts";
import { InsightsReorderStack } from "@/components/insights/InsightsReorderStack";
import { RadarChart } from "@/components/insights/RadarChart";
import {
  ACTIVITY_INSIGHT_CARDS,
  ACTIVITY_INSIGHT_CHART_LABELS,
  ACTIVITY_INSIGHTS_ORDER_KEY,
  useInsightsCardOrder,
  type ActivityInsightCardId,
} from "@/hooks/useInsightsCardOrder";

interface ActivitiesInsightsProps {
  habits: Habit[];
  logs: DayLog[];
  dates: string[];
  heatmapWeeks: HeatmapDayCell[][];
  period: InsightsPeriod;
  endDate: string;
}

export function ActivitiesInsights({
  habits,
  logs,
  dates,
  heatmapWeeks,
  period,
  endDate,
}: ActivitiesInsightsProps) {
  const navigate = useNavigate();
  const today = todayKey();
  const periodTitle = insightsPeriodLabel(period);
  const { order, hiddenIds, swap, hide, show } = useInsightsCardOrder(
    ACTIVITY_INSIGHTS_ORDER_KEY,
    ACTIVITY_INSIGHT_CARDS,
  );

  const hiddenChartOptions = useMemo(
    () =>
      hiddenIds.map((id) => ({
        id,
        label: ACTIVITY_INSIGHT_CHART_LABELS[id as ActivityInsightCardId],
      })),
    [hiddenIds],
  );

  const habitRows = useMemo(
    () => rankHabitsByConsistency(habits, logs, dates, (h) => currentStreak(h, logs, endDate)),
    [habits, logs, dates, endDate],
  );

  const habitRadar = useMemo(() => radarHabitScores(habits, logs, dates), [habits, logs, dates]);
  const performanceRows = useMemo(() => habitPerformanceRows(habits, logs, dates), [habits, logs, dates]);
  const consistencyRows = useMemo(
    () => habitRows.map(({ habit, consistency }) => ({ habit, value: consistency })),
    [habitRows],
  );
  const streakRows = useMemo(
    () => habitRows.map(({ habit, currentStreak: str }) => ({ habit, value: str })),
    [habitRows],
  );
  const best = useMemo(() => bestHabitByConsistency(habits, logs, dates), [habits, logs, dates]);
  const activeCount = habits.filter((h) => !h.paused).length;

  const cards = useMemo(
    () => ({
      radar: (
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
            onRemove={() => hide("radar")}
          />
        </section>
      ),
      metrics: (
        <HabitMetricsCard
          periodTitle={periodTitle}
          consistencyRows={consistencyRows}
          performanceRows={performanceRows}
          streakRows={streakRows}
          onRemoveChart={() => hide("metrics")}
        />
      ),
      strongest: best ? (
        <section className="card page-section best-habit-card">
          <h3 className="page-section__title">Strongest activity · {periodTitle}</h3>
          <Link to={`/habit/${best.id}`} className="best-habit-card__link">
            <span className="best-habit-card__dot" style={{ background: best.color ?? "var(--green)" }} />
            <span className="best-habit-card__name">{best.name}</span>
            <span className="best-habit-card__cat">{best.category}</span>
          </Link>
        </section>
      ) : null,
      heatmap: (
        <section className="card page-section">
          <h3 className="page-section__title">Activity heatmap · {periodTitle}</h3>
          <p className="muted-text">Tap a logged day to open that log.</p>
          <HeatmapGrid
            habits={habits}
            logs={logs}
            weeks={heatmapWeeks}
            onDaySelect={(date) => navigate(date === today ? "/log" : `/log/${date}`)}
            onRemove={() => hide("heatmap")}
          />
        </section>
      ),
      list: (
        <section className="page-section">
          <h3 className="page-section__title">All activities · {periodTitle}</h3>
          <HabitInsightsList rows={habitRows} />
        </section>
      ),
    }),
    [
      activeCount,
      best,
      consistencyRows,
      endDate,
      habitRadar,
      habitRows,
      heatmapWeeks,
      habits,
      hide,
      logs,
      navigate,
      performanceRows,
      periodTitle,
      streakRows,
    ],
  );

  return (
    <>
      <InsightsAddCharts hidden={hiddenChartOptions} onAdd={(id) => show(id as ActivityInsightCardId)} />
      <InsightsReorderStack order={order} onSwap={swap} cards={cards} />
    </>
  );
}
