import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Habit, HabitType, ProgressScoring } from "@mottazen/core";
import { Modal } from "@/components/Modal";
import { GlassSelect } from "@/components/GlassSelect";
import { FormNumericStepper } from "@/components/FormNumericStepper";
import { categorySelectOptions } from "@/lib/all-categories";
import { PROGRESS_SCORING_STREAK_HINT } from "@/lib/progress-scoring";
import { useCategoryColors, useData } from "@/hooks/useData";
import { useToast } from "@/components/Toast";

interface EditHabitModalProps {
  habit: Habit | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function EditHabitModal({ habit, open, onClose, onDeleted }: EditHabitModalProps) {
  const { habits, updateHabit, deleteHabit, restoreHabit } = useData();
  const { categoryColors } = useCategoryColors();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<HabitType>("check");
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [step, setStep] = useState(1);
  const [scoring, setScoring] = useState<ProgressScoring>("scale");
  const [avoid, setAvoid] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categoryOptions = useMemo(
    () => categorySelectOptions(habits, categoryColors, category),
    [habits, categoryColors, category],
  );

  const categoryValue = categoryOptions.includes(category)
    ? category
    : (categoryOptions[0] ?? category);

  useEffect(() => {
    if (!habit || !open) return;
    setName(habit.name);
    setCategory(habit.category);
    setType(habit.type);
    setMin(habit.min ?? 0);
    setMax(habit.max ?? 100);
    setStep(habit.step ?? 1);
    setScoring(habit.progressScoring === "any" ? "any" : "scale");
    setAvoid(habit.goalDirection === "avoid");
    setConfirmDelete(false);
  }, [habit, open]);

  if (!habit) return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateHabit({
      ...habit,
      name: name.trim(),
      category: categoryValue.trim() || "Other",
      type,
      goalDirection: type === "check" && avoid ? "avoid" : undefined,
      ...(type === "numeric" || type === "milestone"
        ? {
            min,
            max,
            step,
            progressScoring: scoring === "any" ? "any" : undefined,
          }
        : { min: undefined, max: undefined, step: undefined, progressScoring: undefined }),
    });
    onClose();
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const snapshot = deleteHabit(habit.id);
    onClose();
    onDeleted();
    if (snapshot) {
      showToast(`Deleted “${habit.name}”`, () => restoreHabit(snapshot.habit, snapshot.logs));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit activity">
      <form className="add-habit-form" onSubmit={submit}>
        <label className="field">
          <span>Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <div className="field">
          <span>Life area</span>
          <GlassSelect
            value={categoryValue}
            onChange={setCategory}
            aria-label="Life area"
            options={categoryOptions.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div className="field">
          <span>Type</span>
          <GlassSelect<HabitType>
            value={type}
            onChange={setType}
            aria-label="Activity type"
            options={[
              { value: "check", label: "Checkbox" },
              { value: "numeric", label: "Numeric" },
              { value: "milestone", label: "Milestone" },
              { value: "onetime", label: "One-time" },
            ]}
          />
        </div>
        {type === "check" && (
          <label className="habit-form__check">
            <input type="checkbox" checked={avoid} onChange={(e) => setAvoid(e.target.checked)} />
            <span>I&apos;m quitting or avoiding this</span>
          </label>
        )}
        {(type === "numeric" || type === "milestone") && (
          <>
            <div className="field-row field-row--numeric">
              <label className="field">
                <span>Min</span>
                <FormNumericStepper value={min} onChange={setMin} min={0} max={9999} aria-label="Minimum" />
              </label>
              <label className="field">
                <span>Max</span>
                <FormNumericStepper value={max} onChange={setMax} min={1} max={99999} aria-label="Maximum" />
              </label>
              <label className="field">
                <span>Step</span>
                <FormNumericStepper value={step} onChange={setStep} min={1} max={1000} aria-label="Step" />
              </label>
            </div>
            <div className="field">
              <span>Progress scoring</span>
              <GlassSelect<ProgressScoring>
                value={scoring}
                onChange={setScoring}
                aria-label="Progress scoring"
                options={[
                  { value: "scale", label: "Increase with value" },
                  { value: "any", label: "Any value counts as complete" },
                ]}
              />
            </div>
            <p className="habit-form__hint">{PROGRESS_SCORING_STREAK_HINT[scoring]}</p>
          </>
        )}
        <div className="form-actions form-actions--split">
          <button
            type="button"
            className={`btn btn--danger${confirmDelete ? " btn--danger-confirm" : ""}`}
            onClick={handleDelete}
          >
            {confirmDelete ? "Confirm delete" : "Delete"}
          </button>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Save
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
