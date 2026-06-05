export interface ThemeColors {
  accent: string;
  bgTintLight: string;
  bgTintDark: string;
  glassCards: boolean;
  /** 20–95: card glass opacity when glassCards is enabled */
  glassOpacity: number;
}

/** Reference grey palette — all theme colors stay within this family (+ muted accents). */
export const GREY_PALETTE = {
  soft: "#e8e8e8",
  cloudy: "#d1d1d1",
  leaf: "#959693",
  slate: "#a19f97",
  studio: "#838079",
  minor: "#626060",
  gloomy: "#3f3b3b",
  thunder: "#1a1a1a",
} as const;

function darkenHex(hex: string, amount: number): string {
  return mixHex(hex, GREY_PALETTE.thunder, clamp(amount, 0, 1));
}

/** Color accents — 10% darker than prior mid-tones. */
const MUTED_ACCENTS_BASE = {
  navy: "#3d5f85",
  maroon: "#7d4a54",
  purple: "#5a4a72",
  green: "#3d6650",
} as const;

export const MUTED_ACCENTS = {
  navy: darkenHex(MUTED_ACCENTS_BASE.navy, 0.1),
  maroon: darkenHex(MUTED_ACCENTS_BASE.maroon, 0.1),
  purple: darkenHex(MUTED_ACCENTS_BASE.purple, 0.1),
  green: darkenHex(MUTED_ACCENTS_BASE.green, 0.1),
} as const;

export const DEFAULT_THEME_COLORS: ThemeColors = {
  accent: GREY_PALETTE.gloomy,
  bgTintLight: GREY_PALETTE.soft,
  bgTintDark: GREY_PALETTE.gloomy,
  glassCards: false,
  glassOpacity: 72,
};

export const ACCENT_PRESETS: Array<{ id: string; label: string; color: string }> = [
  { id: "thunder", label: "Thunder", color: GREY_PALETTE.thunder },
  { id: "gloomy", label: "Gloomy", color: GREY_PALETTE.gloomy },
  { id: "minor", label: "Minor", color: GREY_PALETTE.minor },
  { id: "studio", label: "Studio", color: GREY_PALETTE.studio },
  { id: "navy", label: "Navy", color: MUTED_ACCENTS.navy },
  { id: "maroon", label: "Maroon", color: MUTED_ACCENTS.maroon },
  { id: "purple", label: "Purple", color: MUTED_ACCENTS.purple },
  { id: "green", label: "Forest green", color: MUTED_ACCENTS.green },
];

/** Light mode page backgrounds only */
export const BG_LIGHT_PRESETS: Array<{ id: string; label: string; color: string }> = [
  { id: "pale", label: "Very light grey", color: "#f4f4f4" },
  { id: "soft", label: "Soft grey", color: GREY_PALETTE.soft },
  { id: "offwhite", label: "Off-white", color: "#faf9f6" },
  { id: "cream", label: "Soft cream", color: "#f3ede4" },
];

/** Dark mode page backgrounds only */
export const BG_DEEP_PRESETS: Array<{ id: string; label: string; color: string }> = [
  { id: "studio", label: "Studio grey", color: GREY_PALETTE.studio },
  { id: "minor", label: "Minor grey", color: GREY_PALETTE.minor },
  { id: "gloomy", label: "Gloomy grey", color: GREY_PALETTE.gloomy },
  { id: "thunder", label: "Thunder grey", color: GREY_PALETTE.thunder },
];

export const BG_TINT_PRESETS = [...BG_LIGHT_PRESETS, ...BG_DEEP_PRESETS];

