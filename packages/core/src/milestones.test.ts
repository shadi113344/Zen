import { describe, expect, it } from "vitest";
import { habitMilestones, highestMilestone, milestoneJustReached } from "./milestones";
import { addDays, todayKey } from "./streaks";
import type { DayLog, Habit } from "./types";

const check: Habit = { id: "h1", name: "Read", category: "Mind", type: "check" };

describe("highestMilestone", () => {
  it("returns null below the first tier", () => {
    expect(highestMilestone(0)).toBeNull();
    expect(highestMilestone(9)).toBeNull();
  });
  it("returns the highest tier at or below the streak", () => {
    expect(highestMilestone(10)?.days).toBe(10);
    expect(highestMilestone(29)?.days).toBe(10);
    expect(highestMilestone(30)?.days).toBe(30);
    expect(highestMilestone(100)?.days).toBe(100);
    expect(highestMilestone(400)?.days).toBe(365);
  });
});

describe("milestoneJustReached", () => {
  it("fires only on the exact crossing", () => {
    expect(milestoneJustReached(29, 30)?.days).toBe(30);
    expect(milestoneJustReached(30, 31)).toBeNull();
    expect(milestoneJustReached(9, 11)?.days).toBe(10);
    expect(milestoneJustReached(99, 100)?.days).toBe(100);
  });
  it("returns the highest tier when several are crossed at once", () => {
    expect(milestoneJustReached(29, 100)?.days).toBe(100);
  });
  it("returns null when the streak did not grow", () => {
    expect(milestoneJustReached(30, 5)).toBeNull();
    expect(milestoneJustReached(30, 30)).toBeNull();
  });
});

describe("habitMilestones", () => {
  it("reports activities whose current streak meets a tier", () => {
    const today = todayKey();
    const logs: DayLog[] = [];
    for (let i = 0; i < 30; i++) logs.push({ habitId: "h1", date: addDays(today, -i), value: 1 });
    const result = habitMilestones([check], logs, today);
    expect(result).toHaveLength(1);
    expect(result[0]!.tier.days).toBe(30);
    expect(result[0]!.streakDays).toBe(30);
  });

  it("excludes activities below the first tier and paused ones", () => {
    const today = todayKey();
    const logs: DayLog[] = [{ habitId: "h1", date: today, value: 1 }];
    expect(habitMilestones([check], logs, today)).toHaveLength(0);
    const paused: Habit = { ...check, paused: true };
    const longLogs: DayLog[] = [];
    for (let i = 0; i < 30; i++) longLogs.push({ habitId: "h1", date: addDays(today, -i), value: 1 });
    expect(habitMilestones([paused], longLogs, today)).toHaveLength(0);
  });
});
