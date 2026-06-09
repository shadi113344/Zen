import { useRef, type ReactNode } from "react";
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

const SIZE_ICON: Record<WidgetSize, string> = {
  bar:   "━",
  small: "◻",
  large: "▬",
  full:  "▯",
};

export function SortableWidget({
  item,
  editMode,
  isActive,
  children,
  onRemove,
  onResize,
}: SortableWidgetProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  // Cycle bar → small → large → full → bar on each tap.
  const sizeIndex = WIDGET_SIZE_ORDER.indexOf(item.size);
  const nextSize = WIDGET_SIZE_ORDER[(sizeIndex + 1) % WIDGET_SIZE_ORDER.length];

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        (wrapRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
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

        {/* Size cycle badge — always visible so users discover it without entering edit mode */}
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
    </div>
  );
}
