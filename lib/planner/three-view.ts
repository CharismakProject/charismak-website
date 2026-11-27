"use client";

import { DOOR_HEIGHT, WINDOW_HEIGHT, WINDOW_SILL, catalogItem } from "./catalog";
import { itemMount } from "./elevation";
import { bounds, detectRooms, pointOnWall, wallLength, wallPolyline, type Plan } from "./model";

const COLOURS: Record<string, number> = { Furniture: 0x9a7656, Kitchen: 0xc9ced6, Bathroom: 0xf4f6f8, Electrical: 0xd9b26a, Plumbing: 0x5b8fc9 };

/**
 * Two aerial 3D pictures of the plan (from opposite corners): walls with real door and window openings,
 * glass in the windows, room floors, and items as blocks at their mounting heights. Made in the browser
 * with three.js only when asked for, so the editor itself stays light. Returns [] if WebGL is unavailable.
 */
export async function render3dViews(plan: Plan, width = 1600, height = 1000): Promise<Blob[]> {
  if (!plan.walls.length) return [];
  const THREE = await import("three");
  const canvas = document.createElement("canvas");
  let renderer: import("three").WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  } catch {
    return [];
  }
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf4f6f9);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8c2cc, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  scene.add(sun);

  const H = plan.height;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe6e1d6, roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x8fc1ef, transparent: true, opacity: 0.45, roughness: 0.1 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x2a3340 });
  const geoms: import("three").BufferGeometry[] = [];
  // Every wall piece, so the second picture can cut the walls down (cutaway view).
  const pieces: { objs: import("three").Object3D[]; y0: number; h: number }[] = [];

  const block = (x: number, z: number, len: number, y0: number, h: number, depth: number, angle: number, mat: import("three").Material, edges = true) => {
    if (len < 1 || h < 1) return;
    const g = new THREE.BoxGeometry(len, h, depth);
    geoms.push(g);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y0 + h / 2, z);
    m.rotation.y = -angle;
    scene.add(m);
    const objs: import("three").Object3D[] = [m];
    if (edges) { const eg = new THREE.EdgesGeometry(g); geoms.push(eg); const l = new THREE.LineSegments(eg, edgeMat); l.position.copy(m.position); l.rotation.copy(m.rotation); scene.add(l); objs.push(l); }
    pieces.push({ objs, y0, h });
  };
  /** Cut every wall piece at `cut` mm (or restore full height with Infinity). */
  const cutWalls = (cut: number) => {
    for (const p of pieces) {
      const h = Math.min(p.h, cut - p.y0);
      for (const o of p.objs) { o.visible = h > 1; if (h > 1) { o.scale.y = h / p.h; o.position.y = p.y0 + h / 2; } }
    }
  };

  // Walls: each straight piece is split where doors and windows sit; openings leave a head (and a sill under windows).
  for (const w of plan.walls) {
    const len = wallLength(w) || 1;
    const ops = plan.openings.filter((o) => o.wallId === w.id).map((o) => ({ kind: o.kind, t0: o.t - o.width / 2 / len, t1: o.t + o.width / 2 / len }));
    const pts = wallPolyline(w);
    const n = pts.length - 1;
    for (let i = 0; i < n; i++) {
      const ta = i / n, tb = (i + 1) / n;
      const cuts = [...new Set([ta, tb, ...ops.flatMap((o) => [o.t0, o.t1]).filter((t) => t > ta && t < tb)])].sort((p, q) => p - q);
      for (let k = 0; k + 1 < cuts.length; k++) {
        const t0 = cuts[k], t1 = cuts[k + 1], tm = (t0 + t1) / 2;
        const p0 = pointOnWall(w, t0), p1 = pointOnWall(w, t1);
        const seg = Math.hypot(p1.x - p0.x, p1.y - p0.y), ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const cx = (p0.x + p1.x) / 2, cz = (p0.y + p1.y) / 2;
        const op = ops.find((o) => tm > o.t0 && tm < o.t1);
        // Slight overlap on straight walls closes the corners; arc pieces join edge to edge.
        const L = seg + (n === 1 ? w.thickness : 2);
        if (!op) block(cx, cz, L, 0, H, w.thickness, ang, wallMat, n === 1);
        else if (op.kind === "door") block(cx, cz, seg, DOOR_HEIGHT, H - DOOR_HEIGHT, w.thickness, ang, wallMat, n === 1);
        else {
          block(cx, cz, seg, 0, WINDOW_SILL, w.thickness, ang, wallMat, n === 1);
          block(cx, cz, seg, WINDOW_SILL + WINDOW_HEIGHT, H - WINDOW_SILL - WINDOW_HEIGHT, w.thickness, ang, wallMat, n === 1);
          block(cx, cz, seg, WINDOW_SILL, WINDOW_HEIGHT, 20, ang, glassMat, false);
        }
      }
    }
  }

  // Floors of the rooms found, on a light ground.
  const b = bounds({ ...plan, backdrop: null });
  const span = Math.max(b.maxX - b.minX, b.maxY - b.minY, 3000);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(span * 3, span * 3), new THREE.MeshStandardMaterial({ color: 0xdfe4ea }));
  geoms.push(ground.geometry);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set((b.minX + b.maxX) / 2, -2, (b.minY + b.maxY) / 2);
  scene.add(ground);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xf1ebe0, side: THREE.DoubleSide });
  for (const r of detectRooms(plan.walls, plan.tags)) {
    const shape = new THREE.Shape(r.pts.map((p) => new THREE.Vector2(p.x, p.y)));
    const g = new THREE.ShapeGeometry(shape);
    geoms.push(g);
    const m = new THREE.Mesh(g, floorMat);
    m.rotation.x = Math.PI / 2; // plan y becomes depth (z)
    m.position.y = 1;
    scene.add(m);
  }

  // Items as blocks.
  for (const it of plan.items) {
    const c = catalogItem(it.type);
    const mat = new THREE.MeshStandardMaterial({ color: COLOURS[c?.category ?? "Furniture"] ?? 0x9a7656, roughness: 0.7 });
    const y0 = c?.ceiling ? H - it.h : itemMount(it);
    const g = new THREE.BoxGeometry(it.w, it.h, it.d);
    geoms.push(g);
    const m = new THREE.Mesh(g, mat);
    m.position.set(it.x, y0 + it.h / 2, it.y);
    m.rotation.y = (-it.rot * Math.PI) / 180;
    scene.add(m);
  }

  // Fit the whole plan in the frame, looking down at about 55° so the rooms can be seen into ("dollhouse" view).
  const sizeX = b.maxX - b.minX, sizeZ = b.maxY - b.minY;
  const centre = new THREE.Vector3((b.minX + b.maxX) / 2, H * 0.25, (b.minY + b.maxY) / 2);
  const radius = 0.5 * Math.sqrt(sizeX * sizeX + sizeZ * sizeZ + H * H);
  const fov = 35, aspect = width / height;
  const halfV = (fov * Math.PI) / 360, halfH = Math.atan(Math.tan(halfV) * aspect);
  const distance = (radius / Math.sin(Math.min(halfV, halfH))) * 1.02;
  const camera = new THREE.PerspectiveCamera(fov, aspect, Math.max(10, distance / 100), distance * 10);
  const shots: Blob[] = [];
  // First picture: full-height walls. Second: walls cut at 1.2 m from the opposite corner, showing the layout inside.
  for (const [dx, dz, cut] of [[1, 1.15, Infinity], [-1, -1.15, 1200]]) {
    cutWalls(cut);
    const dir = new THREE.Vector3(dx, 1.9, dz).normalize();
    camera.position.copy(centre).addScaledVector(dir, distance);
    camera.lookAt(centre);
    sun.position.set(centre.x + dx * span, span * 2, centre.z - dz * span * 0.5);
    renderer.render(scene, camera);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (blob) shots.push(blob);
  }
  geoms.forEach((g) => g.dispose());
  renderer.dispose();
  return shots;
}
