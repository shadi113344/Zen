import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { GlassSelect } from "@/components/GlassSelect";
import type { ThemeMode } from "@/hooks/useTheme";

export function SettingsPageHeader({
  title,
  backTo = "/profile",
  backLabel = "Settings",
}: {
  title: string;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <header className="page-header">
      <Link to={backTo} className="page-header__back">
        ← {backLabel}
      </Link>
      <h1 className="page-header__title">{title}</h1>
    </header>
  );
}

export function SettingsSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="settings-section">
      {title ? <h2 className="profile-section-label">{title}</h2> : null}
      <section className="settings-group">{children}</section>
    </div>
  );
}

export function SettingsToggleRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`profile-toggle-row${disabled ? " profile-toggle-row--disabled" : ""}`}>
      <span>
        <span className="profile-toggle-row__label">{label}</span>
        {hint ? <span className="profile-toggle-row__hint">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        className="profile-toggle"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

export function SettingsLinkRow({
  to,
  title,
  hint,
  meta = "→",
}: {
  to: string;
  title: string;
  hint?: string;
  meta?: string;
}) {
  return (
    <Link to={to} className="profile-link-row">
      <span>
        <span className="profile-link-row__title">{title}</span>
        {hint ? <span className="profile-link-row__hint">{hint}</span> : null}
      </span>
      <span className="profile-link-row__meta">{meta}</span>
    </Link>
  );
}

export function SettingsActionRow({
  title,
  hint,
  onClick,
  danger,
  meta,
}: {
  title: string;
  hint?: string;
  onClick: () => void;
  danger?: boolean;
  meta?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`profile-link-row profile-link-row--btn${danger ? " profile-link-row--danger" : ""}`}
      onClick={onClick}
    >
      <span>
        <span className="profile-link-row__title">{title}</span>
        {hint ? <span className="profile-link-row__hint">{hint}</span> : null}
      </span>
      {meta ? <span className="profile-link-row__meta">{meta}</span> : null}
    </button>
  );
}

export function SettingsSliderRow({
  label,
  hint,
  value,
  onChange,
  onRelease,
  disabled,
  min = 1,
  max = 100,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  onRelease?: () => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <div className={`settings-slider${disabled ? " settings-slider--disabled" : ""}`}>
      <div className="settings-slider__row">
        <span className="settings-slider__label">{label}</span>
        <span className="settings-slider__value">{value}%</span>
      </div>
      {hint ? <span className="settings-slider__hint">{hint}</span> : null}
      <input
        type="range"
        className="settings-slider__input"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onRelease}
        onKeyUp={onRelease}
        aria-label={label}
      />
    </div>
  );
}

export function SettingsValueRow({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="profile-link-row profile-link-row--static">
      <span>
        <span className="profile-link-row__title">{label}</span>
        {hint ? <span className="profile-link-row__hint">{hint}</span> : null}
      </span>
      <span className={`profile-link-row__meta${mono ? " profile-link-row__meta--mono" : ""}`}>{value}</span>
    </div>
  );
}

export function ThemeModeRow({ value, onChange }: { value: ThemeMode; onChange: (mode: ThemeMode) => void }) {
  return (
    <div className="settings-field">
      <span className="settings-field__label">Theme mode</span>
      <span className="settings-field__hint">Light, dark, or match your device</span>
      <GlassSelect<ThemeMode>
        value={value}
        onChange={onChange}
        aria-label="Theme mode"
        options={[
          { value: "system", label: "System" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
      />
    </div>
  );
}
