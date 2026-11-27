import { CATALOG, DOOR_PRICE_ID, WINDOW_HEIGHT, WINDOW_PRICE_ID, catalogItem, marketPrice } from "./catalog";

/** Space Planner drawing. All coordinates are in millimetres on the floor plan (x right, y down). */
export type Pt = { x: number; y: number };
/** bulge: for a curved wall, the signed distance in mm from the middle of the straight line a→b to the middle of the arc (0 or missing = straight). */
export type Wall = { id: string; a: Pt; b: Pt; thickness: number; bulge?: number };
export type Opening = { id: string; wallId: string; kind: "door" | "window"; t: number; width: number; price?: number | null };
/** mount: height of the underside above the floor (mm); when missing the catalogue default is used. */
export type Item = { id: string; type: string; x: number; y: number; w: number; d: number; h: number; rot: number; label?: string; price?: number | null; mount?: number };
export type Backdrop = { image: string; pxW: number; pxH: number; mmPerPx: number; x: number; y: number; opacity: number };
/** A room name pinned at a point; the room is whichever closed area of walls contains the point. */
export type RoomTag = { id: string; name: string; x: number; y: number };
export type Plan = { version: 1; title: string; height: number; walls: Wall[]; tags: RoomTag[]; openings: Opening[]; items: Item[]; backdrop: Backdrop | null };

export const emptyPlan = (): Plan => ({ version: 1, title: "My space", height: 3000, walls: [], tags: [], openings: [], items: [], backdrop: null });

let counter = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const round10 = (n: number) => Math.round(n / 10) * 10;

// ---------- Curved walls: exact circular arcs ----------

export type Arc = { c: Pt; r: number; a0: number; sweep: number; length: number; chord: number; bulge: number; mid: Pt; normal: Pt };

/** The circle of a curved wall, or null when it is straight. */
export function arcOf(w: Wall): Arc | null {
  const s = w.bulge ?? 0, chord = dist(w.a, w.b);
  if (Math.abs(s) < 1 || chord < 1) return null;
  const u = { x: (w.b.x - w.a.x) / chord, y: (w.b.y - w.a.y) / chord };
  const n = { x: -u.y, y: u.x }; // positive bulge bows to this side
  const m = { x: (w.a.x + w.b.x) / 2, y: (w.a.y + w.b.y) / 2 };
  const r = (chord * chord / 4 + s * s) / (2 * Math.abs(s));
  const k = s - Math.sign(s) * r;
  const c = { x: m.x + n.x * k, y: m.y + n.y * k };
  const mid = { x: m.x + n.x * s, y: m.y + n.y * s };
  const theta = 4 * Math.atan((2 * Math.abs(s)) / chord);
  const va = { x: w.a.x - c.x, y: w.a.y - c.y }, vm = { x: mid.x - c.x, y: mid.y - c.y };
  const dir = Math.sign(va.x * vm.y - va.y * vm.x) || 1;
  return { c, r, a0: Math.atan2(va.y, va.x), sweep: theta * dir, length: r * theta, chord, bulge: s, mid, normal: n };
}

export const wallLength = (w: Wall) => { const arc = arcOf(w); return arc ? arc.length : dist(w.a, w.b); };

/** Point at fraction t (0..1) along a wall, following the curve when curved. */
export function pointOnWall(w: Wall, t: number): Pt {
  const arc = arcOf(w);
  if (!arc) return { x: w.a.x + (w.b.x - w.a.x) * t, y: w.a.y + (w.b.y - w.a.y) * t };
  const ang = arc.a0 + arc.sweep * t;
  return { x: arc.c.x + Math.cos(ang) * arc.r, y: arc.c.y + Math.sin(ang) * arc.r };
}

/** Unit direction of travel along a wall at fraction t. */
export function tangentAt(w: Wall, t: number): Pt {
  const arc = arcOf(w);
  if (!arc) { const L = dist(w.a, w.b) || 1; return { x: (w.b.x - w.a.x) / L, y: (w.b.y - w.a.y) / L }; }
  const ang = arc.a0 + arc.sweep * t, d = Math.sign(arc.sweep);
  return { x: -Math.sin(ang) * d, y: Math.cos(ang) * d };
}

