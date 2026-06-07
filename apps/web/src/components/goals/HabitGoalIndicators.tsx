import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import type { Goal } from "@mottazen/core";
import { resolveGoalColor } from "@/lib/goal-color";

interface HabitGoalIndicatorsProps {
  goals: Goal[];
  layout: "normal" | "compact";
}

export function HabitGoalIndicators({ goals, layout }: HabitGoalIndicatorsProps) {
  const [openGoalId, setOpenGoalId] = useState<string | null>(null);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!openGoalId) return;
    const close = (e: Event) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpenGoalId(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [openGoalId]);

  if (goals.length === 0) return null;

  const toggle = (goalId: string, e: MouseEvent | PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenGoalId((prev) => (prev === goalId ? null : goalId));
  };

  return (
    <span
      ref={rootRef}
      className={`habit-goal-dots habit-goal-dots--${layout}`}
      aria-label={`${goals.length} linked target${goals.length === 1 ? "" : "s"}`}
    >
      {goals.map((goal) => {
        const color = resolveGoalColor(goal);
        const open = openGoalId === goal.id;
        return (
          <span key={goal.id} className="habit-goal-dot-wrap">
            <button
              type="button"
              className={`habit-goal-dot${open ? " habit-goal-dot--open" : ""}`}
              style={{ backgroundColor: color }}
              aria-label={goal.name}
              aria-expanded={open}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => toggle(goal.id, e)}
            />
            {open ? (
              <span className="habit-goal-pill" style={{ "--goal-color": color } as React.CSSProperties}>
                {goal.name}
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
