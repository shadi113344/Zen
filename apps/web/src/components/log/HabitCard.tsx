import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { formatCompactNumber } from "@/lib/format-number";
import { Link } from "react-router-dom";
import {
  bumpNumericLogValue,
  detectComeback,
  goalsForHabit,
  hasHabitReminder,
  hasVisibleStreak,
  isHabitDone,
  isNumericStreakDay,
  logValueForHabit,
  streak,
  todayKey,
  visibleStreak,
} from "@mottazen/core";
import type { Habit } from "@mottazen/core";
import { HabitGoalIndicators } from "@/components/goals/HabitGoalIndicators";
import { EditHabitModal } from "@/components/habit/EditHabitModal";
import { Modal } from "@/components/Modal";
import { HabitReminderModal } from "@/components/habit/HabitReminderModal";
import { HabitRowMenu } from "@/components/log/HabitRowMenu";
import { HabitSwipeRow } from "@/components/log/HabitSwipeRow";
import { StreakFlame } from "@/components/log/StreakFlame";
import { NumericInput } from "@/components/NumericInput";
import { asHapticSwitch } from "@/lib/haptic";
import { celebrateConfetti } from "@/lib/confetti";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";
import { usePressRadialMenu } from "@/hooks/usePressRadialMenu";
import { useToast } from "@/components/Toast";
import { useData, useGoals, useLogs } from "@/hooks/useData";

interface HabitCardProps {
  habit: Habit;
  date: string;
  onSkip: () => void;
  onRest: () => void;
}

