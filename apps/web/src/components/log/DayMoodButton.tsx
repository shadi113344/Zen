import { useMemo } from "react";
import { AnimatedEmoji } from "@/components/AnimatedEmoji";
import { MoodLinearMenu } from "@/components/log/MoodLinearMenu";
import { DAY_MOOD_OPTIONS, dayMoodCodepoint, dayMoodEmoji, resolveDayMoodId } from "@/lib/day-mood";
import { useDayMood } from "@/hooks/useData";
import { usePressRadialMenu } from "@/hooks/usePressRadialMenu";

interface DayMoodButtonProps {
  date: string;
}

export function DayMoodButton({ date }: DayMoodButtonProps) {
  const { getDayMood, setDayMood } = useDayMood();
  const moodId = resolveDayMoodId(getDayMood(date));
  const selectedEmoji = moodId ? dayMoodEmoji(moodId) : "";
  const selectedCodepoint = moodId ? dayMoodCodepoint(moodId) : "";

  const menuOptions = useMemo(
    () =>
      DAY_MOOD_OPTIONS.map((m) => ({
        id: m.id,
        label: m.label,
        icon: m.emoji,
        lottieCodepoint: m.codepoint,
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
          <AnimatedEmoji
            codepoint={selectedCodepoint}
            fallback={selectedEmoji}
            size={20}
            loop
            autoplay
            className="day-mood-btn__emoji"
          />
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
