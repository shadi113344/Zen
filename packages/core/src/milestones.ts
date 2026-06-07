import { currentStreak } from "./streaks";
import type { DayLog, Habit } from "./types";

/**
 * A "days of showing up" milestone that unlocks a shareable card (G2).
 * Output-only: the tier describes the *number*, never the activity.
 */
export interface MilestoneTier {
  /** Inclusive streak-day threshold. */
  days: number;
  /** Short headline number, e.g. "100 days". */
  label: string;
  /** A warm, name-free caption for the share card. */
  caption: string;
}

/** Streak-length milestones, ascending. Crossing one offers a share card. */
export const MILESTONE_TIERS: readonly MilestoneTier[] = [
  { days: 10, label: "10 days", caption: "10 days of showing up" },
  { days: 30, label: "30 days", caption: "30 days of showing up" },
  { days: 50, label: "50 days", caption: "50 days of showing up" },
  { days: 100, label: "100 days", caption: "100 days of showing up" },
  { days: 200, label: "200 days", caption: "200 days of showing up" },
  { days: 365, label: "365 days", caption: "A full year of showing up" },
] as const;

/** Highest milestone tier reached at `streakDays`, or null when below the first. */
export function highestMilestone(streakDays: number): MilestoneTier | null {
  let hit: MilestoneTier | null = null;
  for (const tier of MILESTONE_TIERS) {
    if (streakDays >= tier.days) hit = tier;
    else break;
  }
  return hit;
}

/**
 * The milestone *just crossed* moving from `prevStreak` → `newStreak`
 * (e.g. yesterday 29, today 30). Returns the highest newly-crossed tier, else null.
 * Used to fire a one-time celebration + Share offer on check-in.
 */
export function milestoneJustReached(prevStreak: number, newStreak: number): MilestoneTier | null {
  if (newStreak <= prevStreak) return null;
  let crossed: MilestoneTier | null = null;
  for (const tier of MILESTONE_TIERS) {
    if (newStreak >= tier.days && prevStreak < tier.days) crossed = tier;
  }
  return crossed;
}

/** A milestone an activity currently holds (its streak sits at/above a tier). */
export interface HabitMilestone {
  habitId: string;
  habitName: string;
  streakDays: number;
  tier: MilestoneTier;
}

/**
 * Every active activity whose *current* streak meets a milestone tier, best first.
 * Drives a "shareable milestones" gallery; the share card hides the name by default.
 */
export function habitMilestones(habits: Habit[], logs: DayLog[], today: string): HabitMilestone[] {
  const out: HabitMilestone[] = [];
  for (const habit of habits) {
    if (habit.paused) continue;
    const streakDays = currentStreak(habit, logs, today);
    const tier = highestMilestone(streakDays);
    if (tier) out.push({ habitId: habit.id, habitName: habit.name, streakDays, tier });
  }
  return out.sort((a, b) => b.streakDays - a.streakDays);
}
