import { useMemo, useState, type MouseEvent, type PointerEvent } from "react";
import { formatCompactNumber } from "@/lib/format-number";
import { Link } from "react-router-dom";
import { bumpNumericLogValue, goalsForHabit, logValueForHabit, streak } from "@mottazen/core";
import type { Habit } from "@mottazen/core";
import { HabitGoalIndicators } from "@/components/goals/HabitGoalIndicators";
import { EditHabitModal } from "@/components/habit/EditHabitModal";
import { HabitReminderModal } from "@/components/habit/HabitReminderModal";
import { HabitRowMenu } from "@/components/log/HabitRowMenu";
import { HabitSwipeRow } from "@/components/log/HabitSwipeRow";
import { NumericInput } from "@/components/NumericInput";
import { asHapticSwitch } from "@/lib/haptic";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";
import { usePressRadialMenu } from "@/hooks/usePressRadialMenu";
import { useGoals, useLogs } from "@/hooks/useData";

interface HabitCardProps {
  habit: Habit;
  date: string;
  onSkip: () => void;
  onRest: () => void;
}

export function HabitCard({ habit, date, onSkip, onRest }: HabitCardProps) {
  const { logs, setLogValue } = useLogs();
  const { goals, goalHabits } = useGoals();
  const { compactView, displayDensity } = useDisplayPrefs();
  const activityOnly = displayDensity === "activity-only";
  const normalLayout = displayDensity === "normal";
  const compactLayout = displayDensity === "compact";
  const inlineRow = activityOnly || compactView;
  const hasReminder = !!(habit.remindAt || habit.notify?.remindAt);
  const [editOpen, setEditOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);

  const row = logs.find((l) => l.habitId === habit.id && l.date === date);
  const value = logValueForHabit(logs, habit.id, date);
  const isRest = row?.isRest === true || value === -1;
  const isSkipped = !isRest && row != null && value === 0;

  const toggleRest = () => {
    if (isRest) setLogValue(habit.id, date, 0, false);
    else setLogValue(habit.id, date, -1, true);
  };

  const menuOptions = useMemo(
    () => [
      { id: "edit", label: "Edit habit", icon: "✎", onSelect: () => setEditOpen(true) },
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
    ],
    [habit.id, isRest],
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
  const linkedGoals = useMemo(
    () => goalsForHabit(goals, goalHabits, habit.id, date),
    [goals, goalHabits, habit.id, date],
  );
  const showGoalDots = !activityOnly && linkedGoals.length > 0;
  const metaLine = inlineRow ? null : buildMetaLine(habit, value, isRest, streakDays);
  const showStreakEmoji = streakDays >= 1;
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
        <article className={cardClass}>
          <div className="habit-card__main">
            <div
              className={`habit-card__title-block${
                inlineRow || (!metaLine && !(showGoalDots && normalLayout))
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
                    {showStreakEmoji ? (
                      <span className="habit-card__streak" aria-label={`${streakDays} day streak`}>
                        <span className="habit-card__streak-days">{streakDays}</span>
                        <span className="habit-card__streak-emoji" aria-hidden>
                          🔥
                        </span>
                      </span>
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
                  {metaLine ? <p className="habit-card__line2">{metaLine}</p> : null}
                </>
              )}
            </div>
          </div>

          <div className="habit-card__actions">
            <button
              ref={btnRef}
              type="button"
              className={`habit-card__menu-btn${menuOpen ? " habit-card__menu-btn--open" : ""}`}
              aria-label="Habit actions"
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
                    setLogValue(habit.id, date, e.target.checked ? 1 : 0);
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
      <StepButton glyph="+" label="Increase" disabled={isRest || current >= max} onStep={() => bump(1)} />
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
}: {
  glyph: string;
  label: string;
  disabled: boolean;
  onStep: () => void;
}) {
  return (
    <label className={`habit-card__step${disabled ? " habit-card__step--disabled" : ""}`}>
      <input
        type="checkbox"
        ref={asHapticSwitch}
        className="habit-card__step-haptic"
        disabled={disabled}
        aria-label={label}
        onChange={() => {
          if (!disabled) onStep();
        }}
      />
      <span aria-hidden>{glyph}</span>
    </label>
  );
}

function buildMetaLine(habit: Habit, value: number | null, isRest: boolean, streakDays: number): string | null {
  const parts: string[] = [];
  if (streakDays >= 2) {
    parts.push(`${streakDays} days 🔥`);
  }
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
