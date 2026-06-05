import { useEffect, useRef, useState } from "react";
import { useSlidingIndicator } from "@/hooks/useSlidingIndicator";

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
  className?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pressed, setPressed] = useState<T | null>(null);
  const visual = pressed ?? value;
  const indicator = useSlidingIndicator(trackRef, ".seg-control__btn--active", [value, options.length]);

  useEffect(() => {
    setPressed(null);
  }, [value]);

  const rootClass = ["seg-control", className ?? ""].filter(Boolean).join(" ");

  return (
    <div ref={trackRef} className={rootClass} role="tablist" aria-label={ariaLabel}>
      <span
        className="seg-control__indicator"
        aria-hidden
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.left}px)`,
          opacity: indicator.ready ? 1 : 0,
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={visual === opt.value}
          className={`seg-control__btn${visual === opt.value ? " seg-control__btn--active" : ""}`}
          onPointerDown={() => setPressed(opt.value)}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
