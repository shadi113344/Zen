import { describe, expect, it } from "vitest";
import { buildRecap } from "./recap";
import { lastNDays } from "./streaks";
import type { DayLog, Habit, Task } from "./types";

const read: Habit = { id: "h1", name: "Read", category: "Mind", type: "check" };

// 10-day window. Done days 1,2,3 then a 3-day gap (4,5,6) then 7,8,9,10.
function scenario() {
  const dates = lastNDays("2026-01-10", 10); // 2026-01-01 .. 2026-01-10
  const doneOffsets = [0, 1, 2, 6, 7, 8, 9]; // indices into dates that are completed
  const logs: DayLog[] = doneOffsets.map((i) => ({ habitId: "h1", date: dates[i]!, value: 1 }));
  return { dates, logs };
}

describe("buildRecap", () => {
  it("counts days shown up and total check-ins (rest/empty excluded)", () => {
    const { dates, logs } = scenario();
    const recap = buildRecap([read], logs, dates, "month");
    expect(recap.totalCheckIns).toBe(7);
    expect(recap.daysShowedUp).toBe(7);
    expect(recap.activeActivities).toBe(1);
    expect(recap.startDate).toBe("2026-01-01");
    expect(recap.endDate).toBe("2026-01-10");
  });

  it("reports the best streak with its activity", () => {
    const { dates, logs } = scenario();
    const recap = buildRecap([read], logs, dates, "month");
    expect(recap.bestStreak.value).toBe(4); // the 7..10 run
    expect(recap.bestStreak.habitId).toBe("h1");
    expect(recap.bestStreak.habitName).toBe("Read");
  });

  it("detects the biggest comeback (missed days recovered)", () => {
    const { dates, logs } = scenario();
    const recap = buildRecap([read], logs, dates, "month");
    expect(recap.biggestComeback.value).toBe(3); // gap of days 4,5,6
    expect(recap.biggestComeback.habitId).toBe("h1");
  });

  it("surfaces the top Life Area and a busiest weekday", () => {
    const { dates, logs } = scenario();
    const recap = buildRecap([read], logs, dates, "month");
    expect(recap.topLifeArea?.category).toBe("Mind");
    expect(recap.topLifeArea!.score).toBeGreaterThan(0);
    expect(recap.busiestWeekday).not.toBeNull();
    expect(recap.busiestWeekday!.count).toBeGreaterThanOrEqual(1);
  });

  it("counts completed tasks in the window (titles never exposed)", () => {
    const { dates, logs } = scenario();
    const tasks: Task[] = [
      { id: "t1", title: "secret", done: true, createdAt: "2026-01-01T00:00:00Z", completedDate: "2026-01-05" },
      { id: "t2", title: "secret2", done: true, createdAt: "2026-01-01T00:00:00Z", completedDate: "2025-12-30" },
      { id: "t3", title: "open", done: false, createdAt: "2026-01-01T00:00:00Z" },
    ];
    const recap = buildRecap([read], logs, dates, "month", { tasks });
    expect(recap.tasksCompleted).toBe(1); // only t1 completed inside the window
  });

  it("is empty-safe", () => {
    const recap = buildRecap([], [], [], "year");
    expect(recap.totalCheckIns).toBe(0);
    expect(recap.bestStreak.value).toBe(0);
    expect(recap.topLifeArea).toBeNull();
    expect(recap.busiestWeekday).toBeNull();
  });
});
