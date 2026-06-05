/**
 * Convert legacy index.html export → Mottazen v1 import bundle.
 * Usage: node scripts/legacy-to-bundle.mjs path/to/export.json [output.json]
 */
import { readFileSync, writeFileSync } from "fs";
import { randomUUID } from "crypto";
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

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: node scripts/legacy-to-bundle.mjs <legacy-export.json> [output.json]");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inputPath, "utf8"));

/** Already v1 bundle */
if (raw.version === 1 && Array.isArray(raw.habits)) {
  const out = process.argv[3] ?? inputPath.replace(/\.json$/i, ".mottazen.json");
  writeFileSync(out, JSON.stringify(raw, null, 2));
  console.log(`Already v1 format — copied to ${out}`);
  process.exit(0);
}

const legacyHabits = raw.habits ?? raw.state?.habits ?? [];
const legacyLogs = raw.logs ?? raw.state?.logs ?? raw.dayValues ?? {};
const legacyNotes = raw.dailyNotes ?? raw.state?.dailyNotes ?? {};
const legacySettings = raw.notificationSettings ?? raw.state?.notificationSettings;

const idMap = new Map();
const habits = legacyHabits.map((h, i) => {
  const id = h.id && String(h.id).length > 8 ? String(h.id) : randomUUID();
  idMap.set(h.id ?? h.name ?? i, id);
  return {
    id,
    name: String(h.name ?? "Habit"),
    category: String(h.category ?? "Other"),
    type: h.type === "numeric" ? "numeric" : "check",
    min: h.min != null ? Number(h.min) : undefined,
    max: h.max != null ? Number(h.max) : undefined,
    step: h.step != null ? Number(h.step) : undefined,
    paused: !!h.paused,
    color: h.color ?? undefined,
    remindAt: h.remindAt ?? h.remind_at ?? undefined,
    notify: h.notify,
    why: h.why ?? h.meta?.why,
  };
});

const logs = [];

/** Shape: { "2026-06-01": { habitId: value } } or { habitId: { date: value } } */
if (legacyLogs && typeof legacyLogs === "object") {
  const firstKey = Object.keys(legacyLogs)[0];
  const looksLikeDate = firstKey && /^\d{4}-\d{2}-\d{2}$/.test(firstKey);

  if (looksLikeDate) {
    for (const [date, day] of Object.entries(legacyLogs)) {
      if (!day || typeof day !== "object") continue;
      for (const [habitKey, value] of Object.entries(day)) {
        const habitId = idMap.get(habitKey) ?? habitKey;
        const num = Number(value);
        const isRest = num === -1;
        logs.push({
          habitId,
          date,
          value: isRest ? -1 : num,
          isRest,
        });
      }
    }
  } else {
    for (const [habitKey, days] of Object.entries(legacyLogs)) {
      if (!days || typeof days !== "object") continue;
      const habitId = idMap.get(habitKey) ?? habitKey;
      for (const [date, value] of Object.entries(days)) {
        const num = Number(value);
        const isRest = num === -1;
        logs.push({
          habitId,
          date,
          value: isRest ? -1 : num,
          isRest,
        });
      }
    }
  }
}

const bundle = {
  version: 1,
  exportedAt: new Date().toISOString(),
  habits,
  logs,
  categoryWeights: raw.categoryWeights ?? raw.category_weights ?? {},
  categoryColors: raw.categoryColors ?? raw.category_colors ?? {},
  dailyNotes: legacyNotes,
  notificationSettings: legacySettings ?? defaultNotificationSettings(),
  timezone: raw.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
};

const outputPath = process.argv[3] ?? inputPath.replace(/\.json$/i, ".mottazen.json");
writeFileSync(outputPath, JSON.stringify(bundle, null, 2));

console.log(`Converted ${habits.length} habits, ${logs.length} log rows`);
console.log(`Wrote ${outputPath}`);
console.log("Import in app: Profile → Import data → select this file");
