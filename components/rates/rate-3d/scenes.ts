import * as THREE from "three";

import { RATE_3D_SLUGS } from "./slugs";

/**
 * Parametric 3D templates for rate build-ups, shown in place inside a small
 * building under construction. Each part is tied to rate line id(s) so a tap
 * shows its cost. Parts move along `dir` as the explode factor goes 0 → 1.
 */
export type ScenePart = {
  /** Rate line id(s) this part represents; a mortar bed is cement + sand. */
  lineId: string | string[];
  object: THREE.Object3D;
  dir: THREE.Vector3;
  /** Only shown when exploded (e.g. the cement and sand inside the mortar). */
  appearOnExplode?: boolean;
};

export type CameraView = { target: THREE.Vector3; position: THREE.Vector3 };

export type RateScene = {
  parts: ScenePart[];
  /** Surrounding structure, faded back when the item is taken apart. */
  context: THREE.Object3D[];
  colors: Record<string, string>;
  overview: CameraView;
  focus: CameraView;
};

// ---------------------------------------------------------------------------
// Procedural surface textures (no image downloads)

const rand = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void, repeat = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  return texture;
}

const speckle = (base: string, spread: number, seed: number, dots = 2200) =>
  canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    const r = rand(seed);
    for (let i = 0; i < dots; i += 1) {
      const shade = Math.round((r() - 0.5) * spread);
      ctx.fillStyle = `rgba(${shade > 0 ? 255 : 0},${shade > 0 ? 255 : 0},${shade > 0 ? 255 : 0},${Math.abs(shade) / 255})`;
      ctx.fillRect(r() * size, r() * size, 1 + r() * 2, 1 + r() * 2);
    }
  });

const woodGrain = (base: string, seed: number) =>
  canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    const r = rand(seed);
    for (let i = 0; i < 60; i += 1) {
      ctx.strokeStyle = `rgba(90,50,20,${0.05 + r() * 0.12})`;
      ctx.lineWidth = 0.5 + r() * 2;
      ctx.beginPath();
      const y = r() * size;
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 16) ctx.lineTo(x, y + Math.sin(x / 30 + i) * 3 * r());
      ctx.stroke();
    }
  });

/** Light render-coloured wall with 450 × 225 mm block coursing lines. */
const coursing = () =>
  canvasTexture(512, (ctx, size) => {
    ctx.fillStyle = "#ECEAE5";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(120,115,105,0.35)";
    ctx.lineWidth = 2;
    const rows = 4;
    const h = size / rows;
    for (let row = 0; row < rows; row += 1) {
      ctx.beginPath();
      ctx.moveTo(0, row * h);
      ctx.lineTo(size, row * h);
      ctx.stroke();
      const offset = row % 2 ? size / 4 : 0;
      for (let x = offset; x < size; x += size / 2) {
        ctx.beginPath();
        ctx.moveTo(x, row * h);
        ctx.lineTo(x, (row + 1) * h);
        ctx.stroke();
      }
    }
  });

// ---------------------------------------------------------------------------
// Geometry helpers

type MatOpts = Partial<THREE.MeshStandardMaterialParameters>;

const mesh = (geometry: THREE.BufferGeometry, opts: MatOpts) => {
  const m = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, ...opts }));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

const box = (w: number, h: number, d: number, opts: MatOpts) => mesh(new THREE.BoxGeometry(w, h, d), opts);

const at = <T extends THREE.Object3D>(object: T, x: number, y: number, z: number) => {
  object.position.set(x, y, z);
  return object;
};

/** White "architectural model" element with fine edge lines. */
function modelBox(w: number, h: number, d: number, x: number, y: number, z: number, opts: MatOpts = {}) {
  const body = at(box(w, h, d, { color: "#F4F2EE", roughness: 0.9, ...opts }), x, y, z);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(body.geometry),
    new THREE.LineBasicMaterial({ color: "#4B5563", transparent: true, opacity: 0.35 }),
  );
  body.add(edges);
  return body;
}

// ---------------------------------------------------------------------------
// Building context: one 4 × 3 m bay of a house under construction.

const BAY_W = 4;
const BAY_D = 3;
const SLAB = 0.15;
const COL = 0.23;
const STOREY = 2.85;

type ContextOptions = {
  beams: boolean;
  /** Front wall thickness and the 1 m² opening left for the rate panel. */
  frontWall?: { thickness: number; openingX: number; openingW: number; openingH: number; height: number };
  sideWalls?: number;
  /** Corner left without a cast column (it is being formed). */
  skipColumn?: number;
};

