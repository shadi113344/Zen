import { useEffect, useRef, useState } from "react";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";

export interface SubTabItem {
  value: string;
  label: string;
}

interface SubTabBarProps {
  items: SubTabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

export function SubTabBar({ items, value, onChange, ariaLabel, className }: SubTabBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const visual = pressed ?? value;
  const indicator = useSlidingIndicator(trackRef, ".sub-tab-bar__btn--active", [value, items.length]);
  useEffect(() => {
    setPressed(null);
  }, [value]);

  const rootClass = ["sub-tab-bar", className ?? ""].filter(Boolean).join(" ");

  return (
    <div ref={trackRef} className={rootClass} role="tablist" aria-label={ariaLabel}>
      <span
        className="sub-tab-bar__indicator"
        aria-hidden
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.left}px)`,
          opacity: indicator.ready ? 1 : 0,
        }}
      />
      {items.map((item) => (
        <button
          key={item.value || "__all"}
          type="button"
          role="tab"
          aria-selected={visual === item.value}
          className={`sub-tab-bar__btn${visual === item.value ? " sub-tab-bar__btn--active" : ""}`}
          onPointerDown={() => setPressed(item.value)}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
