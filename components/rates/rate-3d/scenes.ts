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
  /** Fades out when exploded (e.g. finished concrete turning into its ingredients). */
  hideOnExplode?: boolean;
};

export type CameraView = { target: THREE.Vector3; position: THREE.Vector3 };

export type RateScene = {
  parts: ScenePart[];
  /** Step-by-step method shown beside the model. */
  process?: [string, string, string];
  /** The intended completed state represented by the rate item. */
  endResult?: string;
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
  /** Full-height front wall with a door opening. */
  closedFront?: number;
  /** Mono-pitch timber rafters and purlins; front edge raised by `rise`. */
  roof?: { rise: number };
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

  if (options.closedFront) {
    const t = options.closedFront;
    const z = BAY_D / 2;
    const span = BAY_W - COL;
    const doorX = -1.0;
    const doorW = 0.9;
    const leftW = doorX - doorW / 2 + span / 2;
    const rightW = span / 2 - (doorX + doorW / 2);
    items.push(modelBox(leftW, STOREY, t, -span / 2 + leftW / 2, SLAB + STOREY / 2, z, wallMat()));
    items.push(modelBox(rightW, STOREY, t, span / 2 - rightW / 2, SLAB + STOREY / 2, z, wallMat()));
    items.push(modelBox(doorW, STOREY - 2.1, t, doorX, SLAB + 2.1 + (STOREY - 2.1) / 2, z, wallMat()));
  }

  if (options.roof) {
    const { rise } = options.roof;
    const beamTop = SLAB + STOREY + 0.3;
    const run = BAY_D + 0.8;
    const slopeLen = Math.hypot(run, rise);
    const angle = Math.atan2(rise, run);
    for (let x = -BAY_W / 2; x <= BAY_W / 2 + 0.01; x += BAY_W / 4) {
      const rafter = modelBox(0.05, 0.15, slopeLen, x, beamTop + rise / 2 + 0.075, 0, { color: "#E7E1D6" });
      rafter.rotation.x = -angle;
      items.push(rafter);
    }
    for (let i = 0; i <= 4; i += 1) {
      const f = i / 4;
      const purlin = modelBox(BAY_W + 0.6, 0.05, 0.075, 0, beamTop + 0.15 + 0.025 + rise * f, -run / 2 + run * f, { color: "#E7E1D6" });
      purlin.rotation.x = -angle;
      items.push(purlin);
    }
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

function slabFormwork(prefix: string): RateScene {
  const colors = {
    [`${prefix}-ply`]: "#C98B4B",
    [`${prefix}-2x3`]: "#E2C08D",
    [`${prefix}-2x6`]: "#B5793C",
    [`${prefix}-peri`]: "#E3B23C",
    [`${prefix}-prop-rental`]: "#D9622B",
    [`${prefix}-2x2`]: "#D8B077",
    [`${prefix}-nail`]: "#7D8790",
    [`${prefix}-release`]: "#3E7CB1",
  };
  const parts: ScenePart[] = [];
  const soffit = SLAB + STOREY + 0.15;
  const spanX = BAY_W - COL;
  const spanZ = BAY_D - COL;
  const ply = 0.018;
  const plyTex = woodGrain("#C98B4B", 71);
  const joistTex = woodGrain("#E2C08D", 72);
  const bearerTex = woodGrain("#B5793C", 73);

  // Plywood deck: 3 x 2 sheets.
  for (let i = 0; i < 3; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      const w = spanX / 3;
      const d = spanZ / 2;
      const sheet = at(box(w - 0.004, ply, d - 0.004, { map: plyTex, color: "#FFFFFF" }), -spanX / 2 + w * (i + 0.5), soffit - ply / 2, -spanZ / 2 + d * (j + 0.5));
      parts.push({ lineId: `${prefix}-ply`, object: sheet, dir: new THREE.Vector3(0, 1.9, 0) });
    }
  }
  // 2x3 joists along Z at 400 mm.
  const joistY = soffit - ply - 0.0375;
  for (let x = -spanX / 2 + 0.1; x <= spanX / 2 - 0.05; x += 0.4) {
    parts.push({ lineId: `${prefix}-2x3`, object: at(box(0.05, 0.075, spanZ, { map: joistTex, color: "#FFFFFF" }), x, joistY, 0), dir: new THREE.Vector3(0, 1.35, 0) });
  }
  // 2x2 noggins at the deck edges.
  [-spanZ / 2 + 0.05, spanZ / 2 - 0.05].forEach((z) =>
    parts.push({ lineId: `${prefix}-2x2`, object: at(box(spanX, 0.05, 0.05, { map: joistTex, color: "#FFFFFF" }), 0, joistY, z), dir: new THREE.Vector3(0, 1.35, z * 0.4) }),
  );
  // 2x6 secondary bearers along X.
  const bearerY = joistY - 0.0375 - 0.075;
  [-0.9, 0, 0.9].forEach((z) =>
    parts.push({ lineId: `${prefix}-2x6`, object: at(box(spanX, 0.15, 0.05, { map: bearerTex, color: "#FFFFFF" }), 0, bearerY, z), dir: new THREE.Vector3(0, 0.85, 0) }),
  );
  // H20 primary beams along Z.
  const h20Y = bearerY - 0.075 - 0.1;
  const propXs = [-1.2, 0, 1.2];
  propXs.forEach((x) => {
    const beam = new THREE.Group();
    beam.add(at(box(0.08, 0.04, spanZ, { color: "#E3B23C" }), 0, 0.08, 0));
    beam.add(at(box(0.08, 0.04, spanZ, { color: "#E3B23C" }), 0, -0.08, 0));
    beam.add(at(box(0.03, 0.12, spanZ, { color: "#F1E2B8" }), 0, 0, 0));
    parts.push({ lineId: `${prefix}-peri`, object: at(beam, x, h20Y, 0), dir: new THREE.Vector3(0, 0.4, 0) });
  });
  // Acrow props under each H20 beam.
  const propTop = h20Y - 0.1;
  const propH = propTop - SLAB;
  propXs.forEach((x) =>
    [-0.9, 0, 0.9].forEach((z) => {
      const prop = new THREE.Group();
      prop.add(at(mesh(new THREE.CylinderGeometry(0.03, 0.03, propH * 0.55, 12), { color: "#D9622B", metalness: 0.4, roughness: 0.5 }), 0, propH * 0.275, 0));
      prop.add(at(mesh(new THREE.CylinderGeometry(0.022, 0.022, propH * 0.5, 12), { color: "#B8BEC4", metalness: 0.6, roughness: 0.4 }), 0, propH * 0.75, 0));
      prop.add(at(box(0.15, 0.01, 0.15, { color: "#5B6168", metalness: 0.5 }), 0, 0.005, 0));
      prop.add(at(box(0.15, 0.01, 0.15, { color: "#5B6168", metalness: 0.5 }), 0, propH - 0.005, 0));
      parts.push({ lineId: `${prefix}-prop-rental`, object: at(prop, x, SLAB, z), dir: new THREE.Vector3(x * 0.35, 0, z * 0.45) });
    }),
  );
  const nailBag = at(box(0.25, 0.12, 0.35, { color: "#7D8790", map: speckle("#7D8790", 30, 74) }), -1.0, SLAB + 0.06, 2.2);
  parts.push({ lineId: `${prefix}-nail`, object: nailBag, dir: new THREE.Vector3(-0.2, 0, 0.2), appearOnExplode: true });
  const can = at(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 24), { color: "#3E7CB1", roughness: 0.4, metalness: 0.3 }), 1.0, SLAB + 0.14, 2.2);
  parts.push({ lineId: `${prefix}-release`, object: can, dir: new THREE.Vector3(0.2, 0, 0.2), appearOnExplode: true });

  return {
    parts,
    context: buildContext({ beams: true }),
    colors,
    overview: { target: new THREE.Vector3(0, 1.6, 0), position: new THREE.Vector3(6.8, 5.6, 7.6) },
    focus: { target: new THREE.Vector3(0, 2.6, 0), position: new THREE.Vector3(6.2, 4.4, 7.4) },
  };
}