export const ACCENT_PASTEL: Record<string, string> = {
  [GREY_PALETTE.thunder]: GREY_PALETTE.cloudy,
  [GREY_PALETTE.gloomy]: "#d4d0d0",
  [GREY_PALETTE.minor]: "#d1d0d0",
  [GREY_PALETTE.studio]: "#dcd8d4",
  [MUTED_ACCENTS.navy]: "#c5d4e3",
  [MUTED_ACCENTS.maroon]: "#e3d2d5",
  [MUTED_ACCENTS.purple]: "#dbd4e6",
  [MUTED_ACCENTS.green]: "#d0ddd4",
  [MUTED_ACCENTS_BASE.navy]: "#c5d4e3",
  [MUTED_ACCENTS_BASE.maroon]: "#e3d2d5",
  [MUTED_ACCENTS_BASE.purple]: "#dbd4e6",
  [MUTED_ACCENTS_BASE.green]: "#d0ddd4",
  "#1e2d3d": "#c5d4e3",
  "#3d2a2e": "#e3d2d5",
  "#322840": "#dbd4e6",
  "#243529": "#d0ddd4",
  "#4a6fa5": "#c5d4e3",
  "#9a5c66": "#e3d2d5",
  "#6f5c8f": "#dbd4e6",
  "#4a7d5c": "#d0ddd4",
};

/** Subtle pastels for category cards — same restrained palette family. */
export const CATEGORY_PASTEL_PRESETS: Array<{ id: string; label: string; color: string }> = [
  { id: "pearl", label: "Pearl", color: GREY_PALETTE.soft },
  { id: "cloud", label: "Cloud", color: GREY_PALETTE.cloudy },
  { id: "sand", label: "Sand", color: "#ebe6df" },
  { id: "mist", label: "Mist", color: "#dfe4ea" },
  { id: "blush", label: "Blush", color: "#ebe4e4" },
  { id: "sage", label: "Sage", color: "#e4ebe6" },
  { id: "lilac", label: "Lilac", color: "#e8e4ed" },
  { id: "sky", label: "Sky", color: "#dfe8f0" },
];

const ALLOWED_CATEGORY_PASTELS = CATEGORY_PASTEL_PRESETS.map((p) => p.color);

export function pastelAccentFor(baseAccent: string): string {
  const base = normalizeHex(baseAccent, DEFAULT_THEME_COLORS.accent);
  return ACCENT_PASTEL[base] ?? mixHex(GREY_PALETTE.soft, base, 0.22);
}

function accentLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/** Slight lift for near-black accents so text on buttons stays readable in light mode. */
function readableLightAccent(hex: string): string {
  if (accentLuminance(hex) >= 0.26) return hex;
  return mixHex(hex, GREY_PALETTE.studio, 0.3);
}

export function resolveAccentColor(baseAccent: string, mode: "light" | "dark"): string {
  const base = normalizeHex(baseAccent, DEFAULT_THEME_COLORS.accent);
  if (mode === "dark") return pastelAccentFor(base);
  return readableLightAccent(base);
}

export function resolveBgTint(colors: ThemeColors, mode: "light" | "dark"): string {
  const safe = sanitizeThemeColors(colors);
  return mode === "light" ? safe.bgTintLight : safe.bgTintDark;
}

export function defaultCategoryPastel(category: string): string {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = (hash + category.charCodeAt(i) * (i + 1)) | 0;
  }
  const idx = Math.abs(hash) % CATEGORY_PASTEL_PRESETS.length;
  return CATEGORY_PASTEL_PRESETS[idx]!.color;
}

export function snapCategoryPastel(hex: string): string {
  return snapToAllowed(normalizeHex(hex, CATEGORY_PASTEL_PRESETS[0]!.color), ALLOWED_CATEGORY_PASTELS, CATEGORY_PASTEL_PRESETS[0]!.color);
}

export function categoryPastelLabel(hex: string): string {
  return CATEGORY_PASTEL_PRESETS.find((p) => p.color === hex)?.label ?? "Custom";
}

const ALLOWED_ACCENTS = ACCENT_PRESETS.map((p) => p.color);
const ALLOWED_LIGHT_BG = BG_LIGHT_PRESETS.map((p) => p.color);
const ALLOWED_DEEP_BG = BG_DEEP_PRESETS.map((p) => p.color);
const ALLOWED_BG = BG_TINT_PRESETS.map((p) => p.color);

