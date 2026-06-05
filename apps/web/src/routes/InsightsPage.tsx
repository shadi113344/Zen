import { useMemo, useState } from "react";
import type { InsightsPeriod } from "@mottazen/core";
import {
  bestHabitByConsistency,
  dayScoreSeries,
  heatmapWeeksFromDates,
  insightsPeriodLabel,
  datesForInsightsPeriod,
  radarCategoryScores,
  todayKey,
} from "@mottazen/core";
import { ActivitiesInsights } from "@/components/insights/ActivitiesInsights";
import { CategoriesInsights } from "@/components/insights/CategoriesInsights";
import { ScreenPageBody, ScreenPageTop } from "@/components/ScreenPageTop";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useAppDate } from "@/hooks/useAppDate";
import { useCategoryWeights, useHabits, useLogs } from "@/hooks/useData";

type InsightsScope = "categories" | "activities";

export function InsightsPage() {
  const { habits } = useHabits();
  const { logs } = useLogs();
  const { allWeights } = useCategoryWeights();
  const { selectedDate } = useAppDate();
  const [scope, setScope] = useState<InsightsScope>("activities");
  const [period, setPeriod] = useState<InsightsPeriod>("week");
  const today = todayKey();
  const end = selectedDate > today ? today : selectedDate;

  const earliest = useMemo(() => {
    const dates = logs.map((l) => l.date).sort();
    return dates[0] ?? today;
  }, [logs, today]);

  const rangeDates = useMemo(
    () => datesForInsightsPeriod(period, end, earliest),
    [period, end, earliest],
  );

  const heatmapWeeks = useMemo(() => heatmapWeeksFromDates(rangeDates), [rangeDates]);

  const periodTitle = insightsPeriodLabel(period);

  const radar = useMemo(
    () => radarCategoryScores(habits, logs, rangeDates, allWeights),
    [habits, logs, rangeDates, allWeights],
  );
  const dayScores = useMemo(() => dayScoreSeries(habits, logs, rangeDates), [habits, logs, rangeDates]);
  const best = useMemo(() => bestHabitByConsistency(habits, logs, rangeDates), [habits, logs, rangeDates]);

  return (
    <div className="insights-page screen-page">
      <ScreenPageTop title="Insights" />
      <ScreenPageBody>
        <SegmentedControl
          className="insights-page__period"
          ariaLabel="Analysis period"
          value={period}
          onChange={setPeriod}
          options={(
            [
              { value: "today", label: "Today" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "year", label: "Year" },
              { value: "all", label: "All" },
            ] as const
          ).map((o) => ({ value: o.value, label: o.label }))}
        />

        <SegmentedControl
          className="insights-page__scope"
          ariaLabel="Insights focus"
          value={scope}
          onChange={setScope}
          options={[
            { value: "activities", label: "Activities" },
            { value: "categories", label: "Categories" },
          ]}
        />

        {scope === "categories" && (
          <CategoriesInsights
            period={period}
            periodTitle={periodTitle}
            radar={radar}
            rangeDates={rangeDates}
            dayScores={dayScores}
            best={best}
          />
        )}

        {scope === "activities" && (
          <ActivitiesInsights
            habits={habits}
            logs={logs}
            dates={rangeDates}
            heatmapWeeks={heatmapWeeks}
            period={period}
            endDate={end}
          />
        )}
      </ScreenPageBody>
    </div>
  );
}
