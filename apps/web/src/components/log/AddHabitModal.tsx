import { useEffect, useState, type FormEvent } from "react";

import type { Habit, HabitType } from "@mottazen/core";

import { Modal } from "@/components/Modal";

import { GlassSelect } from "@/components/GlassSelect";

import { FormNumericStepper } from "@/components/FormNumericStepper";

import { categorySelectOptions } from "@/lib/all-categories";
import { useCategoryColors, useData } from "@/hooks/useData";

import { FabButton } from "@/components/FabButton";
import { newId } from "@/lib/new-id";



interface AddHabitModalProps {

  open: boolean;

  onClose: () => void;

  defaultCategory?: string;

}



const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ec4899", "#14b8a6"];

const DEFAULT_REMINDER_TIME = "09:00";



export function AddHabitModal({ open, onClose, defaultCategory = "Health" }: AddHabitModalProps) {

  const { habits, addHabit } = useData();
  const { categoryColors } = useCategoryColors();



  const [name, setName] = useState("");

  const [category, setCategory] = useState(defaultCategory);

  const [type, setType] = useState<HabitType>("check");

  const [color, setColor] = useState(COLORS[0]!);

  const [min, setMin] = useState(0);

  const [max, setMax] = useState(20);

  const [step, setStep] = useState(1);

  const [scoring, setScoring] = useState<"scale" | "any">("scale");

  const [why, setWhy] = useState("");

  const [reminderOn, setReminderOn] = useState(false);

  const [remindAt, setRemindAt] = useState(DEFAULT_REMINDER_TIME);

  const [paused, setPaused] = useState(false);



  useEffect(() => {

    if (open) setCategory(defaultCategory);

  }, [open, defaultCategory]);



  const reset = () => {

    setName("");

    setCategory(defaultCategory);

    setType("check");

    setColor(COLORS[0]!);

    setMin(0);

    setMax(20);

    setStep(1);

    setScoring("scale");

    setWhy("");

    setReminderOn(false);

    setRemindAt(DEFAULT_REMINDER_TIME);

    setPaused(false);

  };



  const submit = (e: FormEvent) => {

    e.preventDefault();

    const trimmed = name.trim();

    if (!trimmed) return;



    const time = reminderOn ? remindAt : "";

    const habit: Habit = {

      id: newId(),

      name: trimmed,

      category: category.trim() || "Other",

      type,

      color,

      paused,

      why: why.trim() || undefined,

      remindAt: time || undefined,

      notify: time ? { enabled: true, remindAt: time } : undefined,

      ...(type === "numeric" || type === "milestone" ? { min, max, step } : {}),

    };

    addHabit(habit);

    reset();

    onClose();

  };



  const categoryOptions = categorySelectOptions(habits, categoryColors, category);



  return (

    <Modal open={open} onClose={onClose} title="Add Activity">

      <form className="habit-form habit-form--modal" onSubmit={submit}>

        <div className="habit-form__scroll">

          <label className="habit-form__field">

            <span className="habit-form__label">Activity name</span>

            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Creatine" required autoFocus />

          </label>

          <div className="habit-form__field">

            <span className="habit-form__label">Category</span>

            <GlassSelect
              value={categoryOptions.includes(category) ? category : (categoryOptions[0] ?? "Health")}
              onChange={setCategory}
              aria-label="Category"
              options={categoryOptions.map((c) => ({ value: c, label: c }))}
            />

          </div>

          <div className="habit-form__field">

            <span className="habit-form__label">Input type</span>

            <GlassSelect<HabitType>

              value={type}

              onChange={setType}

              aria-label="Input type"

              options={[
                { value: "check", label: "Check / Done" },
                { value: "numeric", label: "Number" },
                { value: "milestone", label: "Milestone" },
                { value: "onetime", label: "One-time" },
              ]}

            />

          </div>

          {(type === "numeric" || type === "milestone") && (

            <>

              <label className="habit-form__field">

                <span className="habit-form__label">Minimum value</span>

                <FormNumericStepper value={min} onChange={setMin} min={0} max={9999} aria-label="Minimum value" />

              </label>

              <label className="habit-form__field">

                <span className="habit-form__label">Maximum target</span>

                <FormNumericStepper value={max} onChange={setMax} min={1} max={99999} aria-label="Maximum target" />

              </label>

              <label className="habit-form__field">

                <span className="habit-form__label">Tap step</span>

                <FormNumericStepper value={step} onChange={setStep} min={1} max={1000} aria-label="Tap step" />

              </label>

              <div className="habit-form__field">

                <span className="habit-form__label">Progress scoring</span>

                <GlassSelect

                  value={scoring}

                  onChange={setScoring}

                  aria-label="Progress scoring"

                  options={[

                    { value: "scale", label: "Increase with value" },

                    { value: "any", label: "Any value counts as complete" },

                  ]}

                />

              </div>

            </>

          )}

          <label className="habit-form__field">

            <span className="habit-form__label">Why it matters (optional)</span>

            <textarea

              value={why}

              onChange={(e) => setWhy(e.target.value)}

              placeholder="e.g. Strength for my back, mental clarity…"

              rows={2}

            />

          </label>

          <div className="habit-form__field">

            <span className="habit-form__label">Daily reminder (optional)</span>

            <div className="habit-form__reminder-row">

              <label className="habit-form__reminder-toggle" aria-label="Enable daily reminder">

                <input

                  type="checkbox"

                  checked={reminderOn}

                  onChange={(e) => setReminderOn(e.target.checked)}

                />

                <span className="habit-form__reminder-check-ui" aria-hidden />

              </label>

              <input

                type="time"

                className="habit-form__reminder-time"

                value={remindAt}

                disabled={!reminderOn}

                onChange={(e) => setRemindAt(e.target.value)}

              />

            </div>

            <span className="habit-form__hint">Notify you at this time if not logged today.</span>

          </div>

          <label className="habit-form__check">

            <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} />

            <span>Pause this activity (hidden from logging)</span>

          </label>

        </div>

        <div className="form-actions form-actions--modal">

          <button type="button" className="btn btn--ghost" onClick={onClose}>

            Cancel

          </button>

          <button type="submit" className="btn btn--primary">

            Save

          </button>

        </div>

      </form>

    </Modal>

  );

}



interface AddHabitFABProps {

  onClick: () => void;

}



export function AddHabitFAB({ onClick }: AddHabitFABProps) {
  return <FabButton onClick={onClick} label="Add activity" />;
}


