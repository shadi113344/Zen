import type { DayLog, Goal, GoalHabitLink, Habit } from "@mottazen/core";
import { addDays, todayKey } from "@mottazen/core";

const today = todayKey();

export const demoHabits: Habit[] = [
  { id: "h1", name: "Creatine", category: "Health", type: "check", color: "#22c55e" },
  { id: "h2", name: "Morning sun", category: "Health", type: "check", color: "#f97316" },
  { id: "h3", name: "Stretch", category: "Health", type: "check", color: "#3b82f6" },
  { id: "h4", name: "Meditate", category: "Mind", type: "check", color: "#a855f7", remindAt: "08:00", notify: { enabled: true, missedAlert: true } },
  { id: "h5", name: "Journal", category: "Mind", type: "check", color: "#ec4899" },
  { id: "h6", name: "Steps", category: "Movement", type: "numeric", min: 0, max: 10000, step: 500, color: "#14b8a6" },
  { id: "h7", name: "Gym", category: "Movement", type: "check", color: "#0d9488" },
  {
    id: "h8",
    name: "Course study",
    category: "Mind",
    type: "numeric",
    min: 0,
    max: 2,
    step: 0.5,
    color: "#7c3aed",
  },
];

export const demoGoals: Goal[] = [
  {
    id: "g-fit",
    name: "Healthy & fit",
    kind: "consistency",
    category: "Movement",
    startDate: addDays(today, -90),
    endDate: addDays(today, 90),
    daysPerWeek: 5,
  },
  {
    id: "g-course",
    name: "Finish UX course",
    kind: "cumulative",
    category: "Mind",
    startDate: addDays(today, -10),
    endDate: addDays(today, 5),
    targetTotal: 10,
    unit: "h",
    planIntervalDays: 2,
    planAmountPerSession: 2,
  },
];

export const demoGoalHabits: GoalHabitLink[] = [
  { goalId: "g-fit", habitId: "h7", weight: 100, required: true },
  { goalId: "g-course", habitId: "h8", weight: 100, required: true },
];

function d(offset: number) {
  return addDays(today, offset);
}

export const demoLogs: DayLog[] = [
  { habitId: "h1", date: d(-6), value: 1 },
  { habitId: "h1", date: d(-5), value: 1 },
  { habitId: "h1", date: d(-4), value: 1 },
  { habitId: "h1", date: d(-3), value: 0 },
  { habitId: "h1", date: d(-2), value: 1 },
  { habitId: "h1", date: d(-1), value: 1 },
  { habitId: "h1", date: d(0), value: 1 },
  { habitId: "h2", date: d(-3), value: 1 },
  { habitId: "h2", date: d(-2), value: 1 },
  { habitId: "h2", date: d(-1), value: 0 },
  { habitId: "h2", date: d(0), value: 1 },
  { habitId: "h3", date: d(-1), value: 1 },
  { habitId: "h3", date: d(0), value: 1 },
  { habitId: "h4", date: d(-2), value: 1 },
  { habitId: "h4", date: d(-1), value: 1 },
  { habitId: "h4", date: d(0), value: 0 },
  { habitId: "h5", date: d(-1), value: 1 },
  { habitId: "h5", date: d(0), value: 1 },
  { habitId: "h6", date: d(-2), value: 6000 },
  { habitId: "h6", date: d(-1), value: 4000 },
  { habitId: "h6", date: d(0), value: 7500 },
  { habitId: "h7", date: d(-6), value: 1 },
  { habitId: "h7", date: d(-5), value: 1 },
  { habitId: "h7", date: d(-4), value: 1 },
  { habitId: "h7", date: d(-3), value: 1 },
  { habitId: "h7", date: d(-2), value: 0 },
  { habitId: "h7", date: d(-1), value: 1 },
  { habitId: "h7", date: d(0), value: 1 },
  { habitId: "h8", date: d(-8), value: 2 },
  { habitId: "h8", date: d(-6), value: 2 },
  { habitId: "h8", date: d(-4), value: 2 },
  { habitId: "h8", date: d(-2), value: 2 },
];

export const demoCategoryWeights: Record<string, import("@mottazen/core").CategoryWeights> = {
  Health: { h1: 40, h2: 35, h3: 25 },
  Mind: { h4: 35, h5: 25, h8: 40 },
  Movement: { h6: 50, h7: 50 },
};

export const demoCategoryColors: Record<string, string> = {
  Health: "#e4ebe6",
  Mind: "#e8e4ed",
  Movement: "#dfe8f0",
};

export const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
