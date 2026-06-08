import { DASHBOARD_CARD_LABELS } from "@/lib/dashboard-cards";

interface AddWidgetSheetProps {
  hiddenIds: string[];
  onAdd: (id: string) => void;
  onClose: () => void;
}

const WIDGET_ICONS: Record<string, string> = {
  taskStats: "✓",
  activityRadar: "◎",
  categoryRadar: "◉",
  metrics: "≡",
  heatmap: "▦",
  dayScores: "▁▃▅▇",
  bestHabit: "★",
  activityList: "☰",
  browse: "→",
};

export function AddWidgetSheet({ hiddenIds, onAdd, onClose }: AddWidgetSheetProps) {
  if (hiddenIds.length === 0) {
    return (
      <div className="add-widget-sheet">
        <div className="add-widget-sheet__header">
          <span className="add-widget-sheet__title">Add widget</span>
          <button type="button" className="add-widget-sheet__close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="add-widget-sheet__empty">All widgets are visible.</p>
      </div>
    );
  }

  return (
    <div className="add-widget-sheet">
      <div className="add-widget-sheet__header">
        <span className="add-widget-sheet__title">Add widget</span>
        <button type="button" className="add-widget-sheet__close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="add-widget-sheet__grid">
        {hiddenIds.map((id) => (
          <button
            key={id}
            type="button"
            className="add-widget-tile"
            onClick={() => { onAdd(id); onClose(); }}
          >
            <span className="add-widget-tile__icon">{WIDGET_ICONS[id] ?? "□"}</span>
            <span className="add-widget-tile__label">
              {DASHBOARD_CARD_LABELS[id as keyof typeof DASHBOARD_CARD_LABELS] ?? id}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
