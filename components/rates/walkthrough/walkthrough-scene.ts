import * as THREE from "three/webgpu";
import { SkyMesh } from "three/addons/objects/SkyMesh.js";

import { MODEL, WALKTHROUGH_STEPS } from "@/lib/rates/walkthrough";

/**
 * Procedural two-storey building for the construction walkthrough.
 * Uses three.js WebGPURenderer, which falls back to WebGL 2 automatically when WebGPU is not available.
 * Units are metres: x along the 10 m length, z along the 8 m width, y up (ground = 0).
 */

export type WalkthroughScene = {
  backend: "WebGPU" | "WebGL 2";
  setStep: (index: number) => void;
  dispose: () => void;
};

const C = {
  ground: 0x6b5a3e,
  soil: 0x2a1d12,
  blinding: 0x8d9196,
  concrete: 0xbfbbb3,
  rebar: 0xe0a33a,
  hardcore: 0x7d7468,
  dpm: 0x3d78b5,
  timber: 0xb07a45,
  roof: 0xc9d3dc,
  plaster: 0xe9e2d4,
  gold: 0xd9b26a,
};

const T = 0.23; // wall / column thickness
const SUB_TOP = 0.2; // top of foundation wall (DPC)
const GF_TOP = 3.2; // top of first-floor slab
const FF_TOP = 6.2; // top of ring beam
const BEAM = 0.45;
const PITCH = Math.PI / 6;
const COLUMNS: [number, number][] = [
  [0, 0], [5, 0], [10, 0], [0, 8], [5, 8], [10, 8],
];
// Wall centreline runs: [x1, z1, x2, z2]
const RUNS: [number, number, number, number][] = [
  [0, 0, 10, 0], [0, 8, 10, 8], [0, 0, 0, 8], [10, 0, 10, 8], [5, 0, 5, 8],
];

function blockTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#8f9398";
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = "#a9adb2";
  for (let row = 0; row < 2; row += 1) {
    for (let col = -1; col < 3; col += 1) {
      const x = col * 128 + (row % 2 ? 64 : 0);
      ctx.fillRect(x + 3, row * 64 + 3, 122, 58);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function stripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 8;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createLinearGradient(0, 0, 64, 0);
  gradient.addColorStop(0, "#9aa6b1");
  gradient.addColorStop(0.5, "#e4eaef");
  gradient.addColorStop(1, "#9aa6b1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 8);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export async function createWalkthroughScene(
  canvas: HTMLCanvasElement,
  options: { forceWebGL?: boolean; onDeviceLost?: () => void } = {},
): Promise<WalkthroughScene> {
  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true, alpha: false, forceWebGL: options.forceWebGL });
  // If the GPU device is lost (driver reset, buggy WebGPU), let the page fall back to WebGL.
  renderer.onDeviceLost = () => options.onDeviceLost?.();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  await renderer.init();
  const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? "WebGPU" : "WebGL 2";

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.4;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20000);

  // Physical sky (as in the three.js WebGPU building-generator example): it is the backdrop
  // and, baked through PMREM, the soft image-based fill light. The sun is the key light.
  const sky = new SkyMesh();
  sky.scale.setScalar(10000);
  sky.turbidity.value = 8;
  sky.rayleigh.value = 2.5;
  sky.mieCoefficient.value = 0.006;
  sky.mieDirectionalG.value = 0.86;
  const sunDir = new THREE.Vector3();
  const elevation = 38; // late-afternoon sun
  const azimuth = 140;
  sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevation), THREE.MathUtils.degToRad(azimuth));
  sky.sunPosition.value.copy(sunDir);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  sky.showSunDisc.value = false;
  envScene.add(sky);
  const envMap = pmrem.fromScene(envScene).texture;
  scene.environment = envMap;
  sky.showSunDisc.value = true;
  scene.add(sky);

  const sun = new THREE.DirectionalLight(0xfff0dc, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.target.position.set(5, 0, 4);
  sun.position.copy(sunDir).multiplyScalar(40).add(sun.target.position);
  const shadowCam = sun.shadow.camera;
  shadowCam.left = shadowCam.bottom = -16;
  shadowCam.right = shadowCam.top = 16;
  shadowCam.near = 1;
  shadowCam.far = 90;
  scene.add(sun, sun.target);

  const disposables: { dispose: () => void }[] = [envMap, pmrem];
  const block = blockTexture();
  const stripes = stripeTexture();
  disposables.push(block, stripes);

  type StepVisual = { group: THREE.Group; materials: THREE.MeshStandardMaterial[]; xray: THREE.Group | null };
  const steps = new Map<string, StepVisual>();
  const wallMeshes: { mesh: THREE.Mesh; plaster: THREE.MeshStandardMaterial }[] = [];
  const frameMaterials: THREE.MeshStandardMaterial[] = []; // columns, beams, slab edge: plastered at the finishes stage

  const stepVisual = (id: string): StepVisual => {
    let visual = steps.get(id);
    if (!visual) {
      visual = { group: new THREE.Group(), materials: [], xray: null };
      visual.group.name = id;
      scene.add(visual.group);
      steps.set(id, visual);
    }
    return visual;
  };

  const material = (visual: StepVisual, color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02, ...extra });
    visual.materials.push(m);
    disposables.push(m);
    return m;
  };

  const box = (parent: THREE.Object3D, mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
    const geometry = new THREE.BoxGeometry(w, h, d);
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  /** A box along a wall run, centred on its centreline, between heights y0 and y1. */
  const runBox = (parent: THREE.Object3D, mat: THREE.Material, run: [number, number, number, number], width: number, y0: number, y1: number, extend = 0) => {
    const [x1, z1, x2, z2] = run;
    const alongX = z1 === z2;
    const length = Math.hypot(x2 - x1, z2 - z1) + extend * 2;
    return box(
      parent, mat,
      alongX ? length : width, y1 - y0, alongX ? width : length,
      (x1 + x2) / 2, (y0 + y1) / 2, (z1 + z2) / 2,
    );
  };

  const blockMaterial = (visual: StepVisual, length: number, height: number) => {
    const texture = block.clone();
    texture.needsUpdate = true;
    texture.repeat.set(length / 0.9, height / 0.45);
    disposables.push(texture);
    return material(visual, 0xffffff, { map: texture });
  };

  const lines = (parent: THREE.Object3D, points: number[], color = C.rebar) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const mat = new THREE.LineBasicMaterial({ color });
    disposables.push(geometry, mat);
    const segments = new THREE.LineSegments(geometry, mat);
    parent.add(segments);
    return segments;
  };

  const xrayGroup = (visual: StepVisual) => {
    if (!visual.xray) {
      visual.xray = new THREE.Group();
      visual.group.add(visual.xray);
    }
    return visual.xray;
  };

  // ---------- Ground with the trench footprint left open ----------
  const half = MODEL.trenchWidth / 2;
  const site = new THREE.Group();
  scene.add(site);
  const groundMat = new THREE.MeshStandardMaterial({ color: C.ground, roughness: 1, side: THREE.DoubleSide });
  disposables.push(groundMat);
  const outer = new THREE.Shape([new THREE.Vector2(-30, -30), new THREE.Vector2(40, -30), new THREE.Vector2(40, 38), new THREE.Vector2(-30, 38)]);
  outer.holes.push(new THREE.Path([new THREE.Vector2(-half, -half), new THREE.Vector2(-half, 8 + half), new THREE.Vector2(10 + half, 8 + half), new THREE.Vector2(10 + half, -half)]));
  const outerGeometry = new THREE.ShapeGeometry(outer);
  outerGeometry.rotateX(Math.PI / 2);
  disposables.push(outerGeometry);
  const groundMesh = new THREE.Mesh(outerGeometry, groundMat);
  groundMesh.receiveShadow = true;
  site.add(groundMesh);
  for (const [x0, x1] of [[half, 5 - half], [5 + half, 10 - half]]) {
    box(site, groundMat, x1 - x0, 0.02, 8 - 2 * half, (x0 + x1) / 2, -0.01, 4);
  }

  // ---------- 01 Excavation (open trenches) ----------
  const trench = stepVisual("excavation");
  const soil = material(trench, C.soil, { side: THREE.BackSide, roughness: 1 });
  for (const run of RUNS) runBox(trench.group, soil, run, MODEL.trenchWidth, -MODEL.trenchDepth, 0, half);

  // ---------- 02 Blinding ----------
  const blinding = stepVisual("blinding");
  const blindMat = material(blinding, C.blinding);
  for (const run of RUNS) runBox(blinding.group, blindMat, run, MODEL.trenchWidth - 0.01, -0.9, -0.85, half - 0.005);

  // ---------- 03 Footing ----------
  const footing = stepVisual("footing");
  const footMat = material(footing, C.concrete);
  for (const run of RUNS) runBox(footing.group, footMat, run, MODEL.trenchWidth - 0.02, -0.85, -0.625, half - 0.01);

  // ---------- 04 Foundation blockwork + backfill ----------
  const sub = stepVisual("substructure-walls");
  for (const run of RUNS) {
    const length = Math.hypot(run[2] - run[0], run[3] - run[1]) + T;
    runBox(sub.group, blockMaterial(sub, length, 0.825), run, T, -0.625, SUB_TOP, T / 2);
  }
  const backfill = material(sub, 0x5e4f36, { roughness: 1 });
  for (const run of RUNS) runBox(sub.group, backfill, run, MODEL.trenchWidth, -0.02, 0, half);

  // ---------- 05 Hardcore, DPM, mesh, ground slab ----------
  const slab = stepVisual("ground-slab");
  const inner: [number, number][] = [[T / 2, 5 - T / 2], [5 + T / 2, 10 - T / 2]];
  const hardcore = material(slab, C.hardcore, { roughness: 1 });
  const dpm = material(slab, C.dpm, { roughness: 0.4 });
  const groundSlab = material(slab, C.concrete, { transparent: true, opacity: 1 });
  for (const [x0, x1] of inner) {
    box(slab.group, hardcore, x1 - x0, 0.2, 8 - T, (x0 + x1) / 2, -0.1, 4);
    box(slab.group, dpm, x1 - x0, 0.01, 8 - T, (x0 + x1) / 2, 0.005, 4);
    box(slab.group, groundSlab, x1 - x0, 0.15, 8 - T, (x0 + x1) / 2, 0.125, 4);
  }
  {
    const pts: number[] = [];
    for (const [x0, x1] of inner) {
      for (let x = x0; x <= x1; x += 0.2) pts.push(x, 0.09, T / 2, x, 0.09, 8 - T / 2);
      for (let z = T / 2; z <= 8 - T / 2; z += 0.2) pts.push(x0, 0.09, z, x1, 0.09, z);
    }
    lines(xrayGroup(slab), pts, C.rebar);
  }

  // ---------- Columns (06 ground floor, part of 09 first floor) ----------
  const addColumns = (visual: StepVisual, y0: number, y1: number) => {
    const mat = material(visual, C.concrete, { transparent: true, opacity: 1 });
    frameMaterials.push(mat);
    const pts: number[] = [];
    for (const [x, z] of COLUMNS) {
      box(visual.group, mat, T, y1 - y0, T, x, (y0 + y1) / 2, z);
      const o = 0.07;
      for (const [dx, dz] of [[-o, -o], [o, -o], [o, o], [-o, o]]) pts.push(x + dx, y0, z + dz, x + dx, y1 + 0.3, z + dz);
      for (let y = y0 + 0.1; y < y1; y += 0.25) {
        pts.push(x - o, y, z - o, x + o, y, z - o, x + o, y, z - o, x + o, y, z + o, x + o, y, z + o, x - o, y, z + o, x - o, y, z + o, x - o, y, z - o);
      }
    }
    lines(xrayGroup(visual), pts);
  };
  addColumns(stepVisual("gf-columns"), SUB_TOP, GF_TOP - BEAM);

  // ---------- Walls with openings (07 ground floor, 09 first floor) ----------
  const addWalls = (visual: StepVisual, y0: number, y1: number) => {
    const plaster = material(visual, C.plaster);
    const segments: [number, number, number, number, boolean][] = [];
    for (const z of [0, 8]) {
      segments.push([0, z, 5, z, true], [5, z, 10, z, true]);
    }
    segments.push([0, 0, 0, 8, true], [10, 0, 10, 8, false], [5, 0, 5, 8, false]);
    for (const [x1, z1, x2, z2, window] of segments) {
      const alongX = z1 === z2;
      const length = Math.hypot(x2 - x1, z2 - z1) - T; // between column faces
      const start = (alongX ? Math.min(x1, x2) : Math.min(z1, z2)) + T / 2;
      const pieces: [number, number, number, number][] = []; // [from, to, bottom, top] along the run
      if (window) {
        const w = 1.2;
        const a = start + length / 2 - w / 2;
        const b = a + w;
        pieces.push([start, a, y0, y1], [b, start + length, y0, y1], [a, b, y0, y0 + 0.9], [a, b, y0 + 2.1, y1]);
      } else if (!alongX && x1 === 5) {
        const a = start + 2.5;
        const b = a + 0.9; // door
        pieces.push([start, a, y0, y1], [b, start + length, y0, y1], [a, b, y0 + 2.1, y1]);
      } else {
        pieces.push([start, start + length, y0, y1]);
      }
      for (const [from, to, bottom, top] of pieces) {
        const len = to - from;
        const mat = blockMaterial(visual, len, top - bottom);
        const mid = (from + to) / 2;
        const mesh = box(
          visual.group, mat,
          alongX ? len : T, top - bottom, alongX ? T : len,
          alongX ? mid : x1, (bottom + top) / 2, alongX ? z1 : mid,
        );
        wallMeshes.push({ mesh, plaster });
      }
    }
  };
  addWalls(stepVisual("gf-walls"), SUB_TOP, GF_TOP - BEAM);

  // ---------- 08 Beams + first floor slab ----------
  const addBeams = (visual: StepVisual, top: number) => {
    const mat = material(visual, C.concrete, { transparent: true, opacity: 1 });
    frameMaterials.push(mat);
    const pts: number[] = [];
    for (const run of RUNS) {
      runBox(visual.group, mat, run, T, top - BEAM, top, T / 2);
      const [x1, z1, x2, z2] = run;
      const alongX = z1 === z2;
      for (const dy of [top - BEAM + 0.05, top - 0.05]) {
        for (const off of [-0.07, 0.07]) {
          pts.push(x1 + (alongX ? 0 : off), dy, z1 + (alongX ? off : 0), x2 + (alongX ? 0 : off), dy, z2 + (alongX ? off : 0));
        }
      }
    }
    lines(xrayGroup(visual), pts);
  };
  const ffSlab = stepVisual("ff-slab");
  addBeams(ffSlab, GF_TOP);
  {
    const mat = material(ffSlab, C.concrete, { transparent: true, opacity: 1 });
    frameMaterials.push(mat);
    box(ffSlab.group, mat, 10 + T, 0.15, 8 + T, 5, GF_TOP - 0.075, 4);
    const pts: number[] = [];
    for (let x = 0; x <= 10; x += 0.3) pts.push(x, GF_TOP - 0.11, 0, x, GF_TOP - 0.11, 8);
    for (let z = 0; z <= 8; z += 0.3) pts.push(0, GF_TOP - 0.11, z, 10, GF_TOP - 0.11, z);
    lines(xrayGroup(ffSlab), pts);
  }

  // ---------- 09 First floor ----------
  const ff = stepVisual("first-floor");
  addColumns(ff, GF_TOP, FF_TOP - BEAM);
  addWalls(ff, GF_TOP, FF_TOP - BEAM);
  addBeams(ff, FF_TOP);

  // ---------- 10 Roof ----------
  const roof = stepVisual("roof");
  {
    const timber = material(roof, C.timber, { roughness: 0.7 });
    const over = 0.6;
    const ridgeZ = 4;
    const rise = Math.tan(PITCH);
    const eaveY = FF_TOP - over * rise;
    const ridgeY = FF_TOP + ridgeZ * rise;
    const rafterLen = (ridgeZ + over) / Math.cos(PITCH);
    const sheetsTexture = stripes.clone();
    sheetsTexture.needsUpdate = true;
    sheetsTexture.repeat.set((10 + 2 * over) / 0.2, 1);
    disposables.push(sheetsTexture);
    const sheets = material(roof, 0xffffff, { map: sheetsTexture, metalness: 0.45, roughness: 0.4, transparent: true, opacity: 1, side: THREE.DoubleSide });
    for (const side of [1, -1]) {
      // side 1 = front slope (eave at z = -over), -1 = back slope (eave at z = 8 + over)
      const eaveZ = side === 1 ? -over : 8 + over;
      const midZ = (eaveZ + ridgeZ) / 2;
      const midY = (eaveY + ridgeY) / 2;
      const tilt = side === 1 ? -PITCH : PITCH;
      for (let x = -over; x <= 10 + over + 0.01; x += 0.6) {
        const rafter = box(roof.group, timber, 0.05, 0.1, rafterLen, x, midY, midZ);
        rafter.rotation.x = tilt;
      }
      for (let i = 0; i < 6; i += 1) {
        const t = (i + 0.5) / 6;
        const z = eaveZ + (ridgeZ - eaveZ) * t;
        const y = eaveY + (ridgeY - eaveY) * t + 0.09;
        const purlin = box(roof.group, timber, 10 + 2 * over, 0.075, 0.05, 5, y, z);
        purlin.rotation.x = tilt;
      }
      const sheet = box(roof.group, sheets, 10 + 2 * over, 0.02, rafterLen, 5, midY + 0.16, midZ);
      sheet.rotation.x = tilt;
      sheet.userData.sheet = true;
    }
  }

  // ---------- Camera + simple orbit ----------
  const target = new THREE.Vector3();
  const goalTarget = new THREE.Vector3();
  const sph = new THREE.Spherical();
  const goalSph = new THREE.Spherical();
  const toSpherical = (position: [number, number, number], at: [number, number, number], out: THREE.Spherical) =>
    out.setFromVector3(new THREE.Vector3(...position).sub(new THREE.Vector3(...at)));

  const first = WALKTHROUGH_STEPS[0].camera;
  target.set(...first.target);
  goalTarget.copy(target);
  toSpherical(first.position, first.target, sph);
  sph.radius *= 1.6;
  toSpherical(first.position, first.target, goalSph);

  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;
  const onDown = (event: PointerEvent) => {
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };
  const onMove = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      goalSph.theta -= (event.clientX - previous.x) * 0.006;
      goalSph.phi = THREE.MathUtils.clamp(goalSph.phi - (event.clientY - previous.y) * 0.005, 0.2, 1.5);
    } else if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) goalSph.radius = THREE.MathUtils.clamp(goalSph.radius * (pinch / distance), 4, 60);
      pinch = distance;
    }
  };
  const onUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = 0;
  };
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    goalSph.radius = THREE.MathUtils.clamp(goalSph.radius * (1 + Math.sign(event.deltaY) * 0.08), 4, 60);
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // ---------- Step state ----------
  let current = 0;
  const order = WALKTHROUGH_STEPS.map((step) => step.id);
  const indexOf = (id: string) => order.indexOf(id);

  const applyStep = () => {
    for (const [id, visual] of steps) {
      const i = indexOf(id);
      const active = i === current;
      visual.group.visible = i <= current && !(id === "excavation" && current > indexOf("footing"));
      if (visual.xray) visual.xray.visible = active;
      for (const m of visual.materials) {
        m.emissive.set(active ? C.gold : 0x000000);
        m.emissiveIntensity = active ? 0.22 : 0;
        if (m.transparent) {
          m.opacity = active && visual.xray ? 0.28 : 1;
          m.depthWrite = !(active && visual.xray);
        }
      }
    }
    const roof = steps.get("roof");
    roof?.group.traverse((object) => {
      if ((object as THREE.Mesh).isMesh && object.userData.sheet) {
        const m = (object as THREE.Mesh).material as THREE.MeshStandardMaterial;
        const showTimber = current === indexOf("roof");
        m.opacity = showTimber ? 0.35 : 1;
        m.depthWrite = !showTimber;
      }
    });
    const plastered = current >= indexOf("finishes");
    for (const { mesh, plaster } of wallMeshes) {
      if (!mesh.userData.block) mesh.userData.block = mesh.material;
      mesh.material = plastered ? plaster : (mesh.userData.block as THREE.Material);
    }
    for (const m of frameMaterials) m.color.set(plastered ? C.plaster : C.concrete);
    const finishesActive = current === indexOf("finishes");
    for (const { plaster } of wallMeshes) {
      plaster.emissive.set(finishesActive ? C.gold : 0x000000);
      plaster.emissiveIntensity = finishesActive ? 0.12 : 0;
    }
    const cam = WALKTHROUGH_STEPS[current].camera;
    goalTarget.set(...cam.target);
    toSpherical(cam.position, cam.target, goalSph);
  };
  applyStep();

  // ---------- Render loop ----------
  let fit = 1;
  const resize = () => {
    const parent = canvas.parentElement;
    const width = parent?.clientWidth || canvas.clientWidth || 800;
    const height = parent?.clientHeight || canvas.clientHeight || 500;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fit = camera.aspect < 1.2 ? 1.2 / camera.aspect : 1; // pull back on narrow (phone) screens
  };
  resize();
  const observer = new ResizeObserver(resize);
  if (canvas.parentElement) observer.observe(canvas.parentElement);

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const ease = reduced ? 1 : 0.06;
  const angleLerp = (a: number, b: number, t: number) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  };

  renderer.setAnimationLoop(() => {
    target.lerp(goalTarget, ease);
    sph.radius += (goalSph.radius - sph.radius) * ease;
    sph.phi += (goalSph.phi - sph.phi) * ease;
    sph.theta = angleLerp(sph.theta, goalSph.theta, ease);
    camera.position.setFromSphericalCoords(sph.radius * fit, sph.phi, sph.theta).add(target);
    camera.lookAt(target);
    renderer.render(scene, camera);
  });

  return {
    backend,
    setStep: (index: number) => {
      current = THREE.MathUtils.clamp(index, 0, order.length - 1);
      applyStep();
    },
    dispose: () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      for (const item of disposables) item.dispose();
      renderer.dispose();
    },
  };
}
