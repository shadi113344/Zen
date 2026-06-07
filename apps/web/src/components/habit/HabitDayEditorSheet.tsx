import { useEffect } from "react";
import { createPortal } from "react-dom";
import { bumpNumericLogValue, isNumericLikeHabit, isNumericStreakDay } from "@mottazen/core";
import type { Habit } from "@mottazen/core";
import { formatCompactNumber } from "@/lib/format-number";
import { useLogs } from "@/hooks/useData";

interface HabitDayEditorSheetProps {
  open: boolean;
  onClose: () => void;
  habit: Habit;
  date: string;
  value: number | null;
  isRest: boolean;
  /** Pre-formatted day label, e.g. "Sat 6 Jun". */
  label: string;
}

/** Bottom-sheet editor for a single calendar day: value entry, rest, and clear. */
export function HabitDayEditorSheet({ open, onClose, habit, date, value, isRest, label }: HabitDayEditorSheetProps) {
  const { setLogValue } = useLogs();
  const numeric = isNumericLikeHabit(habit);
  const minVal = Number(habit.min ?? 0);
  const max = Number(habit.max ?? 100);
  const current = isRest ? 0 : Number(value ?? 0);
  const done = !isRest && current > 0;
  const isComplete = done && (numeric ? isNumericStreakDay(habit, current) : true);
  const hasLog = isRest || value !== null;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const bump = (direction: 1 | -1) => {
    if (isRest) return;
    setLogValue(habit.id, date, (prev) => bumpNumericLogValue(prev, direction, habit));
  };

  const toggleRest = () => {
    if (isRest) setLogValue(habit.id, date, null, false);
    else setLogValue(habit.id, date, -1, true);
  };

  const clearDay = () => setLogValue(habit.id, date, null, false);

  const toggleDone = () => {
    if (isRest) return;
    setLogValue(habit.id, date, done ? null : 1);
  };

  return createPortal(
    <div className="numeric-counter-sheet__backdrop" onClick={onClose} role="presentation">
      <div
        className="numeric-counter-sheet card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="habit-day-sheet-title"
      >
        <div className="numeric-counter-sheet__handle" aria-hidden />
        <h2 id="habit-day-sheet-title" className="numeric-counter-sheet__title">
          {habit.name}
        </h2>
        <p className="numeric-counter-sheet__range">
          {label}
          {numeric ? ` · ${formatCompactNumber(minVal)} – ${formatCompactNumber(max)}` : ""}
        </p>

        {numeric ? (
          <div className="numeric-counter-sheet__counter">
            <button
              type="button"
              className="numeric-counter-sheet__step"
              disabled={isRest || current <= minVal}
              onClick={() => bump(-1)}
              aria-label="Decrease"
            >
              −
            </button>
            <span
              className={`numeric-counter-sheet__value${isComplete ? " numeric-counter-sheet__value--complete" : ""}`}
            >
              {isRest ? "—" : formatCompactNumber(current)}
            </span>
            <button
              type="button"
              className="numeric-counter-sheet__step"
              disabled={isRest || current >= max}
              onClick={() => bump(1)}
              aria-label="Increase"
            >
              +
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`habit-day-sheet__toggle${done ? " habit-day-sheet__toggle--done" : ""}`}
            onClick={toggleDone}
            disabled={isRest}
          >
            {done ? "✓ Done" : "Mark done"}
          </button>
        )}

        <div className="habit-day-sheet__actions">
          <button
            type="button"
            className={`btn btn--ghost${isRest ? " habit-day-sheet__rest--active" : ""}`}
            onClick={toggleRest}
          >
            {isRest ? "☾ End rest" : "☾ Rest day"}
          </button>
          <button type="button" className="btn btn--ghost" onClick={clearDay} disabled={!hasLog}>
            Clear
          </button>
        </div>

        <button type="button" className="btn btn--primary numeric-counter-sheet__done" onClick={onClose}>
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}