const STORAGE_KEY = "mottazen-theme-colors";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return { r: 232, g: 232, b: 232 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const to = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function mixHex(base: string, tint: string, amount: number): string {
  const a = hexToRgb(base);
  const b = hexToRgb(tint);
  const t = clamp(amount, 0, 1);
  return rgbToHex({
    r: a.r * (1 - t) + b.r * t,
    g: a.g * (1 - t) + b.g * t,
    b: a.b * (1 - t) + b.b * t,
  });
}

export function contrastText(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const y = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return y > 0.58 ? GREY_PALETTE.thunder : "#ffffff";
}

export function normalizeHex(input: string, fallback: string): string {
  const trimmed = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const h = trimmed.slice(1);
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  return fallback;
}

function colorDistance(a: string, b: string): number {
  const c = hexToRgb(a);
  const d = hexToRgb(b);
  return (c.r - d.r) ** 2 + (c.g - d.g) ** 2 + (c.b - d.b) ** 2;
}

export function snapToAllowed(hex: string, allowed: string[], fallback: string): string {
  const normalized = normalizeHex(hex, fallback);
  if (allowed.includes(normalized)) return normalized;
  let best = fallback;
  let bestDist = Infinity;
  for (const candidate of allowed) {
    const dist = colorDistance(normalized, candidate);
    if (dist < bestDist) {
      bestDist = dist;
      best = candidate;
    }
  }
  return best;
}

function migrateLegacyBgTint(legacy?: string): { light: string; dark: string } {
  const raw = normalizeHex(legacy ?? DEFAULT_THEME_COLORS.bgTintLight, DEFAULT_THEME_COLORS.bgTintLight);
  const lightDist = Math.min(...ALLOWED_LIGHT_BG.map((c) => colorDistance(raw, c)));
  const deepDist = Math.min(...ALLOWED_DEEP_BG.map((c) => colorDistance(raw, c)));
  if (deepDist < lightDist) {
    return {
      light: DEFAULT_THEME_COLORS.bgTintLight,
      dark: snapToAllowed(raw, ALLOWED_DEEP_BG, DEFAULT_THEME_COLORS.bgTintDark),
    };
  }
  return {
    light: snapToAllowed(raw, ALLOWED_LIGHT_BG, DEFAULT_THEME_COLORS.bgTintLight),
    dark: DEFAULT_THEME_COLORS.bgTintDark,
  };
}

export function sanitizeThemeColors(colors: Partial<ThemeColors> & { bgTint?: string }): ThemeColors {
  const migrated = migrateLegacyBgTint(colors.bgTint ?? colors.bgTintLight ?? colors.bgTintDark);
  return {
    accent: snapToAllowed(colors.accent ?? DEFAULT_THEME_COLORS.accent, ALLOWED_ACCENTS, DEFAULT_THEME_COLORS.accent),
    bgTintLight: snapToAllowed(
      colors.bgTintLight ?? migrated.light,
      ALLOWED_LIGHT_BG,
      DEFAULT_THEME_COLORS.bgTintLight,
    ),
    bgTintDark: snapToAllowed(
      colors.bgTintDark ?? migrated.dark,
      ALLOWED_DEEP_BG,
      DEFAULT_THEME_COLORS.bgTintDark,
    ),
    glassCards: Boolean(colors.glassCards),
    glassOpacity: clamp(Math.round(colors.glassOpacity ?? DEFAULT_THEME_COLORS.glassOpacity), 20, 95),
  };
}

export function readStoredThemeColors(): ThemeColors {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_THEME_COLORS };
    const parsed = JSON.parse(raw) as Partial<ThemeColors> & { bgTint?: string };
    return sanitizeThemeColors({
      accent: parsed.accent,
      bgTint: parsed.bgTint,
      bgTintLight: parsed.bgTintLight,
      bgTintDark: parsed.bgTintDark,
      glassCards: parsed.glassCards,
      glassOpacity: parsed.glassOpacity,
    });
  } catch {
    return { ...DEFAULT_THEME_COLORS };
  }
}

