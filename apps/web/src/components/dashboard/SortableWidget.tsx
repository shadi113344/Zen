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
  children: ReactNode;
  onRemove: () => void;
  onResize: (size: WidgetSize) => void;
}

/**
 * A single dashboard tile. dnd-kit owns the drag transform + reflow transition;
 * the visible content lives on an inner element so the edit-mode wobble (rotate)
 * never fights the drag translate. While lifted, the source fades and the
 * DragOverlay shows the floating copy.
 */
export function SortableWidget({ item, editMode, children, onRemove, onResize }: SortableWidgetProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editMode,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "widget-cell",
        `widget-cell--${item.size}`,
        editMode ? "widget-cell--edit" : "",
        isDragging ? "widget-cell--dragging" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-widget-id={item.id}
      {...(editMode ? attributes : {})}
      {...(editMode ? listeners : {})}
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
                  {s === "wide" ? "▭" : s.toUpperCase()}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
