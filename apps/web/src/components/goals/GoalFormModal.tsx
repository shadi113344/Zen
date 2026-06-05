import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { addDays, inferGoalCategory, linksForGoal, todayKey } from "@mottazen/core";
import type { Goal, GoalHabitLink, GoalKind, Habit } from "@mottazen/core";
import { Modal } from "@/components/Modal";
import { GlassSelect } from "@/components/GlassSelect";
import { FormNumericStepper } from "@/components/FormNumericStepper";
import { useCategoryColors, useData } from "@/hooks/useData";
import { categorySelectOptions } from "@/lib/all-categories";
import { defaultGoalColor, GOAL_COLOR_PRESETS } from "@/lib/goal-color";
import { newId } from "@/lib/new-id";
export interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
  defaultCategory?: string;
}

const KIND_OPTIONS: { value: GoalKind; label: string; hint: string }[] = [
  { value: "consistency", label: "Consistency", hint: "e.g. Gym 5 days per week for 3 months" },
  { value: "cumulative", label: "Cumulative total", hint: "e.g. 10 hours of course study by a deadline" },
];

function habitLabel(h: Habit): string {
  const type =
    h.type === "numeric" || h.type === "milestone" ? " · numeric" : h.type === "check" ? "" : ` · ${h.type}`;
  return `${h.name} (${h.category}${type})`;
}

function linksForHabits(goalId: string, habitIds: string[]): GoalHabitLink[] {
  return habitIds.map((habitId) => ({ goalId, habitId, weight: 100, required: true }));
}

function goalToFormKind(goal: Goal): GoalKind {
  return goal.kind === "legacy" ? "consistency" : goal.kind;
}

