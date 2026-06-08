import type { ReactNode } from "react";
import type { WidgetPlacement } from "@/lib/dashboard-cards";

interface WidgetShellProps {
  placement: WidgetPlacement;
  editMode: boolean;
  onRemove: () => void;
  onResize: (colSpan: WidgetPlacement["colSpan"], rowSpan: WidgetPlacement["rowSpan"]) => void;
  children: ReactNode;
}

/** Cycles through size presets for a widget. */
function nextSize(
  colSpan: WidgetPlacement["colSpan"],
  rowSpan: WidgetPlacement["rowSpan"],
): [WidgetPlacement["colSpan"], WidgetPlacement["rowSpan"]] {
  if (colSpan === 1 && rowSpan === 1) return [2, 1];
  if (colSpan === 2 && rowSpan === 1) return [2, 2];
  if (colSpan === 2 && rowSpan === 2) return [4, 1];
  if (colSpan === 4) return [1, 1];
  return [2, 1];
}

export function WidgetShell({ placement, editMode, onRemove, onResize, children }: WidgetShellProps) {
  return (
    <div className={`widget-shell${editMode ? " widget-shell--edit" : ""}`}>
      {children}
      {editMode && (
        <>
          <button
            type="button"
            className="widget-shell__remove"
            onClick={onRemove}
            aria-label="Remove widget"
          >
            ×
          </button>
          <button
            type="button"
            className="widget-shell__resize"
            onClick={() => {
              const [nc, nr] = nextSize(placement.colSpan, placement.rowSpan);
              onResize(nc, nr);
            }}
            aria-label="Resize widget"
            title="Resize"
          >
            ⊞
          </button>
        </>
      )}
    </div>
  );
}