/** The wall as straight pieces: itself when straight, or arc pieces of at most 2° (chord error under 1 mm for radii up to 6.5 m). */
export function wallPolyline(w: Wall, maxStepDeg = 2): Pt[] {
  const arc = arcOf(w);
  if (!arc) return [w.a, w.b];
  // Pieces of at most maxStepDeg, but never shorter than 20 mm (so tight curves stay clean for room detection).
  const n = Math.max(2, Math.min(Math.ceil(Math.abs(arc.sweep) / ((maxStepDeg * Math.PI) / 180)), Math.floor(arc.length / 20)));
  return Array.from({ length: n + 1 }, (_, i) => (i === 0 ? w.a : i === n ? w.b : pointOnWall(w, i / n)));
}

/** Bulge for an arc from a to b passing through p (AutoCAD 3-point arc). Null when the three points are in a line. */
export function bulgeThrough(a: Pt, b: Pt, p: Pt): number | null {
  const chord = dist(a, b);
  if (chord < 1) return null;
  const d = 2 * (a.x * (b.y - p.y) + b.x * (p.y - a.y) + p.x * (a.y - b.y));
  if (Math.abs(d) < 1e-6) return null;
  const a2 = a.x * a.x + a.y * a.y, b2 = b.x * b.x + b.y * b.y, p2 = p.x * p.x + p.y * p.y;
  const c = { x: (a2 * (b.y - p.y) + b2 * (p.y - a.y) + p2 * (a.y - b.y)) / d, y: (a2 * (p.x - b.x) + b2 * (a.x - p.x) + p2 * (b.x - a.x)) / d };
  const r = dist(c, a);
  const u = { x: (b.x - a.x) / chord, y: (b.y - a.y) / chord }, n = { x: -u.y, y: u.x };
  const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const h = (c.x - m.x) * n.x + (c.y - m.y) * n.y; // centre's side of the chord
  const side = Math.sign((p.x - m.x) * n.x + (p.y - m.y) * n.y) || 1; // the arc's side (where p is)
  return h + r * side;
}

/** Bulge for a given radius on one side (+1 / -1); the radius must be at least half the chord. */
export function bulgeForRadius(chord: number, radius: number, side: number, major = false): number | null {
  if (radius < chord / 2 - 0.5) return null;
  const h = Math.sqrt(Math.max(0, radius * radius - (chord * chord) / 4));
  return (side >= 0 ? 1 : -1) * (major ? radius + h : radius - h);
}

/** Closest point on a wall, with t (0..1 along the wall) and the distance to it. Works for curved walls. */
export function projectOnWall(p: Pt, w: Wall) {
  const arc = arcOf(w);
  if (arc) {
    const two = Math.PI * 2;
    let off = (Math.atan2(p.y - arc.c.y, p.x - arc.c.x) - arc.a0) * Math.sign(arc.sweep);
    off = ((off % two) + two) % two;
    const span = Math.abs(arc.sweep);
    if (off <= span) {
      const t = off / span, q = pointOnWall(w, t);
      return { t, point: q, distance: dist(p, q) };
    }
    const da = dist(p, w.a), db = dist(p, w.b);
    return da <= db ? { t: 0, point: { ...w.a }, distance: da } : { t: 1, point: { ...w.b }, distance: db };
  }
  const dx = w.b.x - w.a.x, dy = w.b.y - w.a.y, len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - w.a.x) * dx + (p.y - w.a.y) * dy) / len2));
  const q = { x: w.a.x + dx * t, y: w.a.y + dy * t };
  return { t, point: q, distance: dist(p, q) };
}

// ---------- CAD-style snapping ----------

export type SnapKind = "end" | "mid" | "on" | "ortho" | "angle" | "free";
export type Snap = { pt: Pt; kind: SnapKind };

/**
 * Where a wall point lands, like AutoCAD object snaps: wall ends first, then wall midpoints, then any point
 * on a wall. With no object nearby and a start point given, the direction is locked straight (ortho) or to
 * 15° steps, and the length rounded to 10 mm.
 */
