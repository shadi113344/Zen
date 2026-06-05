import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import {
  defaultHapticSettings,
  readHapticSettings,
  writeHapticSettings,
  type HapticSettings,
} from "@/lib/haptic-settings";

type HapticSettingsContext = HapticSettings & {
  setEnabled: (v: boolean) => void;
  setProgressSteps: (v: boolean) => void;
  setCompletion: (v: boolean) => void;
};

const HapticSettingsCtx = createContext<HapticSettingsContext | null>(null);

function persist(patch: Partial<HapticSettings>, current: HapticSettings): HapticSettings {
  const next = { ...current, ...patch };
  writeHapticSettings(next);
  return next;
}

export function HapticSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<HapticSettings>(() => readHapticSettings());

  const setEnabled = (enabled: boolean) => setSettings((s) => persist({ enabled }, s));
  const setProgressSteps = (progressSteps: boolean) => setSettings((s) => persist({ progressSteps }, s));
  const setCompletion = (completion: boolean) => setSettings((s) => persist({ completion }, s));

  const value = useMemo(
    () => ({
      ...settings,
      setEnabled,
      setProgressSteps,
      setCompletion,
    }),
    [settings],
  );

  return <HapticSettingsCtx.Provider value={value}>{children}</HapticSettingsCtx.Provider>;
}

export function useHapticSettings() {
  const ctx = useContext(HapticSettingsCtx);
  if (!ctx) throw new Error("useHapticSettings must be used within HapticSettingsProvider");
  return ctx;
}

export { defaultHapticSettings };
