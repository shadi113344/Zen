import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { SortableWidget } from "@/components/dashboard/SortableWidget";
import { isFolderItem, type DashboardTile, type FolderItem, type WidgetItem, type WidgetSize } from "@/lib/dashboard-cards";

interface WidgetGridProps {
  tiles: DashboardTile[];
  items: WidgetItem[];
  cards: Record<string, (size: WidgetSize) => ReactNode | null | undefined>;
  editMode: boolean;
  onFinalOrder: (items: WidgetItem[]) => void;
  onRemove: (id: string) => void;
  onResize: (id: string, size: WidgetSize) => void;
  onCreateFolder: (idA: string, idB: string) => void;
  renderFolder: (folder: FolderItem) => ReactNode;
}

export function WidgetGrid({
  tiles,
  items,
  cards,
  editMode,
  onFinalOrder,
  onRemove,
  onResize,
  onCreateFolder,
  renderFolder,
}: WidgetGridProps) {
  const [localItems, setLocalItems] = useState<WidgetItem[]>(items);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null);

  const dragMovedRef = useRef(false);

  useEffect(() => {
    if (!activeId) setLocalItems(items);
  }, [items, activeId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const allIds = tiles.map((t) => t.id);
  const activeItem = activeId ? localItems.find((w) => w.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    dragMovedRef.current = false;
    const rect = e.active.rect.current.initial;
    if (rect) setOverlaySize({ width: rect.width, height: rect.height });
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    dragMovedRef.current = true;
    const from = localItems.findIndex((w) => w.id === active.id);
    const to = localItems.findIndex((w) => w.id === over.id);
    if (from >= 0 && to >= 0) {
      setLocalItems((prev) => arrayMove(prev, from, to));
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    const wasStationary = !dragMovedRef.current;
    setActiveId(null);
    setOverlaySize(null);
    dragMovedRef.current = false;

    if (!over) return;

    if (editMode && wasStationary && over.id !== active.id) {
      onCreateFolder(String(active.id), String(over.id));
      return;
    }

    onFinalOrder(localItems);
  }

  const localItemById = new Map(localItems.map((w) => [w.id, w]));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setOverlaySize(null);
        dragMovedRef.current = false;
        setLocalItems(items);
      }}
    >
      <SortableContext items={allIds} strategy={rectSortingStrategy}>
        <div className={`widget-grid${editMode ? " widget-grid--edit" : ""}`}>
          <AnimatePresence mode="popLayout">
            {tiles.map((tile) => {
              if (isFolderItem(tile)) {
                return (
                  <SortableWidget
                    key={tile.id}
                    item={{ id: tile.id, size: "full" }}
                    editMode={editMode}
                    isActive={tile.id === activeId}
                    onRemove={() => onRemove(tile.id)}
                    onResize={() => {}}
                  >
                    {renderFolder(tile)}
                  </SortableWidget>
                );
              }
              const liveItem = localItemById.get(tile.id) ?? tile;
              const renderCard = cards[tile.id];
              if (!renderCard) return null;
              return (
                <SortableWidget
                  key={tile.id}
                  item={liveItem}
                  editMode={editMode}
                  isActive={tile.id === activeId}
                  onRemove={() => onRemove(tile.id)}
                  onResize={(size) => onResize(tile.id, size)}
                >
                  {renderCard(liveItem.size)}
                </SortableWidget>
              );
            })}
          </AnimatePresence>
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: "ease-out" }}>
        {activeItem && overlaySize ? (
          <div
            className="widget-overlay"
            style={{ width: overlaySize.width, height: overlaySize.height }}
          >
            <div className="widget-cell__inner">
              {cards[activeItem.id]?.(activeItem.size)}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
