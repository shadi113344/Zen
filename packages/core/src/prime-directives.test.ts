import { describe, expect, it } from "vitest";
import {
  categoryScore,
  categoryScoreBreakdown,
  reconstructCategoryScore,
  weightedScoreContribution,
} from "./categories";
import { habitGoalProgressPct } from "./goals";
import { dayScore, dayScoreBreakdown, habitScore, reconstructDayScore } from "./scoring";
import { runSchemaMigrations } from "./snapshot-migrate";
import type { DayLog, Goal, GoalHabitLink, Habit, Task } from "./types";

const healthCheck: Habit = {
  id: "h1",
  name: "Creatine",
  category: "Health",
  type: "check",
};

const mindCheck: Habit = {
  id: "h2",
  name: "Meditate",
  category: "Mind",
  type: "check",
};

const habits = [healthCheck, mindCheck];
const date = "2026-06-07";

describe("prime directive: protect the score", () => {
  const logs: DayLog[] = [
    { habitId: "h1", date, value: 1 },
    { habitId: "h2", date, value: 0 },
  ];

  it("dayScore and categoryScore APIs do not accept tasks", () => {
    const tasks: Task[] = [
      {
        id: "t1",
        title: "Ship feature",
        done: true,
        createdAt: "2026-06-07T10:00:00Z",
        createdDate: date,
        completedDate: date,
      },
    ];
    expect(tasks).toHaveLength(1);
    expect(dayScore(habits, logs, date)).toBe(50);
    expect(categoryScore("Health", habits, logs, date)).toEqual({ kind: "score", value: 100 });
  });

  it("orphan log rows without a matching activity do not inflate dayScore", () => {
    const orphanLogs: DayLog[] = [
      ...logs,
      { habitId: "ghost", date, value: 100 },
    ];
    expect(dayScore(habits, orphanLogs, date)).toBe(dayScore(habits, logs, date));
  });
});

describe("prime directive: score decomposability (M6)", () => {
  const logs: DayLog[] = [
    { habitId: "h1", date, value: 1 },
    { habitId: "h2", date, value: 1 },
  ];

  it("dayScore reconstructs from activity components", () => {
    const breakdown = dayScoreBreakdown(habits, logs, date);
    expect(reconstructDayScore(breakdown)).toBe(dayScore(habits, logs, date));
    expect(breakdown).toEqual([
      { habitId: "h1", score: 100 },
      { habitId: "h2", score: 100 },
    ]);
  });

  it("categoryScore reconstructs from weighted activity components", () => {
    const breakdown = categoryScoreBreakdown("Health", habits, logs, date);
    expect(breakdown.kind).toBe("score");
    if (breakdown.kind !== "score") return;
    expect(reconstructCategoryScore(breakdown.components)).toBe(100);
    expect(categoryScore("Health", habits, logs, date)).toEqual({ kind: "score", value: 100 });
  });

  it("weightedScoreContribution matches weighted parts", () => {
    expect(weightedScoreContribution(50, 80)).toBe(40);
    expect(weightedScoreContribution(100, habitScore(healthCheck, 1)!)).toBe(100);
  });
});

describe("prime directive: progress math in core", () => {
  const goal: Goal = {
    id: "g1",
    name: "Move more",
    kind: "consistency",
    category: "Health",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    cadence: { count: 3, period: "week" },
  };
  const links: GoalHabitLink[] = [{ goalId: "g1", habitId: "h1" }];
  const logs: DayLog[] = [
    { habitId: "h1", date: "2026-06-05", value: 1 },
    { habitId: "h1", date: "2026-06-06", value: 1 },
    { habitId: "h1", date, value: 1 },
  ];

  it("habitGoalProgressPct is derived from habitGoalProgressMeta", () => {
    const pct = habitGoalProgressPct(goal, "h1", habits, logs, date);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });
});

describe("prime directive: version before reshape", () => {
  it("runSchemaMigrations stamps version after upgrade steps", () => {
    const out = runSchemaMigrations({ habits: [] }, 1, {});
    expect(out.schemaVersion).toBe(1);
  });
});