export function GoalFormModal({ open, onClose, goalToEdit = null, defaultCategory }: GoalFormModalProps) {
  const { habits, goalHabits, addGoal, updateGoal } = useData();
  const { categoryColors } = useCategoryColors();
  const today = todayKey();
  const isEdit = goalToEdit != null;
  const skipInferCategory = useRef(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCategory ?? "Health");
  const [kind, setKind] = useState<GoalKind>("consistency");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(addDays(today, 90));
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [targetTotal, setTargetTotal] = useState(10);
  const [unit, setUnit] = useState("h");
  const [color, setColor] = useState(GOAL_COLOR_PRESETS[0]!.color);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const activeHabits = useMemo(() => habits.filter((h) => !h.paused), [habits]);

  const habitOptions = useMemo(() => {
    const list =
      kind === "cumulative"
        ? [
            ...activeHabits.filter((h) => h.type === "numeric" || h.type === "milestone"),
            ...activeHabits.filter((h) => h.type !== "numeric" && h.type !== "milestone"),
          ]
        : activeHabits;
    const seen = new Set<string>();
    return list.filter((h) => {
      if (seen.has(h.id)) return false;
      seen.add(h.id);
      return true;
    });
  }, [activeHabits, kind]);

  const optionIds = useMemo(() => new Set(habitOptions.map((h) => h.id)), [habitOptions]);

  const categoryOptions = useMemo(
    () => categorySelectOptions(habits, categoryColors, category),
    [habits, categoryColors, category],
  );

  useEffect(() => {
    if (!open) return;
    if (goalToEdit) {
      skipInferCategory.current = true;
      setName(goalToEdit.name);
      setCategory(goalToEdit.category ?? defaultCategory ?? "Health");
      setKind(goalToFormKind(goalToEdit));
      setStartDate(goalToEdit.startDate);
      setEndDate(goalToEdit.endDate);
      setDaysPerWeek(goalToEdit.daysPerWeek ?? 5);
      setTargetTotal(goalToEdit.targetTotal ?? 10);
      setUnit(goalToEdit.unit ?? "h");
      setColor(goalToEdit.color ?? defaultGoalColor(goalToEdit.id));
      const linked = linksForGoal(goalToEdit.id, goalHabits).map((l) => l.habitId);
      setSelectedIds(new Set(linked));
      return;
    }
    skipInferCategory.current = false;
    setName("");
    setKind("consistency");
    setStartDate(today);
    setEndDate(addDays(today, 14));
    setDaysPerWeek(5);
    setTargetTotal(10);
    setUnit("h");
    setColor(GOAL_COLOR_PRESETS[0]!.color);
    setSelectedIds(new Set());
    setCategory(defaultCategory ?? "Health");
  }, [open, goalToEdit, goalHabits, today, defaultCategory]);

  useEffect(() => {
    if (!open || isEdit) return;
    setEndDate(kind === "cumulative" ? addDays(today, 14) : addDays(today, 90));
  }, [open, isEdit, kind, today]);

  useEffect(() => {
    if (skipInferCategory.current) {
      skipInferCategory.current = false;
      return;
    }
    const habitIds = [...selectedIds];
    const inferred = inferGoalCategory(activeHabits, habitIds);
    if (inferred) setCategory(inferred);
  }, [selectedIds, activeHabits]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => optionIds.has(id)));
      if (!isEdit && next.size === 0 && habitOptions[0]) next.add(habitOptions[0].id);
      return next;
    });
  }, [optionIds, habitOptions, isEdit]);

  const toggleHabit = (habitId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(habitId)) next.delete(habitId);
      else next.add(habitId);
      return next;
    });
  };

  const selectedCount = selectedIds.size;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const habitIds = [...selectedIds].filter((id) => optionIds.has(id));
    if (!trimmed || habitIds.length === 0 || endDate < startDate) return;

    const goalId = goalToEdit?.id ?? newId();
    const group =
      category.trim() || inferGoalCategory(activeHabits, habitIds) || defaultCategory || "Other";

    const base = {
      id: goalId,
      name: trimmed,
      category: group,
      startDate,
      endDate,
      color,
    };

    const goal: Goal =
      kind === "cumulative"
        ? { ...base, kind: "cumulative", targetTotal, unit: unit.trim() || undefined }
        : { ...base, kind: "consistency", daysPerWeek };

    const links = linksForHabits(goalId, habitIds);
    if (isEdit) updateGoal(goal, links);
    else addGoal(goal, links);
    onClose();
  };

  const activityHint =
    kind === "consistency"
      ? `Each selected activity must reach ${daysPerWeek} day${daysPerWeek === 1 ? "" : "s"} per week (Mon–Sun). A week counts only when every linked activity hits that target.`
      : "Logged values from every selected activity add toward the target. Numeric activities work best.";

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit goal" : "Add goal"}>
      <form className="habit-form habit-form--modal" onSubmit={submit}>
        <div className="habit-form__scroll">
          {goalToEdit?.kind === "legacy" ? (
            <p className="habit-form__hint">This is a legacy blended goal; saving will convert it to the type selected below.</p>
          ) : null}

          <label className="habit-form__field">
            <span className="habit-form__label">Goal name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Healthy & fit"
              required
              autoFocus
            />
          </label>

          <div className="habit-form__field">
            <span className="habit-form__label">Goal color</span>
            <div className="add-category-form__swatches" role="radiogroup" aria-label="Goal color">
              {GOAL_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={color === preset.color}
                  className={`theme-swatch theme-swatch--soft theme-swatch--mini${color === preset.color ? " theme-swatch--mini-active" : ""}`}
                  style={{ "--swatch-color": preset.color } as CSSProperties}
                  title={preset.label}
                  aria-label={preset.label}
                  onClick={() => setColor(preset.color)}
                />
              ))}
            </div>
            <span className="habit-form__hint">Shown on Today and in goal lists.</span>
          </div>

          <div className="habit-form__field">
            <span className="habit-form__label">Category group</span>
            <GlassSelect
              value={categoryOptions.includes(category) ? category : (categoryOptions[0] ?? category)}
              onChange={setCategory}
              aria-label="Category group"
              options={categoryOptions.map((c) => ({ value: c, label: c }))}
            />
            <span className="habit-form__hint">Counts toward this category&apos;s group score.</span>
          </div>

          <div className="habit-form__field">
            <span className="habit-form__label">Goal type</span>
            <GlassSelect<GoalKind>
              value={kind}
              onChange={setKind}
              aria-label="Goal type"
              options={KIND_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
            <span className="habit-form__hint">{KIND_OPTIONS.find((o) => o.value === kind)?.hint}</span>
          </div>

          <label className="habit-form__field">
            <span className="habit-form__label">Start date</span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </label>

          <label className="habit-form__field">
            <span className="habit-form__label">End date</span>
            <input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} required />
            <span className="habit-form__hint">Goal is inactive after this date.</span>
          </label>

          {kind === "consistency" ? (
            <div className="habit-form__field">
              <span className="habit-form__label">Days per week (each activity)</span>
              <FormNumericStepper value={daysPerWeek} onChange={setDaysPerWeek} min={1} max={7} step={1} />
            </div>
          ) : (
            <>
              <div className="habit-form__field">
                <span className="habit-form__label">Target total</span>
                <FormNumericStepper value={targetTotal} onChange={setTargetTotal} min={1} max={9999} step={1} />
              </div>
              <label className="habit-form__field">
                <span className="habit-form__label">Unit (optional)</span>
                <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="h, km, pages…" />
              </label>
            </>
          )}

          <div className="habit-form__field">
            <span className="habit-form__label">
              Linked activities
              {selectedCount > 0 ? (
                <span className="goal-activity-picker__count"> ({selectedCount} selected)</span>
              ) : null}
            </span>
            {habitOptions.length === 0 ? (
              <p className="habit-form__hint">Add an activity first, then link it here.</p>
            ) : (
              <div className="goal-activity-picker" role="group" aria-label="Linked activities">
                {habitOptions.map((h) => (
                  <label key={h.id} className="habit-form__check goal-activity-picker__row">
                    <input type="checkbox" checked={selectedIds.has(h.id)} onChange={() => toggleHabit(h.id)} />
                    <span>{habitLabel(h)}</span>
                  </label>
                ))}
              </div>
            )}
            <span className="habit-form__hint">{activityHint}</span>
          </div>
        </div>

        <div className="form-actions form-actions--modal">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={!name.trim() || selectedCount === 0}>
            {isEdit ? "Save changes" : "Save goal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