export function HabitCard({ habit, date, onSkip, onRest }: HabitCardProps) {
  const { logs, setLogValue } = useLogs();
  const { goals, goalHabits } = useGoals();
  const { deleteHabit, restoreHabit } = useData();
  const { showToast } = useToast();
  const { compactView, displayDensity } = useDisplayPrefs();
  const activityOnly = displayDensity === "activity-only";
  const normalLayout = displayDensity === "normal";
  const compactLayout = displayDensity === "compact";
  const inlineRow = activityOnly || compactView;
  const hasReminder = hasHabitReminder(habit);
  const [editOpen, setEditOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const row = logs.find((l) => l.habitId === habit.id && l.date === date);
  const value = logValueForHabit(logs, habit.id, date);
  const isRest = row?.isRest === true || value === -1;
  const isSkipped = !isRest && row != null && value === 0;

  const toggleRest = () => {
    if (isRest) setLogValue(habit.id, date, null, false);
    else setLogValue(habit.id, date, -1, true);
  };

  const confirmDeleteHabit = useCallback(() => {
    const snapshot = deleteHabit(habit.id);
    setDeleteConfirmOpen(false);
    if (snapshot) {
      showToast(`Deleted “${habit.name}”`, () => restoreHabit(snapshot.habit, snapshot.logs));
    }
  }, [deleteHabit, habit.id, habit.name, restoreHabit, showToast]);

  const menuOptions = useMemo(
    () => [
      { id: "edit", label: "Edit activity", icon: "✎", onSelect: () => setEditOpen(true) },
      {
        id: "rest",
        label: isRest ? "Clear rest day" : "Rest day",
        icon: "☾",
        onSelect: toggleRest,
      },
      {
        id: "reminder",
        label: "Reminder",
        icon: "bell",
        onSelect: () => setReminderOpen(true),
      },
      {
        id: "delete",
        label: "Delete activity",
        icon: "trash",
        onSelect: () => setDeleteConfirmOpen(true),
      },
    ],
    [isRest],
  );

  const { open: menuOpen, highlightId, btnRef, bindTrigger } = usePressRadialMenu(menuOptions);

  const isCheckLike = habit.type === "check" || habit.type === "onetime";
  const isNumericLike = habit.type === "numeric" || habit.type === "milestone";
  const isCheckDone = isCheckLike && !isRest && (value ?? 0) > 0;
  const isNumericProgress =
    isNumericLike && !isRest && value != null && Number(value) > Number(habit.min ?? 0);
  const hasProgress = !isRest && !isSkipped && (isCheckDone || isNumericProgress);
  const nameClass = [
    "habit-card__name",
    isSkipped && "habit-card__name--skipped",
    hasProgress && "habit-card__name--progress",
  ]
    .filter(Boolean)
    .join(" ");

  const streakDays = streak(habit.id, habit, logs, date).current;
  const streakDisplay = visibleStreak(streakDays);
  const linkedGoals = useMemo(
    () => goalsForHabit(goals, goalHabits, habit.id, date),
    [goals, goalHabits, habit.id, date],
  );
  const showGoalDots = !activityOnly && linkedGoals.length > 0;
  const metaLine = inlineRow ? null : buildMetaLine(habit, value, isRest);
  const showStreakEmoji = hasVisibleStreak(streakDays);
  const todayStreakDone = isHabitDone(habit, value, isRest);
  const comeback = useMemo(() => detectComeback(habit, logs, date), [habit, logs, date]);
  const [streakCelebrateTick, setStreakCelebrateTick] = useState(0);
  const [comebackTick, setComebackTick] = useState(0);
  const [comebackCelebrate, setComebackCelebrate] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const prevDate = useRef(date);
  const prevStreakDisplay = useRef(streakDisplay);
  const prevTodayStreakDone = useRef(todayStreakDone);
  const isLogToday = date === todayKey();
  const showMetaLine = !inlineRow && (showStreakEmoji || !!metaLine || comebackCelebrate);

  useEffect(() => {
    // Browsing another log day is not a check-in — sync refs and skip celebrations.
    if (prevDate.current !== date) {
      prevDate.current = date;
      prevStreakDisplay.current = streakDisplay;
      prevTodayStreakDone.current = todayStreakDone;
      return;
    }

    const prevCount = prevStreakDisplay.current;
    const prevDone = prevTodayStreakDone.current;
    let trigger = false;

    if (showStreakEmoji && streakDisplay >= 2 && streakDisplay > prevCount) {
      trigger = true;
    } else if (showStreakEmoji && todayStreakDone && !prevDone) {
      trigger = true;
    }

    if (trigger) setStreakCelebrateTick((t) => t + 1);
    // Comeback confetti only when the user logs on Today — not when viewing history.
    if (isLogToday && todayStreakDone && !prevDone && comeback.isComeback) {
      setComebackTick((t) => t + 1);
    }

    prevStreakDisplay.current = streakDisplay;
    prevTodayStreakDone.current = todayStreakDone;
  }, [date, isLogToday, streakDisplay, showStreakEmoji, todayStreakDone, comeback.isComeback]);

  useEffect(() => {
    if (comebackTick <= 0) return;
    setComebackCelebrate(true);
    celebrateConfetti(articleRef.current);
    showToast(
      habit.goalDirection === "avoid"
        ? "Fresh start 🌱 A slip isn't a failure — you're back."
        : "Welcome back 🌱 You showed up again.",
    );
    const t = window.setTimeout(() => setComebackCelebrate(false), 4000);
    return () => window.clearTimeout(t);
    // Fire exactly once per comeback; showToast/celebrateConfetti are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comebackTick]);

  const maxTarget = isNumericLike ? Number(habit.max ?? 100) : null;

  const cardClass = [
    "habit-card",
    activityOnly ? "habit-card--activity-only" : compactView ? "habit-card--compact" : "habit-card--normal",
    isNumericLike ? "habit-card--numeric" : "",
    isRest ? "habit-card--rest" : "",
    isSkipped ? "habit-card--skipped" : "",
    !isSkipped && isCheckDone ? "habit-card--done" : "",
    !isSkipped && isNumericProgress ? "habit-card--progress" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const swipeLocked = menuOpen;

  return (
    <>
      <HabitSwipeRow onSkip={onSkip} onRest={onRest} enabled={!swipeLocked}>
        <article ref={articleRef} className={cardClass}>
          <div className="habit-card__main">
            <div
              className={`habit-card__title-block${
                inlineRow || (!showMetaLine && !(showGoalDots && normalLayout))
                  ? " habit-card__title-block--solo"
                  : ""
              }`}
            >
              {inlineRow ? (
                <div className="habit-card__line1 habit-card__line1--activity">
                  <span className="habit-card__name-group">
                    <Link
                      to={`/habit/${habit.id}`}
                      className="habit-card__name-link"
                      state={{ fromToday: true }}
                    >
                      <span className={nameClass}>{habit.name}</span>
                    </Link>
                    {showGoalDots && compactLayout ? (
                      <HabitGoalIndicators goals={linkedGoals} layout="compact" />
                    ) : null}
                    {maxTarget != null && (
                      <span className="habit-card__max-badge" aria-label={`Target ${maxTarget}`}>
                        {formatCompactNumber(maxTarget)}
                      </span>
                    )}
                  </span>
                  <span className="habit-card__activity-meta">
                    {comebackCelebrate ? <ComebackPill /> : null}
                    {showStreakEmoji ? (
                      <StreakFlame
                        days={streakDisplay}
                        celebrateTick={streakCelebrateTick}
                        goalDirection={habit.goalDirection}
                      />
                    ) : null}
                    {hasReminder ? (
                      <span className="habit-card__reminder-icon" aria-label="Reminder set" />
                    ) : null}
                  </span>
                </div>
              ) : (
                <>
                  <div className="habit-card__line1">
                    <Link
                      to={`/habit/${habit.id}`}
                      className="habit-card__name-link"
                      state={{ fromToday: true }}
                    >
                      <span className={nameClass}>{habit.name}</span>
                    </Link>
                  </div>
                  {showGoalDots && normalLayout ? (
                    <HabitGoalIndicators goals={linkedGoals} layout="normal" />
                  ) : null}
                  {showMetaLine ? (
                    <div className="habit-card__line2 habit-card__line2--meta">
                      {comebackCelebrate ? <ComebackPill /> : null}
                      {showStreakEmoji ? (
                        <StreakFlame
                          days={streakDisplay}
                          celebrateTick={streakCelebrateTick}
                          goalDirection={habit.goalDirection}
                        />
                      ) : null}
                      {showStreakEmoji && metaLine ? (
                        <span className="habit-card__meta-sep" aria-hidden>
                          {" "}
                          ·{" "}
                        </span>
                      ) : null}
                      {metaLine ? <span>{metaLine}</span> : null}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="habit-card__actions">
            <button
              ref={btnRef}
              type="button"
              className={`habit-card__menu-btn${menuOpen ? " habit-card__menu-btn--open" : ""}`}
              aria-label="Activity actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              {...bindTrigger}
            />
            {isCheckLike ? (
              <label
                className="habit-card__check"
                aria-label={!isRest && (value ?? 0) > 0 ? "Mark incomplete" : "Mark complete"}
                onPointerDown={stopBubble}
                onClick={stopBubble}
              >
                <input
                  type="checkbox"
                  ref={asHapticSwitch}
                  checked={!isRest && (value ?? 0) > 0}
                  disabled={isRest}
                  onChange={(e) => {
                    if (isRest) return;
                    setLogValue(habit.id, date, e.target.checked ? 1 : null);
                  }}
                />
                <span className="habit-card__check-ui" aria-hidden />
              </label>
            ) : (
              <NumericControls habit={habit} date={date} value={value} isRest={isRest} />
            )}
          </div>
        </article>
      </HabitSwipeRow>

      <HabitRowMenu anchorRef={btnRef} open={menuOpen} highlightId={highlightId} options={menuOptions} />

      <EditHabitModal habit={habit} open={editOpen} onClose={() => setEditOpen(false)} onDeleted={() => setEditOpen(false)} />
      <HabitReminderModal habit={habit} open={reminderOpen} onClose={() => setReminderOpen(false)} />
      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete activity?">
        <p className="habit-delete-confirm__text">
          Delete <strong>{habit.name}</strong>? All log history for this activity will be removed.
        </p>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger btn--danger-confirm" onClick={confirmDeleteHabit}>
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}

function NumericControls({
  habit,
  date,
  value,
  isRest,
}: {
  habit: Habit;
  date: string;
  value: number | null;
  isRest: boolean;
}) {
  const { setLogValue } = useLogs();
  const [valueFocused, setValueFocused] = useState(false);
  const minVal = Number(habit.min ?? 0);
  const max = Number(habit.max ?? 100);
  const current = isRest ? 0 : Number(value ?? 0);
  const showCompact = !valueFocused && Math.abs(current) >= 1000;
  const displayValue = isRest ? "—" : showCompact ? formatCompactNumber(current) : String(current);
  const valueCh = isRest ? 1 : Math.max(1, displayValue.length);

  const commitValue = (raw: string) => {
    if (isRest) return;
    const digits = raw.replace(/\D/g, "");
    if (digits === "") return;
    const n = Math.min(max, Math.max(minVal, Number(digits)));
    setLogValue(habit.id, date, n);
  };

  const bump = (direction: 1 | -1) => {
    if (isRest) return;
    setLogValue(habit.id, date, (prev) => bumpNumericLogValue(prev, direction, habit));
  };

  // "any" scoring → complete at any value > 0; "scale" scoring → complete at max.
  const isComplete = !isRest && current > 0 && isNumericStreakDay(habit, current);

  return (
    <div
      className="habit-card__numeric"
      style={
        {
          "--value-ch": valueCh,
          "--numeric-gap": `${Math.min(8, 1 + valueCh)}px`,
        } as React.CSSProperties
      }
      onPointerDown={stopBubble}
      onMouseDown={stopBubble}
    >
      <StepButton
        glyph="−"
        label="Decrease"
        disabled={isRest || current <= Number(habit.min ?? 0)}
        onStep={() => bump(-1)}
      />
      {isRest ? (
        <span className="habit-card__value">—</span>
      ) : (
        <>
          <NumericInput
            className="habit-card__value-input"
            value={displayValue}
            onChange={(e) => commitValue(e.target.value)}
            onFocus={() => setValueFocused(true)}
            onBlur={(e) => {
              commitValue(e.target.value);
              setValueFocused(false);
            }}
            aria-label="Log value"
          />
        </>
      )}
      <StepButton
        glyph="+"
        label="Increase"
        disabled={isRest || current >= max}
        onStep={() => bump(1)}
        completed={isComplete}
      />
    </div>
  );
}

/**
 * Numeric +/- control built on a real `<input type="checkbox" switch>` rather
 * than a <button>, so a direct user tap fires iOS's native Taptic Engine — the
 * only web-haptic path left on iOS 26.5+ (see asHapticSwitch). The checkbox just
 * toggles harmlessly; its change handler does the actual step. On other
 * platforms it's a hidden checkbox and the buzz comes from navigator.vibrate.
 */
function StepButton({
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
    "habit-card__step",
    disabled ? "habit-card__step--disabled" : "",
    completed ? "habit-card__step--complete" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <label className={className}>
      <input
        type="checkbox"
        ref={asHapticSwitch}
        className="habit-card__step-haptic"
        disabled={disabled}
        aria-label={completed ? `${label} — complete` : label}
        onChange={() => {
          if (!disabled) onStep();
        }}
      />
      <span className="habit-card__step-glyph habit-card__step-glyph--base" aria-hidden>
        {glyph}
      </span>
      <span className="habit-card__step-glyph habit-card__step-glyph--check" aria-hidden />
    </label>
  );
}

/** Transient "welcome back 🌱" treatment shown when a check-in restarts a broken streak. */
function ComebackPill() {
  return (
    <span className="habit-card__comeback" role="status" aria-label="Welcome back">
      <span className="habit-card__comeback-emoji" aria-hidden>
        🌱
      </span>
      <span className="habit-card__comeback-text">Back!</span>
    </span>
  );
}

function buildMetaLine(habit: Habit, value: number | null, isRest: boolean): string | null {
  const parts: string[] = [];
  if (isRest) {
    parts.push("Rest");
  } else if (habit.type === "onetime") {
    if ((value ?? 0) > 0) parts.push("Done");
    else parts.push("One-time · not done");
  } else if (habit.type !== "check") {
    const min = habit.min ?? 0;
    const max = habit.max ?? 100;
    if (value != null && Number(value) > 0) {
      parts.push(`${formatCompactNumber(Number(value))} / ${formatCompactNumber(max)}`);
    } else {
      parts.push(`Range ${formatCompactNumber(min)}–${formatCompactNumber(max)}`);
    }
  }
  return parts.length ? parts.join(" · ") : null;
}

function stopBubble(e: PointerEvent | MouseEvent) {
  e.stopPropagation();
}
