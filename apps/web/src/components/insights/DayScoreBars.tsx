import type { InsightsPeriod } from "@mottazen/core";
import { insightsDayScoreTitle } from "@mottazen/core";
import { CategoryBarChart } from "@/components/CategoryBarChart";

interface DayScoreBarsProps {
  period: InsightsPeriod;
  dates: string[];
  scores: number[];
  onRemove?: () => void;
}

export function DayScoreBars({ period, dates, scores, onRemove }: DayScoreBarsProps) {
  const title = insightsDayScoreTitle(period, dates.length);
  const scrollable = dates.length > 7;

  return (
    <section className="card page-section day-score-bars">
      <h3 className="page-section__title">{title}</h3>
      <CategoryBarChart dates={dates} values={scores} scrollable={scrollable} onRemove={onRemove} />
    </section>
  );
}