export function snapPoint(p: Pt, walls: Wall[], tolerance: number, from?: Pt | null, ortho = true): Snap {
  let best: Snap | null = null, bestD = tolerance;
  for (const w of walls) for (const e of [w.a, w.b]) { const d = dist(e, p); if (d <= bestD) { bestD = d; best = { pt: { ...e }, kind: "end" }; } }
  if (best) return best;
  bestD = tolerance;
  for (const w of walls) { const m = pointOnWall(w, 0.5); const d = dist(m, p); if (d <= bestD) { bestD = d; best = { pt: m, kind: "mid" }; } }
  if (best) return best;
  bestD = tolerance;
  let onWall: Wall | null = null;
  for (const w of walls) { const r = projectOnWall(p, w); if (r.distance <= bestD) { bestD = r.distance; best = { pt: r.point, kind: "on" }; onWall = w; } }
  if (best && onWall) {
    // Drawing from a start point onto a wall: prefer the square (straight-across) point on that wall.
    if (from) for (const cand of [{ x: from.x, y: best.pt.y }, { x: best.pt.x, y: from.y }]) {
      const r = projectOnWall(cand, onWall);
      if (r.distance < 1 && dist(r.point, p) <= tolerance * 1.5) return { pt: r.point, kind: "on" };
    }
    return best;
  }
  if (!from) return { pt: { x: round10(p.x), y: round10(p.y) }, kind: "free" };
  const dx = p.x - from.x, dy = p.y - from.y, len = Math.hypot(dx, dy);
  if (ortho) {
    return Math.abs(dx) >= Math.abs(dy) ? { pt: { x: from.x + round10(dx), y: from.y }, kind: "ortho" } : { pt: { x: from.x, y: from.y + round10(dy) }, kind: "ortho" };
  }
  const step = Math.PI / 12, ang = Math.round(Math.atan2(dy, dx) / step) * step, L = round10(len);
  return { pt: { x: from.x + Math.cos(ang) * L, y: from.y + Math.sin(ang) * L }, kind: "angle" };
}

/** A point a given length from `from`, in the direction of `toward` (typed length, like AutoCAD direct distance entry). */
export function pointAtLength(from: Pt, toward: Pt, length: number): Pt {
  const d = dist(from, toward) || 1;
  return { x: from.x + ((toward.x - from.x) / d) * length, y: from.y + ((toward.y - from.y) / d) * length };
}

/** Snap a wall end straight, or onto an existing wall. */
export function snapEnd(start: Pt, p: Pt, walls: Wall[], tolerance: number): Pt {
  return snapPoint(p, walls, tolerance, start, true).pt;
}

/** Set a wall's length by moving its end point along its direction. */
export function withLength(w: Wall, length: number): Wall {
  const len = wallLength(w) || 1, k = length / len;
  // Same shape, scaled about the start point: a curved wall keeps its curvature proportion.
  return { ...w, b: { x: w.a.x + (w.b.x - w.a.x) * k, y: w.a.y + (w.b.y - w.a.y) * k }, ...(w.bulge ? { bulge: w.bulge * k } : {}) };
}

// ---------- Shape shortcuts (they draw ordinary walls) ----------

export type RoomShape = "rect" | "L" | "T" | "U";
export const SHAPE_LABEL: Record<RoomShape, string> = { rect: "Rectangle", L: "L-shape", T: "T-shape", U: "U-shape" };
export const CUT_LABELS: Record<RoomShape, [string, string] | null> = { rect: null, L: ["Cut-out width", "Cut-out depth"], T: ["Stem width", "Top depth"], U: ["Opening width", "Opening depth"] };

export function defaultCuts(shape: RoomShape, w: number, l: number) {
  if (shape === "L") return { a: round10(w / 2), b: round10(l / 2) };
  if (shape === "T") return { a: round10(w / 3), b: round10(l / 3) };
  if (shape === "U") return { a: round10(w / 3), b: round10(l / 2) };
  return { a: 0, b: 0 };
}

