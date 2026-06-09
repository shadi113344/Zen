import { useRef, useState, type ReactNode } from "react";
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
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number } | null>(null);

  const dragMovedRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const activeItem = activeId ? items.find((w) => w.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setActiveId(id);
    dragMovedRef.current = false;

    // Prefer dnd-kit's measured rect, fall back to querying the DOM directly
    // (dnd-kit's rect can be null on the first touch event on some browsers).
    const dndRect = e.active.rect.current.initial;
    if (dndRect) {
      setOverlaySize({ width: dndRect.width, height: dndRect.height });
    } else {
      const el = document.querySelector<HTMLElement>(`[data-widget-id="${id}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setOverlaySize({ width: r.width, height: r.height });
      }
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    setOverlaySize(null);

    if (!over) return;

    if (active.id === over.id) {
      // Dropped on itself without moving — in edit mode this could be a folder
      // intent if released directly atop another tile, but closestCenter sets
      // over === active when stationary, so nothing to do here.
      return;
    }

    const from = items.findIndex((w) => w.id === active.id);
    const to = items.findIndex((w) => w.id === over.id);
    if (from < 0 || to < 0) return;

    // A near-stationary drop directly onto another tile = folder intent.
    if (editMode && !dragMovedRef.current) {
      onCreateFolder(String(active.id), String(over.id));
      return;
    }

    onFinalOrder(arrayMove(items, from, to));
  }

  const renderOrder = items.map((w) => w.id);
  const itemById = new Map(items.map((w) => [w.id, w]));
  const folderById = new Map(
    tiles.filter(isFolderItem).map((f) => [f.id, f] as const),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragMove={() => { dragMovedRef.current = true; }}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setOverlaySize(null);
      }}
    >
      <SortableContext items={renderOrder} strategy={rectSortingStrategy}>
        <div className={`widget-grid${editMode ? " widget-grid--edit" : ""}`}>
          {renderOrder.map((id) => {
            const folder = folderById.get(id);
            if (folder) {
              return (
                <SortableWidget
                  key={folder.id}
                  item={{ id: folder.id, size: "full" }}
                  editMode={editMode}
                  isActive={folder.id === activeId}
                  onRemove={() => onRemove(folder.id)}
                  onResize={() => {}}
                >
                  {renderFolder(folder)}
                </SortableWidget>
              );
            }
            const liveItem = itemById.get(id);
            const renderCard = cards[id];
            if (!liveItem || !renderCard) return null;
            return (
              <SortableWidget
                key={id}
                item={liveItem}
                editMode={editMode}
                isActive={id === activeId}
                onRemove={() => onRemove(id)}
                onResize={(size) => onResize(id, size)}
              >
                {renderCard(liveItem.size)}
              </SortableWidget>
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
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
