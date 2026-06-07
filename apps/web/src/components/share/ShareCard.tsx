import { forwardRef, type CSSProperties } from "react";

export interface ShareCardData {
  /** Large hero figure, e.g. "100". */
  bigNumber: string;
  /** Unit under/after the figure, e.g. "days". */
  bigUnit: string;
  /** Name-free headline, e.g. "days of showing up". */
  caption: string;
  /** Optional revealed detail (activity name) — omitted on abstract shares. */
  subtitle?: string;
  /** Accent colour (any CSS colour or var). */
  accent?: string;
  /** Abstract dot grid size (capped) — a wordless picture of the streak. */
  dots?: number;
}

const MAX_DOTS = 100;

/**
 * The shareable artefact (G2). Output-only: shows a number + an abstract
 * visual; the activity name appears only when `subtitle` is provided.
 * `ref` targets this node for html-to-image capture.
 */
export const ShareCard = forwardRef<HTMLDivElement, ShareCardData>(function ShareCard(
  { bigNumber, bigUnit, caption, subtitle, accent = "var(--accent)", dots = 0 },
  ref,
) {
  const dotCount = Math.min(Math.max(0, dots), MAX_DOTS);
  return (
    <div ref={ref} className="share-card" style={{ "--share-accent": accent } as CSSProperties}>
      <div className="share-card__brand">Mottazen</div>
      <div className="share-card__hero">
        <span className="share-card__num">{bigNumber}</span>
        <span className="share-card__unit">{bigUnit}</span>
      </div>
      <div className="share-card__caption">{caption}</div>
      {dotCount > 0 ? (
        <div className="share-card__dots" aria-hidden>
          {Array.from({ length: dotCount }).map((_, i) => (
            <span key={i} className="share-card__dot" />
          ))}
        </div>
      ) : null}
      {subtitle ? <div className="share-card__subtitle">{subtitle}</div> : null}
      <div className="share-card__foot">a quiet, private habit coach</div>
    </div>
  );
});
