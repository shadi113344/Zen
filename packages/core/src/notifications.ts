import { addDays } from "./streaks";
import { dayScore, habitScore, logValueForHabit } from "./scoring";
import type { DayLog, Habit, HabitNotifySettings, NotificationSettings } from "./types";

export interface CoachMessage {
  title: string;
  body: string;
  tag: string;
}

export interface ReminderCheckInput {
  now: Date;
  timezone: string;
  settings: NotificationSettings;
  habits: Habit[];
  logs: DayLog[];
  sentTagsToday: Set<string>;
}

export function defaultNotificationSettings(): NotificationSettings {
  return {
    enabled: false,
    quietHours: { start: "22:00", end: "07:00" },
    maxPerDay: 5,
    tone: "gentle",
    vacationMode: false,
    dailyCheckIn: { enabled: true, time: "20:00" },
    smartMissed: { enabled: true, delayMinutes: 60 },
    motivation: { enabled: true },
    recovery: { enabled: true },
    lowScore: { enabled: true, threshold: 40 },
    reflection: { enabled: false, time: "21:30" },
    categoryRules: [],
  };
}

/** Merge saved prefs with defaults; supports legacy `{ enabled, dailyTime }` shape. */
export function parseNotificationSettings(raw: unknown): NotificationSettings {
  const base = defaultNotificationSettings();
  if (!raw || typeof raw !== "object") return base;

  const obj = raw as Record<string, unknown>;
  const nested =
    obj.settings && typeof obj.settings === "object"
      ? (obj.settings as Record<string, unknown>)
      : obj;

  const quiet =
    nested.quietHours && typeof nested.quietHours === "object"
      ? (nested.quietHours as { start?: string; end?: string })
      : null;

  const daily =
    nested.dailyCheckIn && typeof nested.dailyCheckIn === "object"
      ? (nested.dailyCheckIn as { enabled?: boolean; time?: string })
      : null;

  const smart =
    nested.smartMissed && typeof nested.smartMissed === "object"
      ? (nested.smartMissed as { enabled?: boolean; delayMinutes?: number })
      : null;

  const low =
    nested.lowScore && typeof nested.lowScore === "object"
      ? (nested.lowScore as { enabled?: boolean; threshold?: number })
      : null;

  const reflection =
    nested.reflection && typeof nested.reflection === "object"
      ? (nested.reflection as { enabled?: boolean; time?: string })
      : null;

  const legacyDailyTime = typeof obj.dailyTime === "string" ? obj.dailyTime : undefined;

  return {
    enabled: typeof nested.enabled === "boolean" ? nested.enabled : typeof obj.enabled === "boolean" ? obj.enabled : base.enabled,
    quietHours: {
      start: quiet?.start ?? base.quietHours.start,
      end: quiet?.end ?? base.quietHours.end,
    },
    maxPerDay: typeof nested.maxPerDay === "number" ? nested.maxPerDay : base.maxPerDay,
    tone: nested.tone === "direct" ? "direct" : "gentle",
    vacationMode: !!nested.vacationMode,
    dailyCheckIn: {
      enabled: daily?.enabled ?? base.dailyCheckIn.enabled,
      time: daily?.time ?? legacyDailyTime ?? base.dailyCheckIn.time,
    },
    smartMissed: {
      enabled: smart?.enabled ?? base.smartMissed.enabled,
      delayMinutes: smart?.delayMinutes ?? base.smartMissed.delayMinutes,
    },
    motivation: {
      enabled:
        nested.motivation && typeof nested.motivation === "object"
          ? !!(nested.motivation as { enabled?: boolean }).enabled
          : base.motivation.enabled,
    },
    recovery: {
      enabled:
        nested.recovery && typeof nested.recovery === "object"
          ? !!(nested.recovery as { enabled?: boolean }).enabled
          : base.recovery.enabled,
    },
    lowScore: {
      enabled: low?.enabled ?? base.lowScore.enabled,
      threshold: low?.threshold ?? base.lowScore.threshold,
    },
    reflection: {
      enabled: reflection?.enabled ?? base.reflection.enabled,
      time: reflection?.time ?? base.reflection.time,
    },
    categoryRules: Array.isArray(nested.categoryRules)
      ? nested.categoryRules.map((r) => {
          const rule = r as { category?: string; enabled?: boolean; time?: string };
          return {
            category: rule.category ?? "",
            enabled: !!rule.enabled,
            time: rule.time,
          };
        })
      : [],
  };
}

/** Shape stored in Supabase — includes legacy `dailyTime` for edge functions. */
export function serializeNotificationSettings(settings: NotificationSettings): Record<string, unknown> {
  return {
    ...settings,
    dailyTime: settings.dailyCheckIn.time,
  };
}

