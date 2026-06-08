import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { SortableWidget } from "@/components/dashboard/SortableWidget";
import type { WidgetItem, WidgetSize } from "@/lib/dashboard-cards";

interface WidgetGridProps {
  items: WidgetItem[];
  cards: Record<string, ReactNode | null | undefined>;
  editMode: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
  onResize: (id: string, size: WidgetSize) => void;
}

export function WidgetGrid({ items, cards, editMode, onReorder, onRemove, onResize }: WidgetGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    // Mouse/trackpad: small drag threshold so taps still click through.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Touch: short long-press to pick up, with slop tolerance.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const ids: string[] = items.map((w) => w.id);
  const activeItem = activeId ? items.find((w) => w.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onReorder(from, to);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className={`widget-grid${editMode ? " widget-grid--edit" : ""}`}>
          {items.map((item) => {
            const content = cards[item.id];
            if (content == null) return null;
            return (
              <SortableWidget
                key={item.id}
                item={item}
                editMode={editMode}
                onRemove={() => onRemove(item.id)}
                onResize={(size) => onResize(item.id, size)}
              >
                {content}
              </SortableWidget>
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.18, 0.67, 0.36, 1.1)" }}>
        {activeItem ? (
          <div className={`widget-cell widget-cell--${activeItem.size} widget-overlay`}>
            <div className="widget-cell__inner">{cards[activeItem.id]}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
