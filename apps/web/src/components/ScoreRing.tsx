import { useEffect, useId, useRef, useState } from "react";



const R = 54;

const C = 2 * Math.PI * R;

const FILL_MS = 780;



interface ScoreRingProps {

  value: number | null;

  label?: string;

  size?: "sm" | "md" | "lg";

  sublabel?: string;

  /** Animate fill from previous value when score changes */

  animated?: boolean;

  /** Brief pop / glow when score increases */

  celebrate?: boolean;

  /** Hide the faint inner disc (Today hero) */

  showInner?: boolean;

  /** Solid accent stroke instead of green/gold gradients */

  accentStroke?: boolean;

}



function clampPct(n: number) {

  return Math.max(0, Math.min(100, n));

}



function gradIdSafe(id: string) {

  return id.replace(/:/g, "");

}



export function ScoreRing({

  value,

  label,

  size = "md",

  sublabel,

  animated = false,

  celebrate = false,

  showInner = true,

  accentStroke = false,

}: ScoreRingProps) {

  const rawId = useId();

  const progressGradId = `score-ring-progress-${gradIdSafe(rawId)}`;

  const goldGradId = `score-ring-gold-${gradIdSafe(rawId)}`;

  const target = value === null ? 0 : clampPct(value);

  const displayedRef = useRef(0);

  const [pct, setPct] = useState(animated ? 0 : target);

  const [pop, setPop] = useState(false);



  useEffect(() => {

    if (!celebrate) return;

    setPop(true);

    const t = window.setTimeout(() => setPop(false), 520);

    return () => window.clearTimeout(t);

  }, [celebrate]);



  useEffect(() => {

    if (!animated) {

      displayedRef.current = target;

      setPct(target);

      return;

    }



    const reduced =

      typeof window !== "undefined" &&

      window.matchMedia("(prefers-reduced-motion: reduce)").matches;



    if (reduced) {

      displayedRef.current = target;

      setPct(target);

      return;

    }



    const from = displayedRef.current;

    const to = target;

    if (from === to) return;



    const start = performance.now();

    let raf = 0;



    const tick = (now: number) => {

      const t = Math.min(1, (now - start) / FILL_MS);

      const eased = 1 - (1 - t) ** 3;

      const v = from + (to - from) * eased;

      setPct(v);

      if (t < 1) {

        raf = requestAnimationFrame(tick);

      } else {

        displayedRef.current = to;

      }

    };



    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);

  }, [animated, target]);



  const offset = C - (pct / 100) * C;

  const rounded = Math.round(pct);
  const valueLabel = value === null ? "—" : String(rounded);
  const isComplete = value !== null && rounded >= 100;

  const progressStroke = isComplete
    ? `url(#${goldGradId})`
    : accentStroke
      ? "var(--accent)"
      : `url(#${progressGradId})`;



  const rootClass = [

    "score-ring",

    `score-ring--${size}`,

    animated ? "score-ring--animated" : "",

    pop ? "score-ring--pop" : "",

    isComplete ? "score-ring--complete" : "",

  ]

    .filter(Boolean)

    .join(" ");



  return (

    <div

      className={rootClass}

      aria-label={label ? `${label}: ${Math.round(pct)}%` : `${Math.round(pct)}%`}

    >

      <svg viewBox="0 0 120 120" role="img" aria-hidden>

        <defs>

          <linearGradient id={progressGradId} x1="8%" y1="12%" x2="92%" y2="88%">

            <stop offset="0%" stopColor="var(--green-bright)" />

            <stop offset="55%" stopColor="var(--green)" />

            <stop offset="100%" stopColor="var(--green)" />

          </linearGradient>

          <linearGradient id={goldGradId} x1="8%" y1="12%" x2="92%" y2="88%">

            <stop offset="0%" stopColor="var(--gold-bright)" />

            <stop offset="48%" stopColor="var(--gold)" />

            <stop offset="100%" stopColor="var(--gold-deep)" />

          </linearGradient>

        </defs>

        {showInner ? <circle className="score-ring__inner" cx="60" cy="60" r={R - 14} /> : null}

        <circle

          className="score-ring__track"

          cx="60"

          cy="60"

          r={R}

          fill="none"

          strokeWidth="10"

        />

        <circle

          className="score-ring__progress"

          cx="60"

          cy="60"

          r={R}

          fill="none"

          stroke={progressStroke}

          strokeWidth="10"

          strokeDasharray={C}

          strokeDashoffset={offset}

          strokeLinecap="round"

        />

      </svg>

      <div className={`score-ring__label${sublabel ? "" : " score-ring__label--centered"}`}>
        {sublabel ? (
          <>
            <div className="score-ring__pct-wrap">
              <span className="score-ring__pct">{valueLabel}</span>
            </div>
            <span className="score-ring__sublabel">{sublabel}</span>
          </>
        ) : (
          <span className="score-ring__pct">{valueLabel}</span>
        )}
      </div>

    </div>

  );

}

