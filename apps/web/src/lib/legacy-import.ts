import { defaultNotificationSettings } from "@mottazen/core";
import type { ExportBundle } from "@/lib/export-import";
import type { DayLog, Habit } from "@mottazen/core";
import { newId } from "@/lib/new-id";

/** Convert old index.html export shape into v1 bundle (for Profile import). */
export function legacyExportToBundle(raw: Record<string, unknown>): ExportBundle {
  const legacyHabits = (raw.habits ?? (raw.state as Record<string, unknown>)?.habits ?? []) as Array<
    Record<string, unknown>
  >;
  const legacyLogs = (raw.logs ??
    (raw.state as Record<string, unknown>)?.logs ??
    raw.dayValues ??
    {}) as Record<string, unknown>;

  const idMap = new Map<string | number, string>();
  const habits: Habit[] = legacyHabits.map((h, i) => {
    const legacyId = h.id ?? h.name ?? i;
    const id = h.id && String(h.id).length > 8 ? String(h.id) : newId();
    idMap.set(String(legacyId), id);
    return {
      id,
      name: String(h.name ?? "Habit"),
      category: String(h.category ?? "Other"),
      type: h.type === "numeric" ? "numeric" : "check",
      min: h.min != null ? Number(h.min) : undefined,
      max: h.max != null ? Number(h.max) : undefined,
      step: h.step != null ? Number(h.step) : undefined,
      paused: !!h.paused,
      color: (h.color as string) ?? undefined,
      remindAt: (h.remindAt ?? h.remind_at) as string | undefined,
      notify: h.notify as Habit["notify"],
      why: (h.why ?? (h.meta as { why?: string })?.why) as string | undefined,
    };
  });

  const logs: DayLog[] = [];
  const firstKey = Object.keys(legacyLogs)[0];
  const byDate = firstKey && /^\d{4}-\d{2}-\d{2}$/.test(firstKey);

  if (byDate) {
    for (const [date, day] of Object.entries(legacyLogs)) {
      if (!day || typeof day !== "object") continue;
      for (const [habitKey, value] of Object.entries(day as Record<string, unknown>)) {
        const habitId = idMap.get(habitKey) ?? habitKey;
        const num = Number(value);
        const isRest = num === -1;
        logs.push({ habitId, date, value: isRest ? -1 : num, isRest });
      }
    }
  } else {
    for (const [habitKey, days] of Object.entries(legacyLogs)) {
      if (!days || typeof days !== "object") continue;
      const habitId = idMap.get(habitKey) ?? habitKey;
      for (const [date, value] of Object.entries(days as Record<string, unknown>)) {
        const num = Number(value);
        const isRest = num === -1;
        logs.push({ habitId, date, value: isRest ? -1 : num, isRest });
      }
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    habits,
    logs,
    categoryWeights: (raw.categoryWeights ?? raw.category_weights ?? {}) as ExportBundle["categoryWeights"],
    categoryColors: (raw.categoryColors ?? raw.category_colors ?? {}) as ExportBundle["categoryColors"],
    dailyNotes: (raw.dailyNotes ?? (raw.state as Record<string, unknown>)?.dailyNotes ?? {}) as Record<string, string>,
    notificationSettings: defaultNotificationSettings(),
    goals: [],
    goalHabits: [],
    timezone:
      (raw.timezone as string) ??
      (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"),
  };
}

export function parseImportFile(raw: string): ExportBundle {
  const data = JSON.parse(raw) as Record<string, unknown>;
  if (data.version === 1 && Array.isArray(data.habits)) {
    return data as ExportBundle;
  }
  return legacyExportToBundle(data);
}
