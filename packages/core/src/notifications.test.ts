import { describe, expect, it } from "vitest";
import {
  checkMotivationOnLog,
  checkNotificationReminders,
  defaultNotificationSettings,
  isInQuietHours,
  parseNotificationSettings,
} from "./notifications";
import type { DayLog, Habit } from "./types";

const habit: Habit = {
  id: "h1",
  name: "Meditate",
  category: "Mind",
  type: "check",
  remindAt: "08:00",
};

describe("isInQuietHours", () => {
  it("handles same-day quiet window", () => {
    expect(isInQuietHours("23:00", { start: "22:00", end: "07:00" })).toBe(true);
    expect(isInQuietHours("12:00", { start: "22:00", end: "07:00" })).toBe(false);
  });

  it("handles overnight quiet window", () => {
    expect(isInQuietHours("06:30", { start: "22:00", end: "07:00" })).toBe(true);
    expect(isInQuietHours("08:00", { start: "22:00", end: "07:00" })).toBe(false);
  });
});

describe("parseNotificationSettings", () => {
  it("merges legacy dailyTime", () => {
    const settings = parseNotificationSettings({ enabled: true, dailyTime: "19:30" });
    expect(settings.enabled).toBe(true);
    expect(settings.dailyCheckIn.time).toBe("19:30");
  });
});

describe("checkNotificationReminders", () => {
  const settings = {
    ...defaultNotificationSettings(),
    enabled: true,
    vacationMode: false,
    quietHours: { start: "22:00", end: "07:00" },
    maxPerDay: 10,
  };

  it("fires habit reminder at scheduled time", () => {
    const now = new Date("2026-06-04T08:00:00Z");
    const messages = checkNotificationReminders({
      now,
      timezone: "UTC",
      settings,
      habits: [habit],
      logs: [],
      sentTagsToday: new Set(),
    });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.tag).toContain("habit:h1");
  });

  it("suppresses during vacation mode", () => {
    const now = new Date("2026-06-04T08:00:00Z");
    const messages = checkNotificationReminders({
      now,
      timezone: "UTC",
      settings: { ...settings, vacationMode: true },
      habits: [habit],
      logs: [],
      sentTagsToday: new Set(),
    });
    expect(messages).toHaveLength(0);
  });

  it("respects max per day cap", () => {
    const now = new Date("2026-06-04T08:00:00Z");
    const sent = new Set(["a", "b", "c", "d", "e"]);
    const messages = checkNotificationReminders({
      now,
      timezone: "UTC",
      settings: { ...settings, maxPerDay: 5 },
      habits: [habit],
      logs: [],
      sentTagsToday: sent,
    });
    expect(messages).toHaveLength(0);
  });
});

describe("checkMotivationOnLog", () => {
  it("returns encouragement after a successful log", () => {
    const settings = { ...defaultNotificationSettings(), enabled: true, motivation: { enabled: true } };
    const msg = checkMotivationOnLog(habit, 1, false, settings, "12:00");
    expect(msg?.title).toBeTruthy();
  });

  it("skips failed check logs", () => {
    const settings = { ...defaultNotificationSettings(), enabled: true, motivation: { enabled: true } };
    expect(checkMotivationOnLog(habit, 0, false, settings, "12:00")).toBeNull();
  });
});
