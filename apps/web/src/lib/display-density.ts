export type DisplayDensity = "normal" | "compact" | "activity-only";

export const DISPLAY_DENSITY_ORDER: DisplayDensity[] = ["normal", "compact", "activity-only"];

export function nextDisplayDensity(current: DisplayDensity): DisplayDensity {
  const i = DISPLAY_DENSITY_ORDER.indexOf(current);
  const next = (i + 1) % DISPLAY_DENSITY_ORDER.length;
  return DISPLAY_DENSITY_ORDER[next] ?? "normal";
}

export function displayDensityLabel(density: DisplayDensity): string {
  switch (density) {
    case "normal":
      return "Normal view";
    case "compact":
      return "Compact view";
    case "activity-only":
      return "Activity only view";
  }
}

export function isDisplayDensity(value: string | null): value is DisplayDensity {
  return value === "normal" || value === "compact" || value === "activity-only";
}
