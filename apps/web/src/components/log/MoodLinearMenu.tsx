import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PressMenuOption } from "@/hooks/usePressRadialMenu";

const BTN_SIZE = 40;
const BTN_HIGHLIGHT = 46;
const MENU_PAD = 8;
const VIEWPORT_PAD = 12;

interface MoodLinearMenuProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  highlightId: string | null;
  options: PressMenuOption[];
}

function estimateMenuWidth(optionCount: number): number {
  return optionCount * (BTN_SIZE + 6) - 6 + MENU_PAD * 2 + 16;
}

export function MoodLinearMenu({ anchorRef, open, highlightId, options }: MoodLinearMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    const sync = () => {
      const anchor = anchorRef.current;
      const menu = menuRef.current;
      if (!anchor) return;

      const rect = anchor.getBoundingClientRect();
      const menuWidth = menu?.offsetWidth ?? estimateMenuWidth(options.length);
      const maxLeft = window.innerWidth - VIEWPORT_PAD;
      const minLeft = VIEWPORT_PAD + menuWidth;

      // Anchor menu's right edge to the button; shift left if it would clip off-screen.
      let left = Math.min(rect.right, maxLeft);
      left = Math.max(left, minLeft);

      setOrigin({ left, top: rect.top });
    };

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [open, anchorRef, options.length, highlightId]);

  if (!open) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="mood-linear-menu"
      role="menu"
      style={{ left: origin.left, top: origin.top }}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div className="mood-linear-menu__row">
        {options.map((opt, index) => {
          const highlighted = highlightId === opt.id;
          const size = highlighted ? BTN_HIGHLIGHT : BTN_SIZE;
          return (
            <button
              key={opt.id}
              type="button"
              data-menu-option={opt.id}
              className={`mood-linear-menu__btn${highlighted ? " mood-linear-menu__btn--highlight" : ""}`}
              role="menuitem"
              aria-label={opt.label}
              tabIndex={-1}
              style={
                {
                  width: size,
                  height: size,
                  animationDelay: `${index * 30}ms`,
                } as React.CSSProperties
              }
            >
              <span className="mood-linear-menu__emoji" aria-hidden>
                {opt.icon}
              </span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
