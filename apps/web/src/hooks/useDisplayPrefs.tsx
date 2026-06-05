import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { isDisplayDensity, nextDisplayDensity, type DisplayDensity } from "@/lib/display-density";

interface DisplayPrefs {
  displayDensity: DisplayDensity;
  /** @deprecated Use displayDensity === "compact" */
  compactView: boolean;
  showEditButtons: boolean;
  setDisplayDensity: (density: DisplayDensity) => void;
  cycleDisplayDensity: () => void;
  setCompactView: (v: boolean) => void;
  setShowEditButtons: (v: boolean) => void;
}

const STORAGE_DENSITY = "mottazen-display-density";
const STORAGE_COMPACT_LEGACY = "mottazen-compact";
const STORAGE_EDIT = "mottazen-edit-buttons";

const DisplayContext = createContext<DisplayPrefs | null>(null);

function readBool(key: string, fallback: boolean) {
  try {
    const v = localStorage.getItem(key);
    if (v === "true") return true;
    if (v === "false") return false;
  } catch {
    /* ignore */
  }
  return fallback;
}

function readDensity(): DisplayDensity {
  try {
    const stored = localStorage.getItem(STORAGE_DENSITY);
    if (isDisplayDensity(stored)) return stored;
    if (readBool(STORAGE_COMPACT_LEGACY, false)) return "compact";
  } catch {
    /* ignore */
  }
  return "normal";
}

export function DisplayProvider({ children }: { children: ReactNode }) {
  const [displayDensity, setDisplayDensityState] = useState<DisplayDensity>(() => readDensity());
  const [showEditButtons, setShowEditButtonsState] = useState(() => readBool(STORAGE_EDIT, false));

  const setDisplayDensity = (density: DisplayDensity) => {
    setDisplayDensityState(density);
    localStorage.setItem(STORAGE_DENSITY, density);
    localStorage.setItem(STORAGE_COMPACT_LEGACY, String(density === "compact"));
  };

  const cycleDisplayDensity = () => {
    setDisplayDensity(nextDisplayDensity(displayDensity));
  };

  const setCompactView = (v: boolean) => {
    setDisplayDensity(v ? "compact" : "normal");
  };

  const setShowEditButtons = (v: boolean) => {
    setShowEditButtonsState(v);
    localStorage.setItem(STORAGE_EDIT, String(v));
  };

  const compactView = displayDensity === "compact";

  const value = useMemo(
    () => ({
      displayDensity,
      compactView,
      showEditButtons,
      setDisplayDensity,
      cycleDisplayDensity,
      setCompactView,
      setShowEditButtons,
    }),
    [displayDensity, compactView, showEditButtons],
  );

  return <DisplayContext.Provider value={value}>{children}</DisplayContext.Provider>;
}

export function useDisplayPrefs() {
  const ctx = useContext(DisplayContext);
  if (!ctx) throw new Error("useDisplayPrefs must be used within DisplayProvider");
  return ctx;
}
