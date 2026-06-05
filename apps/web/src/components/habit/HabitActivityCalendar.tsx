import { habitActivityLevel } from "@mottazen/core";
import type { ActivityCellLevel } from "@mottazen/core";
import type { DayLog, Habit } from "@mottazen/core";

interface HabitActivityCalendarProps {
  habit: Habit;
  logs: DayLog[];
  dates: string[];
}

export function HabitActivityCalendar({ habit, logs, dates }: HabitActivityCalendarProps) {
  return (
    <div className="activity-cal activity-cal--habit" role="img" aria-label="Habit activity">
      {dates.map((date) => {
        const level = habitActivityLevel(habit, logs, date);
        return <span key={date} className={cellClass(level)} title={`${date}: ${levelLabel(level)}`} />;
      })}
      <div className="activity-cal__legend">
        <span>Less</span>
        <span className="activity-cal__cell activity-cal__cell--0" />
        <span className="activity-cal__cell activity-cal__cell--1" />
        <span className="activity-cal__cell activity-cal__cell--2" />
        <span className="activity-cal__cell activity-cal__cell--3" />
        <span>More</span>
      </div>
    </div>
  );
}

function cellClass(level: ActivityCellLevel): string {
  if (level === "rest") return "activity-cal__cell activity-cal__cell--rest";
  if (level === "none") return "activity-cal__cell";
  return `activity-cal__cell activity-cal__cell--${level}`;
}

function levelLabel(level: ActivityCellLevel): string {
  if (level === "rest") return "Rest";
  if (level === "none") return "No log";
  return `${level}`;
}
