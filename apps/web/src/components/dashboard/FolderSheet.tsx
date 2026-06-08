import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { DashboardCardId, WidgetSize } from "@/lib/dashboard-cards";

interface FolderSheetProps {
  folderId: string;
  childIds: DashboardCardId[];
  cards: Record<string, (size: WidgetSize) => ReactNode | null | undefined>;
  name?: string;
  onClose: () => void;
  onDissolve: () => void;
}

export function FolderSheet({ childIds, cards, name, onClose, onDissolve }: FolderSheetProps) {
  return (
    <>
      {/* Scrim */}
      <motion.div
        className="folder-sheet__scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="folder-sheet"
        role="dialog"
        aria-label={name ?? "Folder"}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
      >
        <div className="folder-sheet__handle" />

        <div className="folder-sheet__header">
          <h2 className="folder-sheet__title">{name ?? "Folder"}</h2>
          <div className="folder-sheet__actions">
            <button
              type="button"
              className="folder-sheet__dissolve"
              onClick={onDissolve}
            >
              Ungroup
            </button>
            <button type="button" className="folder-sheet__close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <div className="folder-sheet__grid">
          {childIds.map((id) => {
            const render = cards[id];
            if (!render) return null;
            return (
              <div key={id} className="folder-sheet__widget">
                {render("large")}
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
