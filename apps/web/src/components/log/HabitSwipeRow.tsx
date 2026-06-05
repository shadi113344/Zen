import type { ReactNode } from "react";
import { useHabitSwipe } from "@/hooks/useHabitSwipe";

interface HabitSwipeRowProps {
  children: ReactNode;
  onSkip: () => void;
  onRest: () => void;
  enabled?: boolean;
  className?: string;
}

const HINT_SHOW_PX = 12;

export function HabitSwipeRow({ children, onSkip, onRest, enabled = true, className }: HabitSwipeRowProps) {
  const { offset, bind } = useHabitSwipe(onSkip, onRest, enabled);
  const swiping = enabled && Math.abs(offset) >= HINT_SHOW_PX;
  const showRest = enabled && offset <= -HINT_SHOW_PX;
  const showSkip = enabled && offset >= HINT_SHOW_PX;

  const rootClass = ["habit-swipe-row", swiping ? "habit-swipe-row--swiping" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <div className="habit-swipe-row__behind" aria-hidden>
        <span
          className={`habit-swipe-row__hint habit-swipe-row__hint--skip${showSkip ? " habit-swipe-row__hint--visible" : ""}`}
        >
          Skip
        </span>
        <span
          className={`habit-swipe-row__hint habit-swipe-row__hint--rest${showRest ? " habit-swipe-row__hint--visible" : ""}`}
        >
          Rest
        </span>
      </div>
      <div
        className={`habit-swipe-row__surface${enabled ? "" : " habit-swipe-row__surface--locked"}`}
        style={{ transform: enabled ? `translateX(${offset}px)` : undefined }}
        {...bind}
      >
        {children}
      </div>
    </div>
  );
}
