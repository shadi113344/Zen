import { type ReactNode } from "react";
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
  anyDragging: boolean;
  children: ReactNode;
  onRemove: () => void;
  onResize: (size: WidgetSize) => void;
}

const SIZE_ICON: Record<WidgetSize, string> = {
  bar:   "━",
  small: "◻",
  large: "▬",
  full:  "▯",
  max1:  "⬛",
  max2:  "▮",
};

export function SortableWidget({
  item,
  editMode,
  isActive,
  anyDragging,
  children,
  onRemove,
  onResize,
}: SortableWidgetProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  // While a drag is in progress, dnd-kit drives motion via a CSS translate
  // (translate ONLY — never scale, so neighbours never stretch). When idle,
  // we hand control to framer-motion `layout` so a size change animates
  // smoothly. The two never run at once.
  const style: React.CSSProperties = anyDragging
    ? {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        zIndex: isDragging ? 2 : undefined,
      }
    : {};

  // Cycle bar → small → large → full → bar on each tap.
  const sizeIndex = WIDGET_SIZE_ORDER.indexOf(item.size);
  const nextSize = WIDGET_SIZE_ORDER[(sizeIndex + 1) % WIDGET_SIZE_ORDER.length];

  return (
    <motion.div
      layout={!anyDragging}
      transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.7 }}
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
    >
      <div className="widget-cell__inner">
        {children}

        {/* Size cycle badge — top-right, always visible */}
        <button
          type="button"
          className="widget-cell__size-toggle"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onResize(nextSize)}
          title={`${WIDGET_SIZE_LABELS[item.size]} → ${WIDGET_SIZE_LABELS[nextSize]}`}
          aria-label={`Card size: ${WIDGET_SIZE_LABELS[item.size]}. Tap to switch to ${WIDGET_SIZE_LABELS[nextSize]}`}
        >
          {SIZE_ICON[item.size]}
        </button>

        {editMode && (
          <button
            type="button"
            className="widget-cell__remove"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            aria-label="Remove widget"
          >
            ×
          </button>
        )}
      </div>
    </motion.div>
  );
}
