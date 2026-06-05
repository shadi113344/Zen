import { activityLevel } from "@mottazen/core";
import type { CategoryWeights, DayLog, Habit } from "@mottazen/core";

interface ActivityCalendarProps {
  category: string;
  habits: Habit[];
  logs: DayLog[];
  dates: string[];
  weights?: CategoryWeights;
}

export function ActivityCalendar({ category, habits, logs, dates, weights }: ActivityCalendarProps) {
  return (
    <div className="activity-cal" role="img" aria-label="Category activity calendar">
      {dates.map((date) => {
        const level = activityLevel(category, habits, logs, date, weights);
        const cls =
          level === "rest"
            ? "activity-cal__cell activity-cal__cell--rest"
            : `activity-cal__cell activity-cal__cell--${level}`;
        return <span key={date} className={cls} title={date} />;
      })}
    </div>
  );
}
