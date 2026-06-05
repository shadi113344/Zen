import {
  applyThemeColorVars,
  DEFAULT_THEME_COLORS,
  isDefaultThemeColors,
  readStoredThemeColors,
  sanitizeThemeColors,
  storeThemeColors,
  type ThemeColors,
} from "@/lib/theme-colors";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: ThemeMode;
  resolved: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  colors: ThemeColors;
  setColors: (colors: ThemeColors) => void;
  setAccent: (accent: string) => void;
  setBgTintLight: (bgTint: string) => void;
  setBgTintDark: (bgTint: string) => void;
  setGlassCards: (enabled: boolean) => void;
  setGlassOpacity: (opacity: number) => void;
  resetColors: () => void;
  colorsCustomized: boolean;
}

const MODE_STORAGE_KEY = "mottazen-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(MODE_STORAGE_KEY) as ThemeMode | null;
      if (stored === "light" || stored === "dark" || stored === "system") return stored;
    } catch {
      /* ignore */
    }
    return "system";
  });

  const [colors, setColorsState] = useState<ThemeColors>(() => readStoredThemeColors());

  const resolved = theme === "system" ? systemTheme() : theme;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved);
    localStorage.setItem(MODE_STORAGE_KEY, theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#121212" : "#e8e8e8");
  }, [theme, resolved]);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = systemTheme();
      document.documentElement.setAttribute("data-theme", next);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next === "dark" ? "#121212" : "#e8e8e8");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  useEffect(() => {
    applyThemeColorVars(colors, resolved);
  }, [colors, resolved]);

  const setColors = (next: ThemeColors) => {
    setColorsState(next);
    storeThemeColors(next);
  };

  const patchColors = (patch: Partial<ThemeColors>) => {
    setColorsState((prev) => {
      const next = sanitizeThemeColors({ ...prev, ...patch });
      storeThemeColors(next);
      return next;
    });
  };

  const value = useMemo(
    () => ({
      theme,
      resolved,
      setTheme: setThemeState,
      toggleTheme: () =>
        setThemeState((t) => {
          const current = t === "system" ? systemTheme() : t;
          return current === "dark" ? "light" : "dark";
        }),
      colors,
      setColors,
      setAccent: (accent: string) => patchColors({ accent }),
      setBgTintLight: (bgTintLight: string) => patchColors({ bgTintLight }),
      setBgTintDark: (bgTintDark: string) => patchColors({ bgTintDark }),
      setGlassCards: (glassCards: boolean) => patchColors({ glassCards }),
      setGlassOpacity: (glassOpacity: number) => patchColors({ glassOpacity }),
      resetColors: () => {
        setColorsState({ ...DEFAULT_THEME_COLORS });
        localStorage.removeItem("mottazen-theme-colors");
      },
      colorsCustomized: !isDefaultThemeColors(colors),
    }),
    [theme, resolved, colors],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
