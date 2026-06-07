import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import {
  addMonths,
  habitScore,
  isNumericLikeHabit,
  logValueForHabit,
  monthGridDates,
} from "@mottazen/core";
import type { DayLog, Habit } from "@mottazen/core";
import { useLogs } from "@/hooks/useData";
import { HabitDayEditorSheet } from "@/components/habit/HabitDayEditorSheet";
import { HabitMonthPickerSheet } from "@/components/habit/HabitMonthPickerSheet";

const SWIPE_THRESHOLD_PX = 48;
const SWIPE_LOCK_PX = 8;
const SLIDE_MS = 260;

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAY_LONG = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface HabitMonthCalendarProps {
  habit: Habit;
  logs: DayLog[];
  today: string;
}

function dayNumber(date: string): number {
  return Number(date.slice(8, 10));
}

function monthLabel(anchor: string): string {
  const [y, m] = anchor.split("-").map(Number);
  return `${MONTHS[m! - 1]} ${y}`;
}

function dayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  return `${WEEKDAY_LONG[dow]} ${d} ${MONTHS[m! - 1]!.slice(0, 3)}`;
}

export function HabitMonthCalendar({ habit, logs, today }: HabitMonthCalendarProps) {
  const { setLogValue } = useLogs();
  const numeric = isNumericLikeHabit(habit);
  const [anchor, setAnchor] = useState(() => addMonths(today, 0));
  const [selected, setSelected] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(0);
  const swipeRef = useRef({ x: 0, y: 0, tracking: false, locked: null as "x" | "y" | null });
  const pendingCommitRef = useRef<"prev" | "next" | null>(null);
  const justSwipedRef = useRef(false);
  const dragActiveRef = useRef(false);
  const isAnimatingRef = useRef(isAnimating);

  const setOffset = (px: number) => {
    dragOffsetRef.current = px;
    setDragOffset(px);
  };

  const thisMonth = useMemo(() => addMonths(today, 0), [today]);
  const canGoNext = anchor < thisMonth;
  const canGoNextRef = useRef(false);

  canGoNextRef.current = canGoNext;
  isAnimatingRef.current = isAnimating;

  const prevAnchor = useMemo(() => addMonths(anchor, -1), [anchor]);
  const nextAnchor = useMemo(() => addMonths(anchor, 1), [anchor]);

  const tap = useCallback(
    (date: string) => {
      if (numeric) {
        setSelected(date);
        return;
      }
      const value = logValueForHabit(logs, habit.id, date);
      const isRest = value === -1;
      if (isRest) {
        setSelected(date);
        return;
      }
      setLogValue(habit.id, date, (value ?? 0) > 0 ? null : 1);
    },
    [habit.id, logs, numeric, setLogValue],
  );

  const snapBack = useCallback(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pendingCommitRef.current = null;
    dragActiveRef.current = false;
    if (dragOffsetRef.current === 0) return;
    if (reduced) {
      setOffset(0);
      return;
    }
    setIsAnimating(true);
    setOffset(0);
  }, []);

  const commitSlide = useCallback(
    (direction: "prev" | "next" | "snap") => {
      if (direction === "snap") {
        snapBack();
        return;
      }

      const w = viewportRef.current?.clientWidth ?? 0;
      if (w === 0) {
        snapBack();
        return;
      }

      if (direction === "next" && !canGoNextRef.current) {
        snapBack();
        return;
      }

      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        justSwipedRef.current = true;
        setAnchor((a) => addMonths(a, direction === "prev" ? -1 : 1));
        dragActiveRef.current = false;
        return;
      }

      justSwipedRef.current = true;
      pendingCommitRef.current = direction;
      setIsAnimating(true);
      setOffset(direction === "prev" ? w : -w);
      dragActiveRef.current = false;
    },
    [snapBack],
  );

  const goPrevMonth = () => commitSlide("prev");
  const goNextMonth = () => {
    if (canGoNext) commitSlide("next");
  };

  const onTrackTransitionEnd = () => {
    if (!isAnimating) return;
    if (pendingCommitRef.current === "prev") setAnchor((a) => addMonths(a, -1));
    else if (pendingCommitRef.current === "next") setAnchor((a) => addMonths(a, 1));
    pendingCommitRef.current = null;
    setOffset(0);
    setIsAnimating(false);
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const clamp = (dx: number) => {
      const rubber = 36;
      if (!canGoNextRef.current && dx < 0) return Math.max(dx, -rubber);
      return dx;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (isAnimatingRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      swipeRef.current = { x: t.clientX, y: t.clientY, tracking: true, locked: null };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!swipeRef.current.tracking || isAnimatingRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - swipeRef.current.x;
      const dy = t.clientY - swipeRef.current.y;

      if (swipeRef.current.locked === null) {
        if (Math.abs(dx) < SWIPE_LOCK_PX && Math.abs(dy) < SWIPE_LOCK_PX) return;
        swipeRef.current.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }

      if (swipeRef.current.locked !== "x") return;

      e.preventDefault();
      dragActiveRef.current = Math.abs(dx) > SWIPE_LOCK_PX;
      setOffset(clamp(dx));
    };

    const onTouchEnd = () => {
      if (!swipeRef.current.tracking) return;
      const locked = swipeRef.current.locked;
      swipeRef.current.tracking = false;
      swipeRef.current.locked = null;

      if (locked !== "x") {
        dragActiveRef.current = false;
        return;
      }

      const offset = dragOffsetRef.current;
      if (offset > SWIPE_THRESHOLD_PX) commitSlide("prev");
      else if (offset < -SWIPE_THRESHOLD_PX && canGoNextRef.current) commitSlide("next");
      else commitSlide("snap");
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [commitSlide]);

  const selectedRow = selected ? logs.find((l) => l.habitId === habit.id && l.date === selected) : undefined;
  const selectedValue = selected ? logValueForHabit(logs, habit.id, selected) : null;
  const selectedRest = selectedValue === -1 || selectedRow?.isRest === true;

  const trackClass = [
    "habit-month-cal__track",
    isAnimating ? "habit-month-cal__track--animating" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const trackStyle = {
    transform: `translateX(calc(-33.333% + ${dragOffset}px))`,
    transitionDuration: isAnimating ? `${SLIDE_MS}ms` : "0ms",
  };

  return (
    <div className="habit-month-cal">
      <div className="habit-month-cal__nav">
        <button type="button" className="habit-month-cal__nav-btn" onClick={goPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <button
          type="button"
          className="habit-month-cal__nav-label"
          onClick={() => setPickerOpen(true)}
          aria-label={`${monthLabel(anchor)}. Open month picker`}
        >
          {monthLabel(anchor)}
        </button>
        <button
          type="button"
          className="habit-month-cal__nav-btn"
          onClick={goNextMonth}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div ref={viewportRef} className="habit-month-cal__viewport">
        <div className={trackClass} style={trackStyle} onTransitionEnd={onTrackTransitionEnd}>
          <MonthPanel
            habit={habit}
            logs={logs}
            today={today}
            anchor={prevAnchor}
            onTap={tap}
            onLongPress={setSelected}
            justSwipedRef={justSwipedRef}
            dragActiveRef={dragActiveRef}
          />
          <MonthPanel
            habit={habit}
            logs={logs}
            today={today}
            anchor={anchor}
            onTap={tap}
            onLongPress={setSelected}
            justSwipedRef={justSwipedRef}
            dragActiveRef={dragActiveRef}
          />
          <MonthPanel
            habit={habit}
            logs={logs}
            today={today}
            anchor={nextAnchor}
            onTap={tap}
            onLongPress={setSelected}
            justSwipedRef={justSwipedRef}
            dragActiveRef={dragActiveRef}
          />
        </div>
      </div>

      <div className="habit-month-cal__legend">
        <span className="habit-month-cal__legend-item">
          <span className="habit-month-cal__legend-dot habit-month-cal__legend-dot--done" /> Done
        </span>
        <span className="habit-month-cal__legend-item">
          <span className="habit-month-cal__legend-dot" /> Unlogged
        </span>
        <span className="habit-month-cal__legend-item">
          <span className="habit-month-cal__legend-dot habit-month-cal__legend-dot--rest" />☾ Rest
        </span>
      </div>

      {selected && (
        <HabitDayEditorSheet
          open
          onClose={() => setSelected(null)}
          habit={habit}
          date={selected}
          value={selectedRest ? null : selectedValue}
          isRest={selectedRest}
          label={dayLabel(selected)}
        />
      )}

      <HabitMonthPickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        anchor={anchor}
        today={today}
        onSelect={setAnchor}
      />
    </div>
  );
}

interface MonthPanelProps {
  habit: Habit;
  logs: DayLog[];
  today: string;
  anchor: string;
  onTap: (date: string) => void;
  onLongPress: (date: string) => void;
  justSwipedRef: MutableRefObject<boolean>;
  dragActiveRef: MutableRefObject<boolean>;
}

function MonthPanel({ habit, logs, today, anchor, onTap, onLongPress, justSwipedRef, dragActiveRef }: MonthPanelProps) {
  const grid = useMemo(() => monthGridDates(anchor), [anchor]);

  return (
    <div className="habit-month-cal__panel">
      <div className="habit-month-cal__weekdays" aria-hidden>
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="habit-month-cal__weekday">
            {w}
          </span>
        ))}
      </div>
      <div className="habit-month-cal__grid" role="grid">
        {grid.map(({ date, inMonth }) => (
          <DayCell
            key={`${anchor}-${date}`}
            habit={habit}
            date={date}
            logs={logs}
            inMonth={inMonth}
            isToday={date === today}
            isFuture={date > today}
            onTap={onTap}
            onLongPress={onLongPress}
            justSwipedRef={justSwipedRef}
            dragActiveRef={dragActiveRef}
          />
        ))}
      </div>
    </div>
  );
}

