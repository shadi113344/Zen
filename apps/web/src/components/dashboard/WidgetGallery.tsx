import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DASHBOARD_CARD_LABELS,
  DEFAULT_WIDGET_SIZES,
  WIDGET_SIZE_LABELS,
  WIDGET_SIZE_ORDER,
  type DashboardCardId,
  type WidgetSize,
} from "@/lib/dashboard-cards";

interface WidgetGalleryProps {
  hiddenIds: string[];
  onAdd: (id: string, size: WidgetSize) => void;
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

export function WidgetGallery({ hiddenIds, onAdd, onClose }: WidgetGalleryProps) {
  // Per-tile chosen size, defaulting to each widget's natural size.
  const [sizes, setSizes] = useState<Record<string, WidgetSize>>(() =>
    Object.fromEntries(hiddenIds.map((id) => [id, DEFAULT_WIDGET_SIZES[id as DashboardCardId]])),
  );

  return (
    <motion.div
      className="widget-gallery__scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
    >
      <motion.div
        className="widget-gallery"
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="widget-gallery__header">
          <span className="widget-gallery__title">Add a widget</span>
          <button type="button" className="widget-gallery__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {hiddenIds.length === 0 ? (
          <p className="widget-gallery__empty">Every widget is already on your dashboard.</p>
        ) : (
          <div className="widget-gallery__list">
            <AnimatePresence>
              {hiddenIds.map((id) => {
                const size = sizes[id] ?? DEFAULT_WIDGET_SIZES[id as DashboardCardId];
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="widget-gallery__row"
                  >
                    <span className="widget-gallery__icon">{WIDGET_ICONS[id] ?? "□"}</span>
                    <span className="widget-gallery__label">
                      {DASHBOARD_CARD_LABELS[id as DashboardCardId] ?? id}
                    </span>
                    <div className="widget-gallery__sizes">
                      {WIDGET_SIZE_ORDER.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`widget-gallery__size${s === size ? " is-active" : ""}`}
                          onClick={() => setSizes((m) => ({ ...m, [id]: s }))}
                          title={WIDGET_SIZE_LABELS[s]}
                        >
                          {s === "full" ? "▭" : "◧"}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="widget-gallery__add"
                      onClick={() => onAdd(id, size)}
                    >
                      Add
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
