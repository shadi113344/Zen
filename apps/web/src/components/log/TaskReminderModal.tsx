import { useEffect, useState } from "react";
import { hasTaskReminder } from "@mottazen/core";
import type { Task } from "@mottazen/core";
import { Modal } from "@/components/Modal";
import { useTasks } from "@/hooks/useData";

const DEFAULT_TIME = "09:00";

interface TaskReminderModalProps {
  task: Task;
  open: boolean;
  onClose: () => void;
}

export function TaskReminderModal({ task, open, onClose }: TaskReminderModalProps) {
  const { updateTask } = useTasks();
  const [reminderOn, setReminderOn] = useState(hasTaskReminder(task));
  const [remindAt, setRemindAt] = useState(task.remindAt ?? DEFAULT_TIME);

  useEffect(() => {
    if (!open) return;
    setReminderOn(hasTaskReminder(task));
    setRemindAt(task.remindAt ?? DEFAULT_TIME);
  }, [open, task]);

  const commitEnabled = (on: boolean) => {
    setReminderOn(on);
    updateTask({ ...task, remindAt: on ? remindAt : undefined });
  };

  const commitTime = (time: string) => {
    setRemindAt(time);
    if (reminderOn) updateTask({ ...task, remindAt: time });
  };

  return (
    <Modal open={open} onClose={onClose} title={`Reminder · ${task.title}`}>
      <div className="habit-reminder-modal">
        <label className="habit-reminder-modal__toggle">
          <span className="habit-reminder-modal__toggle-label">Daily reminder</span>
          <input type="checkbox" checked={reminderOn} onChange={(e) => commitEnabled(e.target.checked)} />
        </label>
        <label className="field habit-reminder-modal__time">
          <span>Time</span>
          <input
            type="time"
            className="habit-form__reminder-time"
            value={remindAt}
            disabled={!reminderOn}
            onChange={(e) => commitTime(e.target.value)}
          />
        </label>
        <p className="habit-form__hint">Reminds you once per day while this task is open.</p>
      </div>
    </Modal>
  );
}
