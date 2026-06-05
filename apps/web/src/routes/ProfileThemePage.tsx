import { Link } from "react-router-dom";

import type { CSSProperties } from "react";

import { uniqueCategories } from "@mottazen/core";

import { GlassSelect } from "@/components/GlassSelect";

import { resolveCategoryTint } from "@/lib/category-tint";

import {

  ACCENT_PRESETS,

  BG_DEEP_PRESETS,

  BG_LIGHT_PRESETS,

  CATEGORY_PASTEL_PRESETS,

  accentLabel,

  bgDeepTintLabel,

  bgLightTintLabel,

  resolveBgTint,

} from "@/lib/theme-colors";

import { useCategoryColors, useHabits } from "@/hooks/useData";

import { useTheme, type ThemeMode } from "@/hooks/useTheme";



export function ProfileThemePage() {

  const {

    theme,

    setTheme,

    colors,

    setAccent,

    setBgTintLight,

    setBgTintDark,

    setGlassCards,

    setGlassOpacity,

    resetColors,

    colorsCustomized,

    resolved,

  } = useTheme();



  const greyAccents = ACCENT_PRESETS.filter((p) =>

    ["thunder", "gloomy", "minor", "studio"].includes(p.id),

  );

  const colorAccents = ACCENT_PRESETS.filter((p) =>

    ["navy", "maroon", "purple", "green"].includes(p.id),

  );



  const isLight = resolved === "light";

  const activeBgLabel = isLight

    ? bgLightTintLabel(colors.bgTintLight)

    : bgDeepTintLabel(colors.bgTintDark);



  return (

    <div className="profile-page theme-settings">

      <header className="page-header">

        <Link to="/profile" className="page-header__back">

          ← Settings

        </Link>

        <h1 className="page-header__title">Appearance</h1>

      </header>



      <section className="card theme-preview" aria-label="Theme preview">

        <div className="theme-preview__surface">

          <span className="theme-preview__pill">Active</span>

          <span className="theme-preview__dot" />

          <span className="theme-preview__line" />

        </div>

        <p className="theme-preview__caption">

          {accentLabel(colors.accent)}

          {resolved === "dark" ? " (pastel in dark mode)" : ""} on {activeBgLabel.toLowerCase()}

        </p>

      </section>



      <h2 className="profile-section-label">Appearance</h2>

      <section className="card profile-settings">

        <div className="theme-field">

          <span className="theme-field__label">Mode</span>

          <span className="theme-field__hint">Light or dark base for the app</span>

          <GlassSelect<ThemeMode>

            value={theme}

            onChange={setTheme}

            aria-label="Theme mode"

            options={[

              { value: "light", label: "Light" },

              { value: "dark", label: "Dark" },

              { value: "system", label: "System" },

            ]}

          />

        </div>

      </section>



      <h2 className="profile-section-label">Accent</h2>

      <section className="card profile-settings">

        <p className="theme-field__hint theme-field__hint--block">

          Muted tones from the palette. In dark mode, a soft pastel complement is used for

          buttons and active states.

        </p>



        <p className="theme-swatch-group__label">Greys</p>

        <SwatchGrid

          presets={greyAccents}

          selected={colors.accent}

          onSelect={setAccent}

          ariaLabel="Grey accent presets"

        />



        <p className="theme-swatch-group__label">Color accents</p>

        <SwatchGrid

          presets={colorAccents}

          selected={colors.accent}

          onSelect={setAccent}

          ariaLabel="Color accent presets"

        />

      </section>



      <h2 className="profile-section-label">Background</h2>

      <section className="card profile-settings">

        <p className="theme-field__hint theme-field__hint--block">

          Light tones apply in light mode only. Deep tones apply in dark mode only. Switch mode

          above to preview each.

        </p>



        <SwatchGroupHeader label="Light tones" modeBadge="Light mode" active={isLight} />

        <SwatchGrid

          presets={BG_LIGHT_PRESETS}

          selected={colors.bgTintLight}

          onSelect={setBgTintLight}

          soft

          disabled={!isLight}

          ariaLabel="Light mode background presets"

        />

        {!isLight && (

          <p className="theme-swatch-group__note muted-text">Switch to light mode to change light tones.</p>

        )}



        <SwatchGroupHeader label="Deep tones" modeBadge="Dark mode" active={!isLight} />

        <SwatchGrid

          presets={BG_DEEP_PRESETS}

          selected={colors.bgTintDark}

          onSelect={setBgTintDark}

          soft

          disabled={isLight}

          ariaLabel="Dark mode background presets"

        />

        {isLight && (

          <p className="theme-swatch-group__note muted-text">Switch to dark mode to change deep tones.</p>

        )}

      </section>



      <h2 className="profile-section-label">Glass cards</h2>

      <section className="card profile-settings">

        <label className="theme-glass-toggle">

          <input

            type="checkbox"

            checked={colors.glassCards}

            onChange={(e) => setGlassCards(e.target.checked)}

          />

          <span className="theme-glass-toggle__ui" aria-hidden />

          <span>

            <span className="theme-field__label">Glass effect on cards</span>

            <span className="theme-field__hint">Frosted glass across habit groups, settings cards, and more</span>

          </span>

        </label>

        {colors.glassCards && (

          <div className="theme-glass-slider">

            <div className="theme-glass-slider__row">

              <span className="theme-field__label">Transparency</span>

              <span className="theme-glass-slider__value">{colors.glassOpacity}%</span>

            </div>

            <input

              type="range"

              className="theme-glass-slider__input"

              min={20}

              max={95}

              value={colors.glassOpacity}

              onChange={(e) => setGlassOpacity(Number(e.target.value))}

              aria-label="Glass card transparency"

            />

          </div>

        )}

      </section>



      <h2 className="profile-section-label">Category colors</h2>

      <section className="card profile-settings">

        <p className="theme-field__hint theme-field__hint--block">

          Pastels tint category chips and habit groups on Today. Defaults match Health, Mind, and

          Movement — pick a swatch per category below.

        </p>

        <CategoryColorList />

      </section>



      <div className="theme-settings__actions">

        <button

          type="button"

          className="btn btn--ghost"

          onClick={resetColors}

          disabled={!colorsCustomized}

        >

          Reset to defaults

        </button>

      </div>



      <p className="theme-settings__note muted-text">

        Currently using {resolved} mode

        {colorsCustomized ? " with custom colors." : "."} Background:{" "}

        {bgLightTintLabel(resolveBgTint(colors, "light")).toLowerCase()} (light) ·{" "}

        {bgDeepTintLabel(resolveBgTint(colors, "dark")).toLowerCase()} (dark).

      </p>

    </div>

  );

}



