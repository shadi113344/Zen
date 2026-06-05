import { useState } from "react";
import { CalendarModal } from "@/components/log/CalendarModal";
import { WeekDateStrip } from "@/components/WeekDateStrip";
import { useAppDate } from "@/hooks/useAppDate";
import { useLogs } from "@/hooks/useData";

/** Week strip + calendar picker for the Today screen */
export function LogDateChrome({ className }: { className?: string }) {
  const { selectedDate, setSelectedDate } = useAppDate();
  const { logs } = useLogs();
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <div className={`log-date-chrome${className ? ` ${className}` : ""}`}>
      <WeekDateStrip className="log-date-chrome__strip" />
      <button
        type="button"
        className="log-date-chrome__calendar"
        onClick={() => setCalendarOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={calendarOpen}
        aria-label="Open calendar"
      >
        Calendar
      </button>
      <CalendarModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        logs={logs}
      />
    </div>
  );
}
