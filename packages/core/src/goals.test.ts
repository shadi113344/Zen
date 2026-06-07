import { describe, expect, it } from "vitest";
import {
  categoryGoalsProgress,
  categoryGroupScoreNumeric,
  countHabitDaysInPeriod,
  countHabitDaysInWeek,
  goalCumulativeMeta,
  goalConsistencyMeta,
  goalMet,
  goalPeriodDates,
  goalProgress,
  goalsForCategory,
  habitCountsForGoal,
  inferGoalCategory,
  monthRangeContaining,
  resolveGoalCadence,
} from "./goals";
import type { DayLog, Goal, GoalHabitLink, Habit } from "./types";

const h1: Habit = { id: "a", name: "A", category: "Health", type: "check" };
const h2: Habit = { id: "b", name: "B", category: "Health", type: "check" };
const habits = [h1, h2];

const legacyGoal: Goal = {
  id: "g1",
  name: "Stack",
  kind: "legacy",
  startDate: "2020-01-01",
  endDate: "2099-12-31",
  period: "daily",
  targetPercent: 80,
};

const links: GoalHabitLink[] = [
  { goalId: "g1", habitId: "a", weight: 50, required: false },
  { goalId: "g1", habitId: "b", weight: 50, required: false },
];

describe("goalProgress legacy", () => {
  it("blends 50/50 two completed habits", () => {
    const logs: DayLog[] = [
      { habitId: "a", date: "2026-06-04", value: 1 },
      { habitId: "b", date: "2026-06-04", value: 1 },
    ];
    expect(goalProgress(legacyGoal, links, habits, logs, "2026-06-04")).toBe(100);
  });

  it("returns 50 when one habit missed", () => {
    const logs: DayLog[] = [
      { habitId: "a", date: "2026-06-04", value: 1 },
      { habitId: "b", date: "2026-06-04", value: 0 },
    ];
    expect(goalProgress(legacyGoal, links, habits, logs, "2026-06-04")).toBe(50);
  });

  it("goalMet respects target", () => {
    const logs: DayLog[] = [
      { habitId: "a", date: "2026-06-04", value: 1 },
      { habitId: "b", date: "2026-06-04", value: 0 },
    ];
    expect(goalMet(legacyGoal, links, habits, logs, "2026-06-04")).toBe(false);
  });
});

describe("goalPeriodDates", () => {
  it("daily is one day", () => {
    expect(goalPeriodDates("daily", "2026-06-04")).toEqual(["2026-06-04"]);
  });

  it("weekly is seven days", () => {
    expect(goalPeriodDates("weekly", "2026-06-04")).toHaveLength(7);
  });
});

describe("consistency goals", () => {
  const gym: Habit = { id: "gym", name: "Gym", category: "Movement", type: "check" };
  const goal: Goal = {
    id: "fit",
    name: "Healthy & fit",
    kind: "consistency",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    daysPerWeek: 5,
  };
  const goalLinks: GoalHabitLink[] = [{ goalId: "fit", habitId: "gym", weight: 100, required: true }];

  it("counts gym days in week", () => {
    const logs: DayLog[] = [
      { habitId: "gym", date: "2026-06-02", value: 1 },
      { habitId: "gym", date: "2026-06-03", value: 1 },
      { habitId: "gym", date: "2026-06-04", value: 1 },
      { habitId: "gym", date: "2026-06-05", value: 0 },
    ];
    expect(countHabitDaysInWeek("gym", [gym], logs, "2026-06-07")).toBe(3);
    expect(habitCountsForGoal(gym, logs, "2026-06-02")).toBe(true);
  });

  it("tracks week meta for habit", () => {
    const logs: DayLog[] = ["2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06"].map(
      (date, i) => ({ habitId: "gym", date, value: i < 4 ? 1 : 0 }),
    );
    const meta = goalConsistencyMeta(goal, goalLinks, [gym], logs, "2026-06-06");
    expect(meta.week.done).toBe(4);
    expect(meta.week.target).toBe(5);
  });
});