export function storeThemeColors(colors: ThemeColors) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeThemeColors(colors)));
}

export function isDefaultThemeColors(colors: ThemeColors): boolean {
  const d = DEFAULT_THEME_COLORS;
  return (
    colors.accent === d.accent &&
    colors.bgTintLight === d.bgTintLight &&
    colors.bgTintDark === d.bgTintDark &&
    colors.glassCards === d.glassCards &&
    colors.glassOpacity === d.glassOpacity
  );
}

export function applyThemeColorVars(colors: ThemeColors, mode: "light" | "dark") {
  const root = document.documentElement;
  const safe = sanitizeThemeColors(colors);
  const baseAccent = safe.accent;
  const accent = resolveAccentColor(baseAccent, mode);
  const bgTint = resolveBgTint(safe, mode);
  /** Slider 100% = most transparent; 20% = most solid glass */
  const glassAlpha = 0.06 + ((100 - safe.glassOpacity) / 100) * 0.82;

  root.style.setProperty("--user-accent-base", baseAccent);
  root.style.setProperty("--user-accent", accent);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--active", accent);
  root.style.setProperty(
    "--active-fg",
    mode === "dark" ? GREY_PALETTE.thunder : contrastText(accent),
  );

  const { r, g, b } = hexToRgb(bgTint);

  if (mode === "light") {
    root.style.setProperty("--bg", bgTint);
    root.style.setProperty("--bg-grad-top", mixHex(bgTint, GREY_PALETTE.soft, 0.4));
    root.style.setProperty("--glow-1", `rgba(${r}, ${g}, ${b}, 0.45)`);
    root.style.setProperty("--glow-2", `rgba(${r}, ${g}, ${b}, 0.22)`);
    root.style.setProperty("--card-glass-bg", `rgba(255, 255, 255, ${glassAlpha})`);
    root.style.setProperty("--card-glass-border", `rgba(255, 255, 255, ${Math.min(glassAlpha + 0.12, 1)})`);
  } else {
    const bg = mixHex(GREY_PALETTE.thunder, bgTint, 0.1);
    const bgTop = mixHex(GREY_PALETTE.gloomy, bgTint, 0.08);
    root.style.setProperty("--bg", bg);
    root.style.setProperty("--bg-grad-top", bgTop);
    root.style.setProperty("--glow-1", `rgba(${r}, ${g}, ${b}, 0.1)`);
    root.style.setProperty("--glow-2", `rgba(${r}, ${g}, ${b}, 0.05)`);
    root.style.setProperty("--card-glass-bg", `rgba(38, 38, 38, ${glassAlpha})`);
    root.style.setProperty("--card-glass-border", `rgba(255, 255, 255, ${glassAlpha * 0.22})`);
  }

  if (safe.glassCards) {
    root.setAttribute("data-glass-cards", "true");
  } else {
    root.removeAttribute("data-glass-cards");
  }
}

export function clearThemeColorVars() {
  for (const prop of [
    "--user-accent-base",
    "--user-accent",
    "--accent",
    "--active",
    "--active-fg",
    "--bg",
    "--bg-grad-top",
    "--glow-1",
    "--glow-2",
    "--card-glass-bg",
    "--card-glass-border",
  ]) {
    document.documentElement.style.removeProperty(prop);
  }
  document.documentElement.removeAttribute("data-glass-cards");
}

export function accentLabel(hex: string): string {
  return ACCENT_PRESETS.find((p) => p.color === hex)?.label ?? "Custom";
}

export function bgTintLabel(hex: string): string {
  return BG_TINT_PRESETS.find((p) => p.color === hex)?.label ?? "Custom";
}

export function bgLightTintLabel(hex: string): string {
  return BG_LIGHT_PRESETS.find((p) => p.color === hex)?.label ?? bgTintLabel(hex);
}

export function bgDeepTintLabel(hex: string): string {
  return BG_DEEP_PRESETS.find((p) => p.color === hex)?.label ?? bgTintLabel(hex);
}
