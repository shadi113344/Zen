import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { addDays } from "@mottazen/core";
import { useAppDate } from "@/hooks/useAppDate";

interface WeekDateStripProps {
  /** Number of past days to show, ending on today. */
  days?: number;
  className?: string;
}

export function WeekDateStrip({ days = 21, className }: WeekDateStripProps) {
  const { selectedDate, setSelectedDate, today } = useAppDate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const indicatorAnimatedRef = useRef(false);

  const dates = useMemo(() => {
    const start = addDays(today, -(days - 1));
    const list: string[] = [];
    for (let i = 0; i < days; i++) {
      list.push(addDays(start, i));
    }
    return list;
  }, [days, today]);

  const syncIndicator = useCallback(() => {
    const scroll = scrollRef.current;
    const indicator = indicatorRef.current;
    if (!scroll || !indicator) return;

    const active = scroll.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`);
    if (!active) return;

    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;

    if (!indicatorAnimatedRef.current) {
      indicatorAnimatedRef.current = true;
      requestAnimationFrame(() => {
        indicator.classList.add("week-strip__indicator--ready");
      });
    }
  }, [selectedDate]);

  useLayoutEffect(() => {
    syncIndicator();
  }, [syncIndicator, dates]);

  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;

    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(syncIndicator) : null;
    ro?.observe(scroll);
    scroll.addEventListener("scroll", syncIndicator, { passive: true });
    window.addEventListener("resize", syncIndicator);

    return () => {
      ro?.disconnect();
      scroll.removeEventListener("scroll", syncIndicator);
      window.removeEventListener("resize", syncIndicator);
    };
  }, [syncIndicator]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const active = container.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`);
    active?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selectedDate, dates]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = rootRef.current;
    if (!sentinel || !root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        root.classList.toggle("is-stuck", entry ? !entry.isIntersecting : false);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const rootClass = ["week-strip", className ?? ""].filter(Boolean).join(" ");

  return (
    <>
      <div ref={sentinelRef} className="week-strip__sentinel" aria-hidden />
      <div ref={rootRef} className={rootClass} role="tablist" aria-label="Select day">
        <div className="week-strip__scroll" ref={scrollRef}>
          <div
            ref={indicatorRef}
            className="week-strip__indicator"
            aria-hidden
          />
          {dates.map((date) => {
            const d = new Date(date + "T12:00:00");
            const isSelected = date === selectedDate;
            const isFuture = date > today;
            const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
            const dayNum = d.getDate();
            return (
              <button
                key={date}
                type="button"
                role="tab"
                data-date={date}
                aria-selected={isSelected}
                disabled={isFuture}
                className={`week-strip__day${isSelected ? " week-strip__day--active" : ""}${date === today ? " week-strip__day--today" : ""}`}
                onClick={() => setSelectedDate(date)}
              >
                <span className="week-strip__wd">{weekday}</span>
                <span className="week-strip__num">{dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
