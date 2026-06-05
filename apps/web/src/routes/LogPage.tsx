import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/EmptyState";

import { WeekDateStrip } from "@/components/WeekDateStrip";

import { AddHabitFAB, AddHabitModal } from "@/components/log/AddHabitModal";

import { GoalChipsRow } from "@/components/goals/GoalChipsRow";
import { CategoryChipsRow } from "@/components/log/CategoryChipsRow";

import { DayNotes } from "@/components/log/DayNotes";

import { HeroScore } from "@/components/log/HeroScore";

import { HabitListGrouped } from "@/components/log/HabitListGrouped";

import { LogHeader } from "@/components/log/LogHeader";

import { useAppDate } from "@/hooks/useAppDate";
import { useDisplayPrefs } from "@/hooks/useDisplayPrefs";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useSyncLogDateRoute } from "@/hooks/useSyncLogDateRoute";
import { useData, useHabits, useLogs } from "@/hooks/useData";

import { useOnline } from "@/hooks/useOnline";
import { useMediaQuery } from "@/hooks/useMediaQuery";



export function LogPage() {

  const { habits, loading, demoMode, reloadFromCloud } = useData();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pullY, pulling, refreshing } = usePullToRefresh(scrollRef, reloadFromCloud, !demoMode);

  const { logs } = useLogs();

  const { selectedDate, isToday } = useAppDate();
  const { displayDensity } = useDisplayPrefs();
  useSyncLogDateRoute();

  const [addOpen, setAddOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const activityOnly = displayDensity === "activity-only";

  useEffect(() => {
    if (activityOnly && categoryFilter) setCategoryFilter(null);
  }, [activityOnly, categoryFilter]);

  const online = useOnline();
  const desktop = useMediaQuery("(min-width: 1024px)");

  const activeHabits = habits.filter((h) => !h.paused);



  if (loading) {

    return <p className="log-page__loading">Loading…</p>;

  }



  return (

    <div className="log-page">

      {!desktop && (
        <>
          <div className="log-page__header-stack">
            <LogHeader isToday={isToday} />
            <div className="log-page__hero-wrap">
              <HeroScore habits={habits} logs={logs} date={selectedDate} compact />
            </div>
            <div className="log-page__date-wrap">
              <WeekDateStrip className="log-page__date-strip" />
            </div>
          </div>
        </>
      )}



      <div
        ref={scrollRef}
        className={`log-page__scroll${pulling || refreshing ? " log-page__scroll--ptr" : ""}`}
      >
        {(pulling || refreshing) && (
          <div
            className="ptr-indicator"
            style={{ height: `${Math.max(0, pullY)}px` }}
            aria-hidden={!refreshing}
            aria-live="polite"
          >
            <span className="ptr-indicator__label">{refreshing ? "Syncing…" : "Pull to refresh"}</span>
          </div>
        )}




        {!online && (

          <div className="offline-banner" role="status">

            Offline — changes sync when you reconnect.

          </div>

        )}



        {demoMode && (

          <div className="demo-banner">

            Demo mode — add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to connect Supabase.

          </div>

        )}



        {desktop && (
          <>
            <HeroScore habits={habits} logs={logs} date={selectedDate} />
            <WeekDateStrip className="log-page__date-strip" />
          </>
        )}



        <div className="log-page__content">

          <GoalChipsRow date={selectedDate} />

          {!activityOnly ? (
            <CategoryChipsRow
              habits={habits}
              logs={logs}
              date={selectedDate}
              selectedCategory={categoryFilter}
              onSelectCategory={setCategoryFilter}
            />
          ) : null}



          {activeHabits.length === 0 ? (

            <EmptyState

              title="Add your first habit"

              message="Start with one small action you can log every day."

              action={

                <button type="button" className="btn btn--primary" onClick={() => setAddOpen(true)}>

                  Add habit

                </button>

              }

            />

          ) : (

            <HabitListGrouped habits={habits} date={selectedDate} categoryFilter={categoryFilter} />

          )}



          <DayNotes date={selectedDate} />

        </div>

      </div>



      <AddHabitFAB onClick={() => setAddOpen(true)} />

      <AddHabitModal open={addOpen} onClose={() => setAddOpen(false)} />

    </div>

  );

}