/** Outline of a shape, clockwise on screen, with its top-left at x, y. */
export function shapeOutline(shape: RoomShape, x: number, y: number, w: number, l: number, a?: number, b?: number): Pt[] {
  const cuts = defaultCuts(shape, w, l);
  const ca = Math.max(0, Math.min(a ?? cuts.a, w - 100)), cb = Math.max(0, Math.min(b ?? cuts.b, l - 100));
  let pts: [number, number][];
  if (shape === "L") pts = [[0, 0], [w - ca, 0], [w - ca, cb], [w, cb], [w, l], [0, l]];
  else if (shape === "T") pts = [[0, 0], [w, 0], [w, cb], [(w + ca) / 2, cb], [(w + ca) / 2, l], [(w - ca) / 2, l], [(w - ca) / 2, cb], [0, cb]];
  else if (shape === "U") pts = [[0, 0], [(w - ca) / 2, 0], [(w - ca) / 2, cb], [(w + ca) / 2, cb], [(w + ca) / 2, 0], [w, 0], [w, l], [0, l]];
  else pts = [[0, 0], [w, 0], [w, l], [0, l]];
  return pts.map(([px, py]) => ({ x: x + px, y: y + py }));
}

export const outlineWalls = (pts: Pt[], thickness = 150): Wall[] => pts.map((a, i) => ({ id: uid("w"), a, b: pts[(i + 1) % pts.length], thickness }));

/** Four walls of a rectangular room, starting at the origin. */
export const rectangleRoom = (width: number, length: number, thickness = 150): Wall[] => outlineWalls(shapeOutline("rect", 0, 0, width, length), thickness);

// ---------- Rooms found from the walls (like Revit room detection) ----------

export function signedArea(pts: Pt[]) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p.x * q.y - q.x * p.y; }
  return s / 2;
}
export const polygonArea = (pts: Pt[]) => Math.abs(signedArea(pts)) / 1e6;

