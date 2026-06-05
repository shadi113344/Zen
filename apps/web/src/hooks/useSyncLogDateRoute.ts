import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDate } from "@/hooks/useAppDate";

/** Keeps `/log` URLs in sync with the shared selected date (Today page only). */
export function useSyncLogDateRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedDate, today } = useAppDate();

  useEffect(() => {
    const onLog = location.pathname === "/log" || location.pathname.startsWith("/log/");
    if (!onLog) return;
    const target = selectedDate === today ? "/log" : `/log/${selectedDate}`;
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [location.pathname, navigate, selectedDate, today]);
}
