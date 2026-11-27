import { DOOR_HEIGHT, WINDOW_HEIGHT, WINDOW_SILL, catalogItem } from "./catalog";
import { footprint, itemMount } from "./elevation";
import { projectOnWall, wallLength, wallPolyline, type Plan, type Pt, type SectionLine } from "./model";

/** One thing on a cross-section, x along the cut line (mm from its start), y up from the floor. */
export type CrossPart = { kind: "wall" | "glass" | "item" | "beyond" | "door-beyond"; name: string; type?: string; finish?: string; x0: number; x1: number; y0: number; h: number };
export type CrossSection = { label: string; height: number; from: number; to: number; parts: CrossPart[]; edges: number[]; internal: number | null; walkway: number | null };

const cross = (a: Pt, b: Pt) => a.x * b.y - a.y * b.x;

/** Where the segment p→p2 crosses q→q2: the fraction along p→p2, or null. */
function hit(p: Pt, p2: Pt, q: Pt, q2: Pt): number | null {
  const r = { x: p2.x - p.x, y: p2.y - p.y }, s = { x: q2.x - q.x, y: q2.y - q.y }, den = cross(r, s);
  if (Math.abs(den) < 1e-9) return null;
  const qp = { x: q.x - p.x, y: q.y - p.y }, t = cross(qp, s) / den, u = cross(qp, r) / den;
  return t >= 0 && t <= 1 && u >= -1e-9 && u <= 1 + 1e-9 ? t : null;
}

/**
 * Cross-section along a section line: walls cut (with their true thickness across the cut, and door or window
 * gaps), items cut, and items and doors beyond on the viewing side (to the left of a→b), up to 4 m away.
 * Dimensions: every edge between the inside faces of the outer walls, the internal width and the widest clear gap
 * between solid things (the walkway).
 */
