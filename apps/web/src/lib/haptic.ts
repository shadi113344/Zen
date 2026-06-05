import { readHapticSettings } from "@/lib/haptic-settings";

/** Apple touch devices (iPhone, iPod, iPad including desktop-UA iPads). */
export function isAppleTouchDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

/**
 * Web haptics, the honest state of things (2026):
 *
 *  - iOS Safari has NEVER implemented the Vibration API (`navigator.vibrate`),
 *    in the browser or as a PWA.
 *  - The old hack — toggling an `<input type="checkbox" switch>` via a
 *    programmatic `label.click()` — worked on iOS 17.4–26.4 but Apple PATCHED it
 *    in iOS 26.5. Haptics can no longer be triggered programmatically.
 *  - The only thing left on iOS is the Taptic Engine firing when the user
 *    *physically taps a real `<input type="checkbox" switch>` themselves*.
 *
 * So on Apple devices we don't try to fire haptics from JS at all. Instead we
 * turn the actual progress controls into real switch inputs (see
 * `asHapticSwitch`) so the user's own tap drives the Taptic Engine natively.
 * Everywhere else (Android/Chromium) we use the standard Vibration API.
 */

/**
 * Ref callback for an `<input type="checkbox">`: on Apple touch devices, marks
 * it as a real iOS "switch" so a direct user tap fires the native Taptic Engine.
 * No-op (and cleared) elsewhere, so other platforms keep a plain checkbox and
 * rely on `navigator.vibrate` instead.
 */
export function asHapticSwitch(el: HTMLInputElement | null): void {
  if (!el) return;
  if (isAppleTouchDevice()) el.setAttribute("switch", "");
  else el.removeAttribute("switch");
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Unsupported or blocked — ignore.
  }
}

type HapticOptions = { force?: boolean };

/**
 * Short feedback when logging forward progress (not on a decrease).
 * iOS: handled natively by the switch control the user tapped (no-op here).
 * Android/other: a brief buzz.
 */
export function hapticProgressBump(options?: HapticOptions): void {
  if (!options?.force) {
    const prefs = readHapticSettings();
    if (!prefs.enabled || !prefs.progressSteps) return;
  }
  if (isAppleTouchDevice()) return;
  vibrate(14);
}

/**
 * Stronger feedback when a day, goal, or activity reaches 100%.
 * iOS: impossible — this is a derived event, not a direct switch tap, and Apple
 * blocks programmatic haptics, so it's a no-op. Android/other: a triple buzz.
 */
export function hapticGoalComplete(options?: HapticOptions): void {
  if (!options?.force) {
    const prefs = readHapticSettings();
    if (!prefs.enabled || !prefs.completion) return;
  }
  if (isAppleTouchDevice()) return;
  vibrate([32, 100, 48, 100, 64, 100, 88]);
}
