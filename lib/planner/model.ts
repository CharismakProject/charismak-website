import { CATALOG, DOOR_PRICE_ID, WINDOW_HEIGHT, WINDOW_PRICE_ID, catalogItem, marketPrice } from "./catalog";

/** Space Planner drawing. All coordinates are in millimetres on the floor plan (x right, y down). */
export type Pt = { x: number; y: number };
export type Wall = { id: string; a: Pt; b: Pt; thickness: number };
export type Opening = { id: string; wallId: string; kind: "door" | "window"; t: number; width: number; price?: number | null };
export type Item = { id: string; type: string; x: number; y: number; w: number; d: number; h: number; rot: number; label?: string; price?: number | null };
export type Backdrop = { image: string; pxW: number; pxH: number; mmPerPx: number; x: number; y: number; opacity: number };
export type Plan = { version: 1; title: string; height: number; walls: Wall[]; openings: Opening[]; items: Item[]; backdrop: Backdrop | null };

export const emptyPlan = (): Plan => ({ version: 1, title: "My space", height: 3000, walls: [], openings: [], items: [], backdrop: null });

let counter = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
export const wallLength = (w: Wall) => dist(w.a, w.b);

/** Closest point on a wall, with t (0..1 along the wall) and the distance to it. */
export function projectOnWall(p: Pt, w: Wall) {
  const dx = w.b.x - w.a.x, dy = w.b.y - w.a.y, len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - w.a.x) * dx + (p.y - w.a.y) * dy) / len2));
  const q = { x: w.a.x + dx * t, y: w.a.y + dy * t };
  return { t, point: q, distance: dist(p, q) };
}

/** Snap a wall end: lock to horizontal/vertical when close, and round to 10 mm. */
export function snapEnd(start: Pt, p: Pt, walls: Wall[], tolerance: number): Pt {
  for (const w of walls) for (const end of [w.a, w.b]) if (dist(end, p) <= tolerance) return { ...end };
  const dx = p.x - start.x, dy = p.y - start.y;
  let x = p.x, y = p.y;
  if (Math.abs(dx) > 3 * Math.abs(dy)) y = start.y;
  else if (Math.abs(dy) > 3 * Math.abs(dx)) x = start.x;
  return { x: Math.round(x / 10) * 10, y: Math.round(y / 10) * 10 };
}

/** Set a wall's length by moving its end point along its direction. */
export function withLength(w: Wall, length: number): Wall {
  const len = wallLength(w) || 1, k = length / len;
  return { ...w, b: { x: w.a.x + (w.b.x - w.a.x) * k, y: w.a.y + (w.b.y - w.a.y) * k } };
}

/** Four walls of a rectangular room, starting at the origin. */
export function rectangleRoom(width: number, length: number, thickness = 150): Wall[] {
  const c = [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: length }, { x: 0, y: length }];
  return c.map((a, i) => ({ id: uid("w"), a, b: c[(i + 1) % 4], thickness }));
}

export function bounds(plan: Plan) {
  const xs: number[] = [], ys: number[] = [];
  for (const w of plan.walls) { xs.push(w.a.x, w.b.x); ys.push(w.a.y, w.b.y); }
  for (const it of plan.items) { const r = Math.max(it.w, it.d) / 2; xs.push(it.x - r, it.x + r); ys.push(it.y - r, it.y + r); }
  if (plan.backdrop) { const b = plan.backdrop; xs.push(b.x, b.x + b.pxW * b.mmPerPx); ys.push(b.y, b.y + b.pxH * b.mmPerPx); }
  if (!xs.length) return { minX: 0, minY: 0, maxX: 5000, maxY: 4000 };
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

/** Floor area of a closed room outline (shoelace), in m², when the walls form one loop. */
export function enclosedArea(walls: Wall[]): number | null {
  if (walls.length < 3) return null;
  const pts: Pt[] = [walls[0].a];
  let cur = walls[0].b;
  const left = walls.slice(1);
  while (left.length) {
    const i = left.findIndex((w) => dist(w.a, cur) < 5 || dist(w.b, cur) < 5);
    if (i < 0) return null;
    const [w] = left.splice(i, 1);
    pts.push(cur);
    cur = dist(w.a, cur) < 5 ? w.b : w.a;
  }
  if (dist(cur, pts[0]) > 5) return null;
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p.x * q.y - q.x * p.y; }
  return Math.abs(s) / 2 / 1e6;
}

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
  for (const o of plan.openings) {
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

export const STORAGE_KEY = "charismak-space-planner-v1";

/** Parse a saved plan, ignoring anything malformed. */
export function readSaved(raw: string | null): Plan | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Plan;
    if (p?.version !== 1 || !Array.isArray(p.walls) || !Array.isArray(p.items) || !Array.isArray(p.openings)) return null;
    return { ...emptyPlan(), ...p };
  } catch {
    return null;
  }
}

export const KNOWN_TYPES = new Set(CATALOG.map((c) => c.type));
