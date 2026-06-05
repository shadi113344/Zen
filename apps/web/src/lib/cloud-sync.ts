import type { DayLog, Goal, Habit } from "@mottazen/core";
import { serializeNotificationSettings } from "@mottazen/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocalDataSnapshot } from "@/lib/local-data-store";
import { goalHabitToDb, goalToDb } from "@/lib/goal-db";

function normalizeRemindAt(remind: string | undefined): string | null {
  if (!remind?.trim()) return null;
  const [h, m] = remind.trim().split(":");
  if (!h || !m) return null;
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`;
}

export function habitToDb(habit: Habit) {
  const remind = habit.remindAt ?? habit.notify?.remindAt;
  return {
    name: habit.name,
    category: habit.category,
    type: habit.type,
    min: habit.min ?? null,
    max: habit.max ?? null,
    step: habit.step ?? null,
    color: habit.color ?? null,
    paused: habit.paused ?? false,
    remind_at: normalizeRemindAt(remind),
    notify: habit.notify ?? {},
    meta: habit.why ? { why: habit.why } : {},
  };
}

export async function ensureUserSettingsRow(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { error } = await supabase.from("user_settings").upsert({ id: userId });
  return error?.message ?? null;
}

export async function pushSnapshotToCloud(
  supabase: SupabaseClient,
  userId: string,
  snapshot: Omit<LocalDataSnapshot, "savedAt">,
): Promise<string | null> {
  const settingsError = await ensureUserSettingsRow(supabase, userId);
  if (settingsError) return `user_settings: ${settingsError}`;

  for (let i = 0; i < snapshot.habits.length; i++) {
    const h = snapshot.habits[i]!;
    const { error } = await supabase.from("habits").upsert(
      {
        id: h.id,
        user_id: userId,
        ...habitToDb(h),
        order_index: h.orderIndex ?? i,
      },
      { onConflict: "id" },
    );
    if (error) return `habit ${h.name}: ${error.message}`;
  }

  for (const l of snapshot.logs) {
    const { error } = await supabase.from("habit_logs").upsert(
      {
        user_id: userId,
        habit_id: l.habitId,
        log_date: l.date,
        value: l.isRest ? -1 : l.value,
        is_rest: !!l.isRest,
      },
      { onConflict: "habit_id,log_date" },
    );
    if (error) return `log ${l.habitId}@${l.date}: ${error.message}`;
  }

  const { error: settingsSaveError } = await supabase.from("user_settings").upsert({
    id: userId,
    daily_notes: snapshot.dailyNotes,
    category_weights: snapshot.categoryWeights,
    category_colors: snapshot.categoryColors,
    notification_prefs: serializeNotificationSettings(snapshot.notificationSettings),
    timezone: snapshot.timezone,
  });
  if (settingsSaveError) return `settings: ${settingsSaveError.message}`;

  for (const g of snapshot.goals) {
    const { error } = await supabase.from("goals").upsert(goalToDb(g, userId));
    if (error) return `goal ${g.name}: ${error.message}`;
  }

  for (const g of snapshot.goals) {
    const links = snapshot.goalHabits.filter((l) => l.goalId === g.id);
    await supabase.from("goal_habits").delete().eq("goal_id", g.id);
    if (links.length > 0) {
      const { error } = await supabase.from("goal_habits").insert(links.map(goalHabitToDb));
      if (error) return `goal links ${g.id}: ${error.message}`;
    }
  }

  return null;
}

export function snapshotHasData(snapshot: {
  habits: Habit[];
  logs: DayLog[];
  goals: Goal[];
}): boolean {
  return snapshot.habits.length > 0 || snapshot.logs.length > 0 || snapshot.goals.length > 0;
}
