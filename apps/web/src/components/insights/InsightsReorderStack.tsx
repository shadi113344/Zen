import type { ReactNode } from "react";
import { usePointerReorder } from "@/hooks/usePointerReorder";

interface InsightsReorderStackProps {
  order: readonly string[];
  onSwap: (fromId: string, toId: string) => void;
  cards: Record<string, ReactNode | null | undefined>;
}

export function InsightsReorderStack({ order, onSwap, cards }: InsightsReorderStackProps) {
  const { draggingId, pendingId, getDragProps } = usePointerReorder(onSwap, "data-insight-card");

  return (
    <div className="insights-reorder-stack">
      {order.map((id) => {
        const content = cards[id];
        if (content == null) return null;
        const dragging = draggingId === id;
        const pending = pendingId === id;
        const dragClass = [
          "insights-reorder-card",
          dragging ? "insights-reorder-card--dragging" : "",
          pending ? "insights-reorder-card--pending" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={id} className={dragClass} {...getDragProps(id)}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
