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
  taskStats:     "✓",
  activityRadar: "◎",
  categoryRadar: "◉",
  metrics:       "≡",
  heatmap:       "▦",
  dayScores:     "▁▃▅▇",
  bestHabit:     "★",
  activityList:  "☰",
  browse:        "→",
};

const SIZE_ICON: Record<WidgetSize, string> = {
  bar:   "━",
  small: "▪",
  large: "▬",
  full:  "▭",
  max1:  "⬛",
  max2:  "▮",
};

export function WidgetGallery({ hiddenIds, onAdd, onClose }: WidgetGalleryProps) {
  const [sizes, setSizes] = useState<Record<string, WidgetSize>>(() =>
    Object.fromEntries(hiddenIds.map((id) => [id, DEFAULT_WIDGET_SIZES[id as DashboardCardId]])),
  );

  return (
    <>
      {/* Scrim */}
      <motion.div
        className="widget-gallery__scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
      />

      {/* Sheet slides up from bottom */}
      <motion.div
        className="widget-gallery"
        role="dialog"
        aria-label="Add a widget"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="widget-gallery__handle" />

        <div className="widget-gallery__header">
          <span className="widget-gallery__title">Add a widget</span>
          <button type="button" className="widget-gallery__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {hiddenIds.length === 0 ? (
          <p className="widget-gallery__empty">Every widget is on your dashboard.</p>
        ) : (
          <div className="widget-gallery__list">
            <AnimatePresence>
              {hiddenIds.map((id) => {
                const size = sizes[id] ?? DEFAULT_WIDGET_SIZES[id as DashboardCardId];
                return (
                  <motion.div
                    key={id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
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
                          {SIZE_ICON[s]}
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
    </>
  );
}
