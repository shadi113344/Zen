import { addDays, todayKey } from "@mottazen/core";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { matchPath, useLocation } from "react-router-dom";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STORAGE_KEY = "mottazen-app-date";

interface AppDateContextValue {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  today: string;
  isToday: boolean;
}

const AppDateContext = createContext<AppDateContextValue | null>(null);

function readStoredDate(today: string): string {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && DATE_RE.test(stored) && stored <= today) return stored;
  } catch {
    /* ignore */
  }
  return today;
}

export function AppDateProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const today = todayKey();
  const logMatch = matchPath({ path: "/log/:date", end: true }, location.pathname);
  const urlDate = logMatch?.params.date;

  const [selectedDate, setSelectedDateState] = useState(() => {
    if (urlDate && DATE_RE.test(urlDate)) return urlDate;
    return readStoredDate(today);
  });

  useEffect(() => {
    if (urlDate && DATE_RE.test(urlDate)) {
      setSelectedDateState(urlDate);
      sessionStorage.setItem(STORAGE_KEY, urlDate);
    }
  }, [urlDate]);

  const setSelectedDate = useCallback((date: string) => {
    const clamped = date > today ? today : date;
    setSelectedDateState(clamped);
    sessionStorage.setItem(STORAGE_KEY, clamped);
  }, [today]);

  const value = useMemo(
    () => ({
      selectedDate,
      setSelectedDate,
      today,
      isToday: selectedDate === today,
    }),
    [selectedDate, today],
  );

  return <AppDateContext.Provider value={value}>{children}</AppDateContext.Provider>;
}

export function useAppDate() {
  const ctx = useContext(AppDateContext);
  if (!ctx) throw new Error("useAppDate must be used within AppDateProvider");
  return ctx;
}

export function shiftDate(dateKey: string, delta: number): string {
  return addDays(dateKey, delta);
}

/** @deprecated use useAppDate */
export function useSelectedDate() {
  return useAppDate();
}
