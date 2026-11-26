// Runs the front-page intro (see components/Intro.astro).
// One clock drives everything: the verdite crossing the screen, how much of
// the logo is uncovered, and the logo then flying up into the nav bar while
// the dark backdrop fades to show the site.

import { drawVerdite, fitCanvas } from "./verdite-render";

// Timeline, in milliseconds from the start.
const DELAY_MS = 250; // dark screen before the verdite enters
const TRAVEL_MS = 2000; // verdite crossing the screen
const HOLD_MS = 550; // logo shown in full
const SETTLE_MS = 900; // logo moves into the nav, site fades in
const SETTLE_START_MS = DELAY_MS + TRAVEL_MS + HOLD_MS;
const END_MS = SETTLE_START_MS + SETTLE_MS;

const TILT_RAD = 0.38; // looking slightly down on the gem
const SPIN_PER_RADIUS = 0.8; // radians turned per gem radius travelled, so it rolls
const GLOW_PX = 80; // how far past the logo the clip keeps moving

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Layout {
  width: number;
  height: number;
  radius: number;
  logo: Rect; // where the logo sits in the overlay, untransformed
  target: Rect | null; // the nav logo it settles into
}

export function playIntro(overlay: HTMLElement): void {
  const canvas = overlay.querySelector("canvas");
  const logo = overlay.querySelector<HTMLElement>(".intro-logo");
  const backdrop = overlay.querySelector<HTMLElement>(".intro-backdrop");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !logo || !backdrop || !ctx) {
    finish(overlay);
    return;
  }

  try {
    sessionStorage.setItem("verdite-intro-seen", "1");
  } catch { /* storage blocked: it will play again next time; fine */ }

  let layout = measure(canvas, ctx, logo);
  const onResize = () => { layout = measure(canvas, ctx, logo); };
  window.addEventListener("resize", onResize);

  const start = performance.now();
  let skipOffset = 0;
  const skip = () => {
    const elapsed = performance.now() - start + skipOffset;
    if (elapsed < SETTLE_START_MS) skipOffset += SETTLE_START_MS - elapsed;
  };
  const skipEvents = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
  for (const name of skipEvents) window.addEventListener(name, skip, { passive: true });

  const frame = (now: number) => {
    const t = now - start + skipOffset;
    if (t >= END_MS) {
      window.removeEventListener("resize", onResize);
      for (const name of skipEvents) window.removeEventListener(name, skip);
      finish(overlay);
      return;
    }
    drawFrame(t, layout, ctx, logo, backdrop);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function finish(overlay: HTMLElement): void {
  overlay.remove();
  delete document.documentElement.dataset.intro;
}

function measure(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, logo: HTMLElement): Layout {
  const { width, height } = fitCanvas(canvas, ctx);

  const transform = logo.style.transform;
  logo.style.transform = "none";
  const logoRect = logo.getBoundingClientRect();
  logo.style.transform = transform;

  const navLogo = document.querySelector(".nav-logo img");
  const target = navLogo ? navLogo.getBoundingClientRect() : null;

  const radius = Math.min(Math.max(logoRect.height * 0.95, 56), height * 0.38);
  return { width, height, radius, logo: logoRect, target };
}

function drawFrame(
  t: number,
  layout: Layout,
  ctx: CanvasRenderingContext2D,
  logo: HTMLElement,
  backdrop: HTMLElement,
): void {
  const { width, height, radius } = layout;
  ctx.clearRect(0, 0, width, height);

  // The verdite crosses from just off the left edge to just off the right.
  const travel = clamp01((t - DELAY_MS) / TRAVEL_MS);
  const startX = -radius * 1.4;
  const endX = width + radius * 1.4;
  const x = startX + glide(travel) * (endX - startX);
  const cy = layout.logo.top + layout.logo.height / 2;

  // The logo is uncovered up to the verdite's centre.
  const hiddenRight = Math.max(layout.logo.left + layout.logo.width - x, -GLOW_PX);
  logo.style.setProperty("--hidden-right", `${hiddenRight}px`);

  if (travel > 0 && travel < 1) {
    drawVerdite(ctx, { cx: x, cy, radius, spin: (x / radius) * SPIN_PER_RADIUS, tilt: TILT_RAD });
  }

  // Then the logo flies into the nav bar and the backdrop fades out.
  const settle = clamp01((t - SETTLE_START_MS) / SETTLE_MS);
  if (settle > 0) {
    const p = easeInOutCubic(settle);
    backdrop.style.opacity = String(1 - p);
    if (layout.target) {
      const { logo: from, target: to } = layout;
      const scale = 1 + (to.width / from.width - 1) * p;
      const dx = (to.left - from.left) * p;
      const dy = (to.top - from.top) * p;
      logo.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    } else {
      logo.style.opacity = String(1 - p);
    }
  }
}

// Eases in and out, but not so much that the verdite lingers off screen.
function glide(p: number): number {
  const sine = 0.5 - Math.cos(Math.PI * p) / 2;
  return 0.4 * p + 0.6 * sine;
}

function easeInOutCubic(p: number): number {
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
