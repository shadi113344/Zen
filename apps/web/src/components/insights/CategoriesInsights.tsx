import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { DayLog, Habit, InsightsPeriod, RadarPoint } from "@mottazen/core";
import { DayScoreBars } from "@/components/insights/DayScoreBars";
import { InsightsAddCharts } from "@/components/insights/InsightsAddCharts";
import { InsightsReorderStack } from "@/components/insights/InsightsReorderStack";
import { RadarChart } from "@/components/insights/RadarChart";
import {
  CATEGORY_INSIGHT_CARDS,
  CATEGORY_INSIGHT_CHART_LABELS,
  CATEGORY_INSIGHTS_ORDER_KEY,
  useInsightsCardOrder,
  type CategoryInsightCardId,
} from "@/hooks/useInsightsCardOrder";

interface CategoriesInsightsProps {
  period: InsightsPeriod;
  periodTitle: string;
  radar: RadarPoint[];
  rangeDates: string[];
  dayScores: number[];
  best: Habit | null;
}

export function CategoriesInsights({
  period,
  periodTitle,
  radar,
  rangeDates,
  dayScores,
  best,
}: CategoriesInsightsProps) {
  const { order, hiddenIds, swap, hide, show } = useInsightsCardOrder(
    CATEGORY_INSIGHTS_ORDER_KEY,
    CATEGORY_INSIGHT_CARDS,
  );

  const hiddenChartOptions = useMemo(
    () =>
      hiddenIds.map((id) => ({
        id,
        label: CATEGORY_INSIGHT_CHART_LABELS[id as CategoryInsightCardId],
      })),
    [hiddenIds],
  );

  const cards = useMemo(
    () => ({
      radar: (
        <section className="card page-section">
          <h3 className="page-section__title">Balance by category · {periodTitle}</h3>
          <RadarChart points={radar} onRemove={() => hide("radar")} />
        </section>
      ),
      dayScores: (
        <DayScoreBars period={period} dates={rangeDates} scores={dayScores} onRemove={() => hide("dayScores")} />
      ),
      best: best ? (
        <section className="card page-section best-habit-card">
          <h3 className="page-section__title">Best habit · {periodTitle}</h3>
          <Link to={`/habit/${best.id}`} className="best-habit-card__link">
            <span className="best-habit-card__dot" style={{ background: best.color ?? "var(--green)" }} />
            <span className="best-habit-card__name">{best.name}</span>
            <span className="best-habit-card__cat">{best.category}</span>
          </Link>
        </section>
      ) : null,
      browse: (
        <Link to="/categories" className="insights-browse card">
          Browse by category →
        </Link>
      ),
    }),
    [best, dayScores, hide, period, periodTitle, radar, rangeDates],
  );

  return (
    <>
      <InsightsAddCharts hidden={hiddenChartOptions} onAdd={(id) => show(id as CategoryInsightCardId)} />
      <InsightsReorderStack order={order} onSwap={swap} cards={cards} />
    </>
  );
}
