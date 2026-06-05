import { useEffect, useRef, useState, type ReactNode } from "react";

interface ChartChromeProps {
  children: ReactNode;
  className?: string;
  onRemove?: () => void;
}

/** Top-right circle menu for charts (delete now; more actions later). */
export function ChartChrome({ children, className, onRemove }: ChartChromeProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className={["chart-chrome", className ?? ""].filter(Boolean).join(" ")}>
      <button
        type="button"
        className="chart-chrome__trigger"
        aria-label="Chart options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      />
      {open && (
        <div className="chart-chrome__menu" role="menu">
          {onRemove ? (
            <button
              type="button"
              role="menuitem"
              className="chart-chrome__menu-item"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
            >
              Delete
            </button>
          ) : (
            <span className="chart-chrome__menu-empty muted-text">No actions yet</span>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
