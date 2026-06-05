import { displayDensityLabel } from "@/lib/display-density";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";

export function DisplayDensityToggle() {
  const { displayDensity, cycleDisplayDensity } = useDisplayPrefs();

  return (
    <button
      type="button"
      className={`log-header__icon-btn log-header__icon-btn--density is-${displayDensity}`}
      onClick={cycleDisplayDensity}
      aria-label={`${displayDensityLabel(displayDensity)}. Tap to change layout.`}
      aria-pressed={displayDensity !== "normal"}
      title={displayDensityLabel(displayDensity)}
    >
      <span className="density-icon" aria-hidden />
    </button>
  );
}
