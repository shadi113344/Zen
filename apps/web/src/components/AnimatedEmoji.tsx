import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useEffect, useRef, useState } from "react";
import { loadNotoEmojiLottie } from "@/lib/noto-emoji";

interface AnimatedEmojiProps {
  codepoint: string;
  /** Static Unicode fallback while loading or when motion is reduced. */
  fallback: string;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  /** Remount / restart playback when this changes. */
  playKey?: number;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

/** Noto Emoji Animation Lottie player with Unicode fallback. */
export function AnimatedEmoji({
  codepoint,
  fallback,
  size = 20,
  loop = true,
  autoplay = true,
  className,
  playKey,
}: AnimatedEmojiProps) {
  const reducedMotion = usePrefersReducedMotion();
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const [data, setData] = useState<object | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadNotoEmojiLottie(codepoint)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [codepoint]);

  useEffect(() => {
    if (reducedMotion) return;
    if (autoplay) lottieRef.current?.goToAndPlay(0, true);
    else lottieRef.current?.goToAndStop(0, true);
  }, [playKey, autoplay, reducedMotion, codepoint]);

  if (reducedMotion || !data) {
    return (
      <span className={className} style={{ fontSize: size, lineHeight: 1 }} aria-hidden>
        {fallback}
      </span>
    );
  }

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={data}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