interface DayCellProps {
  habit: Habit;
  date: string;
  logs: DayLog[];
  inMonth: boolean;
  isToday: boolean;
  isFuture: boolean;
  onTap: (date: string) => void;
  onLongPress: (date: string) => void;
  justSwipedRef: MutableRefObject<boolean>;
  dragActiveRef: MutableRefObject<boolean>;
}

function DayCell({
  habit,
  date,
  logs,
  inMonth,
  isToday,
  isFuture,
  onTap,
  onLongPress,
  justSwipedRef,
  dragActiveRef,
}: DayCellProps) {
  const numeric = isNumericLikeHabit(habit);
  const row = logs.find((l) => l.habitId === habit.id && l.date === date);
  const value = logValueForHabit(logs, habit.id, date);
  const isRest = value === -1;
  const isSkipped = !isRest && row != null && value === 0;
  const score = isRest ? null : habitScore(habit, value);
  const done = !isRest && value !== null && value > 0;

  const longPressedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const interactive = inMonth && !isFuture;

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const onPointerDown = () => {
    if (!interactive || dragActiveRef.current) return;
    longPressedRef.current = false;
    timerRef.current = window.setTimeout(() => {
      longPressedRef.current = true;
      onLongPress(date);
    }, 480);
  };

  const onClick = () => {
    if (!interactive || dragActiveRef.current) return;
    if (justSwipedRef.current) {
      justSwipedRef.current = false;
      return;
    }
    if (longPressedRef.current) {
      longPressedRef.current = false;
      return;
    }
    onTap(date);
  };

  const stateLabel = isRest
    ? "rest day"
    : isSkipped
      ? "skipped"
      : done
        ? "done"
        : value !== null
          ? "partial"
          : "not logged";

  const cellClass = [
    "habit-month-cal__cell",
    !inMonth ? "habit-month-cal__cell--out" : "",
    isToday ? "habit-month-cal__cell--today" : "",
    isFuture ? "habit-month-cal__cell--future" : "",
    isRest ? "habit-month-cal__cell--rest" : "",
    isSkipped ? "habit-month-cal__cell--skipped" : "",
    done && !numeric ? "habit-month-cal__cell--done" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const numClass = ["habit-month-cal__num", isSkipped ? "habit-month-cal__num--skipped" : ""].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={cellClass}
      onPointerDown={onPointerDown}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      onPointerCancel={clearTimer}
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
      disabled={!interactive}
      aria-label={`${date}: ${stateLabel}`}
      role="gridcell"
    >
      {numeric && !isRest && score !== null && score > 0 && <DayRing pct={score} />}
      {isRest ? (
        <span className="habit-month-cal__moon" aria-hidden>
          ☾
        </span>
      ) : (
        <span className={numClass}>{dayNumber(date)}</span>
      )}
    </button>
  );
}

const RING_R = 12;
const RING_C = 2 * Math.PI * RING_R;

function DayRing({ pct }: { pct: number }) {
  const offset = RING_C - (Math.min(100, Math.max(0, pct)) / 100) * RING_C;
  const complete = pct >= 100;
  return (
    <svg className="habit-month-cal__ring" viewBox="0 0 36 36" aria-hidden>
      <circle className="habit-month-cal__ring-track" cx="18" cy="18" r={RING_R} fill="none" strokeWidth="3" />
      <circle
        className={`habit-month-cal__ring-progress${complete ? " habit-month-cal__ring-progress--complete" : ""}`}
        cx="18"
        cy="18"
        r={RING_R}
        fill="none"
        strokeWidth="3"
        strokeDasharray={RING_C}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
    </svg>
  );
}
