import { describe, expect, it } from "vitest";
import { dayActivityLevel, habitActivityLevel, heatmapWeeksFromDates, radarCategoryScores } from "./insights";
import type { DayLog, Habit } from "./types";

const habit: Habit = { id: "h1", name: "Run", category: "Health", type: "check" };

describe("habitActivityLevel", () => {
  it("returns none when not logged", () => {
    expect(habitActivityLevel(habit, [], "2026-06-04")).toBe("none");
  });

  it("returns rest for rest day", () => {
    const logs: DayLog[] = [{ habitId: "h1", date: "2026-06-04", value: -1, isRest: true }];
    expect(habitActivityLevel(habit, logs, "2026-06-04")).toBe("rest");
  });

  it("returns 3 for completed check", () => {
    const logs: DayLog[] = [{ habitId: "h1", date: "2026-06-04", value: 1 }];
    expect(habitActivityLevel(habit, logs, "2026-06-04")).toBe(3);
  });
});

describe("dayActivityLevel", () => {
  it("returns none with no logs", () => {
    expect(dayActivityLevel([habit], [], "2026-06-04")).toBe("none");
  });
});

describe("heatmapWeeksFromDates", () => {
  it("pads to full weeks and marks in-range days", () => {
    const weeks = heatmapWeeksFromDates(["2026-06-04", "2026-06-05", "2026-06-06"]);
    expect(weeks.length).toBeGreaterThan(0);
    const flat = weeks.flat();
    const inRange = flat.filter((c) => c.inRange);
    expect(inRange.map((c) => c.date)).toEqual(["2026-06-04", "2026-06-05", "2026-06-06"]);
    expect(flat[0]!.inRange).toBe(false);
  });
});

describe("radarCategoryScores", () => {
  it("returns score per category", () => {
    const logs: DayLog[] = [{ habitId: "h1", date: "2026-06-04", value: 1 }];
    const points = radarCategoryScores([habit], logs, ["2026-06-04"]);
    expect(points).toEqual([{ category: "Health", score: 100 }]);
  });
});
