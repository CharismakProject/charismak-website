import { CATALOG, DOOR_PRICE_ID, WINDOW_HEIGHT, WINDOW_PRICE_ID, catalogItem, marketPrice } from "./catalog";

/** Space Planner drawing. All coordinates are in millimetres on the floor plan (x right, y down). */
export type Pt = { x: number; y: number };
export type Wall = { id: string; a: Pt; b: Pt; thickness: number };
export type Opening = { id: string; wallId: string; kind: "door" | "window"; t: number; width: number; price?: number | null };
export type Item = { id: string; type: string; x: number; y: number; w: number; d: number; h: number; rot: number; label?: string; price?: number | null };
export type Backdrop = { image: string; pxW: number; pxH: number; mmPerPx: number; x: number; y: number; opacity: number };
export type RoomShape = "rect" | "L" | "T" | "U";
/** A room box placed as one piece. x, y = top-left; w × l overall; a, b = the cut-out sizes for L, T and U shapes; rot in 90° steps. */
export type Room = { id: string; name: string; shape: RoomShape; x: number; y: number; w: number; l: number; a: number; b: number; rot: number; thickness: number };
export type Plan = { version: 1; title: string; height: number; walls: Wall[]; rooms: Room[]; openings: Opening[]; items: Item[]; backdrop: Backdrop | null };

export const emptyPlan = (): Plan => ({ version: 1, title: "My space", height: 3000, walls: [], rooms: [], openings: [], items: [], backdrop: null });

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

export const SHAPE_LABEL: Record<RoomShape, string> = { rect: "Rectangle", L: "L-shape", T: "T-shape", U: "U-shape" };
/** What a and b mean for each shape, for the edit panel. */
export const CUT_LABELS: Record<RoomShape, [string, string] | null> = { rect: null, L: ["Cut-out width", "Cut-out depth"], T: ["Stem width", "Top depth"], U: ["Opening width", "Opening depth"] };

/** Default cut-out sizes for a shape of w × l. */
export function defaultCuts(shape: RoomShape, w: number, l: number) {
  if (shape === "L") return { a: Math.round(w / 2 / 10) * 10, b: Math.round(l / 2 / 10) * 10 };
  if (shape === "T") return { a: Math.round(w / 3 / 10) * 10, b: Math.round(l / 3 / 10) * 10 };
  if (shape === "U") return { a: Math.round(w / 3 / 10) * 10, b: Math.round(l / 2 / 10) * 10 };
  return { a: 0, b: 0 };
}

export function newRoom(shape: RoomShape, x: number, y: number, name: string, w = 3600, l = 3000): Room {
  return { id: uid("r"), name, shape, x, y, w, l, ...defaultCuts(shape, w, l), rot: 0, thickness: 150 };
}

/** Corner points of a room, clockwise, in plan millimetres. */
export function roomPolygon(r: Room): Pt[] {
  const w = r.w, l = r.l;
  const a = Math.max(0, Math.min(r.a, w - 100)), b = Math.max(0, Math.min(r.b, l - 100));
  let pts: [number, number][];
  if (r.shape === "L") pts = [[0, 0], [w - a, 0], [w - a, b], [w, b], [w, l], [0, l]];
  else if (r.shape === "T") pts = [[0, 0], [w, 0], [w, b], [(w + a) / 2, b], [(w + a) / 2, l], [(w - a) / 2, l], [(w - a) / 2, b], [0, b]];
  else if (r.shape === "U") pts = [[0, 0], [(w - a) / 2, 0], [(w - a) / 2, b], [(w + a) / 2, b], [(w + a) / 2, 0], [w, 0], [w, l], [0, l]];
  else pts = [[0, 0], [w, 0], [w, l], [0, l]];
  // Turn in 90° steps about the room's top-left, keeping the box's top-left at x, y.
  const turns = ((Math.round(r.rot / 90) % 4) + 4) % 4;
  const turned = pts.map(([px, py]) => {
    if (turns === 1) return [l - py, px];
    if (turns === 2) return [w - px, l - py];
    if (turns === 3) return [py, w - px];
    return [px, py];
  });
  return turned.map(([px, py]) => ({ x: r.x + px, y: r.y + py }));
}

/** The walls a room contributes; ids are "<room id>:<edge>" so doors and windows stay attached when it moves. */
export function roomWalls(r: Room): Wall[] {
  const pts = roomPolygon(r);
  return pts.map((a, i) => ({ id: `${r.id}:${i}`, a, b: pts[(i + 1) % pts.length], thickness: r.thickness }));
}

/** Every wall on the plan: drawn walls plus the walls of every room. */
export const allWalls = (plan: Plan): Wall[] => [...plan.walls, ...plan.rooms.flatMap(roomWalls)];

export const roomOf = (wallId: string) => (wallId.includes(":") ? wallId.split(":")[0] : null);

export function polygonArea(pts: Pt[]) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; s += p.x * q.y - q.x * p.y; }
  return Math.abs(s) / 2 / 1e6;
}
export const roomArea = (r: Room) => polygonArea(roomPolygon(r));

/** Centre of a room's box, for its label. */
export function roomCentre(r: Room): Pt {
  const pts = roomPolygon(r);
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

/** Snap a room being moved to x, y so its edges line up with other rooms and walls when within tolerance. */
export function snapRoom(plan: Plan, room: Room, x: number, y: number, tolerance: number): { x: number; y: number } {
  const moved = roomPolygon({ ...room, x, y });
  const tx: number[] = [], ty: number[] = [];
  for (const r of plan.rooms) if (r.id !== room.id) for (const p of roomPolygon(r)) { tx.push(p.x); ty.push(p.y); }
  for (const w of plan.walls) { tx.push(w.a.x, w.b.x); ty.push(w.a.y, w.b.y); }
  const best = (own: number[], targets: number[]) => {
    let d = Infinity;
    for (const o of own) for (const t of targets) { const k = t - o; if (Math.abs(k) < Math.abs(d) && Math.abs(k) <= tolerance) d = k; }
    return Number.isFinite(d) ? d : 0;
  };
  const dx = best(moved.map((p) => p.x), tx), dy = best(moved.map((p) => p.y), ty);
  return { x: Math.round((x + dx) / 5) * 5, y: Math.round((y + dy) / 5) * 5 };
}

/** Total floor area: the rooms, or a single closed outline of drawn walls when there are no rooms. */
export function floorArea(plan: Plan): number | null {
  if (plan.rooms.length) return plan.rooms.reduce((s, r) => s + roomArea(r), 0);
  return enclosedArea(plan.walls);
}

export function bounds(plan: Plan) {
  const xs: number[] = [], ys: number[] = [];
  for (const w of allWalls(plan)) { xs.push(w.a.x, w.b.x); ys.push(w.a.y, w.b.y); }
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
  const wallIds = new Set(allWalls(plan).map((w) => w.id));
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

export const STORAGE_KEY = "charismak-space-planner-v1";

/** Parse a saved plan, ignoring anything malformed. */
export function readSaved(raw: string | null): Plan | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Plan;
    if (p?.version !== 1 || !Array.isArray(p.walls) || !Array.isArray(p.items) || !Array.isArray(p.openings)) return null;
    return { ...emptyPlan(), ...p, rooms: Array.isArray(p.rooms) ? p.rooms : [] };
  } catch {
    return null;
  }
}

export const KNOWN_TYPES = new Set(CATALOG.map((c) => c.type));
