import type { HabitDayRow, Habit } from "@mottazen/core";
import { bumpNumericLogValue } from "@mottazen/core";
import type { MouseEvent, PointerEvent } from "react";
import { NumericInput } from "@/components/NumericInput";
import { useLogs } from "@/hooks/useData";

interface HabitHistoryTableProps {
  habit: Habit;
  rows: HabitDayRow[];
}

export function HabitHistoryTable({ habit, rows }: HabitHistoryTableProps) {
  if (rows.length === 0) {
    return <p className="muted-text">No history in this range.</p>;
  }

  const isNumeric = habit.type === "numeric" || habit.type === "milestone";

  return (
    <div className="history-table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th>Day</th>
            {isNumeric && <th>Value</th>}
            <th>Score</th>
            <th aria-label="Rest" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <HistoryRow key={row.date} habit={habit} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoryRow({ habit, row }: { habit: Habit; row: HabitDayRow }) {
  const { setLogValue } = useLogs();
  const isNumeric = habit.type === "numeric" || habit.type === "milestone";
  const max = Number(habit.max ?? 100);
  const min = Number(habit.min ?? 0);
  const current = row.isRest ? 0 : Number(row.value ?? 0);

  const toggleRest = () => {
    if (row.isRest) setLogValue(habit.id, row.date, 0, false);
    else setLogValue(habit.id, row.date, -1, true);
  };

  const toggleCheck = () => {
    if (row.isRest) return;
    const next = (row.value ?? 0) > 0 ? 0 : 1;
    setLogValue(habit.id, row.date, next);
  };

  const bump = (direction: 1 | -1) => {
    if (row.isRest) return;
    setLogValue(habit.id, row.date, (prev) => bumpNumericLogValue(prev, direction, habit));
  };

  const commitValue = (raw: string) => {
    if (row.isRest) return;
    const digits = raw.replace(/\D/g, "");
    if (digits === "") return;
    const n = Math.min(max, Math.max(min, Number(digits)));
    setLogValue(habit.id, row.date, n);
  };

  const stopBubble = (e: PointerEvent | MouseEvent) => {
    e.stopPropagation();
  };

  const scoreLabel = row.isRest ? "Rest" : row.score === null ? "Tap to log" : `${row.score}%`;

  return (
    <tr className={`history-table__row${row.isRest ? " history-table__rest" : ""}`}>
      <td>{row.label}</td>
      {isNumeric && (
        <td>
          {row.isRest ? (
            <span className="history-table__muted">Rest</span>
          ) : (
            <div className="history-table__numeric" onPointerDown={stopBubble} onMouseDown={stopBubble}>
              <button
                type="button"
                className="history-table__step"
                onClick={() => bump(-1)}
                disabled={current <= min}
                aria-label="Decrease"
              >
                −
              </button>
              <NumericInput
                className="history-table__value-input"
                value={String(current)}
                onChange={(e) => commitValue(e.target.value)}
                onBlur={(e) => commitValue(e.target.value)}
                aria-label="Log value"
              />
              <button
                type="button"
                className="history-table__step"
                onClick={() => bump(1)}
                disabled={current >= max}
                aria-label="Increase"
              >
                +
              </button>
            </div>
          )}
        </td>
      )}
      <td>
        {isNumeric ? (
          <span className={row.score === null && !row.isRest ? "history-table__muted" : ""}>{scoreLabel}</span>
        ) : (
          <button
            type="button"
            className={`history-table__tap${row.isRest ? " history-table__tap--rest" : ""}${(row.value ?? 0) > 0 ? " history-table__tap--done" : ""}`}
            onClick={toggleCheck}
            disabled={row.isRest}
          >
            {scoreLabel}
          </button>
        )}
      </td>
      <td>
        <button
          type="button"
          className={`history-table__rest-btn${row.isRest ? " history-table__rest-btn--active" : ""}`}
          onClick={toggleRest}
          aria-label={row.isRest ? "Clear rest day" : "Mark rest day"}
          title="Rest day"
        >
          ☾
        </button>
      </td>
    </tr>
  );
}