function buildContext(options: ContextOptions): THREE.Object3D[] {
  const items: THREE.Object3D[] = [];
  const concrete = speckle("#D9D6CF", 26, 7);

  // Site ground and ground-floor slab.
  const ground = at(mesh(new THREE.CircleGeometry(40, 64), { color: "#C9B48F", map: speckle("#C9B48F", 40, 3, 4000), roughness: 1 }), 0, -0.001, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  ground.userData.keepVisible = true;
  (ground.material as THREE.MeshStandardMaterial).map!.repeat.set(24, 24);
  items.push(ground);
  items.push(modelBox(BAY_W + 0.6, SLAB, BAY_D + 0.6, 0, SLAB / 2, 0, { map: concrete }));

  const corners: Array<[number, number]> = [
    [-BAY_W / 2, -BAY_D / 2],
    [BAY_W / 2, -BAY_D / 2],
    [-BAY_W / 2, BAY_D / 2],
    [BAY_W / 2, BAY_D / 2],
  ];
  corners.forEach(([x, z], index) => {
    if (index === options.skipColumn) return;
    items.push(modelBox(COL, STOREY, COL, x, SLAB + STOREY / 2, z));
  });

  if (options.beams) {
    const y = SLAB + STOREY + 0.15;
    items.push(modelBox(BAY_W + COL, 0.3, COL, 0, y, -BAY_D / 2));
    items.push(modelBox(BAY_W + COL, 0.3, COL, 0, y, BAY_D / 2));
    items.push(modelBox(COL, 0.3, BAY_D, -BAY_W / 2, y, 0));
    items.push(modelBox(COL, 0.3, BAY_D, BAY_W / 2, y, 0));
  }

  const wallMat = () => ({ map: coursing(), color: "#FFFFFF" });
  if (options.sideWalls) {
    const t = options.sideWalls;
    const h = STOREY;
    // Back wall full height with a window opening; left wall full height.
    const backLen = BAY_W - COL;
    items.push(modelBox(backLen, 0.9, t, 0, SLAB + 0.45, -BAY_D / 2, wallMat()));
    items.push(modelBox(backLen, h - 2.1, t, 0, SLAB + 2.1 + (h - 2.1) / 2, -BAY_D / 2, wallMat()));
    items.push(modelBox(0.8, 1.2, t, -backLen / 2 + 0.4, SLAB + 1.5, -BAY_D / 2, wallMat()));
    items.push(modelBox(0.8, 1.2, t, backLen / 2 - 0.4, SLAB + 1.5, -BAY_D / 2, wallMat()));
    // Window frame and glass in the back-wall opening.
    const glass = at(box(backLen - 1.6, 1.2, 0.02, { color: "#9EC3D8", roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.45 }), 0, SLAB + 1.5, -BAY_D / 2);
    items.push(glass);
    items.push(modelBox(t, h, BAY_D - COL, -BAY_W / 2, SLAB + h / 2, 0, wallMat()));
  }

  const front = options.frontWall;
  if (front) {
    const { thickness: t, openingX, openingW, openingH, height } = front;
    const z = BAY_D / 2;
    const left = -BAY_W / 2 + COL / 2;
    const right = BAY_W / 2 - COL / 2;
    const oL = openingX - openingW / 2;
    const oR = openingX + openingW / 2;
    // Wall around the 1 m² panel, built up to `height` (work in progress).
    items.push(modelBox(oL - left, height, t, (left + oL) / 2, SLAB + height / 2, z, wallMat()));
    items.push(modelBox(right - oR, height - 0.47, t, (oR + right) / 2, SLAB + (height - 0.47) / 2, z, wallMat()));
    items.push(modelBox(openingW, height - openingH, t, openingX, SLAB + openingH + (height - openingH) / 2, z, wallMat()));
    // A few loose blocks and a mortar board on the slab for a live-site feel.
    items.push(modelBox(0.45, 0.225, t, 1.3, SLAB + 0.11, 1.0, { map: speckle("#BDB7AB", 30, 11) }));
    items.push(modelBox(0.45, 0.225, t, 1.3, SLAB + 0.34, 1.0, { map: speckle("#BDB7AB", 30, 12) }));
    items.push(modelBox(0.6, 0.04, 0.6, -1.2, SLAB + 0.02, 0.8, { color: "#8A6A44" }));
  }

  return items;
}

// ---------------------------------------------------------------------------
// Templates

function blockwork(thickness: number, prefix: string): RateScene {
  const colors = {
    [prefix]: "#B8B2A6",
    [`${prefix}-cem`]: "#8E9399",
    [`${prefix}-sand`]: "#D9B77A",
  };
  const blockTex = speckle("#A39C90", 34, 21);
  const mortarTex = speckle("#C9C5BC", 22, 22);
  const parts: ScenePart[] = [];
  const L = 0.45;
  const H = 0.225;
  const joint = 0.01;
  const courses = 4;
  const panelW = 2 * L + joint;
  const origin = new THREE.Vector3(0.6, SLAB, BAY_D / 2);

  for (let c = 0; c < courses; c += 1) {
    const y = joint + c * (H + joint) + H / 2;
    // Stretcher bond: even courses two full blocks, odd courses half + full + half.
    const pieces = c % 2 === 0 ? [L, L] : [L / 2 - joint / 2, L, L / 2 - joint / 2];
    let x = -panelW / 2;
    for (const len of pieces) {
      const cx = x + len / 2;
      const block = at(box(len, H, thickness, { map: blockTex, color: "#FFFFFF" }), origin.x + cx, origin.y + y, origin.z);
      parts.push({ lineId: prefix, object: block, dir: new THREE.Vector3(cx * 0.7, (y - 0.47) * 0.8, 0.7) });
      x += len + joint;
    }
    const bedY = c * (H + joint) + joint / 2;
    const bed = at(box(panelW, joint, thickness, { map: mortarTex, color: "#FFFFFF" }), origin.x, origin.y + bedY, origin.z);
    parts.push({ lineId: [`${prefix}-cem`, `${prefix}-sand`], object: bed, dir: new THREE.Vector3(0, (bedY - 0.47) * 0.8, 1.05) });
  }

  // Mortar ingredients appear in front of the wall when exploded.
  const bag = at(box(0.32, 0.1, 0.48, { color: "#9AA0A6", map: speckle("#9AA0A6", 20, 31) }), origin.x + 0.95, origin.y + 0.05, origin.z + 0.9);
  parts.push({ lineId: `${prefix}-cem`, object: bag, dir: new THREE.Vector3(0.2, 0, 0.2), appearOnExplode: true });
  const sand = at(
    mesh(new THREE.ConeGeometry(0.24, 0.2, 32), { color: "#FFFFFF", map: speckle("#D9B77A", 60, 41, 5000), roughness: 1 }),
    origin.x - 0.95,
    origin.y + 0.1,
    origin.z + 0.9,
  );
  parts.push({ lineId: `${prefix}-sand`, object: sand, dir: new THREE.Vector3(-0.2, 0, 0.2), appearOnExplode: true });

  const context = buildContext({
    beams: false,
    sideWalls: thickness,
    frontWall: { thickness, openingX: origin.x, openingW: panelW, openingH: 0.95, height: 1.65 },
  });
  const panelCentre = origin.clone().add(new THREE.Vector3(0, 0.47, 0));

  return {
    parts,
    context,
    colors,
    overview: { target: new THREE.Vector3(0, 1.1, 0), position: new THREE.Vector3(6.5, 4.2, 7.5) },
    focus: { target: panelCentre.clone().add(new THREE.Vector3(0, 0, 0.5)), position: panelCentre.clone().add(new THREE.Vector3(2.1, 1.3, 3.9)) },
  };
}

function columnFormwork(prefix: string): RateScene {
  const colors = {
    [`${prefix}-ply`]: "#C98B4B",
    [`${prefix}-2x3`]: "#E2C08D",
    [`${prefix}-2x6`]: "#B5793C",
    [`${prefix}-2x2`]: "#D8B077",
    [`${prefix}-nail`]: "#7D8790",
    [`${prefix}-release`]: "#3E7CB1",
  };
  const plyTex = woodGrain("#C98B4B", 51);
  const studTex = woodGrain("#E2C08D", 52);
  const walerTex = woodGrain("#B5793C", 53);
  const braceTex = woodGrain("#D8B077", 54);
  const parts: ScenePart[] = [];
  const size = COL;
  const height = STOREY;
  const ply = 0.018;
  const origin = new THREE.Vector3(BAY_W / 2, SLAB, BAY_D / 2);
  const place = (object: THREE.Object3D) => {
    object.position.add(origin);
    return object;
  };
  const faces = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];

  // Starter bars (context, not part of this rate) poking out of the slab.
  const context = buildContext({ beams: false, skipColumn: 3 });
  [-0.07, 0.07].forEach((dx) =>
    [-0.07, 0.07].forEach((dz) => {
      const bar = at(mesh(new THREE.CylinderGeometry(0.008, 0.008, height + 0.5, 8), { color: "#6B4F3A", roughness: 0.6, metalness: 0.5 }), origin.x + dx, origin.y + (height + 0.5) / 2, origin.z + dz);
      context.push(bar);
    }),
  );

  faces.forEach((n, i) => {
    const alongX = n.z !== 0;
    const width = i < 2 ? size : size + 2 * ply;
    const off = size / 2 + ply / 2;
    const panel = place(at(box(alongX ? width : ply, height, alongX ? ply : width, { map: plyTex, color: "#FFFFFF" }), n.x * off, height / 2, n.z * off));
    parts.push({ lineId: `${prefix}-ply`, object: panel, dir: n.clone().multiplyScalar(0.35) });

    [-0.07, 0.07].forEach((s) => {
      const so = off + ply / 2 + 0.0375;
      const stud = place(at(box(alongX ? 0.05 : 0.075, height, alongX ? 0.075 : 0.05, { map: studTex, color: "#FFFFFF" }), n.x * so + (alongX ? s : 0), height / 2, n.z * so + (alongX ? 0 : s)));
      parts.push({ lineId: `${prefix}-2x3`, object: stud, dir: n.clone().multiplyScalar(0.65) });
    });

    [0.3, 0.95, 1.6, 2.25].forEach((y) => {
      const wo = off + ply / 2 + 0.075 + 0.025;
      const len = size + 0.45;
      const waler = place(at(box(alongX ? len : 0.05, 0.15, alongX ? 0.05 : len, { map: walerTex, color: "#FFFFFF" }), n.x * wo, y, n.z * wo));
      parts.push({ lineId: `${prefix}-2x6`, object: waler, dir: n.clone().multiplyScalar(0.95).add(new THREE.Vector3(0, (y - 1.2) * 0.25, 0)) });
    });
  });

  [faces[0], faces[2]].forEach((n) => {
    const foot = n.clone().multiplyScalar(1.1);
    const top = n.clone().multiplyScalar(0.22).add(new THREE.Vector3(0, 1.8, 0));
    const vec = top.clone().sub(foot);
    const brace = mesh(new THREE.BoxGeometry(0.05, vec.length(), 0.05), { map: braceTex, color: "#FFFFFF" });
    brace.position.copy(foot.clone().add(top).multiplyScalar(0.5)).add(origin);
    brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec.clone().normalize());
    parts.push({ lineId: `${prefix}-2x2`, object: brace, dir: n.clone().multiplyScalar(0.6) });
  });

  const nailBag = place(at(box(0.25, 0.12, 0.35, { color: "#7D8790", map: speckle("#7D8790", 30, 61) }), -0.9, 0.06, 0.9));
  parts.push({ lineId: `${prefix}-nail`, object: nailBag, dir: new THREE.Vector3(-0.2, 0, 0.1), appearOnExplode: true });
  const can = place(at(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 24), { color: "#3E7CB1", roughness: 0.4, metalness: 0.3 }), 0.9, 0.14, 0.9));
  parts.push({ lineId: `${prefix}-release`, object: can, dir: new THREE.Vector3(0.2, 0, 0.1), appearOnExplode: true });

  const centre = origin.clone().add(new THREE.Vector3(0, 1.3, 0));
  return {
    parts,
    context,
    colors,
    overview: { target: new THREE.Vector3(0.6, 1.2, 0.3), position: new THREE.Vector3(6.5, 4.4, 7.5) },
    focus: { target: centre, position: centre.clone().add(new THREE.Vector3(4.2, 2.0, 5.2)) },
  };
}

const TEMPLATES: Record<(typeof RATE_3D_SLUGS)[number], () => RateScene> = {
  "230mm-hollow-sandcrete-blockwork": () => blockwork(0.225, "block225"),
  "150mm-hollow-sandcrete-blockwork": () => blockwork(0.15, "block150"),
  "plywood-formwork-columns": () => columnFormwork("fwc"),
};

export const buildRateScene = (slug: string): RateScene | undefined =>
  (TEMPLATES as Record<string, () => RateScene>)[slug]?.();
