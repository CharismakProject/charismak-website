import { DOOR_HEIGHT, WINDOW_HEIGHT, WINDOW_SILL, catalogItem } from "./catalog";
import { arcOf, detectRooms, endTrims, pointInPolygon, pointOnWall, projectOnWall, tangentAt, wallLength, type Item, type Plan, type Pt, type Wall } from "./model";

/** Something drawn on a wall elevation: x along the wall from the viewer's left, y up from the floor, all in mm. */
export type ElevationPart = { kind: "door" | "window" | "item"; name: string; x: number; w: number; y: number; h: number; type?: string; finish?: string };
export type Elevation = {
  letter: string;
  wallId: string;
  length: number;
  height: number;
  curved: boolean;
  /** Viewing side: +1 = the wall's left side (positions run a→b), −1 = the other side (positions run b→a). */
  side: number;
  parts: ElevationPart[];
  /** Plan marker: a point beside the wall on the viewing side, and the direction the viewer looks (towards the wall). */
  marker: { at: Pt; look: Pt };
};

const LETTERS = "ABCDEFGHJKLMNP";

/** Corners of an item's footprint on the plan (it is a rectangle turned by rot degrees about its centre). */
export function footprint(it: Item): Pt[] {
  const r = (it.rot * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r), hw = it.w / 2, hd = it.d / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, y]) => ({ x: it.x + x * c - y * s, y: it.y + x * s + y * c }));
}

export const itemMount = (it: Item) => it.mount ?? catalogItem(it.type)?.mount ?? 0;

/**
 * Which side of the wall the viewer stands on: +1 = the side of the wall's left normal (−dy, dx), −1 = the other.
 * The side facing into a room wins; for walls between two rooms or outside, the side with more items against it.
 */
function viewSide(w: Wall, plan: Plan, rooms: Pt[][]): number {
  const m = pointOnWall(w, 0.5), d = tangentAt(w, 0.5), n = { x: -d.y, y: d.x }, off = w.thickness / 2 + 250;
  const inside = (k: number) => rooms.some((pts) => pointInPolygon({ x: m.x + n.x * off * k, y: m.y + n.y * off * k }, pts));
  const left = inside(1), right = inside(-1);
  if (left && !right) return 1;
  if (right && !left) return -1;
  const count = (k: number) => plan.items.filter((it) => { const v = { x: it.x - m.x, y: it.y - m.y }; return (v.x * n.x + v.y * n.y) * k > 0; }).length;
  return count(-1) > count(1) ? -1 : 1;
}

/** Elevation of one wall seen from `side`: doors, windows and the items standing against it on that side. */
export function wallElevation(w: Wall, plan: Plan, side: number, letter = "A"): Elevation {
  const full = wallLength(w), height = plan.height;
  // Internal length: from the inside face of the wall at one end to the inside face at the other.
  const { t0, t1 } = arcOf(w) ? { t0: 0, t1: 0 } : endTrims(w, plan.walls);
  const start = side > 0 ? t0 : t1, length = full - t0 - t1;
  // Viewer faces the wall from `side`; their right-hand direction runs along the wall from a to b when side = +1.
  const along = (t: number) => (side > 0 ? t : 1 - t) * full - start;
  const parts: ElevationPart[] = [];
  for (const o of plan.openings) {
    if (o.wallId !== w.id) continue;
    const x = along(o.t) - o.width / 2;
    parts.push(o.kind === "door" ? { kind: "door", name: "Door", x, w: o.width, y: 0, h: DOOR_HEIGHT } : { kind: "window", name: "Window", x, w: o.width, y: WINDOW_SILL, h: WINDOW_HEIGHT });
  }
  const d = tangentAt(w, 0.5), n = { x: -d.y * side, y: d.x * side };
  for (const it of plan.items) {
    const c = catalogItem(it.type);
    if (c?.ceiling) continue;
    const corners = footprint(it);
    // Against the wall: some corner within 200 mm of the wall face, and the item's centre on the viewing side.
    const face = w.thickness / 2 + 200;
    const near = corners.some((q) => projectOnWall(q, w).distance <= face);
    const centre = projectOnWall({ x: it.x, y: it.y }, w);
    const toCentre = { x: it.x - centre.point.x, y: it.y - centre.point.y };
    const onSide = arcOf(w) ? (() => { const tn = tangentAt(w, centre.t); return (toCentre.x * -tn.y + toCentre.y * tn.x) * side > 0; })() : toCentre.x * n.x + toCentre.y * n.y > 0;
    if (!near || !onSide || centre.t <= 0 || centre.t >= 1) continue;
    const xs = corners.map((q) => along(projectOnWall(q, w).t));
    const x0 = Math.max(0, Math.min(...xs)), x1 = Math.min(length, Math.max(...xs));
    if (x1 - x0 < 10) continue;
    const mount = itemMount(it);
    parts.push({ kind: "item", name: it.label || c?.name || it.type, x: x0, w: x1 - x0, y: mount, h: Math.min(it.h, Math.max(0, height - mount)), type: it.type, finish: it.finish });
  }
  parts.sort((p, q) => p.x - q.x);
  const at = pointOnWall(w, 0.5), off = w.thickness / 2 + 520;
  return { letter, wallId: w.id, length, height, curved: !!arcOf(w), side, parts, marker: { at: { x: at.x + n.x * off, y: at.y + n.y * off }, look: { x: -n.x, y: -n.y } } };
}

/**
 * The walls worth showing as elevations, lettered A, B, C…: walls with doors, windows or items against them,
 * most detail first (up to 8). If nothing is placed yet, the four longest walls.
 */
export function planElevations(plan: Plan, max = 8): Elevation[] {
  const rooms = detectRooms(plan.walls, plan.tags).map((r) => r.pts);
  const all = plan.walls.filter((w) => wallLength(w) >= 1000).map((w) => wallElevation(w, plan, viewSide(w, plan, rooms)));
  let chosen = all.filter((e) => e.parts.length).sort((a, b) => b.parts.length - a.parts.length || b.length - a.length);
  if (!chosen.length) chosen = [...all].sort((a, b) => b.length - a.length).slice(0, 4);
  return chosen.slice(0, max).map((e, i) => ({ ...e, letter: LETTERS[i] }));
}
