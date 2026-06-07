import type { Task } from "./types";

/** Calendar day a task was added (YYYY-MM-DD). */
export function taskCreatedDate(task: Task): string {
  if (task.createdDate) return task.createdDate;
  return task.createdAt.slice(0, 10);
}

/** Calendar day a task was marked done (YYYY-MM-DD). */
export function taskCompletedDate(task: Task): string | undefined {
  if (task.completedDate) return task.completedDate;
  if (task.completedAt) return task.completedAt.slice(0, 10);
  return undefined;
}

/**
 * Tasks visible on a given log day.
 * Starts on the day it was added; pending rolls forward; completed stays on its completion day only.
 */
export function tasksForDay(tasks: Task[], dateKey: string): Task[] {
  return tasks.filter((t) => {
    if (taskCreatedDate(t) > dateKey) return false;
    if (!t.done) return true;
    return taskCompletedDate(t) === dateKey;
  });
}

export function sortTasksByOrder(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const ai = a.orderIndex ?? 0;
    const bi = b.orderIndex ?? 0;
    if (ai !== bi) return ai - bi;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

/** Open tasks first (by order), completed pinned to the bottom (by order). */
export function orderTasksForDay(tasks: Task[], dateKey: string): Task[] {
  const day = sortTasksByOrder(tasksForDay(tasks, dateKey));
  const open = day.filter((t) => !t.done);
  const done = day.filter((t) => t.done);
  return [...open, ...done];
}

export function hasTaskReminder(task: Task): boolean {
  return Boolean(task.remindAt?.trim());
}

export function taskCounts(tasks: Task[]): { pending: number; completed: number } {
  let pending = 0;
  let completed = 0;
  for (const t of tasks) {
    if (t.done) completed += 1;
    else pending += 1;
  }
  return { pending, completed };
}

/** Pending/completed totals scoped to a dashboard insights period. */
export function taskCountsForPeriod(
  tasks: Task[],
  rangeDates: string[],
): { pending: number; completed: number } {
  if (rangeDates.length === 0) return { pending: 0, completed: 0 };
  const range = new Set(rangeDates);
  const end = rangeDates[rangeDates.length - 1]!;
  let completed = 0;
  for (const t of tasks) {
    if (!t.done) continue;
    const doneDay = taskCompletedDate(t);
    if (doneDay && range.has(doneDay)) completed += 1;
  }
  const pending = tasksForDay(tasks, end).filter((t) => !t.done).length;
  return { pending, completed };
}
