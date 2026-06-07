import { addDays, defaultNotificationSettings, todayKey } from "@mottazen/core";
import type { CategoryWeights, DayLog, Goal, GoalHabitLink, Habit, Task } from "@mottazen/core";
import { buildExportBundle, type ExportBundle } from "@/lib/export-import";
import { defaultTimezone } from "@/lib/coach-notify";
import { newId } from "@/lib/new-id";

const SAMPLE_COLORS = {
  health: "#22c55e",
  mind: "#a855f7",
  movement: "#14b8a6",
  life: "#f59e0b",
};

/** Days of history — long enough to exercise milestone tiers (100/365) + a year recap. */
const HISTORY_DAYS = 400;

/**
 * Four life areas, varied activity types, ~400 days of logs (a perfect-streak
 * "Read" to demo milestone cards + Wrapped recap), consistency + cumulative
 * targets, and a few tasks.
 */
export function buildSampleBundle(): ExportBundle {
  const today = todayKey();
  const goalFitId = newId();
  const goalCourseId = newId();

  const habits: Habit[] = [
    {
      id: newId(),
      name: "Read",
      category: "Mind",
      type: "check",
      color: SAMPLE_COLORS.mind,
      why: "Become someone who learns every day",
    },
    {
      id: newId(),
      name: "Creatine",
      category: "Health",
      type: "check",
      color: SAMPLE_COLORS.health,
    },
    {
      id: newId(),
      name: "Sleep",
      category: "Health",
      type: "numeric",
      min: 0,
      max: 10,
      step: 0.5,
      color: SAMPLE_COLORS.health,
    },
    {
      id: newId(),
      name: "Focus hours",
      category: "Mind",
      type: "numeric",
      min: 0,
      max: 8,
      step: 1,
      color: SAMPLE_COLORS.mind,
    },
    {
      id: newId(),
      name: "Meditate",
      category: "Mind",
      type: "check",
      color: SAMPLE_COLORS.mind,
    },
    {
      id: newId(),
      name: "Course study",
      category: "Mind",
      type: "numeric",
      min: 0,
      max: 2,
      step: 0.5,
      color: SAMPLE_COLORS.mind,
    },
    {
      id: newId(),
      name: "Steps",
      category: "Movement",
      type: "numeric",
      min: 0,
      max: 12000,
      step: 500,
      color: SAMPLE_COLORS.movement,
    },
    {
      id: newId(),
      name: "Gym",
      category: "Movement",
      type: "check",
      color: SAMPLE_COLORS.movement,
    },
    {
      id: newId(),
      name: "Renew passport",
      category: "Life",
      type: "onetime",
      color: SAMPLE_COLORS.life,
    },
    {
      id: newId(),
      name: "Books read",
      category: "Life",
      type: "milestone",
      min: 0,
      max: 12,
      step: 1,
      color: SAMPLE_COLORS.life,
    },
  ];

  const [read, creatine, sleep, focus, meditate, course, steps, gym, passport, books] = habits;
  const logs: DayLog[] = [];
  const onetimeDoneDate = addDays(today, -42);
  const courseStart = addDays(today, -14);

  const goals: Goal[] = [
    {
      id: goalFitId,
      name: "Healthy & fit",
      kind: "consistency",
      category: "Movement",
      startDate: addDays(today, -60),
      endDate: addDays(today, 30),
      daysPerWeek: 5,
    },
    {
      id: goalCourseId,
      name: "Finish UX course",
      kind: "cumulative",
      category: "Mind",
      startDate: courseStart,
      endDate: addDays(today, 14),
      targetTotal: 10,
      unit: "h",
      planIntervalDays: 2,
      planAmountPerSession: 2,
    },
  ];

  const goalHabits: GoalHabitLink[] = [
    { goalId: goalFitId, habitId: gym!.id, weight: 100, required: true },
    { goalId: goalCourseId, habitId: course!.id, weight: 100, required: true },
  ];

  for (let offset = -(HISTORY_DAYS - 1); offset <= 0; offset++) {
    const date = addDays(today, offset);
    const dayIndex = offset + (HISTORY_DAYS - 1);

    // Read: a perfect, unbroken streak — powers the 100/365-day milestone card + recap.
    if (read) logs.push({ habitId: read.id, date, value: 1 });

    if (creatine) {
      if (dayIndex % 11 !== 5) logs.push({ habitId: creatine.id, date, value: dayIndex % 7 === 3 ? 0 : 1 });
    }

    if (sleep) {
      const hours = 6 + (dayIndex % 4) * 0.5 + (dayIndex % 3 === 0 ? 1 : 0);
      logs.push({ habitId: sleep.id, date, value: Math.min(hours, 10) });
    }

    if (focus) {
      if (dayIndex % 9 !== 2) {
        const hours = 1 + (dayIndex % 5) + (dayIndex % 4 === 0 ? 2 : 0);
        logs.push({ habitId: focus.id, date, value: Math.min(hours, 8) });
      }
    }

    if (meditate) {
      logs.push({ habitId: meditate.id, date, value: dayIndex % 6 === 0 ? 0 : 1 });
    }

    if (course && date >= courseStart && (offset + 14) % 2 === 0) {
      logs.push({ habitId: course.id, date, value: 2 });
    }

    if (steps) {
      if (dayIndex % 13 === 9) {
        logs.push({ habitId: steps.id, date, value: -1, isRest: true });
      } else {
        const base = 5000 + (dayIndex % 9) * 700;
        logs.push({ habitId: steps.id, date, value: Math.min(base, 12000) });
      }
    }

    if (gym) {
      const gymDone = dayIndex % 7 !== 6 && dayIndex % 11 !== 4;
      logs.push({ habitId: gym.id, date, value: gymDone ? 1 : 0 });
    }

    if (passport && date === onetimeDoneDate) {
      logs.push({ habitId: passport.id, date, value: 1 });
    }

    if (books) {
      const progress = Math.min(12, Math.floor(dayIndex / 30));
      if (progress > 0) logs.push({ habitId: books.id, date, value: progress });
    }
  }

  const nowIso = new Date().toISOString();
  const tasks: Task[] = [
    {
      id: newId(),
      title: "Book dentist appointment",
      category: "Health",
      done: true,
      createdAt: nowIso,
      createdDate: addDays(today, -12),
      completedDate: addDays(today, -10),
      completedAt: nowIso,
    },
    {
      id: newId(),
      title: "Renew gym membership",
      category: "Movement",
      done: true,
      createdAt: nowIso,
      createdDate: addDays(today, -40),
      completedDate: addDays(today, -38),
      completedAt: nowIso,
    },
    {
      id: newId(),
      title: "Reply to landlord",
      category: "Life",
      done: false,
      createdAt: nowIso,
      createdDate: addDays(today, -2),
      orderIndex: 0,
    },
    {
      id: newId(),
      title: "Plan weekend trip",
      done: false,
      createdAt: nowIso,
      createdDate: today,
      orderIndex: 1,
    },
  ];

  const categoryWeights: Record<string, CategoryWeights> = {
    Health: { [creatine!.id]: 50, [sleep!.id]: 50 },
    Mind: { [read!.id]: 25, [focus!.id]: 30, [meditate!.id]: 20, [course!.id]: 25 },
    Movement: { [steps!.id]: 60, [gym!.id]: 40 },
    Life: { [passport!.id]: 30, [books!.id]: 70 },
  };

  const categoryColors: Record<string, string> = {
    Health: "#e4ebe6",
    Mind: "#e8e4ed",
    Movement: "#dfe8f0",
    Life: "#f5efe4",
  };

  return buildExportBundle({
    habits,
    logs,
    goals,
    goalHabits,
    tasks,
    categoryWeights,
    categoryColors,
    dailyNotes: {},
    notificationSettings: defaultNotificationSettings(),
    timezone: defaultTimezone(),
  });
}
