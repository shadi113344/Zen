import { useMemo } from "react";
import { DAY_MOOD_OPTIONS, dayMoodEmoji, resolveDayMoodId } from "@/lib/day-mood";
import { MoodLinearMenu } from "@/components/log/MoodLinearMenu";
import { useDayMood } from "@/hooks/useData";
import { usePressRadialMenu } from "@/hooks/usePressRadialMenu";

interface DayMoodButtonProps {
  date: string;
}

export function DayMoodButton({ date }: DayMoodButtonProps) {
  const { getDayMood, setDayMood } = useDayMood();
  const moodId = resolveDayMoodId(getDayMood(date));
  const selectedEmoji = moodId ? dayMoodEmoji(moodId) : "";

  const menuOptions = useMemo(
    () =>
      DAY_MOOD_OPTIONS.map((m) => ({
        id: m.id,
        label: m.label,
        icon: m.emoji,
        onSelect: () => setDayMood(date, moodId === m.id ? "" : m.id),
      })),
    [date, moodId, setDayMood],
  );

  const { open, highlightId, btnRef, bindTrigger } = usePressRadialMenu(menuOptions);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`day-mood-btn${open ? " day-mood-btn--open" : ""}${moodId ? " day-mood-btn--selected" : ""}`}
        aria-label={
          moodId
            ? `Mood: ${DAY_MOOD_OPTIONS.find((m) => m.id === moodId)?.label ?? moodId}. Hold to change.`
            : "Record mood for today. Hold and slide to pick."
        }
        aria-haspopup="menu"
        aria-expanded={open}
        {...bindTrigger}
      >
        {moodId ? (
          <span className="day-mood-btn__emoji" aria-hidden>
            {selectedEmoji}
          </span>
        ) : (
          <span className="day-mood-btn__placeholder" aria-hidden>
            🙂
          </span>
        )}
      </button>
      <MoodLinearMenu anchorRef={btnRef} open={open} highlightId={highlightId} options={menuOptions} />
    </>
  );
}
