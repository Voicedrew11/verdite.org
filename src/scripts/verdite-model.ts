// The verdite gem's wireframe, read from the King's Field II model
// (src/assets/verdite.obj, the same one the trailer renders).

export type Vec3 = [number, number, number];

export interface Wireframe {
  /** Vertices centred on the origin, scaled so the farthest one is 1 away. */
  vertices: Vec3[];
  /** Each edge once, as a pair of indices into `vertices`. */
  edges: [number, number][];
}

/** Reads the `v` and `f` lines of a Wavefront OBJ into a wireframe. */
export function parseObj(text: string): Wireframe {
  const raw: Vec3[] = [];
  const seen = new Set<string>();
  const edges: [number, number][] = [];

  for (const line of text.split("\n")) {
    const parts = line.trim().split(/\s+/);
    if (parts[0] === "v" && parts.length >= 4) {
      raw.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
      continue;
    }
    if (parts[0] !== "f") continue;
    // "f 1/1/1 2/2/1 3/3/1": the vertex index comes before the first slash, 1-based.
    const face = parts.slice(1).map((p) => Number(p.split("/")[0]) - 1);
    for (let i = 0; i < face.length; i++) {
      const a = face[i];
      const b = face[(i + 1) % face.length];
      if (!(a >= 0 && b >= 0 && a < raw.length && b < raw.length) || a === b) continue;
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([a, b]);
    }
  }

  return { vertices: normalise(raw), edges };
}

function normalise(points: Vec3[]): Vec3[] {
  if (points.length === 0) return [];
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of points) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], p[k]);
      max[k] = Math.max(max[k], p[k]);
    }
  }
  const centre = min.map((m, k) => (m + max[k]) / 2) as Vec3;
  let radius = 0;
  for (const p of points) {
    radius = Math.max(radius, Math.hypot(p[0] - centre[0], p[1] - centre[1], p[2] - centre[2]));
  }
  const scale = radius > 0 ? 1 / radius : 1;
  return points.map((p) => [
    (p[0] - centre[0]) * scale,
    (p[1] - centre[1]) * scale,
    (p[2] - centre[2]) * scale,
  ]);
}
