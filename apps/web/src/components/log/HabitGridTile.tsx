import { isNumericStreakDay, logValueForHabit } from "@mottazen/core";
import type { Habit } from "@mottazen/core";
import { useState } from "react";
import { Link } from "react-router-dom";
import { GridNumericCounterSheet } from "@/components/log/GridNumericCounterSheet";
import { formatCompactNumber } from "@/lib/format-number";
import { asHapticSwitch } from "@/lib/haptic";
import { useLogs } from "@/hooks/useData";

interface HabitGridTileProps {
  habit: Habit;
  date: string;
}

/** Minimal habit row for grid view — name link + check or tappable numeric value. */
export function HabitGridTile({ habit, date }: HabitGridTileProps) {
  const { logs, setLogValue } = useLogs();
  const [counterOpen, setCounterOpen] = useState(false);
  const row = logs.find((l) => l.habitId === habit.id && l.date === date);
  const value = logValueForHabit(logs, habit.id, date);
  const isRest = row?.isRest === true || value === -1;
  const isSkipped = !isRest && row != null && value === 0;

  const isCheckLike = habit.type === "check" || habit.type === "onetime";
  const isNumericLike = habit.type === "numeric" || habit.type === "milestone";
  const isCheckDone = isCheckLike && !isRest && (value ?? 0) > 0;
  const current = isRest ? 0 : Number(value ?? 0);
  const isNumericComplete =
    isNumericLike && !isRest && current > 0 && isNumericStreakDay(habit, current);
  const isNumericProgress =
    isNumericLike && !isRest && value != null && current > Number(habit.min ?? 0);
  const isNumericPartial = isNumericProgress && !isNumericComplete;
  const hasProgress = !isRest && !isSkipped && (isCheckDone || isNumericProgress);

  const tileClass = [
    "habit-grid-tile",
    isRest ? "habit-grid-tile--rest" : "",
    isSkipped ? "habit-grid-tile--skipped" : "",
    !isSkipped && (isCheckDone || isNumericComplete) ? "habit-grid-tile--done" : "",
    !isSkipped && isNumericPartial ? "habit-grid-tile--progress" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const nameClass = [
    "habit-grid-tile__name",
    isSkipped ? "habit-grid-tile__name--skipped" : "",
    hasProgress ? "habit-grid-tile__name--progress" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const displayValue = isRest ? "—" : formatCompactNumber(current);

  return (
    <div className={tileClass}>
      <Link to={`/habit/${habit.id}`} className={nameClass} state={{ fromToday: true }}>
        {habit.name}
      </Link>
      <div className="habit-grid-tile__control">
        {isCheckLike ? (
          <label className="habit-grid-tile__check" aria-label={isCheckDone ? "Mark incomplete" : "Mark complete"}>
            <input
              type="checkbox"
              ref={asHapticSwitch}
              checked={isCheckDone}
              disabled={isRest}
              onChange={(e) => {
                if (isRest) return;
                setLogValue(habit.id, date, e.target.checked ? 1 : null);
              }}
            />
            <span className="habit-grid-tile__check-ui" aria-hidden />
          </label>
        ) : isNumericComplete ? (
          <button
            type="button"
            className="habit-grid-tile__numeric-check"
            disabled={isRest}
            onClick={() => setCounterOpen(true)}
            aria-label={`Complete — ${displayValue}. Tap to adjust.`}
          >
            <span className="habit-grid-tile__check-ui habit-grid-tile__check-ui--on" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            className="habit-grid-tile__value-btn"
            disabled={isRest}
            onClick={() => setCounterOpen(true)}
            aria-label={`Log value: ${displayValue}`}
          >
            {displayValue}
          </button>
        )}
        {isNumericLike ? (
          <GridNumericCounterSheet
              open={counterOpen}
              onClose={() => setCounterOpen(false)}
              habit={habit}
              date={date}
              value={value}
              isRest={isRest}
            />
        ) : null}
      </div>
    </div>
  );
}
