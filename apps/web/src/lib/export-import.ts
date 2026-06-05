import type { CategoryWeights, DayLog, Goal, GoalHabitLink, Habit, NotificationSettings } from "@mottazen/core";
import { parseImportFile } from "@/lib/legacy-import";

export interface ExportBundle {
  version: 1;
  exportedAt: string;
  habits: Habit[];
  logs: DayLog[];
  categoryWeights: Record<string, CategoryWeights>;
  categoryColors: Record<string, string>;
  dailyNotes: Record<string, string>;
  notificationSettings: NotificationSettings;
  timezone: string;
  goals?: Goal[];
  goalHabits?: GoalHabitLink[];
}

export function buildExportBundle(data: Omit<ExportBundle, "version" | "exportedAt">): ExportBundle {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...data,
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function logsToCsv(logs: DayLog[], habits: Habit[]): string {
  const header = "date,habit_id,habit_name,category,value,is_rest";
  const nameById = new Map(habits.map((h) => [h.id, h]));
  const rows = logs.map((l) => {
    const h = nameById.get(l.habitId);
    return [
      l.date,
      l.habitId,
      h?.name ?? "",
      h?.category ?? "",
      l.value ?? "",
      l.isRest ? "1" : "0",
    ].join(",");
  });
  return [header, ...rows].join("\n");
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportJson(raw: string): ExportBundle {
  return parseImportFile(raw);
}
