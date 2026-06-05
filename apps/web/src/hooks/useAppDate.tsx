import { addDays, localDateKey } from "@mottazen/core";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { matchPath, useLocation } from "react-router-dom";
import { defaultTimezone } from "@/lib/coach-notify";
import { useData } from "@/hooks/useData";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STORAGE_KEY = "mottazen-app-date";
/** When the user is on Today, persist this so midnight rollover follows the new day. */
const FOLLOW_TODAY = "__today__";

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
    if (stored === FOLLOW_TODAY) return today;
    if (stored && DATE_RE.test(stored) && stored <= today) return stored;
  } catch {
    /* ignore */
  }
  return today;
}

function persistSelectedDate(date: string, today: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, date === today ? FOLLOW_TODAY : date);
  } catch {
    /* ignore */
  }
}

/** Recompute calendar today in the user's timezone (ticks every minute + on tab focus). */
function useLiveToday(timezone: string): string {
  const compute = useCallback(() => localDateKey(new Date(), timezone), [timezone]);
  const [today, setToday] = useState(compute);

  useEffect(() => {
    setToday(compute());
    const id = window.setInterval(() => setToday(compute()), 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") setToday(compute());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [compute]);

  return today;
}

export function AppDateProvider({ children }: { children: ReactNode }) {
  const { timezone } = useData();
  const tz = timezone || defaultTimezone();
  const today = useLiveToday(tz);
  const location = useLocation();
  const logMatch = matchPath({ path: "/log/:date", end: true }, location.pathname);
  const urlDate = logMatch?.params.date;
  const prevTodayRef = useRef(today);

  const [selectedDate, setSelectedDateState] = useState(() => {
    if (urlDate && DATE_RE.test(urlDate)) return urlDate;
    return readStoredDate(localDateKey(new Date(), tz));
  });

  useEffect(() => {
    if (urlDate && DATE_RE.test(urlDate)) {
      setSelectedDateState(urlDate);
      persistSelectedDate(urlDate, today);
    }
  }, [urlDate, today]);

  // When local midnight passes while the app is open, follow the new Today.
  useEffect(() => {
    const prevToday = prevTodayRef.current;
    if (prevToday === today) return;
    prevTodayRef.current = today;

    setSelectedDateState((current) => {
      let storedFollowsToday = false;
      try {
        storedFollowsToday = sessionStorage.getItem(STORAGE_KEY) === FOLLOW_TODAY;
      } catch {
        /* ignore */
      }
      if (current === prevToday || storedFollowsToday) {
        persistSelectedDate(today, today);
        return today;
      }
      return current;
    });
  }, [today]);

  const setSelectedDate = useCallback(
    (date: string) => {
      const clamped = date > today ? today : date;
      setSelectedDateState(clamped);
      persistSelectedDate(clamped, today);
    },
    [today],
  );

  const value = useMemo(
    () => ({
      selectedDate,
      setSelectedDate,
      today,
      isToday: selectedDate === today,
    }),
    [selectedDate, setSelectedDate, today],
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
