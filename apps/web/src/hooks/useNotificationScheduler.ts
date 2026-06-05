import { useEffect, useRef } from "react";
import { checkNotificationReminders, localDateKey } from "@mottazen/core";
import { coachNotify } from "@/lib/coach-notify";
import { getSentTagsToday, markTagSent } from "@/lib/notify-log";
import { useData } from "@/hooks/useData";

const TICK_MS = 60_000;

export function useNotificationScheduler() {
  const { habits, logs, notificationSettings, timezone } = useData();
  const settingsRef = useRef(notificationSettings);
  const habitsRef = useRef(habits);
  const logsRef = useRef(logs);
  const tzRef = useRef(timezone);

  settingsRef.current = notificationSettings;
  habitsRef.current = habits;
  logsRef.current = logs;
  tzRef.current = timezone;

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tz = tzRef.current;
      const dateKey = localDateKey(now, tz);
      const sentTagsToday = getSentTagsToday(dateKey);
      const pending = checkNotificationReminders({
        now,
        timezone: tz,
        settings: settingsRef.current,
        habits: habitsRef.current,
        logs: logsRef.current,
        sentTagsToday,
      });

      for (const message of pending) {
        if (coachNotify(message)) {
          markTagSent(dateKey, message.tag);
        }
      }
    };

    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);
}
