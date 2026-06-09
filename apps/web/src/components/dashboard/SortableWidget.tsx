import type { ReactNode } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
 * Reflow is handled entirely by dnd-kit's useSortable transforms: when a tile
 * is dragged, every other tile gets a CSS transform that slides it to its new
 * slot, and dnd-kit smoothly transitions it. The dragged tile itself is hidden
 * (opacity 0) while the DragOverlay renders the floating ghost. No framer-motion
 * layout animation — a single reflow system avoids the flicker/jank that comes
 * from two systems both moving the same element.
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

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // The source tile is hidden while the overlay ghost is lifted.
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  const sizeIcon: Record<WidgetSize, string> = {
    bar:   "━",
    small: "◻",
    large: "▭",
    full:  "▯",
  };

  // Cycle bar → small → large → full → bar on each tap of the size toggle.
  const sizeIndex = WIDGET_SIZE_ORDER.indexOf(item.size);
  const nextSize = WIDGET_SIZE_ORDER[(sizeIndex + 1) % WIDGET_SIZE_ORDER.length];

  return (
    <div
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
            <button
              type="button"
              className="widget-cell__size-toggle"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onResize(nextSize)}
              title={`Size: ${WIDGET_SIZE_LABELS[item.size]} — tap for ${WIDGET_SIZE_LABELS[nextSize]}`}
              aria-label={`Resize widget. Current size ${WIDGET_SIZE_LABELS[item.size]}, tap for ${WIDGET_SIZE_LABELS[nextSize]}`}
            >
              <span className="widget-cell__size-glyph">{sizeIcon[item.size]}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
