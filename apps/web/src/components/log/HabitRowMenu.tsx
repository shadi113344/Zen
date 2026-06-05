import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PressMenuOption } from "@/hooks/usePressRadialMenu";

const BTN_SIZE = 50;
const BTN_HIGHLIGHT = 75;
const RADIUS = 92;
const RADIUS_HIGHLIGHT = 108;
/** Nudge cluster slightly lower and left of the hollow circle center */
const ORIGIN_OFFSET_X = -14;
const ORIGIN_OFFSET_Y = 10;

interface HabitRowMenuProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  highlightId: string | null;
  options: PressMenuOption[];
}

function spreadAngles(count: number): number[] {
  const startDeg = 198;
  const endDeg = 285;
  if (count <= 1) return [((startDeg + endDeg) / 2 * Math.PI) / 180];
  const start = (startDeg * Math.PI) / 180;
  const end = (endDeg * Math.PI) / 180;
  return Array.from({ length: count }, (_, i) => start + (i / (count - 1)) * (end - start));
}

function polar(angle: number, radius: number) {
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function MenuOptionIcon({ id, icon, highlighted }: { id: string; icon: string; highlighted: boolean }) {
  if (id === "reminder") {
    return (
      <span
        className={`habit-row-menu__icon habit-row-menu__icon--bell${highlighted ? " habit-row-menu__icon--bell-lg" : ""}`}
        aria-hidden
      />
    );
  }
  return <span className="habit-row-menu__icon" aria-hidden>{icon}</span>;
}

export function HabitRowMenu({ anchorRef, open, highlightId, options }: HabitRowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState({ left: 0, top: 0 });

  const angles = useMemo(() => spreadAngles(options.length), [options.length]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setOrigin({
      left: rect.left + rect.width / 2 + ORIGIN_OFFSET_X,
      top: rect.top + rect.height / 2 + ORIGIN_OFFSET_Y,
    });
  }, [open, anchorRef, options.length, highlightId]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="habit-row-menu"
      role="menu"
      style={{ left: origin.left, top: origin.top }}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      {options.map((opt, index) => {
        const highlighted = highlightId === opt.id;
        const size = highlighted ? BTN_HIGHLIGHT : BTN_SIZE;
        const radius = highlighted ? RADIUS_HIGHLIGHT : RADIUS;
        const { x, y } = polar(angles[index], radius);
        return (
          <button
            key={opt.id}
            type="button"
            data-menu-option={opt.id}
            className={`habit-row-menu__btn${highlighted ? " habit-row-menu__btn--highlight" : ""}`}
            role="menuitem"
            aria-label={opt.label}
            tabIndex={-1}
            style={
              {
                "--pop-x": `${x}px`,
                "--pop-y": `${y}px`,
                width: size,
                height: size,
                animationDelay: `${index * 40}ms`,
              } as React.CSSProperties
            }
          >
            <MenuOptionIcon id={opt.id} icon={opt.icon} highlighted={highlighted} />
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
