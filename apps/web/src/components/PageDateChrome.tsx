import { useState } from "react";
import { CalendarModal } from "@/components/log/CalendarModal";
import { WeekDateStrip } from "@/components/WeekDateStrip";
import { useAppDate } from "@/hooks/useAppDate";
import { useLogs } from "@/hooks/useData";

/** Week date scroller + calendar trigger for Insights and Categories */
export function PageDateChrome() {
  const { selectedDate, setSelectedDate } = useAppDate();

  const { logs } = useLogs();

  const [calendarOpen, setCalendarOpen] = useState(false);



  return (

    <div className="page-date-chrome">

      <div className="page-date-chrome__row">

        <div className="page-date-chrome__strip-wrap">

          <WeekDateStrip className="page-date-chrome__strip" />

        </div>

        <button

          type="button"

          className="page-date-chrome__today"

          onClick={() => setCalendarOpen(true)}

          aria-haspopup="dialog"

          aria-expanded={calendarOpen}

          aria-label="Open calendar"

        >

          Calendar ▾

        </button>

      </div>

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

