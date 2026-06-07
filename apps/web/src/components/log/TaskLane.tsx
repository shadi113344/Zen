import { useCallback, useMemo, useState, type FormEvent } from "react";
import { orderTasksForDay } from "@mottazen/core";
import type { Task } from "@mottazen/core";
import { TaskRow } from "@/components/log/TaskRow";
import { usePointerReorder } from "@/hooks/usePointerReorder";
import { useTasks } from "@/hooks/useData";
import { newId } from "@/lib/new-id";

interface TaskLaneProps {
  date: string;
  /** Allow adding new tasks on this log day (today or a past date). */
  canAdd?: boolean;
}

/**
 * One-off to-do list on the log day. Tasks appear from the day they were added;
 * pending rolls forward; completed stays on the day it was checked off.
 */
export function TaskLane({ date, canAdd = true }: TaskLaneProps) {
  const { tasks, addTask, reorderTasks } = useTasks();
  const [title, setTitle] = useState("");

  const ordered = useMemo(() => orderTasksForDay(tasks, date), [tasks, date]);
  const openCount = ordered.filter((t) => !t.done).length;

  const swapTasks = useCallback(
    (fromId: string, toId: string) => {
      const from = ordered.find((t) => t.id === fromId);
      const to = ordered.find((t) => t.id === toId);
      if (!from || !to || from.done !== to.done) return;
      const ids = ordered.map((t) => t.id);
      const fromIdx = ids.indexOf(fromId);
      const toIdx = ids.indexOf(toId);
      if (fromIdx < 0 || toIdx < 0) return;
      const next = [...ids];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromId);
      reorderTasks(next);
    },
    [ordered, reorderTasks],
  );

  const { getDragProps, draggingId } = usePointerReorder(swapTasks, "data-task-id");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || !canAdd) return;
    addTask({
      id: newId(),
      title: trimmed,
      done: false,
      createdAt: new Date().toISOString(),
      createdDate: date,
    });
    setTitle("");
  };

  const showList = ordered.length > 0;
  const showDivider = canAdd && showList;

  return (
    <section className="task-lane card" aria-label="Tasks">
      <header className="task-lane__header">
        <h2 className="task-lane__title">Tasks</h2>
        {openCount > 0 ? <span className="task-lane__count">{openCount} open</span> : null}
      </header>

      {canAdd ? (
        <form className="task-lane__add" onSubmit={submit}>
          <input
            className="task-lane__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a one-off task…"
            aria-label="New task"
          />
          <button
            type="submit"
            className="task-lane__add-btn"
            disabled={!title.trim()}
            aria-label="Add task"
          >
            +
          </button>
        </form>
      ) : null}

      {showDivider ? <div className="task-lane__divider" aria-hidden /> : null}

      {!showList ? (
        <p className="task-lane__empty">
          {canAdd ? "No tasks yet — capture a one-off to-do." : "No tasks for this day."}
        </p>
      ) : (
        <ul className="task-lane__list">
          {ordered.map((t: Task) => {
            const drag = getDragProps(t.id);
            return (
              <li
                key={t.id}
                className={`task-lane__item${draggingId === t.id ? " task-lane__item--dragging" : ""}`}
                data-task-id={t.id}
                {...drag}
              >
                <TaskRow task={t} date={date} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
