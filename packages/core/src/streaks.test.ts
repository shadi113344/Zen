import { describe, expect, it } from "vitest";
import {
  addMonths,
  currentStreak,
  detectComeback,
  hasVisibleStreak,
  isHabitDone,
  longestStreak,
  mondayIndex,
  monthGridDates,
  streakEmojiChar,
  streakEmojiTier,
  visibleStreak,
} from "./streaks";
import { isNumericStreakDay } from "./scoring";
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

const prayerAny: Habit = {
  ...prayer,
  progressScoring: "any",
};

describe("numeric streak rules", () => {
  it("scale: only max value counts", () => {
    expect(isNumericStreakDay(prayer, 5)).toBe(true);
    expect(isNumericStreakDay(prayer, 4)).toBe(false);
    expect(isNumericStreakDay(prayer, 1)).toBe(false);
    expect(isHabitDone(prayer, 3)).toBe(false);
    expect(isHabitDone(prayer, 5)).toBe(true);
  });

  it("any: any partial value counts", () => {
    expect(isNumericStreakDay(prayerAny, 1)).toBe(true);
    expect(isNumericStreakDay(prayerAny, 3)).toBe(true);
    expect(isNumericStreakDay(prayerAny, 0)).toBe(false);
    expect(isHabitDone(prayerAny, 2)).toBe(true);
    expect(isHabitDone(prayerAny, 0)).toBe(false);
  });
});

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

  it("scale: partial days break the streak", () => {
    const logs: DayLog[] = [
      { habitId: "h2", date: "2026-06-02", value: 5 },
      { habitId: "h2", date: "2026-06-03", value: 3 },
      { habitId: "h2", date: "2026-06-04", value: 5 },
    ];
    expect(currentStreak(prayer, logs, "2026-06-04")).toBe(1);
  });

  it("scale: only consecutive max days extend the streak", () => {
    const logs: DayLog[] = [
      { habitId: "h2", date: "2026-06-02", value: 2 },
      { habitId: "h2", date: "2026-06-03", value: 4 },
      { habitId: "h2", date: "2026-06-04", value: 5 },
    ];
    expect(currentStreak(prayer, logs, "2026-06-04")).toBe(1);
  });

  it("any: partial values on consecutive days build the streak", () => {
    const logs: DayLog[] = [
      { habitId: "h2", date: "2026-06-02", value: 1 },
      { habitId: "h2", date: "2026-06-03", value: 3 },
      { habitId: "h2", date: "2026-06-04", value: 2 },
    ];
    expect(currentStreak(prayerAny, logs, "2026-06-04")).toBe(3);
  });
});

describe("detectComeback", () => {
  it("flags a return after a real gap and reports gap + prior streak", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-10", value: 1 },
      { habitId: "h1", date: "2026-06-11", value: 1 },
      { habitId: "h1", date: "2026-06-12", value: 1 },
      // 06-13 .. 06-19 missed
      { habitId: "h1", date: "2026-06-20", value: 1 },
    ];
    const r = detectComeback(habit, logs, "2026-06-20");
    expect(r.isComeback).toBe(true);
    expect(r.gapDays).toBe(7);
    expect(r.priorBest).toBe(3);
  });

  it("is not a comeback when the streak is ongoing", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-19", value: 1 },
      { habitId: "h1", date: "2026-06-20", value: 1 },
    ];
    expect(detectComeback(habit, logs, "2026-06-20").isComeback).toBe(false);
  });

  it("is not a comeback for a single missed day", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-18", value: 1 },
      // 06-19 missed
      { habitId: "h1", date: "2026-06-20", value: 1 },
    ];
    const r = detectComeback(habit, logs, "2026-06-20");
    expect(r.isComeback).toBe(false);
    expect(r.gapDays).toBe(1);
  });

  it("is not a comeback on a first-ever check-in", () => {
    const logs: DayLog[] = [{ habitId: "h1", date: "2026-06-20", value: 1 }];
    expect(detectComeback(habit, logs, "2026-06-20").isComeback).toBe(false);
  });

  it("is not a comeback when today is not done", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-10", value: 1 },
      { habitId: "h1", date: "2026-06-20", value: 0 },
    ];
    expect(detectComeback(habit, logs, "2026-06-20").isComeback).toBe(false);
  });

  it("treats a rest day before today as not breaking (no comeback)", () => {
    const logs: DayLog[] = [
      { habitId: "h1", date: "2026-06-18", value: 1 },
      { habitId: "h1", date: "2026-06-19", value: -1, isRest: true },
      { habitId: "h1", date: "2026-06-20", value: 1 },
    ];
    expect(detectComeback(habit, logs, "2026-06-20").isComeback).toBe(false);
  });
});

