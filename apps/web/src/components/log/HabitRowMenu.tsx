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

const DEG = Math.PI / 180;
/** Extra px between adjacent option circles (beyond their diameters). */
const MENU_ITEM_PAD_PX = 10;
/** Fan center — left of the trigger, biased slightly upward. */
const FAN_CENTER_DEG = 233;

/**
 * Minimum angle (rad) between option centers so circles don't overlap on the arc.
 * Chord between centers at radius R: 2R·sin(Δθ/2) ≥ diameter + pad.
 */
function minAngleStepRad(diameter: number, radius: number, pad: number): number {
  const ratio = Math.min(1, (diameter + pad) / (2 * radius));
  return 2 * Math.asin(ratio);
}

/**
 * Fan options top → bottom along the left arc (edit highest, delete lowest).
 * Order follows the `options` array from the parent. Arc span grows with item count.
 */
function layoutMenuAngles(options: PressMenuOption[]): Map<string, number> {
  const angles = new Map<string, number>();
  const n = options.length;
  if (n === 0) return angles;

  if (n === 1) {
    angles.set(options[0]!.id, FAN_CENTER_DEG * DEG);
    return angles;
  }

  // Space for the largest button at the default radius (highlight size is the worst case).
  const stepRad = minAngleStepRad(BTN_HIGHLIGHT, RADIUS, MENU_ITEM_PAD_PX);
  const halfSpanRad = ((n - 1) * stepRad) / 2;
  const centerRad = FAN_CENTER_DEG * DEG;

  options.forEach((opt, i) => {
    angles.set(opt.id, centerRad + halfSpanRad - i * stepRad);
  });

  return angles;
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
  if (id === "delete") {
    return (
      <span
        className={`habit-row-menu__icon habit-row-menu__icon--trash${highlighted ? " habit-row-menu__icon--trash-lg" : ""}`}
        aria-hidden
      />
    );
  }
  return <span className="habit-row-menu__icon" aria-hidden>{icon}</span>;
}

export function HabitRowMenu({ anchorRef, open, highlightId, options }: HabitRowMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState({ left: 0, top: 0 });

  const angleById = useMemo(() => layoutMenuAngles(options), [options]);

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
        const isDelete = opt.id === "delete";
        const size = highlighted ? BTN_HIGHLIGHT : BTN_SIZE;
        const radius = highlighted ? RADIUS_HIGHLIGHT : RADIUS;
        const angle = angleById.get(opt.id) ?? 0;
        const { x, y } = polar(angle, radius);
        return (
          <button
            key={opt.id}
            type="button"
            data-menu-option={opt.id}
            className={`habit-row-menu__btn${highlighted ? " habit-row-menu__btn--highlight" : ""}${isDelete ? " habit-row-menu__btn--delete" : ""}`}
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