describe("cadence resolution", () => {
  it("falls back to legacy daysPerWeek as a weekly cadence", () => {
    expect(resolveGoalCadence({ id: "g", name: "G", kind: "consistency", startDate: "2026-06-01", endDate: "2026-08-31", daysPerWeek: 3 })).toEqual({ count: 3, period: "week" });
  });
  it("defaults to 5/week when nothing is set", () => {
    expect(resolveGoalCadence({ id: "g", name: "G", kind: "consistency", startDate: "2026-06-01", endDate: "2026-08-31" })).toEqual({ count: 5, period: "week" });
  });
  it("prefers an explicit cadence over daysPerWeek", () => {
    expect(resolveGoalCadence({ id: "g", name: "G", kind: "consistency", startDate: "x", endDate: "y", daysPerWeek: 5, cadence: { count: 2, period: "month" } })).toEqual({ count: 2, period: "month" });
  });
  it("computes a calendar month range", () => {
    expect(monthRangeContaining("2026-02-14")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(monthRangeContaining("2026-06-30")).toEqual({ start: "2026-06-01", end: "2026-06-30" });
  });
});

describe("monthly cadence consistency", () => {
  const gym: Habit = { id: "gym", name: "Gym", category: "Movement", type: "check" };
  const goal: Goal = {
    id: "fit-m",
    name: "Run monthly",
    kind: "consistency",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    cadence: { count: 2, period: "month" },
  };
  const goalLinks: GoalHabitLink[] = [{ goalId: "fit-m", habitId: "gym", weight: 100, required: true }];
  // June hits 2; July only 1 (as of mid-July)
  const logs: DayLog[] = [
    { habitId: "gym", date: "2026-06-05", value: 1 },
    { habitId: "gym", date: "2026-06-10", value: 1 },
    { habitId: "gym", date: "2026-07-03", value: 1 },
  ];

  it("counts qualifying days across the whole month", () => {
    expect(countHabitDaysInPeriod("gym", [gym], logs, "2026-06-20", "month")).toBe(2);
    expect(countHabitDaysInPeriod("gym", [gym], logs, "2026-07-31", "month")).toBe(1);
  });

  it("counts a month met only when count is reached", () => {
    const meta = goalConsistencyMeta(goal, goalLinks, [gym], logs, "2026-07-15");
    expect(meta.period).toBe("month");
    expect(meta.week.done).toBe(1); // current month (July) so far
    expect(meta.week.target).toBe(2);
    expect(meta.weeksMet).toBe(1); // only June met
    expect(meta.weeksTotal).toBe(3); // Jun, Jul, Aug
  });
});

describe("weekly cadence equals legacy daysPerWeek", () => {
  const gym: Habit = { id: "gym", name: "Gym", category: "Movement", type: "check" };
  const base = { id: "fit", name: "Fit", kind: "consistency" as const, startDate: "2026-06-01", endDate: "2026-08-31" };
  const links: GoalHabitLink[] = [{ goalId: "fit", habitId: "gym", weight: 100, required: true }];
  const logs: DayLog[] = ["2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05", "2026-06-06"].map((date, i) => ({
    habitId: "gym",
    date,
    value: i < 4 ? 1 : 0,
  }));

  it("matches daysPerWeek:5 with cadence {5, week}", () => {
    const legacy = goalConsistencyMeta({ ...base, daysPerWeek: 5 }, links, [gym], logs, "2026-06-06");
    const explicit = goalConsistencyMeta({ ...base, cadence: { count: 5, period: "week" } }, links, [gym], logs, "2026-06-06");
    expect(explicit.week).toEqual(legacy.week);
    expect(explicit.weeksMet).toBe(legacy.weeksMet);
    expect(explicit.weeksTotal).toBe(legacy.weeksTotal);
    expect(legacy.period).toBe("week");
  });
});

describe("category groups", () => {
  const gym: Habit = { id: "gym", name: "Gym", category: "Movement", type: "check" };
  const stretch: Habit = { id: "stretch", name: "Stretch", category: "Movement", type: "check" };
  const goal: Goal = {
    id: "fit",
    name: "Healthy & fit",
    kind: "consistency",
    category: "Movement",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    daysPerWeek: 5,
  };
  const links = [{ goalId: "fit", habitId: "gym", weight: 100, required: true }];

  it("infers category from linked habits", () => {
    expect(inferGoalCategory([gym, stretch], ["gym", "stretch"])).toBe("Movement");
  });

  it("finds goals by category field or linked habits", () => {
    expect(goalsForCategory([goal], links, [gym], "Movement")).toHaveLength(1);
    expect(goalsForCategory([{ ...goal, category: undefined }], links, [gym], "Movement")).toHaveLength(1);
    expect(goalsForCategory([goal], links, [gym], "Mind")).toHaveLength(0);
  });

  it("blends habit and goal progress for category group score", () => {
    const logs: DayLog[] = [{ habitId: "gym", date: "2026-06-04", value: 1 }];
    const goalPct = categoryGoalsProgress("Movement", [goal], links, [gym], logs, "2026-06-04");
    expect(goalPct).not.toBeNull();
    const blended = categoryGroupScoreNumeric("Movement", [gym], logs, "2026-06-04", [goal], links);
    expect(blended).toBeGreaterThan(0);
  });
});

describe("cumulative goals", () => {
  const study: Habit = {
    id: "course",
    name: "Course study",
    category: "Mind",
    type: "numeric",
    min: 0,
    max: 2,
    step: 0.5,
  };
  const goal: Goal = {
    id: "course-goal",
    name: "Finish UX course",
    kind: "cumulative",
    startDate: "2026-06-01",
    endDate: "2026-06-15",
    targetTotal: 10,
    unit: "h",
  };
  const goalLinks: GoalHabitLink[] = [{ goalId: "course-goal", habitId: "course", weight: 100, required: true }];

  it("sums logged hours", () => {
    const logs: DayLog[] = [
      { habitId: "course", date: "2026-06-02", value: 2 },
      { habitId: "course", date: "2026-06-04", value: 2 },
      { habitId: "course", date: "2026-06-06", value: 1 },
    ];
    const meta = goalCumulativeMeta(goal, goalLinks, [study], logs, "2026-06-06");
    expect(meta.logged).toBe(5);
    expect(meta.progressPct).toBe(50);
  });
});
