export type HapticSettings = {
  enabled: boolean;
  progressSteps: boolean;
  completion: boolean;
  progressStrength: number;
  completionStrength: number;
};

export const HAPTIC_STORAGE_KEY = "mottazen-haptic";

export const defaultHapticSettings: HapticSettings = {
  enabled: true,
  progressSteps: true,
  completion: true,
  progressStrength: 70,
  completionStrength: 100,
};

function clampStrength(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(1, Math.min(100, Math.round(value)));
}

export function readHapticSettings(): HapticSettings {
  try {
    const raw = localStorage.getItem(HAPTIC_STORAGE_KEY);
    if (!raw) return defaultHapticSettings;
    const parsed = JSON.parse(raw) as Partial<HapticSettings>;
    return {
      enabled: parsed.enabled ?? defaultHapticSettings.enabled,
      progressSteps: parsed.progressSteps ?? defaultHapticSettings.progressSteps,
      completion: parsed.completion ?? defaultHapticSettings.completion,
      progressStrength: clampStrength(parsed.progressStrength, defaultHapticSettings.progressStrength),
      completionStrength: clampStrength(parsed.completionStrength, defaultHapticSettings.completionStrength),
    };
  } catch {
    return defaultHapticSettings;
  }
}

export function writeHapticSettings(next: HapticSettings): void {
  try {
    localStorage.setItem(HAPTIC_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}
