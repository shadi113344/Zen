export type HapticSettings = {
  enabled: boolean;
  progressSteps: boolean;
  completion: boolean;
};

export const HAPTIC_STORAGE_KEY = "mottazen-haptic";

export const defaultHapticSettings: HapticSettings = {
  enabled: true,
  progressSteps: true,
  completion: true,
};

export function readHapticSettings(): HapticSettings {
  try {
    const raw = localStorage.getItem(HAPTIC_STORAGE_KEY);
    if (!raw) return defaultHapticSettings;
    const parsed = JSON.parse(raw) as Partial<HapticSettings>;
    return {
      enabled: parsed.enabled ?? defaultHapticSettings.enabled,
      progressSteps: parsed.progressSteps ?? defaultHapticSettings.progressSteps,
      completion: parsed.completion ?? defaultHapticSettings.completion,
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
