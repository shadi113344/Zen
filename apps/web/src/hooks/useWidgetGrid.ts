import { useCallback, useMemo, useState } from "react";
import { useData } from "@/hooks/useData";
import {
  DASHBOARD_CARDS,
  DEFAULT_WIDGET_SIZES,
  isFolderItem,
  resolveAllTiles,
  resolveWidgetItems,
  type DashboardCardId,
  type DashboardTile,
  type FolderItem,
  type WidgetItem,
  type WidgetSize,
} from "@/lib/dashboard-cards";

export function useWidgetGrid() {
  const { dashboardLayout, setDashboardLayout } = useData();
  const [editMode, setEditMode] = useState(false);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);

  // All tiles (widgets + folders) in order.
  const tiles = useMemo(() => resolveAllTiles(dashboardLayout), [dashboardLayout]);

  // Flat widget items only (used by most components).
  const items = useMemo(() => resolveWidgetItems(dashboardLayout), [dashboardLayout]);

  const hiddenIds = useMemo(() => {
    const visibleInTiles = new Set<string>();
    for (const t of tiles) {
      if (isFolderItem(t)) t.childIds.forEach((id) => visibleInTiles.add(id));
      else visibleInTiles.add(t.id);
    }
    return DASHBOARD_CARDS.filter((id) => !visibleInTiles.has(id));
  }, [tiles]);

  const commit = useCallback(
    (nextTiles: DashboardTile[]) => {
      const allCardIds = new Set<string>();
      for (const t of nextTiles) {
        if (isFolderItem(t)) t.childIds.forEach((id) => allCardIds.add(id));
        else allCardIds.add(t.id);
      }
      const hidden = DASHBOARD_CARDS.filter((id) => !allCardIds.has(id));
      setDashboardLayout({
        ...dashboardLayout,
        items: nextTiles,
        order: nextTiles.flatMap((t) => (isFolderItem(t) ? t.childIds : [t.id])),
        hidden,
      });
    },
    [dashboardLayout, setDashboardLayout],
  );

  const toggleEditMode = useCallback(() => setEditMode((v) => !v), []);

  /** Persist a fully-reordered tile array (called once on drag end). */
  const finalizeOrder = useCallback(
    (nextItems: WidgetItem[]) => {
      // Merge with any existing folders (keep them in-place based on adjacent widgets).
      const folders = tiles.filter(isFolderItem);
      const mergedTiles: DashboardTile[] = nextItems.map((w) => w as DashboardTile);
      // Re-insert folders at approximate positions (after their first child widget).
      for (const folder of folders) {
        const firstChildIdx = mergedTiles.findIndex(
          (t) => !isFolderItem(t) && folder.childIds.includes((t as WidgetItem).id),
        );
        if (firstChildIdx >= 0) {
          mergedTiles.splice(firstChildIdx + 1, 0, folder);
        } else {
          mergedTiles.push(folder);
        }
      }
      commit(mergedTiles);
    },
    [tiles, commit],
  );

  const resize = useCallback(
    (id: string, size: WidgetSize) => {
      commit(
        tiles.map((t) =>
          !isFolderItem(t) && t.id === id ? { ...t, size } : t,
        ),
      );
    },
    [tiles, commit],
  );

  const hide = useCallback(
    (id: string) => {
      commit(tiles.filter((t) => !(!isFolderItem(t) && t.id === id)));
    },
    [tiles, commit],
  );

  const show = useCallback(
    (id: string, size?: WidgetSize, atIndex?: number) => {
      if (items.some((w) => w.id === id)) return;
      const cardId = id as DashboardCardId;
      const newTile: WidgetItem = { id: cardId, size: size ?? DEFAULT_WIDGET_SIZES[cardId] };
      const next = [...tiles];
      if (atIndex != null && atIndex >= 0 && atIndex <= next.length) {
        next.splice(atIndex, 0, newTile);
      } else {
        next.push(newTile);
      }
      commit(next);
    },
    [items, tiles, commit],
  );

  /** Create a folder from two widget IDs (edit mode only). */
  const createFolder = useCallback(
    (idA: string, idB: string) => {
      const aIdx = tiles.findIndex((t) => !isFolderItem(t) && (t as WidgetItem).id === idA);
      if (aIdx < 0) return;
      const folder: FolderItem = {
        type: "folder",
        id: `folder-${Date.now()}`,
        childIds: [idA as DashboardCardId, idB as DashboardCardId],
      };
      const next = tiles.filter(
        (t) => !(!isFolderItem(t) && (idA === (t as WidgetItem).id || idB === (t as WidgetItem).id)),
      );
      next.splice(Math.max(0, aIdx - 1), 0, folder);
      commit(next);
    },
    [tiles, commit],
  );

  const dissolveFolder = useCallback(
    (folderId: string) => {
      const folderIdx = tiles.findIndex((t) => isFolderItem(t) && t.id === folderId);
      if (folderIdx < 0) return;
      const folder = tiles[folderIdx] as FolderItem;
      const restoredItems: WidgetItem[] = folder.childIds.map((id) => ({
        id,
        size: DEFAULT_WIDGET_SIZES[id],
      }));
      const next = [...tiles];
      next.splice(folderIdx, 1, ...restoredItems);
      commit(next);
    },
    [tiles, commit],
  );

  return {
    tiles,
    items,
    hiddenIds,
    editMode,
    toggleEditMode,
    finalizeOrder,
    resize,
    hide,
    show,
    createFolder,
    dissolveFolder,
    openFolderId,
    setOpenFolderId,
  };
}
