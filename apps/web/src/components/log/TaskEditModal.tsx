import { useEffect, useState, type FormEvent } from "react";
import type { Task } from "@mottazen/core";
import { Modal } from "@/components/Modal";
import { useTasks } from "@/hooks/useData";

interface TaskEditModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

export function TaskEditModal({ task, open, onClose }: TaskEditModalProps) {
  const { updateTask } = useTasks();
  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");

  useEffect(() => {
    if (!open) return;
    setTitle(task.title);
    setNote(task.note ?? "");
    setDueDate(task.dueDate ?? "");
  }, [open, task]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    updateTask({
      ...task,
      title: trimmed,
      note: note.trim() || undefined,
      dueDate: dueDate || undefined,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit task">
      <form className="habit-form habit-form--modal" onSubmit={submit}>
        <label className="habit-form__field">
          <span className="habit-form__label">Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </label>
        <label className="habit-form__field">
          <span className="habit-form__label">Due date (optional)</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label className="habit-form__field">
          <span className="habit-form__label">Note (optional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </label>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={!title.trim()}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
