"use client";

import { DOOR_HEIGHT, WINDOW_HEIGHT, WINDOW_SILL, catalogItem } from "./catalog";
import { footprint, itemMount } from "./elevation";
import { buildItem, makeMaterials } from "./models3d";
import { bounds, detectRooms, pointOnWall, tangentAt, wallLength, wallPolyline, type Plan, type Pt } from "./model";

type THREE = typeof import("three");
export type View3d = { name: string; position: [number, number, number]; target: [number, number, number]; fov: number; cut: number };

/** Floor tile texture (600 × 600 tiles with grout lines), drawn on a canvas. */
function tileTexture(T: THREE) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d")!;
  x.fillStyle = "#ece6db"; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = "#d3ccbf"; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 253, 253);
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(1 / 600, 1 / 600); t.colorSpace = T.SRGBColorSpace;
  return t;
}

/**
 * The plan as a 3D scene (millimetres; plan x → x, plan y → z, up = y): walls with door leaves and window
 * frames in their openings, tiled room floors, and every item as a detailed model. Also returns `cutWalls`
 * (cut every wall at a height for cutaway views) and six ready-made views like the CPNL drawing sets.
 */
export function buildScene(T: THREE, plan: Plan) {
  const scene = new T.Scene();
  scene.background = new T.Color(0xeef1f5);
  scene.add(new T.HemisphereLight(0xffffff, 0xc4ccd4, 1.7));
  const sun = new T.DirectionalLight(0xffffff, 1.4); scene.add(sun);
  const M = makeMaterials(T);
  const H = plan.height;
  const wallMat = M.get(0xebe6dc, 0.92), edgeMat = new T.LineBasicMaterial({ color: 0x3a4350 });
  const pieces: { objs: import("three").Object3D[]; y0: number; h: number }[] = [];
  const add = (o: import("three").Object3D) => { scene.add(o); return o; };
  const block = (x: number, z: number, len: number, y0: number, h: number, depth: number, angle: number, mat: import("three").Material, edges: boolean, cuttable = true) => {
    if (len < 1 || h < 1) return;
    const geo = new T.BoxGeometry(len, h, depth);
    const m = add(new T.Mesh(geo, mat)); m.position.set(x, y0 + h / 2, z); m.rotation.y = -angle;
    const objs: import("three").Object3D[] = [m];
    if (edges) { const l = add(new T.LineSegments(new T.EdgesGeometry(geo), edgeMat)); l.position.copy(m.position); l.rotation.copy(m.rotation); objs.push(l); }
    if (cuttable) pieces.push({ objs, y0, h });
  };

  // Walls, split around openings; door leaves (oak, closed, with a handle) and window frames with glass.
  const doorPts: { at: Pt; into: Pt }[] = [];
  for (const w of plan.walls) {
    const len = wallLength(w) || 1;
    const ops = plan.openings.filter((o) => o.wallId === w.id).map((o) => ({ o, t0: o.t - o.width / 2 / len, t1: o.t + o.width / 2 / len }));
    const pts = wallPolyline(w), n = pts.length - 1;
    for (let i = 0; i < n; i++) {
      const ta = i / n, tb = (i + 1) / n;
      const cuts = [...new Set([ta, tb, ...ops.flatMap((o) => [o.t0, o.t1]).filter((t) => t > ta && t < tb)])].sort((p, q) => p - q);
      for (let k = 0; k + 1 < cuts.length; k++) {
        const t0 = cuts[k], t1 = cuts[k + 1], tm = (t0 + t1) / 2;
        const p0 = pointOnWall(w, t0), p1 = pointOnWall(w, t1);
        const seg = Math.hypot(p1.x - p0.x, p1.y - p0.y), ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const cx = (p0.x + p1.x) / 2, cz = (p0.y + p1.y) / 2;
        const op = ops.find((o) => tm > o.t0 && tm < o.t1);
        const straight = n === 1;
        if (!op) { block(cx, cz, seg + (straight ? w.thickness : 2), 0, H, w.thickness, ang, wallMat, straight); continue; }
        if (op.o.kind === "door") {
          block(cx, cz, seg, DOOR_HEIGHT, H - DOOR_HEIGHT, w.thickness, ang, wallMat, straight);
          block(cx, cz, seg - 10, 0, DOOR_HEIGHT - 10, 40, ang, M.wood, true);
        } else {
          block(cx, cz, seg, 0, WINDOW_SILL, w.thickness, ang, wallMat, straight);
          block(cx, cz, seg, WINDOW_SILL + WINDOW_HEIGHT, H - WINDOW_SILL - WINDOW_HEIGHT, w.thickness, ang, wallMat, straight);
          block(cx, cz, seg, WINDOW_SILL, WINDOW_HEIGHT, 16, ang, M.clearGlass, false);
          block(cx, cz, seg, WINDOW_SILL, 40, 70, ang, M.white, false);
          block(cx, cz, seg, WINDOW_SILL + WINDOW_HEIGHT - 40, 40, 70, ang, M.white, false);
        }
      }
    }
    // Door handles and frames (whole opening), and remember doors for the inside views.
    for (const { o } of ops) {
      const c = pointOnWall(w, o.t), d = tangentAt(w, o.t), nrm = { x: -d.y, y: d.x };
      const ang = Math.atan2(d.y, d.x);
      if (o.kind === "door") {
        const hx = c.x + d.x * (o.width / 2 - 90), hz = c.y + d.y * (o.width / 2 - 90);
        block(hx + nrm.x * 30, hz + nrm.y * 30, 120, 1000, 20, 20, ang, M.handle, false);
        block(hx - nrm.x * 30, hz - nrm.y * 30, 120, 1000, 20, 20, ang, M.handle, false);
        for (const s of [-1, 1]) doorPts.push({ at: { x: c.x, y: c.y }, into: { x: nrm.x * s, y: nrm.y * s } });
      } else {
        for (const s of [-1, 1]) block(c.x + d.x * s * (o.width / 2 - 20), c.y + d.y * s * (o.width / 2 - 20), 40, WINDOW_SILL, WINDOW_HEIGHT, 70, ang, M.white, false);
        block(c.x, c.y, 30, WINDOW_SILL, WINDOW_HEIGHT, 50, ang, M.white, false);
      }
    }
  }

  // Ground and tiled room floors.
  const b = bounds({ ...plan, backdrop: null });
  const sizeX = Math.max(b.maxX - b.minX, 1000), sizeZ = Math.max(b.maxY - b.minY, 1000), span = Math.max(sizeX, sizeZ);
  const ground = add(new T.Mesh(new T.PlaneGeometry(span * 4, span * 4), M.get(0xdde2e8, 1)));
  ground.rotation.x = -Math.PI / 2; ground.position.set((b.minX + b.maxX) / 2, -3, (b.minY + b.maxY) / 2);
  const floorMat = new T.MeshStandardMaterial({ map: tileTexture(T), roughness: 0.8, side: T.DoubleSide });
  const rooms = detectRooms(plan.walls, plan.tags);
  for (const r of rooms) {
    const m = add(new T.Mesh(new T.ShapeGeometry(new T.Shape(r.pts.map((p) => new T.Vector2(p.x, p.y)))), floorMat));
    m.rotation.x = Math.PI / 2; m.position.y = 1;
  }

  // Items.
  for (const it of plan.items) {
    const c = catalogItem(it.type);
    const grp = buildItem(T, M, it, H);
    grp.position.set(it.x, c?.ceiling ? 0 : itemMount(it), it.y);
    grp.rotation.y = (-it.rot * Math.PI) / 180;
    add(grp);
  }

  const cutWalls = (cut: number) => {
    for (const p of pieces) {
      const h = Math.min(p.h, cut - p.y0);
      for (const o of p.objs) { o.visible = h > 1; if (h > 1) { o.scale.y = h / p.h; o.position.y = p.y0 + h / 2; } }
    }
  };

  // Six views: two aerial corners, from above, a cutaway, and two inside views at eye height.
  const cx = (b.minX + b.maxX) / 2, cz = (b.minY + b.maxY) / 2;
  const radius = 0.5 * Math.sqrt(sizeX * sizeX + sizeZ * sizeZ + H * H);
  const aerial = (dx: number, dz: number, up: number, fov: number, aspect: number) => {
    const half = (fov * Math.PI) / 360, halfH = Math.atan(Math.tan(half) * aspect);
    const dist = (radius / Math.sin(Math.min(half, halfH))) * 1.02, L = Math.hypot(dx, up, dz);
    return [cx + (dx / L) * dist, H * 0.25 + (up / L) * dist, cz + (dz / L) * dist] as [number, number, number];
  };
  const room = rooms[0];
  const centre = room ? room.label : { x: cx, y: cz };
  /** Eye-height view looking towards the far end of the room (the room corner farthest away, pulled in a little). */
  const inside = (from: Pt, _look?: Pt): Pick<View3d, "position" | "target"> => {
    void _look;
    const end = room ? towards(farthest(room.pts, from), from, 300) : centre;
    return { position: [from.x, EYE, from.y], target: [end.x, 1250, end.y] };
  };
  // Eye-height cameras must not stand inside anything at 1.6 m (fridges, tall units, wall cabinets).
  const EYE = 1600;
  const blockers = plan.items.filter((it) => { const m = catalogItem(it.type)?.ceiling ? H - it.h : itemMount(it); return m <= EYE + 100 && m + it.h >= EYE - 200; }).map((it) => footprint({ ...it, w: it.w + 700, d: it.d + 700 }));
  const clear = (p: Pt) => rooms.some((r) => pointInside(p, r.pts)) && !blockers.some((f) => pointInside(p, f));
  /** Step in from a door until the camera is clear, sliding sideways if needed. */
  const standAt = (door: { at: Pt; into: Pt }): Pt | null => {
    const side = { x: -door.into.y, y: door.into.x };
    for (const dIn of [450, 650, 850, 1100, 1400]) for (const lat of [0, 300, -300, 550, -550]) {
      const p = { x: door.at.x + door.into.x * dIn + side.x * lat, y: door.at.y + door.into.y * dIn + side.y * lat };
      if (clear(p)) return p;
    }
    return null;
  };
  const insideDoors = doorPts.map((d) => ({ ...d, at: standAt(d) })).filter((d): d is { at: Pt; into: Pt } => d.at !== null);
  const views = (aspect: number): View3d[] => {
    const v: View3d[] = [
      { name: "View 1: aerial", position: aerial(1, 1.15, 1.9, 35, aspect), target: [cx, H * 0.25, cz], fov: 35, cut: Infinity },
      { name: "View 2: aerial, opposite corner", position: aerial(-1, -1.15, 1.9, 35, aspect), target: [cx, H * 0.25, cz], fov: 35, cut: Infinity },
      { name: "View 3: from above", position: aerial(0.12, 0.25, 4, 35, aspect), target: [cx, 0, cz], fov: 35, cut: Infinity },
      { name: "View 4: cutaway, walls at 1.2 m", position: aerial(-1, 1.15, 1.6, 35, aspect), target: [cx, 600, cz], fov: 35, cut: 1200 },
    ];
    const a = insideDoors[0], z = insideDoors[1];
    const farCorner = room ? farthest(room.pts, a ? a.at : centre) : { x: b.maxX, y: b.maxY };
    const far = [400, 700, 1000, 1300].map((k) => towards(farCorner, centre, k)).find(clear) ?? centre;
    if (a) v.push({ name: "View 5: inside, from the door", ...inside(a.at, centre), fov: 70, cut: Infinity });
    else v.push({ name: "View 5: inside", ...inside(far, centre), fov: 70, cut: Infinity });
    if (z) v.push({ name: "View 6: inside, from the other door", ...inside(z.at, centre), fov: 70, cut: Infinity });
    else v.push({ name: "View 6: inside, looking back", ...inside(far, a ? a.at : centre), fov: 70, cut: Infinity });
    return v;
  };
  return { scene, sun, cutWalls, views, span, materials: M };
}

