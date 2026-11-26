// Draws the verdite gem as a glowing wireframe on a 2D canvas.
// Used by the intro and the front-page hero.

import objText from "../assets/verdite.obj?raw";
import { parseObj, type Vec3 } from "./verdite-model";

const wireframe = parseObj(objText);

const CAMERA_DISTANCE = 4; // in gem radii; smaller means stronger perspective
const DEPTH_BUCKETS = 4; // how many brightness steps from back to front

// Drawn in order: two soft glow lines, then the bright core. Widths in px at a
// 140px gem radius; they scale with the gem.
const PASSES = [
  { width: 9, colour: "110, 235, 140", alpha: 0.06 },
  { width: 4.5, colour: "110, 235, 140", alpha: 0.14 },
  { width: 1.3, colour: "190, 255, 205", alpha: 1 },
];

export interface GemPose {
  cx: number;
  cy: number;
  radius: number;
  /** Spin about the vertical axis, radians. */
  spin: number;
  /** Lean towards the viewer, radians; positive looks down on the top. */
  tilt: number;
  /** 0..1, multiplies every line's opacity. */
  opacity?: number;
}

interface Point {
  x: number;
  y: number;
  z: number;
}

export function drawVerdite(ctx: CanvasRenderingContext2D, pose: GemPose): void {
  const { cx, cy, radius, opacity = 1 } = pose;
  const cosS = Math.cos(pose.spin);
  const sinS = Math.sin(pose.spin);
  const cosT = Math.cos(pose.tilt);
  const sinT = Math.sin(pose.tilt);

  const projected: Point[] = wireframe.vertices.map(([vx, vy, vz]: Vec3) => {
    const x1 = vx * cosS + vz * sinS;
    const z1 = -vx * sinS + vz * cosS;
    const y2 = vy * cosT - z1 * sinT;
    const z2 = vy * sinT + z1 * cosT;
    const scale = (CAMERA_DISTANCE / (CAMERA_DISTANCE - z2)) * radius;
    return { x: cx + x1 * scale, y: cy - y2 * scale, z: z2 };
  });

  // A dark body first, so whatever is behind the gem is hidden, not seen through it.
  const outline = convexHull(projected);
  ctx.fillStyle = `rgba(6, 14, 9, ${0.88 * opacity})`;
  ctx.beginPath();
  outline.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();

  // The glow is a few wide, faint lines under the bright one; canvas blur
  // (shadowBlur) looks similar but costs a whole frame to draw. Edges are
  // grouped by depth so each pass is one path per group: back edges dimmer.
  const buckets: [Point, Point][][] = Array.from({ length: DEPTH_BUCKETS }, () => []);
  for (const [a, b] of wireframe.edges) {
    const pa = projected[a];
    const pb = projected[b];
    const depth = ((pa.z + pb.z) / 2 + 1) / 2; // 0 back .. 1 front
    const i = Math.min(DEPTH_BUCKETS - 1, Math.floor(depth * DEPTH_BUCKETS));
    buckets[i].push([pa, pb]);
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const lineScale = Math.max(0.7, Math.min(1.4, radius / 140));
  for (const pass of PASSES) {
    ctx.lineWidth = pass.width * lineScale;
    buckets.forEach((edges, i) => {
      if (edges.length === 0) return;
      const depth = (i + 0.5) / DEPTH_BUCKETS;
      ctx.strokeStyle = `rgba(${pass.colour}, ${pass.alpha * opacity * (0.3 + 0.7 * depth)})`;
      ctx.beginPath();
      for (const [pa, pb] of edges) {
        ctx.moveTo(pa.x, pa.y);
        ctx.lineTo(pb.x, pb.y);
      }
      ctx.stroke();
    });
  }
}

/** Sizes a canvas's backing store to its CSS size and pixel ratio. Returns the CSS size. */
export function fitCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): { width: number; height: number } {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height };
}

// The gem's outline on screen (Andrew's monotone chain).
function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length < 3) return sorted;
  const cross = (o: Point, a: Point, b: Point) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (list: Point[]) => {
    const out: Point[] = [];
    for (const p of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}
