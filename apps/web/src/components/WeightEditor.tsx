import { useState } from "react";
import {
  applyLockedWeightChange,
  snapWeight,
  WEIGHT_SLIDER_STEP,
  type WeightItem,
} from "@/lib/weight-editor";

export { snapWeight, WEIGHT_SLIDER_STEP, type WeightItem } from "@/lib/weight-editor";

interface WeightEditorProps {
  items: WeightItem[];
  habits: Array<{ id: string; name: string; category: string }>;
  onChange: (items: WeightItem[]) => void;
  onNormalize: () => void;
}

export function WeightEditor({ items, habits, onChange, onNormalize }: WeightEditorProps) {
  const [locked, setLocked] = useState(true);
  const total = items.reduce((s, i) => s + snapWeight(i.weight), 0);

  const handleWeightChange = (index: number, raw: number) => {
    if (locked) {
      onChange(applyLockedWeightChange(items, index, raw));
      return;
    }
    const next = [...items];
    next[index] = { ...next[index]!, weight: snapWeight(raw) };
    onChange(next);
  };

  return (
    <div className="weight-editor">
      <div className="weight-editor__header">
        <span className="weight-editor__sum">Weights: {total}%</span>
        <div className="weight-editor__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={onNormalize}>
            Normalize
          </button>
          <button
            type="button"
            className={`weight-editor__lock-btn${locked ? " weight-editor__lock-btn--locked" : ""}`}
            onClick={() => setLocked((v) => !v)}
            aria-label={locked ? "Unlock sliders" : "Lock sliders to 100%"}
            aria-pressed={locked}
            title={locked ? "Locked — sliders stay at 100% total" : "Unlocked — adjust each slider independently"}
          />
        </div>
      </div>
      {items.map((item, index) => {
        const habit = habits.find((h) => h.id === item.habitId);
        if (!habit) return null;
        const weight = snapWeight(item.weight);
        return (
          <div key={item.habitId} className="weight-editor__row">
            <div className="weight-editor__habit">
              <span className="weight-editor__name">{habit.name}</span>
            </div>
            <div className="weight-editor__control">
              <input
                type="range"
                min={0}
                max={100}
                step={WEIGHT_SLIDER_STEP}
                value={weight}
                onChange={(e) => handleWeightChange(index, Number(e.target.value))}
                className="weight-editor__slider"
              />
              <span className="weight-editor__pct">{weight}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
