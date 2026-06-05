import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Modal } from "@/components/Modal";
import { hasCategoryName } from "@/lib/all-categories";
import { CATEGORY_PASTEL_PRESETS, snapCategoryPastel } from "@/lib/theme-colors";
import { useCategoryColors, useHabits } from "@/hooks/useData";

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_COLOR = CATEGORY_PASTEL_PRESETS[0]!.color;

export function AddCategoryModal({ open, onClose }: AddCategoryModalProps) {
  const { habits } = useHabits();
  const { categoryColors, setCategoryColor } = useCategoryColors();
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setColor(DEFAULT_COLOR);
    setError("");
  }, [open]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a category name.");
      return;
    }
    if (hasCategoryName(trimmed, habits, categoryColors)) {
      setError("That category already exists.");
      return;
    }
    setCategoryColor(trimmed, snapCategoryPastel(color));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add category">
      <form className="add-category-form" onSubmit={submit}>
        <label className="field">
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g. Nutrition"
            required
            autoFocus
          />
        </label>

        <div className="field">
          <span>Color</span>
          <div className="add-category-form__swatches" role="radiogroup" aria-label="Category color">
            {CATEGORY_PASTEL_PRESETS.map((preset) => (
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
          <p className="add-category-form__color-label">
            {CATEGORY_PASTEL_PRESETS.find((p) => p.color === color)?.label ?? "Custom"}
          </p>
        </div>

        {error && (
          <p className="add-category-form__error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            Save category
          </button>
        </div>
      </form>
    </Modal>
  );
}
