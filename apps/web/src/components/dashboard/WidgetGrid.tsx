import { useRef, type ReactNode } from "react";
import { useGridDrag } from "@/hooks/useGridDrag";
import { WidgetShell } from "@/components/dashboard/WidgetShell";
import type { WidgetPlacement } from "@/lib/dashboard-cards";

interface WidgetGridProps {
  widgets: WidgetPlacement[];
  cards: Record<string, ReactNode | null | undefined>;
  editMode: boolean;
  onMove: (id: string, col: number, row: number) => void;
  onRemove: (id: string) => void;
  onResize: (id: string, colSpan: WidgetPlacement["colSpan"], rowSpan: WidgetPlacement["rowSpan"]) => void;
  isOccupied: (col: number, row: number, colSpan: number, rowSpan: number, excludeId?: string) => boolean;
}

export function WidgetGrid({
  widgets,
  cards,
  editMode,
  onMove,
  onRemove,
  onResize,
  isOccupied,
}: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { draggingId, pendingId, dropTarget, getDragProps } = useGridDrag({
    containerRef,
    widgets,
    onMove,
    isOccupied,
  });

  // Calculate how many rows the grid spans for the drop zone overlay
  const totalRows = Math.max(...widgets.map((w) => w.row + w.rowSpan), 1);

  return (
    <div
      ref={containerRef}
      className={`widget-grid${editMode ? " widget-grid--edit" : ""}${draggingId ? " widget-grid--dragging" : ""}`}
    >
      {widgets.map((w) => {
        const content = cards[w.id];
        if (content == null) return null;
        const isDragging = draggingId === w.id;
        const isPending = pendingId === w.id;

        return (
          <div
            key={w.id}
            className={[
              "widget-cell",
              editMode ? "widget-cell--edit" : "",
              isDragging ? "widget-cell--dragging" : "",
              isPending ? "widget-cell--pending" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              gridColumn: `${w.col + 1} / span ${w.colSpan}`,
              gridRow: `${w.row + 1} / span ${w.rowSpan}`,
            }}
            {...getDragProps(w.id)}
          >
            <WidgetShell
              placement={w}
              editMode={editMode}
              onRemove={() => onRemove(w.id)}
              onResize={(cs, rs) => onResize(w.id, cs, rs)}
            >
              {content}
            </WidgetShell>
          </div>
        );
      })}

      {/* Drop zone overlay — only shown during active drag */}
      {draggingId && (
        <div className="widget-drop-overlay" aria-hidden>
          {Array.from({ length: totalRows + 2 }, (_, row) =>
            Array.from({ length: 4 }, (__, col) => {
              const draggingWidget = widgets.find((w) => w.id === draggingId);
              if (!draggingWidget) return null;
              const isTarget =
                dropTarget &&
                col >= dropTarget.col &&
                col < dropTarget.col + draggingWidget.colSpan &&
                row >= dropTarget.row &&
                row < dropTarget.row + draggingWidget.rowSpan;
              const isValid = dropTarget?.valid ?? false;

              return (
                <div
                  key={`${col},${row}`}
                  className={[
                    "widget-drop-cell",
                    isTarget && isValid ? "widget-drop-cell--valid" : "",
                    isTarget && !isValid ? "widget-drop-cell--invalid" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    gridColumn: `${col + 1}`,
                    gridRow: `${row + 1}`,
                  }}
                />
              );
            }),
          )}
        </div>
      )}
    </div>
  );
}
