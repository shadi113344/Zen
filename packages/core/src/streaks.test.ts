import { describe, expect, it } from "vitest";
import {
  currentStreak,
  hasVisibleStreak,
  isHabitDone,
  longestStreak,
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
