import { useEffect, useRef, useState } from "react";
import { dayScore, heroCopy } from "@mottazen/core";
import type { DayLog, Habit } from "@mottazen/core";
import { ScoreRing } from "@/components/ScoreRing";
import { celebrateConfetti } from "@/lib/confetti";

interface HeroScoreProps {
  habits: Habit[];
  logs: DayLog[];
  date: string;
  /** Pinned in mobile header — card layout, medium ring */
  compact?: boolean;
}

const CELEBRATE_MS = 520;

export function HeroScore({ habits, logs, date, compact = false }: HeroScoreProps) {
  const score = dayScore(habits, logs, date);
  const prevScore = useRef<number | null>(null);
  const prevDate = useRef(date);
  const sectionRef = useRef<HTMLElement>(null);
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    // Switching days isn't an achievement — just re-baseline, don't celebrate.
    if (prevDate.current !== date) {
      prevDate.current = date;
      prevScore.current = score;
      return;
    }

    const prev = prevScore.current;
    prevScore.current = score;
    if (prev === null || score <= prev) return;

    setBurst(true);
    const t = window.setTimeout(() => setBurst(false), CELEBRATE_MS);

    // Subtle confetti only when the day ring actually crosses into 100%.
    if (prev < 100 && score >= 100) {
      celebrateConfetti(sectionRef.current?.querySelector<HTMLElement>(".score-ring"));
    }

    return () => window.clearTimeout(t);
  }, [score, date]);

  const copy = heroCopy(score);

  const heroClass = [
    "hero-score",
    "card",
    compact ? "hero-score--header" : "",
    burst ? "hero-score--celebrate" : "",
    burst && score >= 100 ? "hero-score--celebrate-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section ref={sectionRef} className={heroClass} aria-label={`Day score ${score} percent`}>
      <ScoreRing
        value={score}
        size={compact ? "md" : "lg"}
        animated
        celebrate={burst}
        showInner={false}
        accentStroke
      />
      <div className="hero-score__copy">
        <p className="hero-score__status">{copy.status}</p>
        <p className="hero-score__suggestion">{copy.suggestion}</p>
      </div>
    </section>
  );
}
