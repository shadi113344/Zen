import { useEffect, useState } from "react";
import { todayKey } from "@mottazen/core";
import type { DayLog } from "@mottazen/core";
import { Modal } from "@/components/Modal";

interface CalendarModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: string;
  onSelect: (date: string) => void;
  logs: DayLog[];
}

export function CalendarModal({ open, onClose, selectedDate, onSelect, logs }: CalendarModalProps) {
  const [viewMonth, setViewMonth] = useState(() => monthState(selectedDate));
  const today = todayKey();

  useEffect(() => {
    if (open) setViewMonth(monthState(selectedDate));
  }, [open, selectedDate]);

  const cells = buildMonthGrid(viewMonth.year, viewMonth.month);

  return (
    <Modal open={open} onClose={onClose} title="Pick a day">
      <div className="calendar">
        <div className="calendar__nav">
          <button type="button" onClick={() => setViewMonth(shiftMonth(viewMonth, -1))} aria-label="Previous month">
            ‹
          </button>
          <span>{monthLabel(viewMonth.year, viewMonth.month)}</span>
          <button
            type="button"
            onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
            aria-label="Next month"
            disabled={isFutureMonth(viewMonth, today)}
          >
            ›
          </button>
        </div>
        <div className="calendar__weekdays">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>
        <div className="calendar__grid">
          {cells.map((cell, i) => {
            if (!cell) return <span key={`e-${i}`} className="calendar__empty" />;
            const hasLog = logs.some((l) => l.date === cell && (l.value !== null || l.isRest));
            const isSelected = cell === selectedDate;
            const isFuture = cell > today;
            return (
              <button
                key={cell}
                type="button"
                className={[
                  "calendar__day",
                  hasLog ? "calendar__day--logged" : "",
                  isSelected ? "calendar__day--selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={isFuture}
                onClick={() => {
                  onSelect(cell);
                  onClose();
                }}
              >
                {Number(cell.slice(8))}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="calendar__today-link"
          onClick={() => {
            onSelect(today);
            onClose();
          }}
        >
          Jump to today
        </button>
      </div>
    </Modal>
  );
}

function monthState(dateKey: string) {
  const [y, m] = dateKey.split("-").map(Number);
  return { year: y!, month: m! - 1 };
}

function buildMonthGrid(year: number, month: number): Array<string | null> {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = Array(startPad).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }
  return cells;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function shiftMonth(v: { year: number; month: number }, delta: number) {
  const d = new Date(v.year, v.month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function isFutureMonth(v: { year: number; month: number }, today: string) {
  const [ty, tm] = today.split("-").map(Number);
  return v.year > ty! || (v.year === ty && v.month > tm! - 1);
}
