import type { ReactNode } from "react";
import type { DashboardCardId } from "@/lib/dashboard-cards";

interface WidgetFolderTileProps {
  folderId: string;
  childIds: DashboardCardId[];
  cards: Record<string, (size: "small") => ReactNode | null | undefined>;
  name?: string;
  onClick: () => void;
  onRemove: () => void;
  editMode: boolean;
}

/** Renders a 2×2 mosaic of mini widget previews representing a folder. */
export function WidgetFolderTile({
  childIds,
  cards,
  name,
  onClick,
  onRemove,
  editMode,
}: WidgetFolderTileProps) {
  const previews = childIds.slice(0, 4);

  return (
    <button
      type="button"
      className="widget-folder-tile card"
      onClick={onClick}
      aria-label={`Open folder${name ? ` ${name}` : ""}`}
    >
      <div className="widget-folder-tile__mosaic">
        {previews.map((id) => (
          <div key={id} className="widget-folder-tile__preview">
            <div className="widget-folder-tile__preview-inner">
              {cards[id]?.("small")}
            </div>
          </div>
        ))}
        {previews.length < 4 &&
          Array.from({ length: 4 - previews.length }).map((_, i) => (
            <div key={`empty-${i}`} className="widget-folder-tile__preview widget-folder-tile__preview--empty" />
          ))}
      </div>
      {name && <p className="widget-folder-tile__name">{name}</p>}

      {editMode && (
        <button
          type="button"
          className="widget-cell__remove"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label="Remove folder"
        >
          ×
        </button>
      )}
    </button>
  );
}
