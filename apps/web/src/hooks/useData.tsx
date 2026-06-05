import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  checkMotivationOnLog,
  dayScore,
  defaultNotificationSettings,
  goalProgress,
  habitScore,
  localDateKey,
  localTimeHM,
  parseNotificationSettings,
  resolveCategoryWeights,
  serializeNotificationSettings,
  todayKey,
} from "@mottazen/core";
import type { CategoryWeights, DayLog, Goal, GoalHabitLink, Habit, NotificationSettings } from "@mottazen/core";
import { normalizeGoal } from "@mottazen/core";
import { coachNotify, defaultTimezone } from "@/lib/coach-notify";
import { hapticGoalComplete, hapticProgressBump } from "@/lib/haptic";
import type { ExportBundle } from "@/lib/export-import";
import {
  demoCategoryColors,
  demoCategoryWeights,
  demoGoalHabits,
  demoGoals,
  demoHabits,
  demoLogs,
  isDemoMode,
} from "@/lib/demo-data";
import { markTagSent } from "@/lib/notify-log";
import { mergeDailyNotesBlob, splitDailyNotesBlob } from "@/lib/day-mood";
import {
  ensureUserSettingsRow,
  habitToDb,
  pushSnapshotToCloud,
  snapshotHasData,
} from "@/lib/cloud-sync";
import { clearLocalSnapshot, readLocalSnapshot, writeLocalSnapshot } from "@/lib/local-data-store";
import { buildSampleBundle } from "@/lib/sample-data";
import { goalHabitToDb, goalToDb, mapGoalHabitRow, mapGoalRow } from "@/lib/goal-db";
import { snapCategoryPastel } from "@/lib/theme-colors";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/hooks/useSession";
import { useDebouncedEffect } from "@/hooks/useSync";
import { useToast } from "@/components/Toast";

function logDbError(label: string, error: { message: string } | null | undefined) {
  if (error) console.warn(`[zen] ${label}:`, error.message);
}

interface DataContextValue {
  habits: Habit[];
  logs: DayLog[];
  goals: Goal[];
  goalHabits: GoalHabitLink[];
  categoryWeights: Record<string, CategoryWeights>;
  categoryColors: Record<string, string>;
  notificationSettings: NotificationSettings;
  timezone: string;
  dailyNotes: Record<string, string>;
  loading: boolean;
  demoMode: boolean;
  setLogValue: (
    habitId: string,
    date: string,
    value: number | null | ((prev: number | null) => number | null),
    isRest?: boolean,
  ) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (habit: Habit) => void;
  deleteHabit: (habitId: string) => { habit: Habit; logs: DayLog[] } | null;
  restoreHabit: (habit: Habit, logs: DayLog[]) => void;
  reorderHabits: (orderedIds: string[]) => void;
  getDayNote: (date: string) => string;
  setDayNote: (date: string, note: string) => void;
  getDayMood: (date: string) => string;
  setDayMood: (date: string, emoji: string) => void;
  getCategoryWeights: (category: string) => CategoryWeights | undefined;
  setCategoryWeights: (category: string, weights: CategoryWeights) => void;
  getCategoryColor: (category: string) => string | undefined;
  setCategoryColor: (category: string, color: string) => void;
  saveNotificationSettings: (settings: NotificationSettings, timezone?: string) => void;
  addGoal: (goal: Goal, links: GoalHabitLink[]) => void;
  updateGoal: (goal: Goal, links: GoalHabitLink[]) => void;
  deleteGoal: (goalId: string) => void;
  importBundle: (bundle: ExportBundle) => void;
  loadSampleData: () => void;
  clearAllData: () => void;
  reloadFromCloud: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function mapHabitRow(h: Record<string, unknown>): Habit {
  const remindRaw = h.remind_at as string | null | undefined;
  const notifyRaw = h.notify as Habit["notify"] | null | undefined;
  const meta = h.meta as { why?: string } | null | undefined;
  return {
    id: h.id as string,
    name: h.name as string,
    category: h.category as string,
    type: h.type as Habit["type"],
    min: h.min != null ? Number(h.min) : undefined,
    max: h.max != null ? Number(h.max) : undefined,
    step: h.step != null ? Number(h.step) : undefined,
    paused: !!h.paused,
    orderIndex: h.order_index != null ? Number(h.order_index) : undefined,
    color: (h.color as string) ?? undefined,
    remindAt: remindRaw ? String(remindRaw).slice(0, 5) : undefined,
    why: meta?.why,
    notify: notifyRaw && typeof notifyRaw === "object" ? notifyRaw : undefined,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: sessionLoading } = useSession();
  const { showToast } = useToast();
  const userId = user?.id;
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  const [habits, setHabits] = useState<Habit[]>(() => (isDemoMode ? demoHabits : []));
  const [logs, setLogs] = useState<DayLog[]>(() => (isDemoMode ? demoLogs : []));
  const [goals, setGoals] = useState<Goal[]>(() => (isDemoMode ? demoGoals : []).map(normalizeGoal));
  const [goalHabits, setGoalHabits] = useState<GoalHabitLink[]>(() => (isDemoMode ? demoGoalHabits : []));
  const [categoryWeights, setCategoryWeightsState] = useState<Record<string, CategoryWeights>>(() =>
    isDemoMode ? demoCategoryWeights : {},
  );
  const [categoryColors, setCategoryColorsState] = useState<Record<string, string>>(() =>
    isDemoMode ? demoCategoryColors : {},
  );
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    defaultNotificationSettings(),
  );
  const [timezone, setTimezone] = useState(() => defaultTimezone());
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
  const [dayMood, setDayMoodState] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(!isDemoMode);

