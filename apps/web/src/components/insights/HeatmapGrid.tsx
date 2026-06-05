import type { HeatmapDayCell } from "@mottazen/core";
import { dayActivityLevel } from "@mottazen/core";
import type { ActivityCellLevel } from "@mottazen/core";
import type { DayLog, Habit } from "@mottazen/core";
import { ChartChrome } from "@/components/charts/ChartChrome";

interface HeatmapGridProps {
  habits: Habit[];
  logs: DayLog[];
  weeks: HeatmapDayCell[][];
  onDaySelect?: (date: string) => void;
  onRemove?: () => void;
}

export function HeatmapGrid({ habits, logs, weeks, onDaySelect, onRemove }: HeatmapGridProps) {
  return (
    <ChartChrome onRemove={onRemove}>
      <div className="heatmap">
        <div className="heatmap__grid">
          {weeks.map((week, wi) => (
            <div key={wi} className="heatmap__week">
              {week.map((cell) => {
                const level = cell.inRange ? dayActivityLevel(habits, logs, cell.date) : "none";
                const clickable = cell.inRange && level !== "none";
                return (
                  <button
                    key={cell.date}
                    type="button"
                    className={cellClass(cell, level)}
                    title={cell.inRange ? cell.date : undefined}
                    disabled={!clickable}
                    onClick={() => {
                      if (clickable) onDaySelect?.(cell.date);
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="heatmap__legend">
          <span>Less</span>
          <span className="heatmap__cell heatmap__cell--inactive" />
          <span className="heatmap__cell heatmap__cell--1" />
          <span className="heatmap__cell heatmap__cell--2" />
          <span className="heatmap__cell heatmap__cell--3" />
          <span>More</span>
        </div>
      </div>
    </ChartChrome>
  );
}

function cellClass(cell: HeatmapDayCell, level: ActivityCellLevel): string {
  if (!cell.inRange) return "heatmap__cell heatmap__cell--pad";
  if (level === "none") return "heatmap__cell heatmap__cell--inactive";
  return `heatmap__cell heatmap__cell--${level}`;
}
