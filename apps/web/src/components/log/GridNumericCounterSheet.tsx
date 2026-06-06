import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { bumpNumericLogValue, isNumericStreakDay } from "@mottazen/core";
import type { Habit } from "@mottazen/core";
import { formatCompactNumber } from "@/lib/format-number";
import { asHapticSwitch } from "@/lib/haptic";
import { useLogs } from "@/hooks/useData";

interface GridNumericCounterSheetProps {
  open: boolean;
  onClose: () => void;
  habit: Habit;
  date: string;
  value: number | null;
  isRest: boolean;
}

/** Bottom-sheet phone-style counter for grid view numeric habits. */
export function GridNumericCounterSheet({
  open,
  onClose,
  habit,
  date,
  value,
  isRest,
}: GridNumericCounterSheetProps) {
  const { setLogValue } = useLogs();
  const sheetRef = useRef<HTMLDivElement>(null);
  const minVal = Number(habit.min ?? 0);
  const max = Number(habit.max ?? 100);
  const current = isRest ? 0 : Number(value ?? 0);
  const isComplete = !isRest && current > 0 && isNumericStreakDay(habit, current);

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

  return createPortal(
    <div className="numeric-counter-sheet__backdrop" onClick={onClose} role="presentation">
      <div
        ref={sheetRef}
        className="numeric-counter-sheet card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="numeric-counter-sheet-title"
      >
        <div className="numeric-counter-sheet__handle" aria-hidden />
        <h2 id="numeric-counter-sheet-title" className="numeric-counter-sheet__title">
          {habit.name}
        </h2>
        <p className="numeric-counter-sheet__range">
          {formatCompactNumber(minVal)} – {formatCompactNumber(max)}
        </p>
        <div className="numeric-counter-sheet__counter">
          <CounterStepButton
            glyph="−"
            label="Decrease"
            disabled={isRest || current <= minVal}
            onStep={() => bump(-1)}
          />
          <span
            className={`numeric-counter-sheet__value${isComplete ? " numeric-counter-sheet__value--complete" : ""}`}
          >
            {isRest ? "—" : formatCompactNumber(current)}
          </span>
          <CounterStepButton
            glyph="+"
            label="Increase"
            disabled={isRest || current >= max}
            onStep={() => bump(1)}
            completed={isComplete}
          />
        </div>
        <button type="button" className="btn btn--primary numeric-counter-sheet__done" onClick={onClose}>
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}

function CounterStepButton({
  glyph,
  label,
  disabled,
  onStep,
  completed = false,
}: {
  glyph: string;
  label: string;
  disabled: boolean;
  onStep: () => void;
  completed?: boolean;
}) {
  const className = [
    "numeric-counter-sheet__step",
    disabled ? "numeric-counter-sheet__step--disabled" : "",
    completed ? "numeric-counter-sheet__step--complete" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={className}>
      <input
        type="checkbox"
        ref={asHapticSwitch}
        className="numeric-counter-sheet__step-haptic"
        disabled={disabled}
        aria-label={completed ? `${label} — complete` : label}
        onChange={() => {
          if (!disabled) onStep();
        }}
      />
      <span className="numeric-counter-sheet__step-glyph numeric-counter-sheet__step-glyph--base" aria-hidden>
        {glyph}
      </span>
      <span className="numeric-counter-sheet__step-glyph numeric-counter-sheet__step-glyph--check" aria-hidden />
    </label>
  );
}