  const habitsRef = useRef(habits);
  habitsRef.current = habits;
  const settingsRef = useRef(notificationSettings);
  settingsRef.current = notificationSettings;
  const tzRef = useRef(timezone);
  tzRef.current = timezone;
  const dailyNotesRef = useRef(dailyNotes);
  dailyNotesRef.current = dailyNotes;
  const dayMoodRef = useRef(dayMood);
  dayMoodRef.current = dayMood;
  const categoryWeightsRef = useRef(categoryWeights);
  categoryWeightsRef.current = categoryWeights;
  const categoryColorsRef = useRef(categoryColors);
  categoryColorsRef.current = categoryColors;
  const logsRef = useRef(logs);
  logsRef.current = logs;
  const goalsRef = useRef(goals);
  goalsRef.current = goals;
  const goalHabitsRef = useRef(goalHabits);
  goalHabitsRef.current = goalHabits;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const applySnapshot = useCallback((snap: NonNullable<ReturnType<typeof readLocalSnapshot>>) => {
    setHabits(snap.habits);
    setLogs(snap.logs);
    setGoals(snap.goals.map(normalizeGoal));
    setGoalHabits(snap.goalHabits);
    setCategoryWeightsState(snap.categoryWeights);
    setCategoryColorsState(snap.categoryColors);
    setNotificationSettings(snap.notificationSettings);
    setTimezone(snap.timezone);
    const split = splitDailyNotesBlob(snap.dailyNotes);
    setDailyNotes(split.dailyNotes);
    setDayMoodState(split.dayMood);
  }, []);

  const persistLocal = useCallback(() => {
    writeLocalSnapshot(
      {
        habits: habitsRef.current,
        logs: logsRef.current,
        categoryWeights: categoryWeightsRef.current,
        categoryColors: categoryColorsRef.current,
        dailyNotes: mergeDailyNotesBlob(dailyNotesRef.current, dayMoodRef.current),
        notificationSettings: settingsRef.current,
        timezone: tzRef.current,
        goals: goalsRef.current,
        goalHabits: goalHabitsRef.current,
      },
      userIdRef.current,
    );
  }, []);

  const fetchCloud = useCallback(async () => {
    if (isDemoMode || !supabase || !userId) return;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      logDbError("sync", { message: "No active session — sign in again" });
      return;
    }

    const settingsRowError = await ensureUserSettingsRow(supabase, userId);
    if (settingsRowError) logDbError("ensure settings", { message: settingsRowError });

    const localSnap = readLocalSnapshot(userId);

    const { data: habitRows, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .order("order_index");

    const { data: logRows, error: logsError } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("user_id", userId);

    const { data: settings, error: settingsError } = await supabase
      .from("user_settings")
      .select("daily_notes, category_weights, category_colors, notification_prefs, timezone")
      .eq("id", userId)
      .maybeSingle();

    const { data: goalRows, error: goalsError } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false });

    const { data: linkRows, error: linksError } = await supabase.from("goal_habits").select("*");