/** Cone of a given volume, so material piles are true to the quantities. */
function pile(volume: number, height: number, color: string, seed: number) {
  const radius = Math.sqrt((3 * volume) / (Math.PI * height));
  return mesh(new THREE.ConeGeometry(radius, height, 40), { color: "#FFFFFF", map: speckle(color, 60, seed, 6000), roughness: 1 });
}

function concreteCubicMetre(prefix: string, quantities: { cement: number; sand: number; granite: number }): RateScene {
  const colors = {
    [`${prefix}-cement`]: "#9AA0A6",
    [`${prefix}-sand`]: "#D9B77A",
    [`${prefix}-granite`]: "#8F8A84",
    [`${prefix}-plant`]: "#E39B2D",
  };
  const parts: ScenePart[] = [];
  const concreteTex = speckle("#B9B6AF", 30, 81);
  const materials = [`${prefix}-cement`, `${prefix}-sand`, `${prefix}-granite`];
  // 1 m³ shown as this bay's ring beam: perimeter ≈ 14.5 m × 0.23 × 0.30 m.
  const y = SLAB + STOREY + 0.15;
  const ring: Array<[number, number, number, number]> = [
    [BAY_W + COL, COL, 0, -BAY_D / 2],
    [BAY_W + COL, COL, 0, BAY_D / 2],
    [COL, BAY_D - COL, -BAY_W / 2, 0],
    [COL, BAY_D - COL, BAY_W / 2, 0],
  ];
  ring.forEach(([w, d, x, z]) =>
    parts.push({ lineId: materials, object: at(box(w, 0.3, d, { map: concreteTex, color: "#FFFFFF" }), x, y, z), dir: new THREE.Vector3(0, 0.6, 0), hideOnExplode: true }),
  );

  const front = BAY_D / 2 + 1.9;
  const granite = at(pile(quantities.granite, 0.55, "#8F8A84", 82), -1.6, SLAB / 2 + 0.275, front);
  parts.push({ lineId: `${prefix}-granite`, object: granite, dir: new THREE.Vector3(0, 0, 0.2), appearOnExplode: true });
  const sand = at(pile(quantities.sand, 0.45, "#D9B77A", 83), 0.8, SLAB / 2 + 0.225, front);
  parts.push({ lineId: `${prefix}-sand`, object: sand, dir: new THREE.Vector3(0, 0, 0.2), appearOnExplode: true });

  // Cement bags stacked: whole bags plus one part-used bag.
  const bags = new THREE.Group();
  const bagTex = speckle("#9AA0A6", 20, 84);
  const whole = Math.floor(quantities.cement);
  for (let i = 0; i <= whole; i += 1) {
    const partial = i === whole ? quantities.cement - whole : 1;
    if (partial <= 0.01) continue;
    const bag = box(0.48, 0.12 * partial, 0.32, { map: bagTex, color: "#FFFFFF" });
    bag.position.set((i % 2) * 0.5, 0.06 * partial + Math.floor(i / 2) * 0.125, 0);
    bags.add(bag);
  }
  parts.push({ lineId: `${prefix}-cement`, object: at(bags, 2.3, SLAB, front - 0.4), dir: new THREE.Vector3(0.2, 0, 0.2), appearOnExplode: true });

  // Drum mixer for the plant allocation.
  const mixer = new THREE.Group();
  const drum = mesh(new THREE.CylinderGeometry(0.28, 0.4, 0.7, 24), { color: "#E39B2D", metalness: 0.3, roughness: 0.5 });
  drum.rotation.z = Math.PI / 3;
  drum.position.set(0, 0.85, 0);
  mixer.add(drum);
  mixer.add(at(box(0.9, 0.08, 0.5, { color: "#4B5563", metalness: 0.4 }), 0, 0.45, 0));
  [-0.35, 0.35].forEach((x) => {
    const wheel = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 20), { color: "#1F2933" });
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.2, 0.3);
    mixer.add(wheel);
  });
  parts.push({ lineId: `${prefix}-plant`, object: at(mixer, -3.7, SLAB, front - 0.2), dir: new THREE.Vector3(-0.2, 0, 0.2), appearOnExplode: true });

  return {
    parts,
    context: buildContext({ beams: false }),
    colors,
    overview: { target: new THREE.Vector3(0, 1.5, 0.4), position: new THREE.Vector3(6.8, 5.2, 8.0) },
    focus: { target: new THREE.Vector3(-0.4, 0.4, front - 0.2), position: new THREE.Vector3(2.5, 4.6, front + 7.2) },
  };
}

