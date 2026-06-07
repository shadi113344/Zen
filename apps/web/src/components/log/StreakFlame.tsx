import { streakEmojiTier } from "@mottazen/core";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatedEmoji } from "@/components/AnimatedEmoji";

const CONFETTI = [
  { x: -12, y: -14, r: 35, c: "var(--orange)" },
  { x: 14, y: -12, r: -25, c: "var(--gold)" },
  { x: -16, y: 4, r: 55, c: "var(--green)" },
  { x: 15, y: 6, r: -40, c: "var(--orange)" },
  { x: -6, y: -18, r: 20, c: "var(--gold-bright)" },
  { x: 8, y: -16, r: -15, c: "var(--green-bright)" },
  { x: -10, y: 12, r: 70, c: "var(--orange)" },
  { x: 11, y: 10, r: -60, c: "var(--gold)" },
] as const;

interface StreakFlameProps {
  days: number;
  /** Incremented by the parent when the streak is earned / extended today. */
  celebrateTick: number;
  /** "avoid" reads the streak as "days clean" (abstinence framing). */
  goalDirection?: "do" | "avoid";
}

/** Streak count + tiered emoji; celebrates for 2s with Lottie + confetti. */
export function StreakFlame({ days, celebrateTick, goalDirection }: StreakFlameProps) {
  const [celebrate, setCelebrate] = useState(false);
  const tier = useMemo(() => streakEmojiTier(days), [days]);

  useEffect(() => {
    if (celebrateTick <= 0) return;
    setCelebrate(true);
    const t = window.setTimeout(() => setCelebrate(false), 2000);
    return () => clearTimeout(t);
  }, [celebrateTick]);

  if (!tier) return null;

  return (
    <span
      className={`habit-card__streak${celebrate ? " habit-card__streak--celebrate" : ""}`}
      aria-label={goalDirection === "avoid" ? `${days} days clean` : `${days} day streak`}
    >
      <span className="habit-card__streak-days">{days}</span>
      <span className="habit-card__streak-flame-wrap">
        {celebrate ? (
          <span className="habit-card__streak-confetti" aria-hidden>
            {CONFETTI.map((piece, i) => (
              <span
                key={i}
                className="habit-card__streak-confetti-piece"
                style={
                  {
                    "--burst-x": `${piece.x}px`,
                    "--burst-y": `${piece.y}px`,
                    "--burst-r": `${piece.r}deg`,
                    "--burst-delay": `${i * 35}ms`,
                    backgroundColor: piece.c,
                  } as CSSProperties
                }
              />
            ))}
          </span>
        ) : null}
        <span className="habit-card__streak-emoji" aria-hidden>
          <AnimatedEmoji
            codepoint={tier.codepoint}
            fallback={tier.emoji}
            size={14}
            loop={celebrate}
            autoplay={celebrate}
            playKey={celebrateTick}
            className={`streak-flame-lottie${celebrate ? " streak-flame-lottie--celebrate" : ""}`}
          />
        </span>
      </span>
    </span>
  );
}