    logDbError("fetch habits", habitsError);
    logDbError("fetch logs", logsError);
    logDbError("fetch settings", settingsError);
    logDbError("fetch goals", goalsError);
    logDbError("fetch goal links", linksError);

    if (habitsError || logsError || settingsError || goalsError || linksError) {
      return;
    }

    const cloudEmpty = (habitRows?.length ?? 0) === 0 && (logRows?.length ?? 0) === 0;
    const localPayload = localSnap ?? {
      habits: habitsRef.current,
      logs: logsRef.current,
      goals: goalsRef.current,
      goalHabits: goalHabitsRef.current,
      categoryWeights: categoryWeightsRef.current,
      categoryColors: categoryColorsRef.current,
      dailyNotes: mergeDailyNotesBlob(dailyNotesRef.current, dayMoodRef.current),
      notificationSettings: settingsRef.current,
      timezone: tzRef.current,
    };

    if (cloudEmpty && snapshotHasData(localPayload)) {
      const pushError = await pushSnapshotToCloud(supabase, userId, localPayload);
      if (pushError) {
        logDbError("push local", { message: pushError });
        showToastRef.current(`Could not sync: ${pushError}`);
      } else {
        persistLocal();
      }
      return;
    }

    setHabits(habitRows?.length ? habitRows.map((h) => mapHabitRow(h)) : []);
    setLogs(
      logRows?.length
        ? logRows.map((l) => ({
            habitId: l.habit_id,
            date: l.log_date,
            value: l.is_rest ? -1 : l.value,
            isRest: l.is_rest,
          }))
        : [],
    );

    if (settings) {
      if (settings.daily_notes && typeof settings.daily_notes === "object") {
        const split = splitDailyNotesBlob(settings.daily_notes as Record<string, string>);
        setDailyNotes(split.dailyNotes);
        setDayMoodState(split.dayMood);
      }
      if (settings.category_weights && typeof settings.category_weights === "object") {
        setCategoryWeightsState(settings.category_weights as Record<string, CategoryWeights>);
      }
      if (settings.category_colors && typeof settings.category_colors === "object") {
        setCategoryColorsState(settings.category_colors as Record<string, string>);
      }
      if (settings.notification_prefs) {
        setNotificationSettings(parseNotificationSettings(settings.notification_prefs));
      }
      if (settings.timezone) setTimezone(settings.timezone);
    }

    setGoals(goalRows?.length ? goalRows.map((row) => mapGoalRow(row as Record<string, unknown>)) : []);
    setGoalHabits(
      linkRows?.length
        ? linkRows
            .filter((row) => goalRows?.some((g) => g.id === row.goal_id))
            .map((row) => mapGoalHabitRow(row as Record<string, unknown>))
        : [],
    );

