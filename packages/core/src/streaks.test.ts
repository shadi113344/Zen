import { describe, expect, it } from "vitest";
import { currentStreak, longestStreak } from "./streaks";
import type { DayLog, Habit } from "./types";

const habit: Habit = { id: "h1", name: "Water", category: "Health", type: "check" };

const prayer: Habit = {
  id: "h2",
  name: "Prayer",
  category: "Spirituality",
  type: "numeric",
  min: 0,
  max: 5,
  step: 1,
};

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

  it("numeric habit streak requires max value", () => {
    const logs: DayLog[] = [
      { habitId: "h2", date: "2026-06-02", value: 5 },
      { habitId: "h2", date: "2026-06-03", value: 3 },
      { habitId: "h2", date: "2026-06-04", value: 5 },
    ];
    expect(currentStreak(prayer, logs, "2026-06-04")).toBe(1);
  });

  it("numeric partial progress on prior days does not extend streak", () => {
    const logs: DayLog[] = [
      { habitId: "h2", date: "2026-06-02", value: 2 },
      { habitId: "h2", date: "2026-06-03", value: 4 },
      { habitId: "h2", date: "2026-06-04", value: 5 },
    ];
    expect(currentStreak(prayer, logs, "2026-06-04")).toBe(1);
  });
});
