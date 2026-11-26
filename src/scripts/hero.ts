// The slowly turning verdite in the front-page hero. Stops drawing while it
// is off screen; with reduced motion it draws one still frame.

import { drawVerdite, fitCanvas } from "./verdite-render";

const TURN_MS = 16000; // one full turn
const BOB_MS = 6000; // one rise and fall
const TILT_RAD = 0.32;

export function spinHeroGem(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let size = fitCanvas(canvas, ctx);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const draw = (now: number) => {
    const { width, height } = size;
    ctx.clearRect(0, 0, width, height);
    const radius = Math.min(width, height) * 0.36;
    const bob = still ? 0 : Math.sin((now / BOB_MS) * Math.PI * 2) * radius * 0.04;
    drawVerdite(ctx, {
      cx: width / 2,
      cy: height / 2 + bob,
      radius,
      spin: (now / TURN_MS) * Math.PI * 2,
      tilt: TILT_RAD,
    });
  };

  let visible = true;
  let frameId = 0;
  const loop = (now: number) => {
    draw(now);
    frameId = visible ? requestAnimationFrame(loop) : 0;
  };

  window.addEventListener("resize", () => {
    size = fitCanvas(canvas, ctx);
    if (still) draw(0);
  });

  if (still) {
    draw(0);
    return;
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && frameId === 0) frameId = requestAnimationFrame(loop);
  }).observe(canvas);
  frameId = requestAnimationFrame(loop);
}
