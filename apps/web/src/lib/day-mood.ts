/** Stored inside `daily_notes` jsonb under keys `__mood__:<date>`. */
export const DAY_MOOD_STORAGE_PREFIX = "__mood__:";

export const DAY_MOOD_OPTIONS = [
  { id: "happy", emoji: "😊", codepoint: "1f60a", label: "Happy" },
  { id: "neutral", emoji: "😐", codepoint: "1f610", label: "Neutral" },
  { id: "sad", emoji: "😢", codepoint: "1f622", label: "Sad" },
  { id: "angry", emoji: "😠", codepoint: "1f620", label: "Angry" },
  { id: "strong", emoji: "💪", codepoint: "1f4aa", label: "Strong" },
] as const;

export type DayMoodId = (typeof DAY_MOOD_OPTIONS)[number]["id"];

const MOOD_BY_ID = new Map(DAY_MOOD_OPTIONS.map((m) => [m.id, m]));
const MOOD_BY_EMOJI = new Map(DAY_MOOD_OPTIONS.map((m) => [m.emoji, m]));

/** Normalize legacy emoji values to mood ids. */
export function resolveDayMoodId(stored: string): DayMoodId | "" {
  if (!stored) return "";
  if (MOOD_BY_ID.has(stored as DayMoodId)) return stored as DayMoodId;
  return MOOD_BY_EMOJI.get(stored)?.id ?? "";
}

export function dayMoodEmoji(id: string): string {
  return MOOD_BY_ID.get(id as DayMoodId)?.emoji ?? "";
}

export function dayMoodCodepoint(id: string): string {
  return MOOD_BY_ID.get(id as DayMoodId)?.codepoint ?? "";
}

export function splitDailyNotesBlob(raw: Record<string, string>): {
  dailyNotes: Record<string, string>;
  dayMood: Record<string, string>;
} {
  const dailyNotes: Record<string, string> = {};
  const dayMood: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith(DAY_MOOD_STORAGE_PREFIX)) {
      const date = key.slice(DAY_MOOD_STORAGE_PREFIX.length);
      const id = resolveDayMoodId(value);
      if (date && id) dayMood[date] = id;
    } else {
      dailyNotes[key] = value;
    }
  }
  return { dailyNotes, dayMood };
}

export function mergeDailyNotesBlob(
  dailyNotes: Record<string, string>,
  dayMood: Record<string, string>,
): Record<string, string> {
  const merged = { ...dailyNotes };
  for (const key of Object.keys(merged)) {
    if (key.startsWith(DAY_MOOD_STORAGE_PREFIX)) delete merged[key];
  }
  for (const [date, id] of Object.entries(dayMood)) {
    if (id) merged[`${DAY_MOOD_STORAGE_PREFIX}${date}`] = id;
  }
  return merged;
}
