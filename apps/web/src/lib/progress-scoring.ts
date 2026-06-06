import type { ProgressScoring } from "@mottazen/core";

export const PROGRESS_SCORING_STREAK_HINT: Record<ProgressScoring, string> = {
  scale: "Streak counts only on days you reach the max. Partial progress does not count.",
  any: "Streak counts on any day you log a value, even partial.",
};