    persistLocal();
  }, [userId, persistLocal]);

  const reloadFromCloud = useCallback(async () => {
    await fetchCloud();
  }, [fetchCloud]);

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }
    if (sessionLoading) return;

    if (!userId) {
      setHabits([]);
      setLogs([]);
      setGoals([]);
      setGoalHabits([]);
      setCategoryWeightsState({});
      setCategoryColorsState({});
      setDailyNotes({});
      setDayMoodState({});
      setNotificationSettings(defaultNotificationSettings());
      setTimezone(defaultTimezone());
      setLoading(false);
      return;
    }

    const snap = readLocalSnapshot(userId);
    if (snap) applySnapshot(snap);

    setLoading(true);
    void fetchCloud().finally(() => setLoading(false));
  }, [userId, sessionLoading, fetchCloud, applySnapshot]);

  const syncOnReconnect = useCallback(async () => {
    if (isDemoMode || !supabase || !userId) return;

    const localPayload = {
      habits: habitsRef.current,
      logs: logsRef.current,
      goals: goalsRef.current,
      goalHabits: goalHabitsRef.current,
      categoryWeights: categoryWeightsRef.current,
      categoryColors: categoryColorsRef.current,
      dailyNotes: mergeDailyNotesBlob(dailyNotesRef.current, dayMoodRef.current),
      notificationSettings: settingsRef.current,
      timezone: tzRef.current,
    };

    if (snapshotHasData(localPayload)) {
      const pushError = await pushSnapshotToCloud(supabase, userId, localPayload);
      if (pushError) {
        logDbError("reconnect push", { message: pushError });
        showToastRef.current(`Sync failed: ${pushError}`);
        return;
      }
    }
    await fetchCloud();
    showToastRef.current("Back online — synced");
  }, [userId, fetchCloud]);

  useEffect(() => {
    if (isDemoMode || !userId) return;
    const onOnline = () => void syncOnReconnect();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [userId, syncOnReconnect]);

  useDebouncedEffect(() => {
    persistLocal();
  }, [habits, logs, goals, goalHabits, categoryWeights, categoryColors, dailyNotes, dayMood, notificationSettings, timezone, persistLocal]);

  useDebouncedEffect(() => {
    if (isDemoMode || !supabase || !userId) return;
    void supabase
      .from("user_settings")
      .upsert({
        id: userId,
        daily_notes: mergeDailyNotesBlob(dailyNotesRef.current, dayMoodRef.current),
        category_weights: categoryWeightsRef.current,
        category_colors: categoryColorsRef.current,
      })
      .then(({ error }) => logDbError("save settings", error));
  }, [dailyNotes, dayMood, categoryWeights, categoryColors, userId]);

  const setLogValue = (
    habitId: string,
    date: string,
    value: number | null | ((prev: number | null) => number | null),
    isRest?: boolean,
  ) => {
    const existing = logsRef.current.find((l) => l.habitId === habitId && l.date === date);
    const prevRest = existing?.isRest === true || existing?.value === -1;
    const prevValue = existing && !prevRest ? existing.value : null;

    let resolvedValue: number | null = null;
    let resolvedRest = false;

    resolvedRest = isRest ?? false;
    if (typeof value === "function") {
      resolvedValue = value(prevValue);
      if (resolvedRest) resolvedValue = -1;
    } else {
      resolvedRest = isRest ?? value === -1;
      resolvedValue = resolvedRest ? -1 : value;
    }

    const forwardProgress = !resolvedRest && resolvedValue != null && resolvedValue > (prevValue ?? 0);
    if (forwardProgress) {
      // Build the post-update logs so we can detect a 100% milestone synchronously
      // (within the user gesture). On iOS these helpers are no-ops — Apple blocks
      // programmatic haptics — so the buzz only lands on Android/Chromium.
      const beforeLogs = logsRef.current;
      const habitsNow = habitsRef.current;
      const filteredForScore = beforeLogs.filter((l) => !(l.habitId === habitId && l.date === date));
      const afterLogs: DayLog[] = [
        ...filteredForScore,
        { habitId, date, value: resolvedRest ? -1 : resolvedValue!, isRest: resolvedRest },
      ];

      let reachedComplete =
        dayScore(habitsNow, beforeLogs, date) < 100 && dayScore(habitsNow, afterLogs, date) >= 100;

      if (!reachedComplete) {
        for (const link of goalHabitsRef.current.filter((l) => l.habitId === habitId)) {
          const goal = goalsRef.current.find((g) => g.id === link.goalId);
          if (!goal) continue;
          if (
            goalProgress(goal, goalHabitsRef.current, habitsNow, beforeLogs, date) < 100 &&
            goalProgress(goal, goalHabitsRef.current, habitsNow, afterLogs, date) >= 100
          ) {
            reachedComplete = true;
            break;
          }
        }
      }

      if (!reachedComplete) {
        const habit = habitsNow.find((h) => h.id === habitId);
        if (habit) {
          const prevHabitScore = habitScore(habit, prevValue, prevRest);
          const nextHabitScore = habitScore(habit, resolvedValue, false);
          if ((prevHabitScore ?? 0) < 100 && (nextHabitScore ?? 0) >= 100) {
            reachedComplete = true;
          }
        }
      }

      if (reachedComplete) hapticGoalComplete();
      else hapticProgressBump();
    }

    setLogs((prev) => {
      const filtered = prev.filter((l) => !(l.habitId === habitId && l.date === date));
      if (resolvedValue === null && !resolvedRest) return filtered;
      return [
        ...filtered,
        { habitId, date, value: resolvedRest ? -1 : resolvedValue!, isRest: resolvedRest },
      ];
    });

    if (!isDemoMode && supabase && userId) {
      if (resolvedValue === null && !resolvedRest) {
        void supabase
          .from("habit_logs")
          .delete()
          .eq("habit_id", habitId)
          .eq("log_date", date)
          .eq("user_id", userId)
          .then(({ error }) => logDbError("delete log", error));
      } else {
        void supabase
          .from("habit_logs")
          .upsert(
            {
              user_id: userId,
              habit_id: habitId,
              log_date: date,
              value: resolvedRest || resolvedValue === -1 ? -1 : resolvedValue,
              is_rest: resolvedRest || resolvedValue === -1,
            },
            { onConflict: "habit_id,log_date" },
          )
          .then(({ error }) => {
            if (error) {
              logDbError("save log", error);
              showToastRef.current(`Could not save log: ${error.message}`);
            }
          });
      }
    }

    if (date === todayKey()) {
      const habit = habitsRef.current.find((h) => h.id === habitId);
      if (habit) {
        const now = new Date();
        const message = checkMotivationOnLog(
          habit,
          resolvedRest ? -1 : resolvedValue,
          resolvedRest,
          settingsRef.current,
          localTimeHM(now, tzRef.current),
        );
        if (message && coachNotify(message)) {
          markTagSent(localDateKey(now, tzRef.current), message.tag);
        }
      }
    }
  };

  const addHabit = (habit: Habit) => {
    setHabits((prev) => [...prev, habit]);

    if (!isDemoMode && supabase && userId) {
      void supabase
        .from("habits")
        .upsert(
          {
            id: habit.id,
            user_id: userId,
            ...habitToDb(habit),
            order_index: habits.length,
          },
          { onConflict: "id" },
        )
        .then(({ error }) => {
          if (error) {
            logDbError("add habit", error);
            showToastRef.current(`Could not save activity: ${error.message}`);
          }
        });
    }
  };

  const updateHabit = (habit: Habit) => {
    const next = habitsRef.current.map((h) => (h.id === habit.id ? habit : h));
    habitsRef.current = next;
    setHabits(next);
    persistLocal();

    if (!isDemoMode && supabase && userId) {
      const orderIndex =
        habit.orderIndex ??
        next.findIndex((h) => h.id === habit.id);
      void supabase
        .from("habits")
        .upsert(
          {
            id: habit.id,
            user_id: userId,
            ...habitToDb(habit),
            order_index: orderIndex >= 0 ? orderIndex : 0,
          },
          { onConflict: "id" },
        )
        .then(({ error }) => {
          if (error) {
            logDbError("update habit", error);
            showToastRef.current(`Could not save activity: ${error.message}`);
          }
        });
    }
  };

  const deleteHabit = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return null;
    const removedLogs = logs.filter((l) => l.habitId === habitId);

    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    setLogs((prev) => prev.filter((l) => l.habitId !== habitId));
    setGoalHabits((prev) => prev.filter((l) => l.habitId !== habitId));

    if (!isDemoMode && supabase) {
      void supabase.from("habits").delete().eq("id", habitId);
    }

    return { habit, logs: removedLogs };
  };

  const reorderHabits = (orderedIds: string[]) => {
    setHabits((prev) => {
      const byId = new Map(prev.map((h) => [h.id, h]));
      const next: Habit[] = [];
      orderedIds.forEach((id, index) => {
        const h = byId.get(id);
        if (h) {
          next.push({ ...h, orderIndex: index });
          byId.delete(id);
        }
      });
      let index = orderedIds.length;
      for (const h of prev) {
        if (byId.has(h.id)) {
          next.push({ ...h, orderIndex: index++ });
        }
      }
      return next;
    });

    if (!isDemoMode && supabase && userId) {
      orderedIds.forEach((id, index) => {
        void supabase.from("habits").update({ order_index: index }).eq("id", id).eq("user_id", userId);
      });
    }
  };

  const restoreHabit = (habit: Habit, restoredLogs: DayLog[]) => {
    setHabits((prev) => (prev.some((h) => h.id === habit.id) ? prev : [...prev, habit]));
    setLogs((prev) => {
      const without = prev.filter((l) => l.habitId !== habit.id);
      return [...without, ...restoredLogs];
    });

    if (!isDemoMode && supabase && userId) {
      void supabase.from("habits").upsert({
        id: habit.id,
        user_id: userId,
        ...habitToDb(habit),
        order_index: habits.length,
      });
      for (const l of restoredLogs) {
        void supabase.from("habit_logs").upsert(
          {
            user_id: userId,
            habit_id: l.habitId,
            log_date: l.date,
            value: l.isRest ? -1 : l.value,
            is_rest: !!l.isRest,
          },
          { onConflict: "habit_id,log_date" },
        );
      }
    }
  };

  const getCategoryWeights = (category: string) => categoryWeights[category];

  const setCategoryWeights = (category: string, weights: CategoryWeights) => {
    setCategoryWeightsState((prev) => ({ ...prev, [category]: weights }));
  };

  const getCategoryColor = (category: string) => categoryColors[category];

  const setCategoryColor = (category: string, color: string) => {
    const snapped = snapCategoryPastel(color);
    setCategoryColorsState((prev) => {
      const next = { ...prev, [category]: snapped };
      return next;
    });
  };

  const saveNotificationSettings = (settings: NotificationSettings, nextTz?: string) => {
    setNotificationSettings(settings);
    if (nextTz) setTimezone(nextTz);

    if (isDemoMode || !supabase || !userId) return;

    void supabase
      .from("user_settings")
      .upsert({
        id: userId,
        notification_prefs: serializeNotificationSettings(settings),
        timezone: nextTz ?? timezone,
      })
      .then(({ error }) => logDbError("save notification settings", error));
  };

  const getDayNote = (date: string) => dailyNotes[date] ?? "";

  const setDayNote = (date: string, note: string) => {
    setDailyNotes((prev) => ({ ...prev, [date]: note }));
  };

  const getDayMood = (date: string) => dayMood[date] ?? "";

  const setDayMood = (date: string, emoji: string) => {
    setDayMoodState((prev) => {
      const next = { ...prev };
      if (emoji) next[date] = emoji;
      else delete next[date];
      return next;
    });
  };

  const syncGoalLinks = async (goalId: string, links: GoalHabitLink[]) => {
    if (!supabase || !userId) return;
    await supabase.from("goal_habits").delete().eq("goal_id", goalId);
    if (links.length > 0) {
      await supabase.from("goal_habits").insert(links.map(goalHabitToDb));
    }
  };

  const addGoal = (goal: Goal, links: GoalHabitLink[]) => {
    const normalized = normalizeGoal(goal);
    setGoals((prev) => [...prev, normalized]);
    setGoalHabits((prev) => [...prev, ...links]);

    if (!isDemoMode && supabase && userId) {
      void supabase.from("goals").upsert(goalToDb(normalized, userId));
      void syncGoalLinks(normalized.id, links);
    }
  };

  const updateGoal = (goal: Goal, links: GoalHabitLink[]) => {
    const normalized = normalizeGoal(goal);
    setGoals((prev) => prev.map((g) => (g.id === normalized.id ? normalized : g)));
    setGoalHabits((prev) => [...prev.filter((l) => l.goalId !== normalized.id), ...links]);

    if (!isDemoMode && supabase && userId) {
      void supabase.from("goals").upsert(goalToDb(normalized, userId));
      void syncGoalLinks(normalized.id, links);
    }
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setGoalHabits((prev) => prev.filter((l) => l.goalId !== goalId));

    if (!isDemoMode && supabase && userId) {
      void supabase.from("goals").delete().eq("id", goalId).eq("user_id", userId);
    }
  };

  const importBundle = (bundle: ExportBundle) => {
    setHabits(bundle.habits);
    setLogs(bundle.logs);
    setGoals((bundle.goals ?? []).map(normalizeGoal));
    setGoalHabits(bundle.goalHabits ?? []);
    setCategoryWeightsState(bundle.categoryWeights);
    setCategoryColorsState(bundle.categoryColors);
    const split = splitDailyNotesBlob(bundle.dailyNotes);
    setDailyNotes(split.dailyNotes);
    setDayMoodState(split.dayMood);
    setNotificationSettings(bundle.notificationSettings);
    setTimezone(bundle.timezone);

    if (!isDemoMode && supabase && userId) {
      void (async () => {
        for (const h of bundle.habits) {
          await supabase.from("habits").upsert({
            id: h.id,
            user_id: userId,
            ...habitToDb(h),
            order_index: bundle.habits.indexOf(h),
          });
        }
        for (const l of bundle.logs) {
          await supabase.from("habit_logs").upsert(
            {
              user_id: userId,
              habit_id: l.habitId,
              log_date: l.date,
              value: l.isRest ? -1 : l.value,
              is_rest: !!l.isRest,
            },
            { onConflict: "habit_id,log_date" },
          );
        }
        await supabase.from("user_settings").upsert({
          id: userId,
          daily_notes: mergeDailyNotesBlob(split.dailyNotes, split.dayMood),
          category_weights: bundle.categoryWeights,
          category_colors: bundle.categoryColors,
          notification_prefs: serializeNotificationSettings(bundle.notificationSettings),
          timezone: bundle.timezone,
        });
        const importedGoals = (bundle.goals ?? []).map(normalizeGoal);
        const importedGoalIds = new Set(importedGoals.map((g) => g.id));
        const { data: existingGoals } = await supabase.from("goals").select("id").eq("user_id", userId);
        for (const row of existingGoals ?? []) {
          if (!importedGoalIds.has(row.id as string)) {
            await supabase.from("goals").delete().eq("id", row.id as string);
          }
        }
        for (const g of importedGoals) {
          await supabase.from("goals").upsert(goalToDb(g, userId));
        }
        for (const g of importedGoals) {
          await syncGoalLinks(
            g.id,
            (bundle.goalHabits ?? []).filter((l) => l.goalId === g.id),
          );
        }
      })();
    }
    persistLocal();
  };

  const loadSampleData = () => {
    importBundle(buildSampleBundle());
  };

  const clearAllData = () => {
    setHabits([]);
    setLogs([]);
    setGoals([]);
    setGoalHabits([]);
    setCategoryWeightsState({});
    setCategoryColorsState({});
    setDailyNotes({});
    setDayMoodState({});
    clearLocalSnapshot(userId);

    if (!isDemoMode && supabase && userId) {
      void (async () => {
        await supabase.from("habit_logs").delete().eq("user_id", userId);
        await supabase.from("habits").delete().eq("user_id", userId);
        await supabase.from("goals").delete().eq("user_id", userId);
        await supabase.from("user_settings").upsert({
          id: userId,
          daily_notes: {},
          category_weights: {},
          category_colors: {},
        });
      })();
    }
  };

  const value = useMemo(
    () => ({
      habits,
      logs,
      goals,
      goalHabits,
      categoryWeights,
      categoryColors,
      notificationSettings,
      timezone,
      dailyNotes,
      dayMood,
      loading,
      demoMode: isDemoMode,
      setLogValue,
      addHabit,
      updateHabit,
      deleteHabit,
      restoreHabit,
      reorderHabits,
      getDayNote,
      setDayNote,
      getDayMood,
      setDayMood,
      getCategoryWeights,
      setCategoryWeights,
      getCategoryColor,
      setCategoryColor,
      saveNotificationSettings,
      addGoal,
      updateGoal,
      deleteGoal,
      importBundle,
      loadSampleData,
      clearAllData,
      reloadFromCloud,
    }),
    [
      habits,
      logs,
      goals,
      goalHabits,
      categoryWeights,
      categoryColors,
      notificationSettings,
      timezone,
      dailyNotes,
      dayMood,
      loading,
      reloadFromCloud,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

export function useHabits() {
  const { habits, loading } = useData();
  return { habits, loading };
}

export function useLogs() {
  const { logs, setLogValue } = useData();
  return { logs, setLogValue };
}

export function useGoals() {
  const { goals, goalHabits, habits, logs } = useData();
  return { goals, goalHabits, habits, logs };
}

export function useDayNotes() {
  const { getDayNote, setDayNote } = useData();
  return { getDayNote, setDayNote };
}

export function useDayMood() {
  const { getDayMood, setDayMood } = useData();
  return { getDayMood, setDayMood };
}

export function useCategoryWeights() {
  const { habits, categoryWeights, getCategoryWeights, setCategoryWeights } = useData();

  const getWeights = (category: string) =>
    resolveCategoryWeights(habits, category, getCategoryWeights(category));

  return { getWeights, setWeights: setCategoryWeights, allWeights: categoryWeights };
}

export function useCategoryColors() {
  const { categoryColors, getCategoryColor, setCategoryColor } = useData();
  return { categoryColors, getCategoryColor, setCategoryColor };
}

export function useNotifications() {
  const { notificationSettings, timezone, saveNotificationSettings, habits, updateHabit } = useData();
  return { notificationSettings, timezone, saveNotificationSettings, habits, updateHabit };
}