/** Trapezoidal long-span roofing sheet profile, extruded along its length. */
function roofSheet(width: number, length: number, material: THREE.MeshStandardMaterial) {
  const shape = new THREE.Shape();
  const pitch = 0.2;
  const rib = 0.03;
  shape.moveTo(-width / 2, 0);
  for (let x = -width / 2; x < width / 2 - 0.001; x += pitch) {
    shape.lineTo(x + 0.06, 0);
    shape.lineTo(x + 0.08, rib);
    shape.lineTo(x + 0.12, rib);
    shape.lineTo(x + 0.14, 0);
    shape.lineTo(Math.min(x + pitch, width / 2), 0);
  }
  shape.lineTo(width / 2, -0.004);
  shape.lineTo(-width / 2, -0.004);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  geometry.translate(0, 0, -length / 2);
  const sheet = new THREE.Mesh(geometry, material);
  sheet.castShadow = true;
  sheet.receiveShadow = true;
  return sheet;
}

function roofCovering(prefix: string): RateScene {
  const colors = {
    [`${prefix}-sheet`]: "#8E2B1F",
    [`${prefix}-screws`]: "#C9CED3",
  };
  const parts: ScenePart[] = [];
  const rise = 0.6;
  const run = BAY_D + 0.8;
  const angle = Math.atan2(rise, run);
  const beamTop = SLAB + STOREY + 0.3;
  const deckY = beamTop + 0.15 + 0.05 + rise / 2 + 0.02;
  const length = Math.hypot(run, rise) + 0.3;
  const sheetMat = new THREE.MeshStandardMaterial({ color: "#8E2B1F", metalness: 0.55, roughness: 0.4, side: THREE.DoubleSide });
  const sheets = 5;
  const sheetW = 1.0;
  const lap = 0.04;
  for (let i = 0; i < sheets; i += 1) {
    const x = (i - (sheets - 1) / 2) * (sheetW - lap);
    const sheet = roofSheet(sheetW, length, sheetMat.clone());
    const holder = new THREE.Group();
    holder.add(sheet);
    holder.rotation.x = -angle;
    parts.push({ lineId: `${prefix}-sheet`, object: at(holder, x, deckY, 0), dir: new THREE.Vector3((i - 2) * 0.25, 0.9 + i * 0.12, 0) });
  }
  // Screws on every other rib along each purlin line.
  const screws = new THREE.Group();
  const screwGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8);
  const screwMat = new THREE.MeshStandardMaterial({ color: "#C9CED3", metalness: 0.8, roughness: 0.3 });
  const span = sheets * (sheetW - lap);
  for (let p = 0; p <= 4; p += 1) {
    const z = -run / 2 + (run * p) / 4;
    for (let x = -span / 2 + 0.1; x <= span / 2; x += 0.4) {
      const screw = new THREE.Mesh(screwGeo, screwMat);
      screw.position.set(x, rise * (p / 4) - rise / 2 + 0.04, z);
      screws.add(screw);
    }
  }
  parts.push({ lineId: `${prefix}-screws`, object: at(screws, 0, deckY, 0), dir: new THREE.Vector3(0, 2.1, 0) });

  return {
    parts,
    context: buildContext({ beams: true, sideWalls: 0.225, closedFront: 0.225, roof: { rise } }),
    colors,
    overview: { target: new THREE.Vector3(0, 2.2, 0), position: new THREE.Vector3(7.5, 7.0, 8.5) },
    focus: { target: new THREE.Vector3(0, 4.4, 0), position: new THREE.Vector3(6.5, 7.8, 7.5) },
  };
}

const TEMPLATES: Record<(typeof RATE_3D_SLUGS)[number], () => RateScene> = {
  "230mm-hollow-sandcrete-blockwork": () => blockwork(0.225, "block225"),
  "150mm-hollow-sandcrete-blockwork": () => blockwork(0.15, "block150"),
  "plywood-formwork-columns": () => columnFormwork("fwc"),
  "plywood-formwork-slab-soffit": () => slabFormwork("fws"),
  "c25-structural-concrete-310kg": () => concreteCubicMetre("c25", { cement: 6.386, sand: 0.43028, granite: 0.86056 }),
  "055mm-aluminium-roof-covering": () => roofCovering("roof055"),
};

export const buildRateScene = (slug: string): RateScene | undefined =>
  (TEMPLATES as Record<string, () => RateScene>)[slug]?.();
