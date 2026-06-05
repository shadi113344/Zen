import { describe, expect, it } from "vitest";
import {
  categoryGoalsProgress,
  categoryGroupScoreNumeric,
  countHabitDaysInWeek,
  goalCumulativeMeta,
  goalConsistencyMeta,
  goalMet,
  goalPeriodDates,
  goalProgress,
  goalsForCategory,
  habitCountsForGoal,
  inferGoalCategory,
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
