/**
 * Turns the straight lines of a DXF floor plan into wall centrelines.
 * Architects draw a wall as two parallel lines its thickness apart; each such pair becomes one wall
 * (thickness snapped to 150 / 230 mm when close). Drawings with single-line walls fall back to
 * treating every long line as a 230 mm wall. Output is in plan metres: x across, y down the sheet.
 */

export type P = [number, number];
export type DxfLine = { layer: string; points: P[]; closed: boolean };
export type DetectedWall = { a: P; b: P; thickness: number };

/** $INSUNITS → metres per drawing unit (0 = unknown: guessed from the drawing's size). */
export function unitScale(insunits: number, extent: number) {
  const known: Record<number, number> = { 1: 0.0254, 2: 0.3048, 4: 0.001, 5: 0.01, 6: 1 };
  if (known[insunits]) return known[insunits];
  if (extent > 2000) return 0.001; // a house drawn in millimetres
  if (extent > 200) return 0.01;
  return 1;
}

type Seg = { a: P; b: P; len: number; ux: number; uy: number };

export function segmentsOf(lines: DxfLine[], layers?: Set<string>): { segs: [P, P][]; extent: number } {
  const segs: [P, P][] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const line of lines) {
    if (layers && !layers.has(line.layer)) continue;
    const pts = line.points;
    const n = line.closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i += 1) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      segs.push([a, b]);
      for (const [x, y] of [a, b]) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    }
  }
  return { segs, extent: Math.max(maxX - minX, maxY - minY) };
}

export function detectWalls(lines: DxfLine[], insunits: number, layers?: Set<string>): { walls: DetectedWall[]; paired: boolean; width: number; length: number } {
  const { segs: raw, extent } = segmentsOf(lines, layers);
  const k = unitScale(insunits, extent);
  // Metres, y flipped so the drawing's top is the back of the plan.
  let segs: Seg[] = raw.map(([a, b]) => {
    const A: P = [a[0] * k, -a[1] * k], B: P = [b[0] * k, -b[1] * k];
    const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
    return { a: A, b: B, len, ux: (B[0] - A[0]) / (len || 1), uy: (B[1] - A[1]) / (len || 1) };
  }).filter((s) => s.len >= 0.2);
  segs = segs.sort((p, q) => q.len - p.len).slice(0, 4000);

  const used = new Set<number>();
  const walls: DetectedWall[] = [];
  for (let i = 0; i < segs.length; i += 1) {
    if (used.has(i)) continue;
    const s = segs[i];
    let best: { j: number; d: number; t0: number; t1: number } | null = null;
    for (let j = i + 1; j < segs.length; j += 1) {
      if (used.has(j)) continue;
      const o = segs[j];
      if (Math.abs(s.ux * o.uy - s.uy * o.ux) > 0.035) continue; // not parallel (≈2°)
      const d = Math.abs((o.a[0] - s.a[0]) * -s.uy + (o.a[1] - s.a[1]) * s.ux);
      if (d < 0.07 || d > 0.4) continue;
      const proj = (p: P) => (p[0] - s.a[0]) * s.ux + (p[1] - s.a[1]) * s.uy;
      const t0 = Math.max(0, Math.min(proj(o.a), proj(o.b))), t1 = Math.min(s.len, Math.max(proj(o.a), proj(o.b)));
      const overlap = t1 - t0;
      if (overlap < 0.3 || overlap < 0.5 * Math.min(s.len, o.len)) continue;
      if (!best || d < best.d) best = { j, d, t0, t1 };
    }
    if (!best) continue;
    used.add(i); used.add(best.j);
    const half = best.d / 2;
    const side = Math.sign((segs[best.j].a[0] - s.a[0]) * -s.uy + (segs[best.j].a[1] - s.a[1]) * s.ux) || 1;
    const nx = -s.uy * half * side, ny = s.ux * half * side;
    const at = (t: number): P => [s.a[0] + s.ux * t + nx, s.a[1] + s.uy * t + ny];
    const thickness = Math.abs(best.d - 0.23) < 0.04 ? 0.23 : Math.abs(best.d - 0.15) < 0.04 ? 0.15 : Math.round(best.d * 100) / 100;
    walls.push({ a: at(best.t0), b: at(best.t1), thickness });
  }
  const paired = walls.length >= 3;
  const result = paired ? joinCorners(walls) : segs.filter((s) => s.len >= 0.5).map((s) => ({ a: s.a, b: s.b, thickness: 0.23 }));

  // Shift so the plan starts at (0, 0).
  const xs = result.flatMap((w) => [w.a[0], w.b[0]]), ys = result.flatMap((w) => [w.a[1], w.b[1]]);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  const shifted = result.map((w) => ({ thickness: w.thickness, a: [r3(w.a[0] - minX), r3(w.a[1] - minY)] as P, b: [r3(w.b[0] - minX), r3(w.b[1] - minY)] as P }));
  return { walls: shifted, paired, width: r3(Math.max(...xs) - minX), length: r3(Math.max(...ys) - minY) };
}

/** Pairs stop short of each other at corners and tees; stretch each end onto the wall it meets (≤ 0.35 m). */
function joinCorners(walls: DetectedWall[]): DetectedWall[] {
  const out = walls.map((w) => ({ ...w, a: [...w.a] as P, b: [...w.b] as P }));
  const cross = (p: P, q: P, r: P, s: P): P | null => {
    const d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]);
    if (Math.abs(d) < 1e-9) return null;
    const t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d;
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  };
  const along = (w: DetectedWall, p: P) => {
    const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]) || 1;
    return ((p[0] - w.a[0]) * (w.b[0] - w.a[0]) + (p[1] - w.a[1]) * (w.b[1] - w.a[1])) / len / len;
  };
  for (const w of out) {
    for (const end of ["a", "b"] as const) {
      let best: { p: P; d: number } | null = null;
      for (const o of out) {
        if (o === w) continue;
        const hit = cross(w.a, w.b, o.a, o.b);
        if (!hit) continue;
        const d = Math.hypot(hit[0] - w[end][0], hit[1] - w[end][1]);
        const t = along(o, hit);
        const olen = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]);
        if (d <= 0.35 && t > -0.35 / olen && t < 1 + 0.35 / olen && (!best || d < best.d)) best = { p: hit, d };
      }
      if (best) w[end] = best.p;
    }
  }
  return out;
}
