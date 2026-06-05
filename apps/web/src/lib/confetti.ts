/**
 * Tiny dependency-free confetti celebration. Pops a burst of particles from a
 * point (the centre of `origin`, else the top-third of the screen), then lets
 * them arc, flutter (horizontal sway), spin, and rain down under gravity before
 * fading out and self-cleaning. Skipped entirely under reduced-motion.
 */
const COLORS = ["#f5c542", "#34d399", "#60a5fa", "#f472b6", "#fb923c", "#c084fc", "#facc15"];
const COUNT = 70;
const DURATION = 2400; // ms
const GRAVITY = 0.0011; // px / ms²
const DRAG = 0.0006; // velocity damping per ms

interface Particle {
  el: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
}

export function celebrateConfetti(origin?: HTMLElement | null): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  let ox = window.innerWidth / 2;
  let oy = window.innerHeight / 3;
  const rect = origin?.getBoundingClientRect();
  if (rect && (rect.width || rect.height)) {
    ox = rect.left + rect.width / 2;
    oy = rect.top + rect.height / 2;
  }

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  container.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;";
  document.body.appendChild(container);

  const parts: Particle[] = [];
  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement("div");
    const w = 6 + Math.random() * 6;
    const round = Math.random() < 0.45;
    el.style.cssText =
      `position:absolute;top:0;left:0;will-change:transform,opacity;` +
      `width:${w.toFixed(1)}px;height:${(round ? w : w * 0.45).toFixed(1)}px;` +
      `background:${COLORS[Math.floor(Math.random() * COLORS.length)]};` +
      `border-radius:${round ? "50%" : "1px"};`;
    container.appendChild(el);

    // Radial burst with a strong upward bias so it pops then rains down.
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.22 + Math.random() * 0.45;
    parts.push({
      el,
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.42,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 1.1,
      swayAmp: 0.015 + Math.random() * 0.03,
      swayFreq: 0.004 + Math.random() * 0.005,
      swayPhase: Math.random() * Math.PI * 2,
    });
  }

  const startT = performance.now();
  let last = startT;
  const tick = (now: number) => {
    const dt = Math.min(40, now - last);
    last = now;
    const elapsed = now - startT;
    const life = Math.min(1, elapsed / DURATION);
    const opacity = life < 0.7 ? 1 : 1 - (life - 0.7) / 0.3;

    for (const p of parts) {
      p.vy += GRAVITY * dt;
      const damp = 1 - DRAG * dt;
      p.vx *= damp;
      p.vy *= damp;
      const sway = Math.sin(elapsed * p.swayFreq + p.swayPhase) * p.swayAmp;
      p.x += (p.vx + sway) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      p.el.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) rotate(${p.rot.toFixed(0)}deg)`;
      p.el.style.opacity = opacity.toFixed(2);
    }

    if (elapsed < DURATION) requestAnimationFrame(tick);
    else container.remove();
  };
  requestAnimationFrame(tick);
}