function SwatchGroupHeader({

  label,

  modeBadge,

  active,

}: {

  label: string;

  modeBadge: string;

  active: boolean;

}) {

  return (

    <div className={`theme-swatch-group__header${active ? " theme-swatch-group__header--active" : ""}`}>

      <p className="theme-swatch-group__label">{label}</p>

      <span className="theme-mode-badge">{modeBadge}</span>

    </div>

  );

}



function CategoryColorList() {

  const { habits } = useHabits();

  const { categoryColors, setCategoryColor } = useCategoryColors();

  const categories = uniqueCategories(habits);



  if (categories.length === 0) {

    return <p className="muted-text">Add habits to assign category colors.</p>;

  }



  return (

    <div className="category-color-list">

      {categories.map((category) => {

        const tint = resolveCategoryTint(category, categoryColors);

        return (

          <div key={category} className="category-color-row">

            <div

              className="category-color-row__chip category-card-tint"

              style={{ "--category-tint": tint } as CSSProperties}

            >

              <span className="category-color-row__name">{category}</span>

            </div>

            <div className="category-color-row__swatches" role="group" aria-label={`${category} color`}>

              {CATEGORY_PASTEL_PRESETS.map((preset) => (

                <button

                  key={preset.id}

                  type="button"

                  className={`theme-swatch theme-swatch--soft theme-swatch--mini${tint === preset.color ? " theme-swatch--mini-active" : ""}`}

                  style={{ "--swatch-color": preset.color } as CSSProperties}

                  aria-label={preset.label}

                  title={preset.label}

                  onClick={() => setCategoryColor(category, preset.color)}

                />

              ))}

            </div>

          </div>

        );

      })}

    </div>

  );

}



function SwatchGrid({

  presets,

  selected,

  onSelect,

  soft,

  disabled,

  ariaLabel,

}: {

  presets: Array<{ id: string; label: string; color: string }>;

  selected: string;

  onSelect: (color: string) => void;

  soft?: boolean;

  disabled?: boolean;

  ariaLabel: string;

}) {

  return (

    <div

      className={`theme-swatch-grid${disabled ? " theme-swatch-grid--disabled" : ""}`}

      role="group"

      aria-label={ariaLabel}

      aria-disabled={disabled || undefined}

    >

      {presets.map((preset) => (

        <button

          key={preset.id}

          type="button"

          className={`theme-swatch-btn${selected === preset.color ? " theme-swatch-btn--active" : ""}`}

          onClick={() => onSelect(preset.color)}

          disabled={disabled}

          aria-label={preset.label}

          aria-pressed={selected === preset.color}

        >

          <span

            className={`theme-swatch${soft ? " theme-swatch--soft" : ""}`}

            style={{ "--swatch-color": preset.color } as CSSProperties}

          />

          <span className="theme-swatch-btn__label">{preset.label}</span>

        </button>

      ))}

    </div>

  );

}


