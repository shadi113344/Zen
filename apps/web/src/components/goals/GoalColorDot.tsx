import type { Goal } from "@mottazen/core";
import { resolveGoalColor } from "@/lib/goal-color";

interface GoalColorDotProps {
  goal: Pick<Goal, "id" | "color">;
  className?: string;
  title?: string;
}

/** Small color marker for a goal (custom color or stable default). */
export function GoalColorDot({ goal, className, title }: GoalColorDotProps) {
  return (
    <span
      className={`goal-color-dot${className ? ` ${className}` : ""}`}
      style={{ backgroundColor: resolveGoalColor(goal) }}
      title={title}
      aria-hidden={title ? undefined : true}
    />
  );
}