export function crossSection(plan: Plan, line: SectionLine): CrossSection {
  const L = Math.hypot(line.b.x - line.a.x, line.b.y - line.a.y) || 1;
  const u = { x: (line.b.x - line.a.x) / L, y: (line.b.y - line.a.y) / L }, n = { x: -u.y, y: u.x };
  const along = (p: Pt) => (p.x - line.a.x) * u.x + (p.y - line.a.y) * u.y;
  const side = (p: Pt) => (p.x - line.a.x) * n.x + (p.y - line.a.y) * n.y;
  const H = plan.height, parts: CrossPart[] = [];

  // Walls cut by the line (curved walls through their pieces).
  const cutWalls = new Set<string>();
  for (const w of plan.walls) {
    const pts = wallPolyline(w), len = wallLength(w) || 1;
    for (let i = 0; i + 1 < pts.length; i++) {
      const t = hit(line.a, line.b, pts[i], pts[i + 1]);
      if (t === null) continue;
      const at = { x: line.a.x + (line.b.x - line.a.x) * t, y: line.a.y + (line.b.y - line.a.y) * t };
      const d = { x: pts[i + 1].x - pts[i].x, y: pts[i + 1].y - pts[i].y }, dl = Math.hypot(d.x, d.y) || 1;
      const sin = Math.abs(cross(u, { x: d.x / dl, y: d.y / dl })) || 1;
      const half = Math.min(w.thickness / sin, w.thickness * 4) / 2, s = t * L;
      const wt = projectOnWall(at, w).t;
      const op = plan.openings.find((o) => o.wallId === w.id && Math.abs(wt - o.t) * len <= o.width / 2);
      const base = { name: "Wall", x0: s - half, x1: s + half };
      if (!op) parts.push({ ...base, kind: "wall", y0: 0, h: H });
      else if (op.kind === "door") parts.push({ ...base, kind: "wall", name: "Over door", y0: DOOR_HEIGHT, h: H - DOOR_HEIGHT });
      else {
        parts.push({ ...base, kind: "wall", y0: 0, h: WINDOW_SILL });
        parts.push({ ...base, kind: "glass", name: "Window", y0: WINDOW_SILL, h: WINDOW_HEIGHT });
        parts.push({ ...base, kind: "wall", y0: WINDOW_SILL + WINDOW_HEIGHT, h: H - WINDOW_SILL - WINDOW_HEIGHT });
      }
      cutWalls.add(w.id);
      break;
    }
  }
  const walls = parts.filter((p) => p.kind === "wall" && p.y0 === 0 || p.name === "Over door").sort((p, q) => p.x0 - q.x0);
  const from = walls.length ? walls[0].x0 : 0, to = walls.length ? walls[walls.length - 1].x1 : L;

  // Items: cut (the line passes through the footprint) or beyond (on the viewing side, within 4 m).
  for (const it of plan.items) {
    const c = catalogItem(it.type);
    if (c?.ceiling) continue;
    const f = footprint(it), ss: number[] = [];
    for (let i = 0; i < 4; i++) { const t = hit(line.a, line.b, f[i], f[(i + 1) % 4]); if (t !== null) ss.push(t * L); }
    const name = it.label || c?.name || it.type, y0 = itemMount(it);
    if (ss.length >= 2) { parts.push({ kind: "item", name, type: it.type, finish: it.finish, x0: Math.min(...ss), x1: Math.max(...ss), y0, h: it.h }); continue; }
    const centre = { x: it.x, y: it.y };
    if (side(centre) > 0 && side(centre) < 4000) {
      const xs = f.map(along), x0 = Math.max(from, Math.min(...xs)), x1 = Math.min(to, Math.max(...xs));
      if (x1 - x0 > 20) parts.push({ kind: "beyond", name, type: it.type, x0, x1, y0, h: it.h });
    }
  }
  // Doors beyond, in walls running across the view.
  for (const o of plan.openings) {
    if (o.kind !== "door" || cutWalls.has(o.wallId)) continue;
    const w = plan.walls.find((x) => x.id === o.wallId);
    if (!w) continue;
    const len = wallLength(w) || 1, ends = [o.t - o.width / 2 / len, o.t + o.width / 2 / len].map((t) => { const p = { x: w.a.x + (w.b.x - w.a.x) * t, y: w.a.y + (w.b.y - w.a.y) * t }; return p; });
    const mid = { x: (ends[0].x + ends[1].x) / 2, y: (ends[0].y + ends[1].y) / 2 };
    if (side(mid) <= 0 || side(mid) > 4000) continue;
    const x0 = Math.max(from, Math.min(...ends.map(along))), x1 = Math.min(to, Math.max(...ends.map(along)));
    if (x1 - x0 > 100) parts.push({ kind: "door-beyond", name: "Door beyond", x0, x1, y0: 0, h: DOOR_HEIGHT });
  }

  // Dimensions between the inside faces of the outer walls.
  const inner0 = walls.length >= 2 ? walls[0].x1 : null, inner1 = walls.length >= 2 ? walls[walls.length - 1].x0 : null;
  const solids = parts.filter((p) => p.kind === "item" && p.y0 < 1000).map((p) => [Math.max(p.x0, inner0 ?? p.x0), Math.min(p.x1, inner1 ?? p.x1)] as [number, number]).filter(([a, b]) => b > a);
  const edges = inner0 !== null && inner1 !== null ? [...new Set([inner0, inner1, ...solids.flat()].map((v) => Math.round(v)))].sort((a, b) => a - b) : [];
  let walkway: number | null = null;
  if (inner0 !== null && inner1 !== null) {
    const blocks = [[inner0 - 1, inner0], ...solids.sort((a, b) => a[0] - b[0]), [inner1, inner1 + 1]];
    let reach = blocks[0][1];
    for (const [a, b] of blocks.slice(1)) { if (a > reach) walkway = Math.max(walkway ?? 0, a - reach); reach = Math.max(reach, b); }
  }
  return { label: line.label, height: H, from, to, parts, edges, internal: inner0 !== null && inner1 !== null ? Math.round(inner1 - inner0) : null, walkway: walkway !== null ? Math.round(walkway) : null };
}
