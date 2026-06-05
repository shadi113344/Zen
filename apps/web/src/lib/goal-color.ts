import type { Goal } from "@mottazen/core";

export const GOAL_COLOR_PALETTE = [
  "#0d9488",
  "#7c3aed",
  "#c46a3a",
  "#2563eb",
  "#db2777",
  "#ca8a04",
  "#059669",
  "#dc2626",
  "#0891b2",
  "#9333ea",
] as const;

export const GOAL_COLOR_PRESETS = GOAL_COLOR_PALETTE.map((color, i) => ({
  id: `goal-${i}`,
  color,
  label: `Color ${i + 1}`,
}));

/** Stable default accent when no custom color is stored. */
export function defaultGoalColor(goalId: string): string {
  let hash = 0;
  for (let i = 0; i < goalId.length; i++) {
    hash = (hash + goalId.charCodeAt(i) * (i + 3)) % 9973;
  }
  return GOAL_COLOR_PALETTE[hash % GOAL_COLOR_PALETTE.length]!;
}

export function resolveGoalColor(goal: Pick<Goal, "id" | "color">): string {
  const custom = goal.color?.trim();
  return custom || defaultGoalColor(goal.id);
}

/** @deprecated Use resolveGoalColor or defaultGoalColor */
export function goalColor(goalId: string): string {
  return defaultGoalColor(goalId);
}