function pointInside(p: Pt, pts: Pt[]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const a = pts[i], b = pts[j]; if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside; }
  return inside;
}
const farthest = (pts: Pt[], from: Pt) => pts.reduce((best, p) => (Math.hypot(p.x - from.x, p.y - from.y) > Math.hypot(best.x - from.x, best.y - from.y) ? p : best), pts[0]);
const towards = (p: Pt, to: Pt, by: number) => { const d = Math.hypot(to.x - p.x, to.y - p.y) || 1; return { x: p.x + ((to.x - p.x) / d) * by, y: p.y + ((to.y - p.y) / d) * by }; };

/** Apply a view to a camera (and cut the walls for cutaway views). */
export function applyView(T: THREE, camera: import("three").PerspectiveCamera, built: ReturnType<typeof buildScene>, v: View3d) {
  built.cutWalls(v.cut);
  camera.fov = v.fov; camera.near = v.fov > 50 ? 20 : Math.max(10, built.span / 200); camera.far = built.span * 30;
  camera.position.set(...v.position); camera.lookAt(new T.Vector3(...v.target)); camera.updateProjectionMatrix();
  built.sun.position.set(v.position[0], v.position[1] + built.span, v.position[2] - built.span * 0.4);
}

/** The six views as PNG pictures (for the PDF). Returns [] if WebGL is unavailable. */
export async function render3dViews(plan: Plan, width = 1600, height = 1000): Promise<{ name: string; blob: Blob }[]> {
  if (!plan.walls.length) return [];
  const T = await import("three");
  const canvas = document.createElement("canvas");
  let renderer: import("three").WebGLRenderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true }); } catch { return []; }
  renderer.setSize(width, height, false); renderer.setPixelRatio(1); renderer.outputColorSpace = T.SRGBColorSpace;
  const built = buildScene(T, plan);
  const camera = new T.PerspectiveCamera(35, width / height, 10, 1e6);
  const out: { name: string; blob: Blob }[] = [];
  for (const v of built.views(width / height)) {
    applyView(T, camera, built, v);
    renderer.render(built.scene, camera);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (blob) out.push({ name: v.name, blob });
  }
  built.scene.traverse((o) => { const m = o as import("three").Mesh; if (m.geometry) m.geometry.dispose(); });
  built.materials.all().forEach((m) => m.dispose());
  renderer.dispose();
  return out;
}