export function pointInPolygon(p: Pt, pts: Pt[]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i], b = pts[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** A point well inside a polygon (for its label): the sampled point furthest from every edge. */
export function labelPoint(pts: Pt[]): Pt {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const edgeDist = (p: Pt) => {
    let d = Infinity;
    for (let i = 0; i < pts.length; i++) d = Math.min(d, projectOnWall(p, { id: "", a: pts[i], b: pts[(i + 1) % pts.length], thickness: 0 }).distance);
    return d;
  };
  let best: Pt = pts[0], bestD = -1;
  const N = 16;
  for (let i = 1; i < N; i++) for (let j = 1; j < N; j++) {
    const p = { x: minX + ((maxX - minX) * i) / N, y: minY + ((maxY - minY) * j) / N };
    if (!pointInPolygon(p, pts)) continue;
    const d = edgeDist(p);
    if (d > bestD) { bestD = d; best = p; }
  }
  return best;
}

export type DetectedRoom = { key: string; pts: Pt[]; area: number; label: Pt; name: string; tagId: string | null };

function segIntersection(p: Pt, p2: Pt, q: Pt, q2: Pt): Pt | null {
  const r = { x: p2.x - p.x, y: p2.y - p.y }, s = { x: q2.x - q.x, y: q2.y - q.y };
  const den = r.x * s.y - r.y * s.x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / den, u = ((q.x - p.x) * r.y - (q.y - p.y) * r.x) / den;
  if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;
  return { x: p.x + t * r.x, y: p.y + t * r.y };
}

/**
 * Closed areas formed by the wall centre-lines. Walls are split where they meet or cross (including a wall
 * starting part-way along another), then each enclosed face of the resulting network is a room.
 */
export function detectRooms(walls: Wall[], tags: RoomTag[] = []): DetectedRoom[] {
  const SNAP = 5;
  const pieces: Wall[] = walls.flatMap((w) => { const pts = wallPolyline(w); return pts.slice(1).map((b, i) => ({ id: w.id, a: pts[i], b, thickness: w.thickness })); });
  const segs = pieces.filter((w) => dist(w.a, w.b) > 0.5);
  const splits = segs.map(() => [0, 1]);
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const a = segs[i], b = segs[j];
    const add = (k: number, w: Wall, pt: Pt) => { const r = projectOnWall(pt, w); if (r.distance <= SNAP) splits[k].push(r.t); };
    const x = segIntersection(a.a, a.b, b.a, b.b);
    if (x) { add(i, a, x); add(j, b, x); }
    for (const e of [b.a, b.b]) add(i, a, e);
    for (const e of [a.a, a.b]) add(j, b, e);
  }
  const nodes: Pt[] = [];
  const nodeOf = (p: Pt) => { let k = nodes.findIndex((n) => dist(n, p) <= SNAP); if (k < 0) { nodes.push(p); k = nodes.length - 1; } return k; };
  const adj = new Map<number, Set<number>>();
  const link = (u: number, v: number) => { if (!adj.has(u)) adj.set(u, new Set()); adj.get(u)!.add(v); };
  segs.forEach((w, k) => {
    const ts = [...new Set(splits[k].map((t) => Math.round(t * 1e6) / 1e6))].sort((m, n) => m - n);
    const ids = ts.map((t) => nodeOf({ x: w.a.x + (w.b.x - w.a.x) * t, y: w.a.y + (w.b.y - w.a.y) * t }));
    for (let i = 0; i + 1 < ids.length; i++) if (ids[i] !== ids[i + 1]) { link(ids[i], ids[i + 1]); link(ids[i + 1], ids[i]); }
  });
  const ang = (u: number, v: number) => Math.atan2(nodes[v].y - nodes[u].y, nodes[v].x - nodes[u].x);
  const sorted = new Map<number, number[]>();
  for (const [u, vs] of adj) sorted.set(u, [...vs].sort((m, n) => ang(u, m) - ang(u, n)));
  const used = new Set<string>(), faces: Pt[][] = [];
  for (const [u0, vs] of adj) for (const v0 of vs) {
    if (used.has(`${u0}>${v0}`)) continue;
    let u = u0, v = v0;
    const face: number[] = [];
    for (let guard = 0; guard < 20000; guard++) {
      used.add(`${u}>${v}`); face.push(u);
      const around = sorted.get(v)!, i = around.indexOf(u);
      const next = around[(i - 1 + around.length) % around.length];
      u = v; v = next;
      if (u === u0 && v === v0) break;
    }
    faces.push(face.map((k) => nodes[k]));
  }
  // With y pointing down and this turning rule, enclosed faces have positive signed area; outer boundaries negative.
  const found = faces.filter((f) => f.length >= 3 && signedArea(f) > 1e4).map((pts) => ({ pts, area: polygonArea(pts) })).sort((a, b) => b.area - a.area);
  const taken = new Set<string>();
  return found.map(({ pts, area }, i) => {
    const tag = tags.find((t) => !taken.has(t.id) && pointInPolygon(t, pts));
    if (tag) taken.add(tag.id);
    const label = labelPoint(pts);
    return { key: `${Math.round(label.x)},${Math.round(label.y)}`, pts, area, label, name: tag?.name ?? `Room ${i + 1}`, tagId: tag?.id ?? null };
  });
}

/** Total floor area of the closed areas formed by these walls, in m². */
export function enclosedArea(walls: Wall[]): number | null {
  const rooms = detectRooms(walls);
  return rooms.length ? rooms.reduce((s, r) => s + r.area, 0) : null;
}

/** Total floor area of every room found on the plan, in m². */
export const floorArea = (plan: Plan): number | null => enclosedArea(plan.walls);

