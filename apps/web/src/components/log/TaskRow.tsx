import { useCallback, useMemo, useState } from "react";
import { hasTaskReminder } from "@mottazen/core";
import type { Task } from "@mottazen/core";
import { Modal } from "@/components/Modal";
import { HabitRowMenu } from "@/components/log/HabitRowMenu";
import { TaskEditModal } from "@/components/log/TaskEditModal";
import { TaskReminderModal } from "@/components/log/TaskReminderModal";
import { usePressRadialMenu } from "@/hooks/usePressRadialMenu";
import { useTasks } from "@/hooks/useData";

interface TaskRowProps {
  task: Task;
  date: string;
}

export function TaskRow({ task, date }: TaskRowProps) {
  const { toggleTask, deleteTask } = useTasks();
  const [editOpen, setEditOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const hasReminder = hasTaskReminder(task);

  const confirmDelete = useCallback(() => {
    deleteTask(task.id);
    setDeleteConfirmOpen(false);
  }, [deleteTask, task.id]);

  const menuOptions = useMemo(
    () => [
      { id: "edit", label: "Edit task", icon: "✎", onSelect: () => setEditOpen(true) },
      { id: "reminder", label: "Reminder", icon: "bell", onSelect: () => setReminderOpen(true) },
      { id: "delete", label: "Delete task", icon: "trash", onSelect: () => setDeleteConfirmOpen(true) },
    ],
    [],
  );

  const { open: menuOpen, highlightId, btnRef, bindTrigger } = usePressRadialMenu(menuOptions);

  return (
    <>
      <div className={`task-row${task.done ? " task-row--done" : ""}`}>
        <div className="task-row__main">
          <span className="task-row__title">{task.title}</span>
          {hasReminder ? <span className="habit-card__reminder-icon" aria-label="Reminder set" /> : null}
          {task.dueDate ? <span className="task-row__due">{task.dueDate}</span> : null}
        </div>
        <div className="task-row__actions">
          <button
            type="button"
            ref={btnRef}
            className={`habit-card__menu-btn${menuOpen ? " habit-card__menu-btn--open" : ""}`}
            aria-label="Task actions"
            {...bindTrigger}
          />
          <label className="habit-card__check" aria-label={task.done ? "Mark not done" : "Mark done"}>
            <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id, date)} />
            <span className="habit-card__check-ui" aria-hidden />
          </label>
        </div>
      </div>

      <HabitRowMenu anchorRef={btnRef} open={menuOpen} highlightId={highlightId} options={menuOptions} />

      <TaskEditModal task={task} open={editOpen} onClose={() => setEditOpen(false)} />
      <TaskReminderModal task={task} open={reminderOpen} onClose={() => setReminderOpen(false)} />

      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete task?">
        <p className="habit-delete-confirm__text">
          Delete <strong>{task.title}</strong>? This cannot be undone.
        </p>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn--danger btn--danger-confirm" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}
