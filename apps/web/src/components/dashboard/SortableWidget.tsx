import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  WIDGET_SIZE_LABELS,
  WIDGET_SIZE_ORDER,
  type WidgetItem,
  type WidgetSize,
} from "@/lib/dashboard-cards";

interface SortableWidgetProps {
  item: WidgetItem;
  editMode: boolean;
  isActive: boolean;
  children: ReactNode;
  onRemove: () => void;
  onResize: (size: WidgetSize) => void;
}

/**
 * One dashboard tile.
 *
 * Drag split: dnd-kit provides gesture detection (setNodeRef, listeners,
 * isDragging). framer-motion layout provides position animation for all tiles
 * when the array order changes mid-drag. The two must not both apply a CSS
 * transform to non-active tiles — so we suppress useSortable's transform on
 * non-dragging tiles and let framer-motion FLIP them instead.
 */
export function SortableWidget({
  item,
  editMode,
  isActive,
  children,
  onRemove,
  onResize,
}: SortableWidgetProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  // Only apply useSortable's CSS transform to the ACTIVE tile (which becomes
  // invisible anyway — the DragOverlay is the visible ghost). Non-active tiles
  // are animated by framer-motion layout alone so the two don't conflict.
  const style: React.CSSProperties = isDragging
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    : {};

  const sizeIcon: Record<WidgetSize, string> = {
    bar:   "━",
    small: "▪",
    large: "▬",
    full:  "▭",
  };

  return (
    <motion.div
      layout="position"
      layoutId={item.id}
      initial={false}
      ref={setNodeRef}
      style={style}
      className={[
        "widget-cell",
        `widget-cell--${item.size}`,
        editMode ? "widget-cell--edit" : "",
        isActive ? "widget-cell--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-widget-id={item.id}
      {...attributes}
      {...listeners}
      transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.6 }}
    >
      <div className="widget-cell__inner">
        {children}

        {editMode && (
          <>
            <button
              type="button"
              className="widget-cell__remove"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onRemove}
              aria-label="Remove widget"
            >
              ×
            </button>
            <div
              className="widget-cell__sizes"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {WIDGET_SIZE_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`widget-cell__size${s === item.size ? " is-active" : ""}`}
                  onClick={() => onResize(s)}
                  title={WIDGET_SIZE_LABELS[s]}
                  aria-label={`Resize to ${WIDGET_SIZE_LABELS[s]}`}
                >
                  {sizeIcon[s]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