export function bounds(plan: Plan) {
  const xs: number[] = [], ys: number[] = [];
  for (const w of plan.walls) for (const q of wallPolyline(w, 10)) { xs.push(q.x); ys.push(q.y); }
  for (const it of plan.items) { const r = Math.max(it.w, it.d) / 2; xs.push(it.x - r, it.x + r); ys.push(it.y - r, it.y + r); }
  if (plan.backdrop) { const b = plan.backdrop; xs.push(b.x, b.x + b.pxW * b.mmPerPx); ys.push(b.y, b.y + b.pxH * b.mmPerPx); }
  if (!xs.length) return { minX: 0, minY: 0, maxX: 5000, maxY: 4000 };
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

// ---------- Schedule ----------

export type ScheduleLine = { key: string; name: string; size: string; qty: number; unitPrice: number | null; source: "market" | "own" | "none"; total: number | null };

const mm = (n: number) => `${Math.round(n)}`;

/** Price used for one thing: the visitor's own price wins; otherwise the market price if there is one. */
function pick(own: number | null | undefined, market: number | null): { price: number | null; source: ScheduleLine["source"] } {
  if (own !== undefined && own !== null && Number.isFinite(own)) return { price: own, source: "own" };
  if (market !== null) return { price: market, source: "market" };
  return { price: null, source: "none" };
}

/** Schedule of everything placed, grouped by type, size and price. */
export function schedule(plan: Plan): { lines: ScheduleLine[]; total: number; unpriced: number } {
  const groups = new Map<string, ScheduleLine>();
  const add = (key: string, name: string, size: string, unit: { price: number | null; source: ScheduleLine["source"] }) => {
    const k = `${key}|${size}|${unit.price}|${unit.source}`;
    const line = groups.get(k) ?? { key: k, name, size, qty: 0, unitPrice: unit.price, source: unit.source, total: unit.price === null ? null : 0 };
    line.qty += 1;
    if (line.total !== null && unit.price !== null) line.total += unit.price;
    groups.set(k, line);
  };
  for (const it of plan.items) {
    const c = catalogItem(it.type);
    const m = marketPrice(c?.priceId);
    add(it.type, it.label || c?.name || it.type, c?.point ? "—" : `${mm(it.w)} × ${mm(it.d)} × ${mm(it.h)}`, pick(it.price, m ? m.rate : null));
  }
  const wallIds = new Set(plan.walls.map((w) => w.id));
  for (const o of plan.openings) {
    if (!wallIds.has(o.wallId)) continue;
    if (o.kind === "door") {
      const m = marketPrice(DOOR_PRICE_ID);
      add("door", "Door", `${mm(o.width)} wide`, pick(o.price, m ? m.rate : null));
    } else {
      const m = marketPrice(WINDOW_PRICE_ID);
      const area = (o.width * WINDOW_HEIGHT) / 1e6;
      add("window", "Window", `${mm(o.width)} × ${WINDOW_HEIGHT}`, pick(o.price, m ? Math.round(m.rate * area) : null));
    }
  }
  const lines = [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
  return { lines, total: lines.reduce((s, l) => s + (l.total ?? 0), 0), unpriced: lines.filter((l) => l.total === null).reduce((s, l) => s + l.qty, 0) };
}

// ---------- Saving ----------

export const STORAGE_KEY = "charismak-space-planner-v1";

type LegacyRoom = { id: string; name: string; shape: RoomShape; x: number; y: number; w: number; l: number; a: number; b: number; thickness: number };

/** Parse a saved plan, ignoring anything malformed. Plans saved with room boxes are turned into walls and room names. */
export function readSaved(raw: string | null): Plan | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Plan & { rooms?: LegacyRoom[] };
    if (p?.version !== 1 || !Array.isArray(p.walls) || !Array.isArray(p.items) || !Array.isArray(p.openings)) return null;
    const { rooms, ...rest } = p;
    const plan: Plan = { ...emptyPlan(), ...rest, walls: [...p.walls], tags: Array.isArray(p.tags) ? [...p.tags] : [] };
    if (Array.isArray(rooms) && rooms.length) {
      const remap = new Map<string, string>();
      for (const r of rooms) {
        const pts = shapeOutline(r.shape, r.x, r.y, r.w, r.l, r.a, r.b);
        pts.forEach((a, i) => { const id = uid("w"); remap.set(`${r.id}:${i}`, id); plan.walls.push({ id, a, b: pts[(i + 1) % pts.length], thickness: r.thickness || 150 }); });
        plan.tags.push({ id: uid("t"), name: r.name, ...labelPoint(pts) });
      }
      plan.openings = plan.openings.map((o) => (remap.has(o.wallId) ? { ...o, wallId: remap.get(o.wallId)! } : o));
    }
    return plan;
  } catch {
    return null;
  }
}

export const KNOWN_TYPES = new Set(CATALOG.map((c) => c.type));