describe("visibleStreak", () => {
  it("hides streak UI until day 2", () => {
    expect(hasVisibleStreak(0)).toBe(false);
    expect(hasVisibleStreak(1)).toBe(false);
    expect(hasVisibleStreak(2)).toBe(true);
    expect(visibleStreak(1)).toBe(0);
    expect(visibleStreak(2)).toBe(2);
  });
});

describe("streakEmojiTier", () => {
  it("returns null before streak is visible", () => {
    expect(streakEmojiTier(0)).toBeNull();
    expect(streakEmojiTier(1)).toBeNull();
    expect(streakEmojiChar(1)).toBe("");
  });

  it("upgrades emoji by streak length", () => {
    expect(streakEmojiTier(2)?.codepoint).toBe("1f44f");
    expect(streakEmojiTier(3)?.emoji).toBe("👏");
    expect(streakEmojiTier(4)?.codepoint).toBe("1f525");
    expect(streakEmojiTier(9)?.emoji).toBe("🔥");
    expect(streakEmojiTier(10)?.codepoint).toBe("1f4aa");
    expect(streakEmojiTier(29)?.emoji).toBe("💪");
    expect(streakEmojiTier(30)?.codepoint).toBe("1f3c6");
    expect(streakEmojiChar(42)).toBe("🏆");
  });
});

describe("mondayIndex", () => {
  it("maps Monday to 0 and Sunday to 6", () => {
    expect(mondayIndex("2026-06-01")).toBe(0); // Monday
    expect(mondayIndex("2026-06-06")).toBe(5); // Saturday
    expect(mondayIndex("2026-06-07")).toBe(6); // Sunday
  });
});

describe("addMonths", () => {
  it("returns the first of the target month", () => {
    expect(addMonths("2026-06-15", 0)).toBe("2026-06-01");
    expect(addMonths("2026-06-15", 1)).toBe("2026-07-01");
    expect(addMonths("2026-01-31", -1)).toBe("2025-12-01");
    expect(addMonths("2026-12-10", 1)).toBe("2027-01-01");
  });
});

describe("monthGridDates", () => {
  it("pads to full Monday-start weeks around the month", () => {
    const grid = monthGridDates("2026-06-10"); // June 2026: 1st is Monday, 30th is Tuesday
    expect(grid.length % 7).toBe(0);
    expect(grid[0]!.date).toBe("2026-06-01"); // no leading pad — June starts on Monday
    expect(grid[0]!.inMonth).toBe(true);
    expect(grid.at(-1)!.date).toBe("2026-07-05"); // trailing pad to finish the week
    expect(grid.at(-1)!.inMonth).toBe(false);
    expect(grid.filter((d) => d.inMonth)).toHaveLength(30);
  });

  it("adds leading padding when the month starts mid-week", () => {
    const grid = monthGridDates("2026-05-15"); // May 2026: 1st is Friday
    expect(grid[0]!.date).toBe("2026-04-27"); // Monday before May 1
    expect(grid[0]!.inMonth).toBe(false);
    expect(grid.some((d) => d.date === "2026-05-01" && d.inMonth)).toBe(true);
  });
});
