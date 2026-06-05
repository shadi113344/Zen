import {
  adminClient,
  corsHeaders,
  getVapid,
  jsonResponse,
  sendToSubscription,
} from "../_shared/push.ts";

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

    const settingsByUser = new Map(
      (settingsRows || []).map((row) => [row.id, row]),
    );

    const { data: habitsRows, error: habitsError } = await sb
      .from("habits")
      .select("id, user_id, name, reminder, remind_at, paused")
      .in("user_id", userIds);

    if (habitsError) throw habitsError;

    const habitsByUser = new Map<string, typeof habitsRows>();
    for (const h of habitsRows || []) {
      const list = habitsByUser.get(h.user_id) || [];
      list.push(h);
      habitsByUser.set(h.user_id, list);
    }

    let sent = 0;
    const errors: string[] = [];

    for (const userId of userIds) {
      const settings = settingsByUser.get(userId);
      const tz = settings?.timezone || "UTC";
      const prefs = (settings?.notification_prefs || {}) as {
        enabled?: boolean;
        dailyTime?: string;
      };

      const localParts = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(now);

      const part = (type: string) =>
        localParts.find((p) => p.type === type)?.value || "";

      const todayKey = `${part("year")}-${part("month")}-${part("day")}`;
      const hm = `${part("hour")}:${part("minute")}`;

      const { data: logsToday, error: logsError } = await sb
        .from("habit_logs")
        .select("habit_id, value")
        .eq("user_id", userId)
        .eq("log_date", todayKey);

      if (logsError) {
        errors.push(`logs ${userId}: ${logsError.message}`);
        continue;
      }

      const logMap = new Map(
        (logsToday || []).map((l) => [l.habit_id, Number(l.value)]),
      );

      const isDone = (habitId: string, type: string) => {
        const v = logMap.get(habitId);
        if (v === undefined) return false;
        if (v === -1) return true;
        if (type === "check") return v > 0;
        return v > 0;
      };

      const userSubs = subs.filter((s) => s.user_id === userId);
      const userHabits = habitsByUser.get(userId) || [];

      const queue: { key: string; title: string; body: string; tag: string }[] =
        [];

      for (const h of userHabits) {
        if (h.paused || !h.remind_at) continue;
        const remindHm = String(h.remind_at).slice(0, 5);
        if (remindHm !== hm) continue;
        if (isDone(h.id, h.type)) continue;
        queue.push({
          key: `habit:${h.id}:${todayKey}`,
          title: `Time for ${h.name}`,
          body: h.reminder || "Tap to log it now.",
          tag: `habit-${h.id}`,
        });
      }

      if (prefs.enabled && (prefs.dailyTime || "20:00") === hm) {
        const due = userHabits.filter(
          (h) => !h.paused && !isDone(h.id, h.type),
        );
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

      for (const item of queue) {
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
          url: "/",
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
        }
      }
    }

    return jsonResponse({ ok: true, sent, errors: errors.slice(0, 20) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 500);
  }
});
