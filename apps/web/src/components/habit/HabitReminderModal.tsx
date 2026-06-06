import { useEffect, useState } from "react";
import { mergeHabitNotify, hasHabitReminder } from "@mottazen/core";
import type { Habit, HabitNotifySettings } from "@mottazen/core";
import { Modal } from "@/components/Modal";
import { useData } from "@/hooks/useData";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_TIME = "09:00";

interface HabitReminderModalProps {
  habit: Habit;
  open: boolean;
  onClose: () => void;
}

export function HabitReminderModal({ habit, open, onClose }: HabitReminderModalProps) {
  const { updateHabit } = useData();
  const notify = habit.notify ?? {};
  const initialTime = habit.remindAt ?? notify.remindAt ?? DEFAULT_TIME;
  const initialOn = hasHabitReminder(habit);

  const [reminderOn, setReminderOn] = useState(initialOn);
  const [remindAt, setRemindAt] = useState(initialTime);

  useEffect(() => {
    if (!open) return;
    const n = habit.notify ?? {};
    const time = habit.remindAt ?? n.remindAt ?? DEFAULT_TIME;
    setReminderOn(hasHabitReminder(habit));
    setRemindAt(time);
  }, [open, habit]);

  const apply = (partial: Partial<HabitNotifySettings> & { remindAt?: string }) => {
    updateHabit(mergeHabitNotify(habit, partial));
  };

  const commitEnabled = (on: boolean) => {
    setReminderOn(on);
    if (on) {
      apply({ enabled: true, remindAt });
    } else {
      updateHabit({
        ...habit,
        remindAt: undefined,
        notify: { ...habit.notify, enabled: false, remindAt: undefined },
      });
    }
  };

  const commitTime = (time: string) => {
    setRemindAt(time);
    if (reminderOn) apply({ enabled: true, remindAt: time });
  };

  const patchDays = (day: number) => {
    const n = habit.notify ?? {};
    const base = n.days?.length ? [...n.days] : [0, 1, 2, 3, 4, 5, 6];
    const next = base.includes(day) ? base.filter((d) => d !== day) : [...base, day].sort();
    apply({ days: next.length === 7 ? [] : next, enabled: true, remindAt });
  };

  const activeDays = !notify.days?.length ? [0, 1, 2, 3, 4, 5, 6] : notify.days;

  return (
    <Modal open={open} onClose={onClose} title={`Reminder · ${habit.name}`}>
      <div className="habit-reminder-modal">
        <label className="habit-reminder-modal__toggle">
          <span className="habit-reminder-modal__toggle-label">Daily reminder</span>
          <input
            type="checkbox"
            checked={reminderOn}
            onChange={(e) => commitEnabled(e.target.checked)}
          />
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

        <p className="muted-text habit-reminder-modal__hint">
          Notify you at this time if the activity is not logged yet today.
        </p>

        {reminderOn ? (
          <div className="habit-reminder-modal__days">
            <span className="habit-reminder-modal__days-label">Active days</span>
            <div className="coach-days">
              {WEEKDAYS.map((name, day) => {
                const active = activeDays.includes(day);
                return (
                  <button
                    key={name}
                    type="button"
                    className={`coach-day${active ? " coach-day--on" : ""}`}
                    onClick={() => patchDays(day)}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
