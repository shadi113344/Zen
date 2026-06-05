import { createPortal } from "react-dom";

import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";



export interface GlassSelectOption<T extends string = string> {

  value: T;

  label: string;

}



interface GlassSelectProps<T extends string> {

  value: T;

  onChange: (value: T) => void;

  options: GlassSelectOption<T>[];

  placeholder?: string;

  disabled?: boolean;

  className?: string;

  "aria-label"?: string;

}



export function GlassSelect<T extends string>({

  value,

  onChange,

  options,

  placeholder = "Select…",

  disabled,

  className,

  "aria-label": ariaLabel,

}: GlassSelectProps<T>) {

  const [open, setOpen] = useState(false);

  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);

  const menuRef = useRef<HTMLUListElement>(null);

  const listId = useId();



  const selected = options.find((o) => o.value === value);



  const syncMenuPosition = () => {

    const el = rootRef.current;

    if (!el) return;

    const rect = el.getBoundingClientRect();

    setMenuStyle({

      position: "fixed",

      top: rect.bottom + 8,

      left: rect.left,

      width: rect.width,

      zIndex: 600,

    });

  };



  useLayoutEffect(() => {

    if (!open) {

      setMenuStyle(null);

      return;

    }

    syncMenuPosition();

  }, [open]);



  useEffect(() => {

    if (!open) return;



    const onPointerDown = (e: PointerEvent) => {

      const target = e.target as Node;

      if (rootRef.current?.contains(target)) return;

      if (menuRef.current?.contains(target)) return;

      setOpen(false);

    };



    const onKeyDown = (e: globalThis.KeyboardEvent) => {

      if (e.key === "Escape") setOpen(false);

    };



    const onReposition = () => syncMenuPosition();



    document.addEventListener("pointerdown", onPointerDown);

    document.addEventListener("keydown", onKeyDown);

    window.addEventListener("resize", onReposition);

    window.addEventListener("scroll", onReposition, true);

    return () => {

      document.removeEventListener("pointerdown", onPointerDown);

      document.removeEventListener("keydown", onKeyDown);

      window.removeEventListener("resize", onReposition);

      window.removeEventListener("scroll", onReposition, true);

    };

  }, [open]);



  const pick = (next: T) => {

    onChange(next);

    setOpen(false);

  };



  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {

    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {

      e.preventDefault();

      setOpen((v) => !v);

      return;

    }

    if (e.key === "ArrowDown" || e.key === "ArrowUp") {

      e.preventDefault();

      if (!open) {

        setOpen(true);

        return;

      }

      const idx = options.findIndex((o) => o.value === value);

      const delta = e.key === "ArrowDown" ? 1 : -1;

      const next = options[(idx + delta + options.length) % options.length];

      if (next) onChange(next.value);

    }

    if (e.key === "Escape") setOpen(false);

  };



  const rootClass = [

    "glass-select",

    open ? "glass-select--open" : "",

    disabled ? "glass-select--disabled" : "",

    className ?? "",

  ]

    .filter(Boolean)

    .join(" ");



  const menu = open && menuStyle && (

    <ul

      ref={menuRef}

      className="glass-select__menu glass-select__menu--portal"

      id={listId}

      role="listbox"

      aria-label={ariaLabel}

      style={menuStyle}

    >

      {options.map((opt) => {

        const active = opt.value === value;

        return (

          <li key={opt.value} role="none">

            <button

              type="button"

              role="option"

              aria-selected={active}

              className={`glass-select__option${active ? " glass-select__option--active" : ""}`}

              onClick={() => pick(opt.value)}

            >

              {opt.label}

            </button>

          </li>

        );

      })}

    </ul>

  );



  return (

    <div className={rootClass} ref={rootRef}>

      <button

        type="button"

        className="glass-select__trigger"

        aria-label={ariaLabel}

        aria-haspopup="listbox"

        aria-expanded={open}

        aria-controls={listId}

        disabled={disabled}

        onClick={() => !disabled && setOpen((v) => !v)}

        onKeyDown={onTriggerKeyDown}

      >

        <span className="glass-select__value">{selected?.label ?? placeholder}</span>

        <span className="glass-select__chev" aria-hidden>

          ▾

        </span>

      </button>



      {menu && createPortal(menu, document.body)}

    </div>

  );

}

