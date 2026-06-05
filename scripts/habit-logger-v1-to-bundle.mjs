/**
 * Convert habit_logger_export_v1 → Zen v1 import bundle.
 * Usage: node scripts/habit-logger-v1-to-bundle.mjs <input.json> [output.json]
 */
import { readFileSync, writeFileSync } from "fs";

const defaultNotificationSettings = () => ({
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
});

function mapHabitType(type) {
  if (type === "numeric" || type === "number") return "numeric";
  if (type === "milestone" || type === "onetime" || type === "check") return type;
  return "check";
}

function convertHabitNotify(notify, remindAt) {
  if (!notify || typeof notify !== "object") {
    return remindAt ? { enabled: true, remindAt: String(remindAt).slice(0, 5) } : undefined;
  }
  const reminders = notify.reminders ?? {};
  const missed = notify.missed ?? {};
  const times = Array.isArray(reminders.times) ? reminders.times.map((t) => String(t).slice(0, 5)) : [];
  const remind = (remindAt ?? times[0] ?? "").toString().slice(0, 5) || undefined;
  const days = Array.isArray(reminders.days) ? reminders.days : undefined;
  return {
    enabled: reminders.enabled !== false,
    remindAt: remind,
    times: times.length ? times : undefined,
    days: days?.length === 7 ? [] : days,
    message: reminders.message?.trim() || undefined,
    missedAlert: missed.enabled !== false,
  };
}

function convertNotificationSettings(data) {
  const prefs = data.notificationPrefs ?? {};
  const ns = data.notificationSettings ?? {};
  const base = defaultNotificationSettings();

  return {
    enabled: ns.masterEnabled ?? prefs.enabled ?? base.enabled,
    quietHours: {
      start: ns.quietHours?.start ?? base.quietHours.start,
      end: ns.quietHours?.end ?? base.quietHours.end,
    },
    maxPerDay: typeof ns.maxPerDay === "number" ? ns.maxPerDay : base.maxPerDay,
    tone: ns.tone === "direct" ? "direct" : "gentle",
    vacationMode: !!ns.vacationMode,
    dailyCheckIn: {
      enabled: true,
      time: (prefs.dailyTime ?? base.dailyCheckIn.time).slice(0, 5),
    },
    smartMissed: {
      enabled: ns.missed?.enabled ?? base.smartMissed.enabled,
      delayMinutes: base.smartMissed.delayMinutes,
    },
    motivation: { enabled: ns.motivation?.enabled ?? base.motivation.enabled },
    recovery: { enabled: ns.recovery?.enabled ?? base.recovery.enabled },
    lowScore: {
      enabled: ns.lowScore?.enabled ?? base.lowScore.enabled,
      threshold: typeof ns.lowScore?.threshold === "number" ? ns.lowScore.threshold : base.lowScore.threshold,
    },
    reflection: {
      enabled: ns.reflection?.enabled ?? base.reflection.enabled,
      time: (ns.reflection?.dailyTime ?? base.reflection.time).slice(0, 5),
    },
    categoryRules: [],
  };
}

function unwrap(raw) {
  if (raw.schema === "habit_logger_export_v1" && raw.data && typeof raw.data === "object") {
    return raw.data;
  }
  if (raw.version === 1 && Array.isArray(raw.habits)) {
    return raw;
  }
  return raw.data ?? raw.state ?? raw;
}

function convertLogs(legacyLogs, idMap) {
  const logs = [];
  if (!legacyLogs || typeof legacyLogs !== "object") return logs;

  const firstKey = Object.keys(legacyLogs)[0];
  const byDate = firstKey && /^\d{4}-\d{2}-\d{2}$/.test(firstKey);

  if (byDate) {
    for (const [date, day] of Object.entries(legacyLogs)) {
      if (!day || typeof day !== "object") continue;
      for (const [habitKey, value] of Object.entries(day)) {
        const habitId = idMap.get(String(habitKey)) ?? String(habitKey);
        const num = Number(value);
        const isRest = num === -1;
        logs.push({ habitId, date, value: isRest ? -1 : num, isRest });
      }
    }
  } else {
    for (const [habitKey, days] of Object.entries(legacyLogs)) {
      if (!days || typeof days !== "object") continue;
      const habitId = idMap.get(String(habitKey)) ?? String(habitKey);
      for (const [date, value] of Object.entries(days)) {
        const num = Number(value);
        const isRest = num === -1;
        logs.push({ habitId, date, value: isRest ? -1 : num, isRest });
      }
    }
  }
  return logs;
}

const inputPath = process.argv[2];
const outputPath =
  process.argv[3] ?? inputPath.replace(/\.json$/i, "-zen-import.json");

if (!inputPath) {
  console.error("Usage: node scripts/habit-logger-v1-to-bundle.mjs <input.json> [output.json]");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inputPath, "utf8"));
const data = unwrap(raw);

const legacyHabits = data.habits ?? [];
const idMap = new Map();

const habits = legacyHabits.map((h, i) => {
  const id = h.id && String(h.id).length > 8 ? String(h.id) : crypto.randomUUID();
  idMap.set(String(h.id ?? h.name ?? i), id);
  const remindAt = (h.remindAt ?? h.remind_at) ? String(h.remindAt ?? h.remind_at).slice(0, 5) : undefined;
  return {
    id,
    name: String(h.name ?? "Habit"),
    category: String(h.category ?? "Other"),
    type: mapHabitType(h.type),
    min: h.min != null ? Number(h.min) : undefined,
    max: h.max != null ? Number(h.max) : undefined,
    step: h.step != null ? Number(h.step) : undefined,
    paused: !!h.paused,
    orderIndex: h.order_index != null ? Number(h.order_index) : i,
    color: h.color ?? undefined,
    remindAt,
    notify: convertHabitNotify(h.notify, remindAt),
    why: h.why ?? undefined,
  };
});

const logs = convertLogs(data.logs, idMap);

const bundle = {
  version: 1,
  exportedAt: raw.exportedAt ?? new Date().toISOString(),
  habits,
  logs,
  categoryWeights: data.categoryWeights ?? data.category_weights ?? {},
  categoryColors: data.categoryColors ?? data.category_colors ?? {},
  dailyNotes: data.dailyNotes ?? data.notes ?? {},
  notificationSettings: convertNotificationSettings(data),
  timezone: data.timezone ?? "UTC",
  goals: [],
  goalHabits: [],
};

writeFileSync(outputPath, JSON.stringify(bundle, null, 2));

console.log(`Converted ${habits.length} habits, ${logs.length} log rows`);
console.log(`Wrote ${outputPath}`);
