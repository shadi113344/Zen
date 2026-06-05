import { useEffect, useState } from "react";
import { DayMoodButton } from "@/components/log/DayMoodButton";
import { useDayNotes } from "@/hooks/useData";

interface DayNotesProps {
  date: string;
}

export function DayNotes({ date }: DayNotesProps) {
  const { getDayNote, setDayNote } = useDayNotes();
  const saved = getDayNote(date);
  const [text, setText] = useState(saved);

  useEffect(() => {
    setText(saved);
  }, [date, saved]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (text !== saved) setDayNote(date, text);
    }, 800);
    return () => clearTimeout(t);
  }, [text, date, saved, setDayNote]);

  return (
    <section className="day-notes card">
      <div className="day-notes__head">
        <label htmlFor="day-notes-input" className="day-notes__label">
          Notes for today
        </label>
        <DayMoodButton date={date} />
      </div>
      <textarea
        id="day-notes-input"
        className="day-notes__input"
        rows={3}
        placeholder="Reflections, context, wins…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </section>
  );
}
