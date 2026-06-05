import {
  adminClient,
  corsHeaders,
  getVapid,
  jsonResponse,
  sendToSubscription,
} from "../_shared/push.ts";

type HabitRow = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  remind_at: string | null;
  paused: boolean;
  notify: { enabled?: boolean; message?: string; days?: number[] } | null;
};

type NotificationPrefs = {
  enabled?: boolean;
  vacationMode?: boolean;
  quietHours?: { start?: string; end?: string };
  maxPerDay?: number;
  dailyCheckIn?: { enabled?: boolean; time?: string };
  dailyTime?: string;
};

function parseHM(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function isInQuietHours(hm: string, quiet: { start: string; end: string }): boolean {
  const now = parseHM(hm);
  const start = parseHM(quiet.start);
  const end = parseHM(quiet.end);
  if (start === end) return false;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}

function localWeekday(now: Date, timezone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(now);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[weekday] ?? 0;
}

function habitReminderBody(habit: HabitRow): string {
  const msg = habit.notify?.message?.trim();
  return msg || "Tap to log it now.";
}

function isNotifyDayActive(weekday: number, days?: number[]): boolean {
  if (!days?.length) return true;
  return days.includes(weekday);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const headerSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("authorization") || "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!cronSecret || (headerSecret !== cronSecret && bearer !== cronSecret)) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    getVapid();
    const sb = adminClient();
    const now = new Date();

    const { data: subs, error: subsError } = await sb
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth_key");

    if (subsError) throw subsError;
    if (!subs?.length) {
      return jsonResponse({ ok: true, sent: 0, message: "No subscriptions" });
    }

    const userIds = [...new Set(subs.map((s) => s.user_id))];
    const { data: settingsRows, error: settingsError } = await sb
      .from("user_settings")
      .select("id, notification_prefs, timezone")
      .in("id", userIds);

    if (settingsError) throw settingsError;

    const settingsByUser = new Map((settingsRows || []).map((row) => [row.id, row]));

    const { data: habitsRows, error: habitsError } = await sb
      .from("habits")
      .select("id, user_id, name, type, remind_at, paused, notify")
      .in("user_id", userIds);

    if (habitsError) throw habitsError;

    const habitsByUser = new Map<string, HabitRow[]>();
    for (const h of (habitsRows || []) as HabitRow[]) {
      const list = habitsByUser.get(h.user_id) || [];
      list.push(h);
      habitsByUser.set(h.user_id, list);
    }

    let sent = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      const settings = settingsByUser.get(userId);
      const tz = settings?.timezone || "UTC";
      const prefs = (settings?.notification_prefs || {}) as NotificationPrefs;

      if (!prefs.enabled || prefs.vacationMode) continue;

      const localParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(now);

      const part = (type: string) => localParts.find((p) => p.type === type)?.value || "";

      const todayKey = `${part("year")}-${part("month")}-${part("day")}`;
      const hm = `${part("hour")}:${part("minute")}`;
      const weekday = localWeekday(now, tz);

      const quiet = {
        start: prefs.quietHours?.start ?? "22:00",
        end: prefs.quietHours?.end ?? "07:00",
      };
      if (isInQuietHours(hm, quiet)) continue;

      const { count: sentTodayCount } = await sb
        .from("push_notify_log")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("sent_at", `${todayKey}T00:00:00`);

      const maxPerDay = prefs.maxPerDay ?? 8;
      if ((sentTodayCount ?? 0) >= maxPerDay) continue;

      const { data: logsToday, error: logsError } = await sb
        .from("habit_logs")
        .select("habit_id, value")
        .eq("user_id", userId)
        .eq("log_date", todayKey);

      if (logsError) {
        errors.push(`logs ${userId}: ${logsError.message}`);
        continue;
      }

      const logMap = new Map((logsToday || []).map((l) => [l.habit_id, Number(l.value)]));

      const isDone = (habitId: string, type: string) => {
        const v = logMap.get(habitId);
        if (v === undefined) return false;
        if (v === -1) return true;
        if (type === "check") return v > 0;
        return v > 0;
      };

      const userSubs = subs.filter((s) => s.user_id === userId);
      const userHabits = habitsByUser.get(userId) || [];

      const queue: { key: string; title: string; body: string; tag: string }[] = [];

      for (const h of userHabits) {
        if (h.paused || !h.remind_at) continue;
        if (h.notify?.enabled === false) continue;
        if (!isNotifyDayActive(weekday, h.notify?.days)) continue;
        const remindHm = String(h.remind_at).slice(0, 5);
        if (remindHm !== hm) continue;
        if (isDone(h.id, h.type)) continue;
        queue.push({
          key: `habit:${h.id}:${todayKey}`,
          title: `Time for ${h.name}`,
          body: habitReminderBody(h),
          tag: `habit-${h.id}`,
        });
      }

      const dailyEnabled = prefs.dailyCheckIn?.enabled ?? false;
      const dailyTime = (prefs.dailyCheckIn?.time ?? prefs.dailyTime ?? "20:00").slice(0, 5);
      if (dailyEnabled && dailyTime === hm) {
        const due = userHabits.filter((h) => !h.paused && !isDone(h.id, h.type));
        if (due.length) {
          const names = due.slice(0, 3).map((h) => h.name).join(", ");
          const extra = due.length > 3 ? ` +${due.length - 3} more` : "";
          queue.push({
            key: `daily:${todayKey}`,
            title: due.length === 1 ? "1 habit left today" : `${due.length} habits left today`,
            body: names + extra,
            tag: `daily-${todayKey}`,
          });
        }
      }

      let sentForUser = sentTodayCount ?? 0;
      for (const item of queue) {
        if (sentForUser >= maxPerDay) break;

        const { data: existing } = await sb
          .from("push_notify_log")
          .select("id")
          .eq("user_id", userId)
          .eq("notify_key", item.key)
          .maybeSingle();

        if (existing) continue;

        const payload = {
          title: item.title,
          body: item.body,
          tag: item.tag,
          url: "/log",
        };

        let delivered = false;
        for (const sub of userSubs) {
          try {
            await sendToSubscription(sub, payload);
            delivered = true;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("410") || msg.includes("404")) {
              await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
            } else {
              errors.push(`push ${userId}: ${msg}`);
            }
          }
        }

        if (delivered) {
          await sb.from("push_notify_log").insert({
            user_id: userId,
            notify_key: item.key,
          });
          sent++;
          sentForUser++;
        }
      }
    }

    return jsonResponse({ ok: true, sent, errors: errors.slice(0, 20) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
