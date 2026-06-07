import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  buildRecap,
  datesForInsightsPeriod,
  todayKey,
  weekdayLabel,
  type RecapData,
  type RecapPeriod,
} from "@mottazen/core";
import { ShareCard } from "@/components/share/ShareCard";
import { useToast } from "@/components/Toast";
import { useCategoryWeights, useHabits, useLogs, useTasks } from "@/hooks/useData";
import { celebrateConfetti } from "@/lib/confetti";
import { shareNodeAsPng } from "@/lib/share-image";

interface Slide {
  key: string;
  kicker: string;
  big: string;
  caption: string;
}

function buildSlides(recap: RecapData, periodLabel: string): Slide[] {
  const slides: Slide[] = [
    { key: "intro", kicker: "Mottazen", big: periodLabel, caption: "in habits" },
    {
      key: "days",
      kicker: "You showed up",
      big: String(recap.daysShowedUp),
      caption: recap.daysShowedUp === 1 ? "day" : "days",
    },
    { key: "checkins", kicker: "That's", big: String(recap.totalCheckIns), caption: "check-ins logged" },
  ];
  if (recap.bestStreak.value > 0) {
    slides.push({
      key: "streak",
      kicker: "Longest streak",
      big: String(recap.bestStreak.value),
      caption: "days in a row",
    });
  }
  if (recap.biggestComeback.value > 0) {
    slides.push({
      key: "comeback",
      kicker: "Biggest comeback",
      big: `+${recap.biggestComeback.value}`,
      caption: "you came back after a break",
    });
  }
  if (recap.topLifeArea) {
    slides.push({
      key: "area",
      kicker: "Most consistent",
      big: recap.topLifeArea.category,
      caption: `${recap.topLifeArea.score}% average`,
    });
  }
  if (recap.busiestWeekday) {
    slides.push({
      key: "weekday",
      kicker: "Busiest day",
      big: weekdayLabel(recap.busiestWeekday.weekday),
      caption: "you show up most",
    });
  }
  if (recap.tasksCompleted > 0) {
    slides.push({ key: "tasks", kicker: "Also done", big: String(recap.tasksCompleted), caption: "tasks completed" });
  }
  slides.push({ key: "share", kicker: "Your year, your way", big: String(recap.daysShowedUp), caption: "days of showing up" });
  return slides;
}

export function RecapPage() {
  const { period: periodParam } = useParams();
  const period: RecapPeriod = periodParam === "month" ? "month" : "year";
  const navigate = useNavigate();
  const { habits } = useHabits();
  const { logs } = useLogs();
  const { tasks } = useTasks();
  const { allWeights } = useCategoryWeights();
  const { showToast } = useToast();

  const cardRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);

  const today = todayKey();
  const earliest = useMemo(() => {
    const sorted = logs.map((l) => l.date).sort();
    return sorted[0] ?? today;
  }, [logs, today]);

  const recap = useMemo(() => {
    const dates = datesForInsightsPeriod(period, today, earliest);
    return buildRecap(habits, logs, dates, period, { weightsByCategory: allWeights, tasks });
  }, [habits, logs, tasks, allWeights, period, today, earliest]);

  const periodLabel = period === "year" ? "This year" : "This month";
  const slides = useMemo(() => buildSlides(recap, periodLabel), [recap, periodLabel]);
  const isLast = index >= slides.length - 1;
  const slide = slides[Math.min(index, slides.length - 1)]!;

  useEffect(() => {
    if (slide.key === "intro" || slide.key === "share") {
      const t = setTimeout(() => celebrateConfetti(), 250);
      return () => clearTimeout(t);
    }
  }, [slide.key]);

  const advance = () => {
    if (!isLast) setIndex((i) => i + 1);
  };

  const onShare = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const res = await shareNodeAsPng(cardRef.current, `mottazen-recap-${period}.png`, `I showed up ${recap.daysShowedUp} days`);
      if (res.method === "download") showToast("Recap saved");
    } catch {
      showToast("Could not create image");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="recap" role="dialog" aria-label={`${periodLabel} in habits`}>
      <button type="button" className="recap__close" onClick={() => navigate("/dashboard")} aria-label="Close recap">
        ×
      </button>

      <div className="recap__progress" aria-hidden>
        {slides.map((s, i) => (
          <span key={s.key} className={`recap__tick${i <= index ? " recap__tick--on" : ""}`} />
        ))}
      </div>

      <div className="recap__stage" onClick={advance}>
        {isLast ? (
          <div className="recap__share-wrap">
            <ShareCard
              ref={cardRef}
              bigNumber={String(recap.daysShowedUp)}
              bigUnit="days"
              caption="days of showing up"
              dots={recap.daysShowedUp}
            />
            <button type="button" className="btn btn--primary btn--block" onClick={onShare} disabled={busy}>
              {busy ? "Preparing…" : "Share my recap"}
            </button>
            <p className="recap__privacy muted-text">Shows the number, never your list. Made on your device.</p>
          </div>
        ) : (
          <div key={slide.key} className="recap__slide">
            <div className="recap__kicker">{slide.kicker}</div>
            <div className="recap__big">{slide.big}</div>
            <div className="recap__caption">{slide.caption}</div>
            <div className="recap__hint muted-text">tap to continue</div>
          </div>
        )}
      </div>
    </div>
  );
}