export function localDateKey(now: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function localTimeHM(now: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function localWeekday(now: Date, timezone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(now);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

export function parseHM(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function isInQuietHours(hm: string, quiet: { start: string; end: string }): boolean {
  const now = parseHM(hm);
  const start = parseHM(quiet.start);
  const end = parseHM(quiet.end);
  if (start === end) return false;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}

export function isHabitDueToday(habit: Habit, logs: DayLog[], date: string): boolean {
  if (habit.paused) return false;
  const value = logValueForHabit(logs, habit.id, date);
  const row = logs.find((l) => l.habitId === habit.id && l.date === date);
  if (row?.isRest || value === -1) return false;
  if (value === null) return true;
  if (habit.type === "check") return value <= 0;
  return Number(value) <= 0;
}

export function habitReminderTimes(habit: Habit): string[] {
  const notify = habit.notify ?? {};
  const times = new Set<string>();
  if (habit.remindAt) times.add(habit.remindAt.slice(0, 5));
  if (notify.remindAt) times.add(notify.remindAt.slice(0, 5));
  for (const t of notify.times ?? []) times.add(t.slice(0, 5));
  return [...times];
}

export function isNotifyDayActive(weekday: number, days?: number[]): boolean {
  if (!days?.length) return true;
  return days.includes(weekday);
}

function canSend(
  settings: NotificationSettings,
  hm: string,
  sentTagsToday: Set<string>,
  tag: string,
): boolean {
  if (!settings.enabled || settings.vacationMode) return false;
  if (isInQuietHours(hm, settings.quietHours)) return false;
  if (sentTagsToday.has(tag)) return false;
  if (sentTagsToday.size >= settings.maxPerDay) return false;
  return true;
}

export function coachCopy(
  tone: NotificationSettings["tone"],
  kind: string,
  ctx: { habitName?: string; count?: number; score?: number },
): { title: string; body: string } {
  const gentle = tone === "gentle";
  switch (kind) {
    case "habit-reminder":
      return gentle
        ? { title: `Time for ${ctx.habitName}`, body: "A small step counts. Log when you're ready." }
        : { title: `${ctx.habitName} — now`, body: "Log it while it's on your mind." };
    case "daily-checkin":
      return gentle
        ? {
            title: ctx.count === 1 ? "1 habit left today" : `${ctx.count} habits left today`,
            body: "You're close — finish strong when you can.",
          }
        : {
            title: ctx.count === 1 ? "1 habit still open" : `${ctx.count} habits still open`,
            body: "Check your list and log what's done.",
          };
    case "smart-missed":
      return gentle
        ? { title: `Still time for ${ctx.habitName}`, body: "No pressure — log it if you still plan to." }
        : { title: `${ctx.habitName} not logged yet`, body: "Mark it done or skip for today." };
    case "reflection":
      return gentle
        ? { title: "Evening reflection", body: "How did today feel? Add a note on Today if you like." }
        : { title: "End-of-day check", body: "Review Today and close anything still open." };
    case "low-score":
      return gentle
        ? { title: "Gentle nudge", body: `Today is at ${ctx.score}% — one log can lift the day.` }
        : { title: "Score is low today", body: `You're at ${ctx.score}%. Pick one habit and move the needle.` };
    case "recovery":
      return gentle
        ? { title: "Fresh start today", body: "Yesterday was tough — today is a clean slate." }
        : { title: "Reset and go", body: "Yesterday slipped — focus on the next small win." };
    case "category":
      return gentle
        ? { title: "Category check-in", body: "See how your categories are tracking today." }
        : { title: "Category reminder", body: "Open Categories and log what's due." };
    case "motivation":
      return gentle
        ? { title: "Nice work!", body: `${ctx.habitName} logged — keep the momentum.` }
        : { title: "Logged.", body: `${ctx.habitName} is done. Next habit.` };
    default:
      return { title: "Mottazen", body: "Time to check your habits." };
  }
}

export function checkNotificationReminders(input: ReminderCheckInput): CoachMessage[] {
  const { now, timezone, settings, habits, logs, sentTagsToday } = input;
  if (!settings.enabled || settings.vacationMode) return [];

  const date = localDateKey(now, timezone);
  const hm = localTimeHM(now, timezone);
  const weekday = localWeekday(now, timezone);
  const out: CoachMessage[] = [];
  const active = habits.filter((h) => !h.paused);

  for (const habit of active) {
    const notify = habit.notify ?? {};
    if (notify.enabled === false) continue;
    if (!isNotifyDayActive(weekday, notify.days)) continue;
    if (!isHabitDueToday(habit, logs, date)) continue;

    for (const time of habitReminderTimes(habit)) {
      if (time !== hm) continue;
      const tag = `habit:${habit.id}:${date}:${time}`;
      if (!canSend(settings, hm, sentTagsToday, tag)) continue;
      const copy = coachCopy(settings.tone, "habit-reminder", { habitName: habit.name });
      out.push({
        title: notify.message?.trim() || copy.title,
        body: copy.body,
        tag,
      });
    }

    if (settings.smartMissed.enabled && notify.missedAlert !== false) {
      for (const time of habitReminderTimes(habit)) {
        const elapsed = parseHM(hm) - parseHM(time);
        if (elapsed < settings.smartMissed.delayMinutes || elapsed >= settings.smartMissed.delayMinutes + 1) continue;
        const tag = `missed:${habit.id}:${date}`;
        if (!canSend(settings, hm, sentTagsToday, tag)) continue;
        const copy = coachCopy(settings.tone, "smart-missed", { habitName: habit.name });
        out.push({ title: copy.title, body: copy.body, tag });
      }
    }
  }

  if (settings.dailyCheckIn.enabled && settings.dailyCheckIn.time === hm) {
    const due = active.filter((h) => isHabitDueToday(h, logs, date));
    if (due.length) {
      const tag = `daily:${date}`;
      if (canSend(settings, hm, sentTagsToday, tag)) {
        const copy = coachCopy(settings.tone, "daily-checkin", { count: due.length });
        const names = due
          .slice(0, 3)
          .map((h) => h.name)
          .join(", ");
        const extra = due.length > 3 ? ` +${due.length - 3} more` : "";
        out.push({ title: copy.title, body: names + extra, tag });
      }
    }
  }

  if (settings.reflection.enabled && settings.reflection.time === hm) {
    const tag = `reflection:${date}`;
    if (canSend(settings, hm, sentTagsToday, tag)) {
      const copy = coachCopy(settings.tone, "reflection", {});
      out.push({ title: copy.title, body: copy.body, tag });
    }
  }

  if (settings.lowScore.enabled && settings.dailyCheckIn.time === hm) {
    const score = dayScore(habits, logs, date);
    if (score > 0 && score < settings.lowScore.threshold) {
      const tag = `lowscore:${date}`;
      if (canSend(settings, hm, sentTagsToday, tag)) {
        const copy = coachCopy(settings.tone, "low-score", { score });
        out.push({ title: copy.title, body: copy.body, tag });
      }
    }
  }

  if (settings.recovery.enabled && hm === "09:00") {
    const yesterday = addDays(date, -1);
    const score = dayScore(habits, logs, yesterday);
    if (score > 0 && score < 50) {
      const tag = `recovery:${date}`;
      if (canSend(settings, hm, sentTagsToday, tag)) {
        const copy = coachCopy(settings.tone, "recovery", {});
        out.push({ title: copy.title, body: copy.body, tag });
      }
    }
  }

  for (const rule of settings.categoryRules) {
    if (!rule.enabled || !rule.time || rule.time !== hm) continue;
    const due = active.filter((h) => h.category === rule.category && isHabitDueToday(h, logs, date));
    if (!due.length) continue;
    const tag = `category:${rule.category}:${date}`;
    if (!canSend(settings, hm, sentTagsToday, tag)) continue;
    const copy = coachCopy(settings.tone, "category", {});
    out.push({
      title: `${rule.category} — ${copy.title}`,
      body: `${due.length} habit${due.length === 1 ? "" : "s"} due in ${rule.category}.`,
      tag,
    });
  }

  return out;
}

export function checkMotivationOnLog(
  habit: Habit,
  value: number | null,
  isRest: boolean | undefined,
  settings: NotificationSettings,
  hm: string,
): CoachMessage | null {
  if (!settings.enabled || settings.vacationMode || !settings.motivation.enabled) return null;
  if (isInQuietHours(hm, settings.quietHours)) return null;
  if (isRest || value === null || value === -1) return null;

  const score = habitScore(habit, value, isRest);
  if (score === null || score <= 0) return null;

  const copy = coachCopy(settings.tone, "motivation", { habitName: habit.name });
  return {
    title: copy.title,
    body: copy.body,
    tag: `motivation:${habit.id}:${Date.now()}`,
  };
}

export function mergeHabitNotify(habit: Habit, patch: Partial<HabitNotifySettings>): Habit {
  return {
    ...habit,
    notify: { ...habit.notify, ...patch },
    remindAt: patch.remindAt ?? habit.remindAt,
  };
}
