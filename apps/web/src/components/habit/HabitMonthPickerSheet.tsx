import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { addMonths } from "@mottazen/core";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface HabitMonthPickerSheetProps {
  open: boolean;
  onClose: () => void;
  anchor: string;
  today: string;
  onSelect: (monthAnchor: string) => void;
}

/** Year + month grid for quick calendar navigation. */
export function HabitMonthPickerSheet({ open, onClose, anchor, today, onSelect }: HabitMonthPickerSheetProps) {
  const [year, setYear] = useState(() => Number(anchor.slice(0, 4)));
  const todayYear = Number(today.slice(0, 4));
  const todayMonth = Number(today.slice(5, 7));
  const anchorMonth = Number(anchor.slice(5, 7));

  useEffect(() => {
    if (open) setYear(Number(anchor.slice(0, 4)));
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const pickMonth = (month: number) => {
    const mm = String(month).padStart(2, "0");
    onSelect(`${year}-${mm}-01`);
    onClose();
  };

  return createPortal(
    <div className="numeric-counter-sheet__backdrop" onClick={onClose} role="presentation">
      <div
        className="numeric-counter-sheet card habit-month-picker"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="habit-month-picker-title"
      >
        <div className="numeric-counter-sheet__handle" aria-hidden />
        <h2 id="habit-month-picker-title" className="numeric-counter-sheet__title">
          Jump to month
        </h2>

        <div className="habit-month-picker__year-nav">
          <button type="button" className="habit-month-cal__nav-btn" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
            ‹
          </button>
          <span className="habit-month-picker__year">{year}</span>
          <button
            type="button"
            className="habit-month-cal__nav-btn"
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= todayYear}
            aria-label="Next year"
          >
            ›
          </button>
        </div>

        <div className="habit-month-picker__grid">
          {MONTHS_SHORT.map((label, i) => {
            const month = i + 1;
            const isFuture = year > todayYear || (year === todayYear && month > todayMonth);
            const isCurrent = year === Number(anchor.slice(0, 4)) && month === anchorMonth;
            return (
              <button
                key={label}
                type="button"
                className={[
                  "habit-month-picker__month",
                  isCurrent ? "habit-month-picker__month--current" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={isFuture}
                onClick={() => pickMonth(month)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="btn btn--ghost habit-month-picker__today"
          onClick={() => {
            onSelect(addMonths(today, 0));
            onClose();
          }}
        >
          Today
        </button>
      </div>
    </div>,
    document.body,
  );
}
