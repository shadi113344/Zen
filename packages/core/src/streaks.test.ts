import { describe, expect, it } from "vitest";
import { currentStreak, longestStreak } from "./streaks";
import type { DayLog, Habit } from "./types";

const habit: Habit = { id: "h1", name: "Water", category: "Health", type: "check" };

describe("streak", () => {
  it("counts consecutive done days including today", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-02", value: 1 },
      { habitId: "h1", date: "2026-06-03", value: 1 },
      { habitId: "h1", date: "2026-06-04", value: 1 },
    ];
    expect(currentStreak(habit, logs, "2026-06-04")).toBe(3);
  });

  it("preserves streak when today not done yet", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-02", value: 1 },
      { habitId: "h1", date: "2026-06-03", value: 1 },
    ];
    expect(currentStreak(habit, logs, "2026-06-04")).toBe(2);
  });

  it("rest preserves streak", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-03", value: 1 },
      { habitId: "h1", date: "2026-06-04", value: -1, isRest: true },
    ];
    expect(currentStreak(habit, logs, "2026-06-04")).toBe(2);
  });

  it("longest streak across gap", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-01", value: 1 },
      { habitId: "h1", date: "2026-06-02", value: 1 },
      { habitId: "h1", date: "2026-06-04", value: 1 },
    ];
    expect(longestStreak(habit, logs, "2026-06-04")).toBe(2);
  });
});
