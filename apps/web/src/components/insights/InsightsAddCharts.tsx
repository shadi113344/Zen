import { useState } from "react";

export interface ChartPickerOption {
  id: string;
  label: string;
}

interface InsightsAddChartsProps {
  hidden: ChartPickerOption[];
  onAdd: (id: string) => void;
}

export function InsightsAddCharts({ hidden, onAdd }: InsightsAddChartsProps) {
  const [open, setOpen] = useState(false);

  if (hidden.length === 0) return null;

  return (
    <div className="insights-add-charts">
      <button
        type="button"
        className="btn btn--ghost btn--sm insights-add-charts__btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        + Add chart
      </button>
      {open ? (
        <div className="insights-add-charts__menu card" role="listbox" aria-label="Add chart">
          {hidden.map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="option"
              className="insights-add-charts__option"
              onClick={() => {
                onAdd(opt.id);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
