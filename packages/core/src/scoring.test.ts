import { describe, expect, it } from "vitest";
import {
  categoryScore,
  categorySeries,
  categoryToSlug,
  normalizeWeights,
  slugToCategory,
  weekAverage,
} from "./categories";
import { bumpNumericLogValue, dayScore, habitScore, isRestLog } from "./scoring";
import type { DayLog, Habit } from "./types";

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

const numericHabit: Habit = {
  id: "h3",
  name: "Steps",
  category: "Health",
  type: "numeric",
  min: 0,
  max: 10000,
  step: 500,
};

const habits = [healthCheck, mindCheck, numericHabit];

describe("habitScore", () => {
  it("returns 100 for completed check", () => {
    expect(habitScore(healthCheck, 1)).toBe(100);
  });

  it("returns 0 for unchecked check", () => {
    expect(habitScore(healthCheck, 0)).toBe(0);
  });

  it("returns ~50 for numeric mid range", () => {
    expect(habitScore(numericHabit, 5000)).toBe(50);
  });

  it("excludes rest days", () => {
    expect(habitScore(healthCheck, -1)).toBeNull();
    expect(habitScore(healthCheck, null, true)).toBeNull();
  });

  it("excludes not logged", () => {
    expect(habitScore(healthCheck, null)).toBeNull();
  });
});

describe("bumpNumericLogValue", () => {
  const stepsHabit: Habit = { id: "s1", name: "Steps", category: "Movement", type: "numeric", min: 0, max: 20, step: 5 };

  it("adds fixed step from zero", () => {
    expect(bumpNumericLogValue(null, 1, stepsHabit)).toBe(5);
    expect(bumpNumericLogValue(0, 1, stepsHabit)).toBe(5);
  });

  it("adds fixed step repeatedly", () => {
    expect(bumpNumericLogValue(5, 1, stepsHabit)).toBe(10);
    expect(bumpNumericLogValue(10, 1, stepsHabit)).toBe(15);
  });

  it("subtracts fixed step", () => {
    expect(bumpNumericLogValue(10, -1, stepsHabit)).toBe(5);
  });

  it("clamps to max and min", () => {
    expect(bumpNumericLogValue(18, 1, stepsHabit)).toBe(20);
    expect(bumpNumericLogValue(3, -1, stepsHabit)).toBe(0);
  });

  it("coerces string step from storage", () => {
    const habit = { ...stepsHabit, step: "5" as unknown as number };
    expect(bumpNumericLogValue(0, 1, habit)).toBe(5);
  });
});

describe("dayScore", () => {
  it("averages logged habits", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-04", value: 1 },
      { habitId: "h2", date: "2026-06-04", value: 1 },
    ];
    expect(dayScore(habits, logs, "2026-06-04")).toBe(100);
  });

  it("excludes rest from average", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-04", value: 1 },
      { habitId: "h2", date: "2026-06-04", value: -1, isRest: true },
    ];
    expect(dayScore(habits, logs, "2026-06-04")).toBe(100);
  });
});

describe("categoryScore", () => {
  it("scopes to category", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-04", value: 1 },
      { habitId: "h2", date: "2026-06-04", value: 0 },
      { habitId: "h3", date: "2026-06-04", value: 5000 },
    ];
    const result = categoryScore("Health", habits, logs, "2026-06-04");
    expect(result).toEqual({ kind: "score", value: 75 });
  });

  it("excludes one rest habit from category avg", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-04", value: 1 },
      { habitId: "h3", date: "2026-06-04", value: -1, isRest: true },
    ];
    const result = categoryScore("Health", habits, logs, "2026-06-04");
    expect(result).toEqual({ kind: "score", value: 100 });
  });

  it("returns empty for unknown category", () => {
    expect(categoryScore("Work", habits, [], "2026-06-04")).toEqual({ kind: "empty" });
  });

  it("uses custom weights when provided", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-04", value: 1 },
      { habitId: "h3", date: "2026-06-04", value: 5000 },
    ];
    const weights = { h1: 90, h3: 10 };
    const result = categoryScore("Health", habits, logs, "2026-06-04", weights);
    expect(result).toEqual({ kind: "score", value: 95 });
  });

  it("returns rest when all habits rest", () => {
    const onlyHealth = [healthCheck, numericHabit];
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-04", value: -1, isRest: true },
      { habitId: "h3", date: "2026-06-04", value: -1, isRest: true },
    ];
    expect(categoryScore("Health", onlyHealth, logs, "2026-06-04")).toEqual({ kind: "rest" });
  });
});

describe("categorySeries", () => {
  it("maps dates to scores", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-03", value: 1 },
      { habitId: "h1", date: "2026-06-04", value: 0 },
    ];
    const series = categorySeries("Health", [healthCheck], logs, ["2026-06-03", "2026-06-04"]);
    expect(series).toEqual([100, 0]);
  });
});

describe("category slugs", () => {
  it("converts name to slug", () => {
    expect(categoryToSlug("Health")).toBe("health");
    expect(categoryToSlug("  Morning Sun ")).toBe("morning-sun");
  });

  it("resolves slug to display name", () => {
    expect(slugToCategory("health", ["Health", "Mind"])).toBe("Health");
    expect(slugToCategory("missing", ["Health"])).toBeNull();
  });
});

describe("weekAverage", () => {
  it("averages scorable days only", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-03", value: 1 },
      { habitId: "h1", date: "2026-06-04", value: 0 },
    ];
    const avg = weekAverage("Health", [healthCheck], logs, ["2026-06-03", "2026-06-04"]);
    expect(avg).toBe(50);
  });
});

describe("normalizeWeights", () => {
  it("scales weights to sum to 100", () => {
    const result = normalizeWeights([
      { habitId: "a", weight: 40 },
      { habitId: "b", weight: 40 },
    ]);
    expect(result).toEqual([
      { habitId: "a", weight: 50 },
      { habitId: "b", weight: 50 },
    ]);
  });
});

describe("isRestLog", () => {
  it("detects rest sentinel", () => {
    expect(isRestLog(-1)).toBe(true);
    expect(isRestLog(0, true)).toBe(true);
    expect(isRestLog(1)).toBe(false);
  });
});
