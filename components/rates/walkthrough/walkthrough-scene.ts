import * as THREE from "three/webgpu";
import { SkyMesh } from "three/addons/objects/SkyMesh.js";

import { MODEL, WALKTHROUGH_STEPS } from "@/lib/rates/walkthrough";

/**
 * Procedural building site for the construction walkthrough, from survey to handover.
 * Uses three.js WebGPURenderer (automatic WebGL 2 fallback) with a physical sky, image-based
 * light and a shadow-casting sun, following the three.js webgpu building-generator example.
 * Units are metres: x along the 10 m length, z along the 8 m width (front of house at z = 0), y up.
 */

export type WalkthroughScene = {
  backend: "WebGPU" | "WebGL 2";
  setStep: (index: number) => void;
  dispose: () => void;
};

const C = {
  grass: 0x5d7d36,
  overgrown: 0x6d7740,
  earth: 0x7a6446,
  lawn: 0x5f9a3c,
  soil: 0x2a1d12,
  blinding: 0x8d9196,
  concrete: 0xbfbbb3,
  rebar: 0xe0a33a,
  hardcore: 0x7d7468,
  dpm: 0x3d78b5,
  timber: 0xb07a45,
  plaster: 0xb3aea4,
  paint: 0xf0e4c8,
  trim: 0xffffff,
  gold: 0xd9b26a,
  steel: 0x3b4148,
  glass: 0x9cc8e8,
  yellow: 0xf2b400,
  white: 0xf4f4f2,
};

const T = 0.23; // wall / column thickness
const SUB_TOP = 0.2; // top of foundation wall and ground slab
const GF_TOP = 3.2; // top of first-floor slab
const FF_TOP = 6.2; // top of ring beam
const BEAM = 0.45;
const PITCH = Math.PI / 6;
const PLOT = { x0: -4, x1: 14, z0: -8, z1: 12 };
const GATE = { x0: 6.2, x1: 9.8 };
const COLUMNS: [number, number][] = [[0, 0], [5, 0], [10, 0], [0, 8], [5, 8], [10, 8]];
const RUNS: [number, number, number, number][] = [[0, 0, 10, 0], [0, 8, 10, 8], [0, 0, 0, 8], [10, 0, 10, 8], [5, 0, 5, 8]];
const STAIR = { x0: 3.75, x1: 4.85, zTop: 3.4, zBottom: 7.6, steps: 17 };

// ---------- Canvas textures ----------
function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat = true) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!);
  const texture = new THREE.CanvasTexture(canvas);
  if (repeat) texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const speckle = (base: string, dots: string[], count: number) => (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < count; i += 1) {
    ctx.fillStyle = dots[i % dots.length];
    ctx.globalAlpha = 0.25 + ((i * 37) % 50) / 100;
    const s = 1 + ((i * 13) % 4);
    ctx.fillRect((i * 97) % 256, (i * 57 + Math.floor(i / 7) * 31) % 256, s, s);
  }
  ctx.globalAlpha = 1;
};

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
  renderer.toneMappingExposure = 0.42;
  renderer.shadowMap.enabled = true;

  const disposables: { dispose: () => void }[] = [];
  const scene = new THREE.Scene();
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20000);

  // ---------- Sky, image-based light and sun ----------
  const sky = new SkyMesh();
  sky.scale.setScalar(10000);
  sky.turbidity.value = 8;
  sky.rayleigh.value = 2.5;
  sky.mieCoefficient.value = 0.006;
  sky.mieDirectionalG.value = 0.86;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const sun = new THREE.DirectionalLight(0xfff0dc, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.05;
  sun.target.position.set(5, 0, 2);
  const shadowCam = sun.shadow.camera;
  shadowCam.left = shadowCam.bottom = -18;
  shadowCam.right = shadowCam.top = 18;
  shadowCam.near = 1;
  shadowCam.far = 100;
  scene.add(sun, sun.target);
  let envMap: THREE.Texture | null = null;
  const sunDir = new THREE.Vector3();
  const setSun = (elevation: number, azimuth: number, intensity: number, color: number) => {
    sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - elevation), THREE.MathUtils.degToRad(azimuth));
    sky.sunPosition.value.copy(sunDir);
    sky.showSunDisc.value = false;
    envScene.add(sky);
    const next = pmrem.fromScene(envScene).texture;
    envMap?.dispose();
    envMap = next;
    scene.environment = next;
    sky.showSunDisc.value = true;
    scene.add(sky);
    sun.intensity = intensity;
    sun.color.set(color);
    sun.position.copy(sunDir).multiplyScalar(45).add(sun.target.position);
  };
  setSun(38, 140, 5, 0xfff0dc);
  let dusk = false;

  // ---------- Textures ----------
  const tex = {
    block: canvasTexture(256, 128, (ctx) => {
      ctx.fillStyle = "#8f9398";
      ctx.fillRect(0, 0, 256, 128);
      ctx.fillStyle = "#a9adb2";
      for (let row = 0; row < 2; row += 1) {
        for (let col = -1; col < 3; col += 1) ctx.fillRect(col * 128 + (row % 2 ? 64 : 0) + 3, row * 64 + 3, 122, 58);
      }
    }),
    roof: canvasTexture(64, 8, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 64, 0);
      g.addColorStop(0, "#6e281f");
      g.addColorStop(0.5, "#b04c3c");
      g.addColorStop(1, "#6e281f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 8);
    }),
    hoarding: canvasTexture(64, 8, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 64, 0);
      g.addColorStop(0, "#1c4f8a");
      g.addColorStop(0.5, "#3f7fc4");
      g.addColorStop(1, "#1c4f8a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 8);
    }),
    grass: canvasTexture(256, 256, speckle("#5d7d36", ["#4c6a2b", "#6f9142", "#3f5a24"], 2600)),
    earth: canvasTexture(256, 256, speckle("#7a6446", ["#6a5539", "#8d7655", "#5b4831"], 2600)),
    paving: canvasTexture(128, 128, (ctx) => {
      ctx.fillStyle = "#6b6560";
      ctx.fillRect(0, 0, 128, 128);
      const colours = ["#9b8f86", "#8d5a48", "#a59a90", "#7f4d3e"];
      for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          ctx.fillStyle = colours[(row + col) % 4];
          ctx.fillRect(col * 32 + (row % 2 ? 16 : 0) - 16 + 2, row * 32 + 2, 28, 28);
          ctx.fillRect(col * 32 + (row % 2 ? 16 : 0) + 16 + 2 - 32, row * 32 + 2, 28, 28);
        }
      }
    }),
    tiles: canvasTexture(128, 128, (ctx) => {
      ctx.fillStyle = "#cfc6b8";
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = "#e9e2d6";
      ctx.fillRect(2, 2, 124, 124);
    }),
    wallTiles: canvasTexture(128, 64, (ctx) => {
      ctx.fillStyle = "#9fb3c0";
      ctx.fillRect(0, 0, 128, 64);
      ctx.fillStyle = "#d6e4ec";
      ctx.fillRect(2, 2, 124, 60);
    }),
    sign: canvasTexture(512, 256, (ctx) => {
      ctx.fillStyle = "#071a2e";
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = "#d9b26a";
      ctx.fillRect(0, 0, 512, 14);
      ctx.font = "bold 46px sans-serif";
      ctx.fillText("CHARISMAK", 28, 82);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("PROJECT NIGERIA LIMITED", 30, 116);
      ctx.font = "20px sans-serif";
      ctx.fillStyle = "#cfd8e2";
      ctx.fillText("PROPOSED 2-STOREY BUILDING", 30, 168);
      ctx.fillText("CONTRACTOR: CPNL · ABUJA", 30, 200);
    }, false),
  };
  Object.values(tex).forEach((t) => disposables.push(t));
  const textured = (base: THREE.CanvasTexture, rx: number, ry: number) => {
    const t = base.clone();
    t.needsUpdate = true;
    t.repeat.set(rx, ry);
    disposables.push(t);
    return t;
  };

  // ---------- Registry: what is visible at which stage ----------
  const order = WALKTHROUGH_STEPS.map((step) => step.id);
  const idx = (id: string) => {
    const i = order.indexOf(id);
    if (i < 0) throw new Error(`Unknown walkthrough step ${id}`);
    return i;
  };
  type Entry = {
    group: THREE.Group;
    from: number;
    until: number; // exclusive
    highlight: boolean;
    anim: "y" | "xyz" | "none";
    materials: THREE.MeshStandardMaterial[];
    xray: THREE.Group | null; // shown only while this entry's stage is current (rebar etc.)
    start: number; // animation start time, -1 = idle
  };
  const entries: Entry[] = [];
  const glassMaterials: THREE.MeshStandardMaterial[] = [];
  const lampMaterials: THREE.MeshStandardMaterial[] = [];
  const wallTileMaterials: THREE.MeshStandardMaterial[] = [];
  let collecting: THREE.MeshStandardMaterial[] = [];

  const material = (color: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02, ...extra });
    collecting.push(m);
    disposables.push(m);
    return m;
  };
  const geometries = new Map<string, THREE.BufferGeometry>();
  const boxGeometry = (w: number, h: number, d: number) => {
    const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
    let g = geometries.get(key);
    if (!g) {
      g = new THREE.BoxGeometry(w, h, d);
      geometries.set(key, g);
      disposables.push(g);
    }
    return g;
  };
  const box = (parent: THREE.Object3D, mat: THREE.Material, w: number, h: number, d: number, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(boxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (parent: THREE.Object3D, mat: THREE.Material, rTop: number, rBottom: number, h: number, x: number, y: number, z: number, segments = 12) => {
    const g = new THREE.CylinderGeometry(rTop, rBottom, h, segments);
    disposables.push(g);
    const mesh = new THREE.Mesh(g, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const lines = (parent: THREE.Object3D, points: number[], color = C.rebar) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    const m = new THREE.LineBasicMaterial({ color });
    disposables.push(g, m);
    const segments = new THREE.LineSegments(g, m);
    parent.add(segments);
    return segments;
  };
  const runBox = (parent: THREE.Object3D, mat: THREE.Material, run: [number, number, number, number], width: number, y0: number, y1: number, extend = 0) => {
    const [x1, z1, x2, z2] = run;
    const alongX = z1 === z2;
    const length = Math.hypot(x2 - x1, z2 - z1) + extend * 2;
    return box(parent, mat, alongX ? length : width, y1 - y0, alongX ? width : length, (x1 + x2) / 2, (y0 + y1) / 2, (z1 + z2) / 2);
  };

  /** Builds an element group that appears at stage `from` (and is removed at `until`). */
  const add = (
    from: string,
    build: (group: THREE.Group, xray: () => THREE.Group) => void,
    opts: { until?: string; highlight?: boolean; anim?: "y" | "xyz" | "none" } = {},
  ) => {
    const group = new THREE.Group();
    const entry: Entry = {
      group,
      from: idx(from),
      until: opts.until ? idx(opts.until) : order.length,
      highlight: opts.highlight ?? true,
      anim: opts.anim ?? "y",
      materials: [],
      xray: null,
      start: -1,
    };
    collecting = entry.materials;
    build(group, () => {
      if (!entry.xray) {
        entry.xray = new THREE.Group();
        group.add(entry.xray);
      }
      return entry.xray;
    });
    collecting = [];
    // Pivot the group at its lowest point so it can "grow" up from its base.
    const bounds = new THREE.Box3().setFromObject(group);
    if (Number.isFinite(bounds.min.y)) {
      const base = bounds.min.y;
      for (const child of group.children) child.position.y -= base;
      group.position.y = base;
    }
    scene.add(group);
    entries.push(entry);
    return entry;
  };

  // ---------- Ground ----------
  {
    const shape = new THREE.Shape([new THREE.Vector2(-60, -60), new THREE.Vector2(70, -60), new THREE.Vector2(70, 70), new THREE.Vector2(-60, 70)]);
    shape.holes.push(new THREE.Path([new THREE.Vector2(PLOT.x0, PLOT.z0), new THREE.Vector2(PLOT.x0, PLOT.z1), new THREE.Vector2(PLOT.x1, PLOT.z1), new THREE.Vector2(PLOT.x1, PLOT.z0)]));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(Math.PI / 2);
    disposables.push(g);
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, map: textured(tex.grass, 30, 30), roughness: 1, side: THREE.DoubleSide });
    disposables.push(m);
    const mesh = new THREE.Mesh(g, m);
    mesh.position.y = -0.01;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // Plot ground with the trench footprint left open; its surface changes with the stages.
  const half = MODEL.trenchWidth / 2;
  const plotEarth = textured(tex.earth, 6, 6);
  const plotGrass = textured(tex.grass, 6, 6);
  const plotMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: plotEarth, roughness: 1, side: THREE.DoubleSide });
  disposables.push(plotMat);
  {
    const shape = new THREE.Shape([new THREE.Vector2(PLOT.x0, PLOT.z0), new THREE.Vector2(PLOT.x1, PLOT.z0), new THREE.Vector2(PLOT.x1, PLOT.z1), new THREE.Vector2(PLOT.x0, PLOT.z1)]);
    shape.holes.push(new THREE.Path([new THREE.Vector2(-half, -half), new THREE.Vector2(-half, 8 + half), new THREE.Vector2(10 + half, 8 + half), new THREE.Vector2(10 + half, -half)]));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(Math.PI / 2);
    disposables.push(g);
    const mesh = new THREE.Mesh(g, plotMat);
    mesh.receiveShadow = true;
    scene.add(mesh);
    for (const [x0, x1] of [[half, 5 - half], [5 + half, 10 - half]]) {
      const cell = box(scene, plotMat, x1 - x0, 0.02, 8 - 2 * half, (x0 + x1) / 2, -0.01, 4);
      cell.castShadow = false;
    }
  }
  // Ground over the trench lines: present before digging and again after backfilling.
  const trenchCover = new THREE.Group();
  scene.add(trenchCover);
  for (const run of RUNS) runBox(trenchCover, plotMat, run, MODEL.trenchWidth, -0.02, 0, half).castShadow = false;

  // ---------- Pre-construction ----------
  add("survey", (g) => {
    const leaf = material(0x4f6b2a, { roughness: 1 });
    const ico = new THREE.IcosahedronGeometry(0.6, 0);
    disposables.push(ico);
    for (let i = 0; i < 70; i += 1) {
      const x = PLOT.x0 + 0.8 + ((i * 7.31) % (PLOT.x1 - PLOT.x0 - 1.6));
      const z = PLOT.z0 + 0.8 + ((i * 5.17) % (PLOT.z1 - PLOT.z0 - 1.6));
      const s = 0.45 + ((i * 3) % 7) / 10;
      const bush = new THREE.Mesh(ico, leaf);
      bush.position.set(x, s * 0.35, z);
      bush.scale.set(s, s * 0.7, s);
      bush.castShadow = true;
      g.add(bush);
    }
  }, { until: "mobilisation", highlight: false, anim: "none" });

  // Plot beacons (survey pillars)
  add("survey", (g) => {
    const m = material(0xd8d2c4);
    const red = material(0xb8322a);
    for (const [x, z] of [[PLOT.x0, PLOT.z0], [PLOT.x1, PLOT.z0], [PLOT.x1, PLOT.z1], [PLOT.x0, PLOT.z1]]) {
      box(g, m, 0.25, 0.5, 0.25, x, 0.25, z);
      box(g, red, 0.26, 0.08, 0.26, x, 0.46, z);
    }
  }, { until: "external-works", anim: "xyz" });

  // Surveyor's tripod and staff
  const tripod = (g: THREE.Group, x: number, z: number) => {
    const wood = material(0xc89a52);
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * Math.PI * 2;
      const leg = cylinder(g, wood, 0.02, 0.025, 1.5, x + Math.cos(a) * 0.3, 0.7, z + Math.sin(a) * 0.3, 6);
      leg.rotation.set(Math.sin(a) * 0.38, 0, -Math.cos(a) * 0.38);
    }
    box(g, material(C.yellow), 0.22, 0.18, 0.3, x, 1.48, z);
  };
  add("survey", (g) => tripod(g, -1.5, -4), { until: "excavation", highlight: false, anim: "xyz" });

  add("mobilisation", (g) => {
    // Hoarding round the plot with a gate gap.
    const sheet = material(0xffffff, { map: textured(tex.hoarding, 40, 1), metalness: 0.3, roughness: 0.5 });
    const post = material(C.steel);
    const h = 2.2;
    const sides: [number, number, number, number][] = [
      [PLOT.x0, PLOT.z0, GATE.x0, PLOT.z0], [GATE.x1, PLOT.z0, PLOT.x1, PLOT.z0],
      [PLOT.x0, PLOT.z1, PLOT.x1, PLOT.z1], [PLOT.x0, PLOT.z0, PLOT.x0, PLOT.z1], [PLOT.x1, PLOT.z0, PLOT.x1, PLOT.z1],
    ];
    for (const [x1, z1, x2, z2] of sides) {
      const alongX = z1 === z2;
      const len = Math.hypot(x2 - x1, z2 - z1);
      const panel = box(g, sheet, alongX ? len : 0.04, h, alongX ? 0.04 : len, (x1 + x2) / 2, h / 2, (z1 + z2) / 2);
      panel.castShadow = true;
      for (let t = 0; t <= len; t += 2.4) box(g, post, 0.06, h + 0.1, 0.06, alongX ? x1 + t : x1, (h + 0.1) / 2, alongX ? z1 : z1 + t);
    }
    // Container site office
    const cont = material(0x2f6f4e, { roughness: 0.6, metalness: 0.3 });
    box(g, cont, 6, 2.6, 2.4, -0.6, 1.3, 10.4);
    box(g, material(0xe8e4dc), 0.9, 2.0, 0.05, 0.6, 1.0, 9.18);
    box(g, material(C.glass, { roughness: 0.1, metalness: 0.3 }), 1.2, 0.8, 0.05, -2.2, 1.6, 9.18);
    // Water tank on stand
    const tankMat = material(0x1e2328, { roughness: 0.5 });
    for (const [dx, dz] of [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]]) box(g, post, 0.08, 2, 0.08, 12.4 + dx, 1, 10 + dz);
    cylinder(g, tankMat, 0.75, 0.75, 1.5, 12.4, 2.75, 10, 20);
    // Project signboard
    const sign = new THREE.MeshStandardMaterial({ map: tex.sign, roughness: 0.6 });
    collecting.push(sign);
    disposables.push(sign);
    box(g, post, 0.08, 3, 0.08, 1.2, 1.5, -7.6);
    box(g, post, 0.08, 3, 0.08, 3.8, 1.5, -7.6);
    box(g, sign, 2.8, 1.4, 0.05, 2.5, 2.4, -7.65);
  }, { until: "external-works", anim: "xyz" });

  add("setting-out", (g) => {
    const wood = material(C.timber);
    const pts: number[] = [];
    const o = 1.5;
    for (const [cx, cz, sx, sz] of [[0, 0, -1, -1], [10, 0, 1, -1], [10, 8, 1, 1], [0, 8, -1, 1]]) {
      // two boards per corner on pegs
      box(g, wood, 1.2, 0.15, 0.03, cx, 0.6, cz + sz * o);
      box(g, wood, 0.03, 0.15, 1.2, cx + sx * o, 0.6, cz);
      for (const d of [-0.5, 0.5]) {
        box(g, wood, 0.05, 0.75, 0.05, cx + d, 0.37, cz + sz * o);
        box(g, wood, 0.05, 0.75, 0.05, cx + sx * o, 0.37, cz + d);
      }
    }
    for (const z of [0, 8]) pts.push(-o, 0.66, z, 10 + o, 0.66, z);
    for (const x of [0, 5, 10]) pts.push(x, 0.66, -o, x, 0.66, 8 + o);
    lines(g, pts, 0xffffff);
  }, { until: "blinding", anim: "xyz" });

  // ---------- Substructure ----------
  add("excavation", (g) => {
    const soil = material(C.soil, { side: THREE.BackSide, roughness: 1 });
    for (const run of RUNS) runBox(g, soil, run, MODEL.trenchWidth, -MODEL.trenchDepth, 0, half);
    // spoil heaps
    const heap = material(0x6a4f33, { roughness: 1 });
    for (const [x, z, s] of [[-2.2, 3, 1.3], [12.3, 5, 1.1], [7, 10.3, 1.2]]) {
      const cone = cylinder(g, heap, 0.05, s * 1.4, s, x, s / 2, z, 14);
      cone.scale.z = 0.7;
    }
  }, { until: "substructure-walls", anim: "none" });

  // Excavator (animated)
  let excavatorBoom: THREE.Group | null = null;
  let excavatorCab: THREE.Group | null = null;
  add("excavation", (g) => {
    const body = material(C.yellow, { roughness: 0.5, metalness: 0.2 });
    const dark = material(0x222222, { roughness: 0.7 });
    const glass = material(0x223344, { roughness: 0.1, metalness: 0.5 });
    const base = new THREE.Group();
    base.position.set(-1.8, 0, -3.2);
    g.add(base);
    box(base, dark, 2.6, 0.6, 0.55, 0, 0.3, -0.85);
    box(base, dark, 2.6, 0.6, 0.55, 0, 0.3, 0.85);
    const cab = new THREE.Group();
    cab.position.y = 0.6;
    base.add(cab);
    box(cab, body, 2.2, 0.8, 2.0, -0.2, 0.45, 0);
    box(cab, body, 0.9, 1.0, 0.9, 0.4, 1.35, 0.45);
    box(cab, glass, 0.92, 0.6, 0.6, 0.4, 1.45, 0.5);
    const boom = new THREE.Group();
    boom.position.set(0.9, 0.8, -0.3);
    cab.add(boom);
    const arm = box(boom, body, 2.6, 0.3, 0.3, 1.2, 0.5, 0);
    arm.rotation.z = 0.45;
    const stick = box(boom, body, 0.25, 1.8, 0.25, 2.5, 0.3, 0);
    stick.rotation.z = -0.25;
    box(boom, dark, 0.6, 0.45, 0.6, 2.75, -0.55, 0);
    cab.rotation.y = 0.9;
    excavatorBoom = boom;
    excavatorCab = cab;
  }, { until: "blinding", highlight: false, anim: "xyz" });

  add("blinding", (g) => {
    const m = material(C.blinding);
    for (const run of RUNS) runBox(g, m, run, MODEL.trenchWidth - 0.01, -0.9, -0.85, half - 0.005);
  });

  add("footing", (g) => {
    const m = material(C.concrete);
    for (const run of RUNS) runBox(g, m, run, MODEL.trenchWidth - 0.02, -0.85, -0.625, half - 0.01);
  });

  // Concrete mixer (animated drum)
  let mixerDrum: THREE.Mesh | null = null;
  add("footing", (g) => {
    const frame = material(0xd04a1d, { metalness: 0.3, roughness: 0.5 });
    const drumMat = material(0xe0e0e0, { metalness: 0.4, roughness: 0.4 });
    const dark = material(0x222222);
    box(g, frame, 1.6, 0.15, 0.8, 12, 0.6, 2);
    cylinder(g, dark, 0.3, 0.3, 0.12, 11.4, 0.3, 1.55).rotation.x = Math.PI / 2;
    cylinder(g, dark, 0.3, 0.3, 0.12, 11.4, 0.3, 2.45).rotation.x = Math.PI / 2;
    box(g, frame, 0.15, 0.9, 0.15, 12.4, 1.05, 2);
    const drum = cylinder(g, drumMat, 0.35, 0.55, 1.0, 12.2, 1.35, 2, 16);
    drum.rotation.z = 0.9;
    mixerDrum = drum;
  }, { until: "roof-carcass", highlight: false, anim: "xyz" });

  add("substructure-walls", (g) => {
    for (const run of RUNS) {
      const length = Math.hypot(run[2] - run[0], run[3] - run[1]) + T;
      runBox(g, material(0xffffff, { map: textured(tex.block, length / 0.9, 0.825 / 0.45) }), run, T, -0.625, SUB_TOP, T / 2);
    }
  });

  // Materials on site: block stack, sand and granite heaps
  add("substructure-walls", (g) => {
    const blockMat = material(0xa3a7ab, { roughness: 0.9 });
    for (let i = 0; i < 4; i += 1) for (let j = 0; j < 2; j += 1) for (let k = 0; k < 5; k += 1) box(g, blockMat, 0.45, 0.225, 0.23, 11.2 + i * 0.47, 0.11 + k * 0.23, 6.4 + j * 0.25);
    for (let i = 0; i < 4; i += 1) for (let j = 0; j < 2; j += 1) for (let k = 0; k < 4; k += 1) box(g, blockMat, 0.45, 0.225, 0.23, 11.2 + i * 0.47, 0.11 + k * 0.23, 7.3 + j * 0.25);
    cylinder(g, material(0xd9b77a, { roughness: 1 }), 0.05, 1.3, 0.9, -2.4, 0.45, 6.5, 16);
    cylinder(g, material(0x8a8a8a, { roughness: 1 }), 0.05, 1.1, 0.8, -2.4, 0.4, 3.6, 12);
  }, { until: "external-works", highlight: false, anim: "xyz" });

  add("ground-slab", (g, xray) => {
    const inner: [number, number][] = [[T / 2, 5 - T / 2], [5 + T / 2, 10 - T / 2]];
    const hardcore = material(C.hardcore, { roughness: 1 });
    const dpm = material(C.dpm, { roughness: 0.4 });
    const slab = material(C.concrete, { transparent: true, opacity: 1 });
    for (const [x0, x1] of inner) {
      box(g, hardcore, x1 - x0, 0.2, 8 - T, (x0 + x1) / 2, -0.1, 4);
      box(g, dpm, x1 - x0, 0.01, 8 - T, (x0 + x1) / 2, 0.005, 4);
      box(g, slab, x1 - x0, 0.15, 8 - T, (x0 + x1) / 2, 0.125, 4);
    }
    const pts: number[] = [];
    for (const [x0, x1] of inner) {
      for (let x = x0; x <= x1; x += 0.2) pts.push(x, 0.09, T / 2, x, 0.09, 8 - T / 2);
      for (let z = T / 2; z <= 8 - T / 2; z += 0.2) pts.push(x0, 0.09, z, x1, 0.09, z);
    }
    lines(xray(), pts);
  });

  // ---------- Frame ----------
  const frameMaterials: THREE.MeshStandardMaterial[] = [];
  const wallMeshes: { mesh: THREE.Mesh; block: THREE.MeshStandardMaterial }[] = [];
  type Opening = { alongX: boolean; x: number; z: number; w: number; y0: number; y1: number; door: boolean; thickness: number };
  const openings: Opening[] = [];

  const addColumns = (g: THREE.Group, xray: () => THREE.Group, y0: number, y1: number) => {
    const m = material(C.concrete, { transparent: true, opacity: 1 });
    frameMaterials.push(m);
    const pts: number[] = [];
    for (const [x, z] of COLUMNS) {
      box(g, m, T, y1 - y0, T, x, (y0 + y1) / 2, z);
      const o = 0.07;
      for (const [dx, dz] of [[-o, -o], [o, -o], [o, o], [-o, o]]) pts.push(x + dx, y0, z + dz, x + dx, y1 + 0.3, z + dz);
      for (let y = y0 + 0.1; y < y1; y += 0.25) {
        pts.push(x - o, y, z - o, x + o, y, z - o, x + o, y, z - o, x + o, y, z + o, x + o, y, z + o, x - o, y, z + o, x - o, y, z + o, x - o, y, z - o);
      }
    }
    lines(xray(), pts);
  };

  /** Blockwork between columns with openings; records the openings for windows and doors. */
  const addWalls = (g: THREE.Group, y0: number, y1: number, ground: boolean) => {
    type Seg = { x1: number; z1: number; x2: number; z2: number; opening: "window" | "door" | null; at?: number; w?: number; thickness?: number; from?: number; to?: number };
    const segs: Seg[] = [
      { x1: 0, z1: 0, x2: 5, z2: 0, opening: "window" },
      { x1: 5, z1: 0, x2: 10, z2: 0, opening: ground ? "door" : "window" },
      { x1: 0, z1: 8, x2: 5, z2: 8, opening: "window" },
      { x1: 5, z1: 8, x2: 10, z2: 8, opening: "window" },
      { x1: 0, z1: 0, x2: 0, z2: 8, opening: "window" },
      { x1: 10, z1: 0, x2: 10, z2: 8, opening: null },
      { x1: 5, z1: 0, x2: 5, z2: 8, opening: "door", at: 2.0, w: 0.9 },
      // Toilet partitions (150 mm) in the back-left corner
      { x1: 0, z1: 6, x2: 1.7, z2: 6, opening: "door", at: 0.85, w: 0.7, thickness: 0.15, from: T / 2, to: 1.775 },
      { x1: 1.7, z1: 6, x2: 1.7, z2: 8, opening: null, thickness: 0.15, from: 6.075, to: 8 - T / 2 },
    ];
    for (const seg of segs) {
      const alongX = seg.z1 === seg.z2;
      const thickness = seg.thickness ?? T;
      const start = seg.from ?? (alongX ? Math.min(seg.x1, seg.x2) : Math.min(seg.z1, seg.z2)) + T / 2;
      const end = seg.to ?? (alongX ? Math.max(seg.x1, seg.x2) : Math.max(seg.z1, seg.z2)) - T / 2;
      const pieces: [number, number, number, number][] = [];
      if (seg.opening) {
        const w = seg.w ?? (seg.opening === "door" ? 1.2 : 1.2);
        const centre = seg.at !== undefined ? start + seg.at : (start + end) / 2;
        const a = centre - w / 2;
        const b = centre + w / 2;
        const sill = seg.opening === "door" ? y0 : y0 + 0.9;
        const head = y0 + 2.1;
        pieces.push([start, a, y0, y1], [b, end, y0, y1], [a, b, head, y1]);
        if (sill > y0) pieces.push([a, b, y0, sill]);
        openings.push({ alongX, x: alongX ? centre : seg.x1, z: alongX ? seg.z1 : centre, w, y0: sill, y1: head, door: seg.opening === "door", thickness });
      } else {
        pieces.push([start, end, y0, y1]);
      }
      for (const [p0, p1, bottom, top] of pieces) {
        const len = p1 - p0;
        const block = material(0xffffff, { map: textured(tex.block, len / 0.9, (top - bottom) / 0.45), transparent: true, opacity: 1 });
        const mid = (p0 + p1) / 2;
        const mesh = box(g, block, alongX ? len : thickness, top - bottom, alongX ? thickness : len, alongX ? mid : seg.x1, (bottom + top) / 2, alongX ? seg.z1 : mid);
        wallMeshes.push({ mesh, block });
      }
    }
  };

  const addBeams = (g: THREE.Group, xray: () => THREE.Group, top: number) => {
    const m = material(C.concrete, { transparent: true, opacity: 1 });
    frameMaterials.push(m);
    const pts: number[] = [];
    for (const run of RUNS) {
      runBox(g, m, run, T, top - BEAM, top, T / 2);
      const [x1, z1, x2, z2] = run;
      const alongX = z1 === z2;
      for (const dy of [top - BEAM + 0.05, top - 0.05]) {
        for (const off of [-0.07, 0.07]) pts.push(x1 + (alongX ? 0 : off), dy, z1 + (alongX ? off : 0), x2 + (alongX ? 0 : off), dy, z2 + (alongX ? off : 0));
      }
    }
    lines(xray(), pts);
  };

  add("gf-columns", (g, xray) => addColumns(g, xray, SUB_TOP, GF_TOP - BEAM));
  add("gf-walls", (g) => addWalls(g, SUB_TOP, GF_TOP - BEAM, true));

  // Scaffolding: ground lift from the ground floor walls, upper lifts from the first floor.
  const scaffold = (g: THREE.Group, y0: number, y1: number) => {
    const tube = material(0x9aa3ab, { metalness: 0.6, roughness: 0.35 });
    const board = material(0xb98d55);
    const o = 1.0;
    const ring: [number, number][] = [];
    for (let x = -o; x <= 10 + o + 0.01; x += 2.0) ring.push([x, -o], [x, 8 + o]);
    for (let z = -o + 2; z < 8 + o - 0.5; z += 2.0) ring.push([-o, z], [10 + o, z]);
    for (const [x, z] of ring) box(g, tube, 0.05, y1 - y0, 0.05, x, (y0 + y1) / 2, z);
    for (let y = y0 + 1.8; y <= y1 + 0.01; y += 1.8) {
      box(g, tube, 12 + 2 * o - 2, 0.05, 0.05, 5, y, -o);
      box(g, tube, 12 + 2 * o - 2, 0.05, 0.05, 5, y, 8 + o);
      box(g, tube, 0.05, 0.05, 8 + 2 * o, -o, y, 4);
      box(g, tube, 0.05, 0.05, 8 + 2 * o, 10 + o, y, 4);
      box(g, board, 12, 0.04, 0.5, 5, y - 0.05, -o + 0.3);
    }
  };
  add("gf-walls", (g) => scaffold(g, 0, GF_TOP), { until: "external-works", highlight: false, anim: "y" });

  add("ff-slab", (g, xray) => {
    addBeams(g, xray, GF_TOP);
    const m = material(C.concrete, { transparent: true, opacity: 1 });
    frameMaterials.push(m);
    // Slab with an opening over the staircase
    const y = GF_TOP - 0.075;
    const sx0 = STAIR.x0;
    const sx1 = STAIR.x1 + 0.05;
    const oz0 = STAIR.zTop;
    const oz1 = 6.6; // long enough for ~2 m headroom over the flight
    box(g, m, sx0 + T / 2, 0.15, 8 + T, sx0 / 2 - T / 4, y, 4);
    box(g, m, 10 + T / 2 - sx1, 0.15, 8 + T, (sx1 + 10 + T / 2) / 2, y, 4);
    box(g, m, sx1 - sx0, 0.15, oz0 + T / 2, (sx0 + sx1) / 2, y, (oz0 - T / 2) / 2);
    box(g, m, sx1 - sx0, 0.15, 8 + T / 2 - oz1, (sx0 + sx1) / 2, y, (oz1 + 8 + T / 2) / 2);
    const pts: number[] = [];
    for (let x = 0; x <= 10; x += 0.3) pts.push(x, GF_TOP - 0.11, 0, x, GF_TOP - 0.11, 8);
    for (let z = 0; z <= 8; z += 0.3) pts.push(0, GF_TOP - 0.11, z, 10, GF_TOP - 0.11, z);
    lines(xray(), pts);
    // Staircase: straight flight rising from the back towards the front
    const stairMat = material(C.concrete, { transparent: true, opacity: 1 });
    frameMaterials.push(stairMat);
    const rise = (GF_TOP - SUB_TOP) / STAIR.steps;
    const going = (STAIR.zBottom - STAIR.zTop) / STAIR.steps;
    for (let i = 0; i < STAIR.steps; i += 1) {
      const h = rise * (i + 1);
      box(g, stairMat, STAIR.x1 - STAIR.x0, h, going, (STAIR.x0 + STAIR.x1) / 2, SUB_TOP + h / 2, STAIR.zBottom - going * (i + 0.5));
    }
  });

  // Props and soffit formwork while the slab cures
  add("ff-slab", (g) => {
    const prop = material(0xc8501e, { metalness: 0.4, roughness: 0.4 });
    const ply = material(0x9a6b3c);
    for (let x = 0.7; x < 10; x += 1.2) for (let z = 0.7; z < 8; z += 1.2) {
      if (x > STAIR.x0 - 0.2 && x < STAIR.x1 + 0.2 && z > STAIR.zTop && z < STAIR.zBottom) continue;
      cylinder(g, prop, 0.03, 0.03, GF_TOP - 0.16 - SUB_TOP, x, SUB_TOP + (GF_TOP - 0.16 - SUB_TOP) / 2, z, 6);
    }
    box(g, ply, 10 - T, 0.02, 8 - T, 5, GF_TOP - 0.16, 4);
  }, { until: "first-floor", highlight: false, anim: "none" });

  add("first-floor", (g, xray) => {
    addColumns(g, xray, GF_TOP, FF_TOP - BEAM);
    addWalls(g, GF_TOP, FF_TOP - BEAM, false);
    addBeams(g, xray, FF_TOP);
  });
  add("first-floor", (g) => scaffold(g, GF_TOP, FF_TOP + 0.2), { until: "external-works", highlight: false, anim: "y" });

  // Rebar bundle on site during the frame stages
  add("gf-columns", (g) => {
    const steel = material(0x8b4a2b, { metalness: 0.5, roughness: 0.6 });
    for (let i = 0; i < 12; i += 1) {
      const bar = cylinder(g, steel, 0.012, 0.012, 6, -2.4 + (i % 4) * 0.05, 0.1 + Math.floor(i / 4) * 0.05, 9.5, 5);
      bar.rotation.z = Math.PI / 2;
      bar.position.x = 7;
      bar.position.z = 10.3 + (i % 4) * 0.05;
    }
  }, { until: "roof-carcass", highlight: false, anim: "xyz" });

  // ---------- Roof ----------
  const over = 0.6;
  const ridgeZ = 4;
  const riseK = Math.tan(PITCH);
  const eaveY = FF_TOP - over * riseK;
  const ridgeY = FF_TOP + ridgeZ * riseK;
  const rafterLen = (ridgeZ + over) / Math.cos(PITCH);

  add("roof-carcass", (g) => {
    // Gable walls
    for (const x of [0, 10]) {
      const shape = new THREE.Shape([new THREE.Vector2(-T / 2, FF_TOP), new THREE.Vector2(8 + T / 2, FF_TOP), new THREE.Vector2(4, FF_TOP + (4 + T / 2) * riseK)]);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
      geo.rotateY(-Math.PI / 2);
      disposables.push(geo);
      const m = material(0xffffff, { map: textured(tex.block, 1 / 0.9, 1 / 0.45), transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geo, m);
      mesh.position.set(x + T / 2, 0, 0);
      mesh.castShadow = mesh.receiveShadow = true;
      g.add(mesh);
      wallMeshes.push({ mesh, block: m });
    }
    const timber = material(C.timber, { roughness: 0.7 });
    box(g, timber, 10 + T, 0.15, 0.05, 5, FF_TOP + 0.075, 0);
    box(g, timber, 10 + T, 0.15, 0.05, 5, FF_TOP + 0.075, 8);
    for (const side of [1, -1]) {
      const eaveZ = side === 1 ? -over : 8 + over;
      const midZ = (eaveZ + ridgeZ) / 2;
      const midY = (eaveY + ridgeY) / 2;
      const tilt = side === 1 ? -PITCH : PITCH;
      for (let x = -over; x <= 10 + over + 0.01; x += 0.6) box(g, timber, 0.05, 0.1, rafterLen, x, midY, midZ).rotation.x = tilt;
      for (let i = 0; i < 6; i += 1) {
        const t = (i + 0.5) / 6;
        box(g, timber, 10 + 2 * over, 0.075, 0.05, 5, eaveY + (ridgeY - eaveY) * t + 0.09, eaveZ + (ridgeZ - eaveZ) * t).rotation.x = tilt;
      }
    }
  });

  add("roof-covering", (g) => {
    const sheets = material(0xffffff, { map: textured(tex.roof, (10 + 2 * over) / 0.19, 1), metalness: 0.45, roughness: 0.45, side: THREE.DoubleSide });
    const fascia = material(C.white, { roughness: 0.5 });
    const ridge = material(0x7a2c22, { metalness: 0.4, roughness: 0.45 });
    for (const side of [1, -1]) {
      const eaveZ = side === 1 ? -over : 8 + over;
      const tilt = side === 1 ? -PITCH : PITCH;
      box(g, sheets, 10 + 2 * over + 0.1, 0.03, rafterLen + 0.05, 5, (eaveY + ridgeY) / 2 + 0.17, (eaveZ + ridgeZ) / 2).rotation.x = tilt;
      box(g, fascia, 10 + 2 * over + 0.12, 0.3, 0.03, 5, eaveY + 0.02, eaveZ + side * -0.02);
      for (const x of [-over - 0.06, 10 + over + 0.06]) {
        box(g, fascia, 0.03, 0.3, rafterLen, x, (eaveY + ridgeY) / 2 + 0.05, (eaveZ + ridgeZ) / 2).rotation.x = tilt;
      }
    }
    box(g, ridge, 10 + 2 * over + 0.12, 0.08, 0.6, 5, ridgeY + 0.22, ridgeZ);
  });

  // ---------- Services & finishes ----------
  add("mep-first-fix", (g) => {
    const conduit: number[] = [];
    const pipe: number[] = [];
    const rooms: [number, number, number][] = [[2.5, 4, SUB_TOP], [7.5, 4, SUB_TOP], [2.5, 4, GF_TOP], [7.5, 4, GF_TOP]];
    for (const [cx, cz, floor] of rooms) {
      const ceiling = floor + 2.55;
      // light point, switch drop and sockets
      conduit.push(cx, ceiling, cz, cx, ceiling, 0.2);
      conduit.push(cx - 1.8, ceiling, 0.15, cx + 1.8, ceiling, 0.15);
      conduit.push(cx + 1.8, ceiling, 0.15, cx + 1.8, floor + 1.2, 0.15);
      for (const sx of [cx - 1.5, cx + 0.5]) conduit.push(sx, ceiling, 7.85, sx, floor + 0.3, 7.85);
      conduit.push(cx - 1.5, ceiling, 7.85, cx + 0.5, ceiling, 7.85, cx, ceiling, cz, cx, ceiling, 7.85);
    }
    // Plumbing: supply and waste to both toilets and the kitchen
    for (const floor of [SUB_TOP, GF_TOP]) {
      pipe.push(0.3, floor + 0.05, 7.7, 1.4, floor + 0.05, 7.7, 0.3, floor + 0.05, 7.7, 0.3, floor + 1.9, 7.7, 1.4, floor + 0.05, 7.7, 1.4, floor + 0.8, 7.85);
    }
    pipe.push(0.25, SUB_TOP, 7.75, 0.25, GF_TOP + 2.4, 7.75); // soil stack
    pipe.push(7.5, SUB_TOP + 0.05, 7.8, 1.4, SUB_TOP + 0.05, 7.8, 7.5, SUB_TOP + 0.05, 7.8, 7.5, SUB_TOP + 0.6, 7.85);
    lines(g, conduit, 0xff7a1a);
    lines(g, pipe, 0x3aa0ff);
    const boxes = material(0xff7a1a);
    for (const [cx, , floor] of rooms) {
      box(g, boxes, 0.08, 0.08, 0.04, cx + 1.8, floor + 1.2, 0.17);
      box(g, boxes, 0.08, 0.08, 0.04, cx - 1.5, floor + 0.3, 7.83);
    }
    box(g, material(0x6b7280), 0.4, 0.5, 0.12, 6.2, SUB_TOP + 1.6, 0.18); // distribution board
  }, { until: "plaster", anim: "none" });

  add("windows-doors", (g) => {
    const frame = material(0x2b2f33, { metalness: 0.6, roughness: 0.35 });
    const glass = material(C.glass, { metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.45 });
    glassMaterials.push(glass);
    const wood = material(0x6b3f22, { roughness: 0.55 });
    for (const o of openings) {
      const h = o.y1 - o.y0;
      const cy = (o.y0 + o.y1) / 2;
      // a member of length `len` along the wall, `height` tall, offset `off` along the wall from the opening centre
      const member = (mat: THREE.Material, len: number, height: number, depth: number, off: number, y: number) =>
        box(g, mat, o.alongX ? len : depth, height, o.alongX ? depth : len, o.alongX ? o.x + off : o.x, y, o.alongX ? o.z : o.z + off);
      member(frame, o.w, 0.05, 0.07, 0, o.y1 - 0.025);
      member(frame, 0.05, h, 0.07, -(o.w / 2 - 0.025), cy);
      member(frame, 0.05, h, 0.07, o.w / 2 - 0.025, cy);
      if (o.door) {
        member(wood, o.w - 0.1, h - 0.06, 0.045, 0, cy - 0.02);
      } else {
        member(frame, o.w, 0.05, 0.07, 0, o.y0 + 0.025);
        member(frame, 0.04, h, 0.07, 0, cy);
        member(glass, o.w - 0.1, h - 0.1, 0.012, 0, cy);
      }
    }
  });

  add("ceilings", (g) => {
    const pop = material(0xfbfaf6, { roughness: 0.9 });
    for (const y of [GF_TOP - 0.35, FF_TOP - BEAM - 0.05]) {
      box(g, pop, 5 - T, 0.04, 8 - T, 2.5, y, 4).castShadow = false;
      box(g, pop, 5 - T, 0.04, 8 - T, 7.5, y, 4).castShadow = false;
    }
  });

  add("tiling", (g) => {
    const floorTiles = material(0xffffff, { map: textured(tex.tiles, (10 - T) / 0.6, (8 - T) / 0.6), roughness: 0.35 });
    for (const y of [SUB_TOP + 0.02, GF_TOP + 0.02]) box(g, floorTiles, 10 - T, 0.02, 8 - T, 5, y, 4).castShadow = false;
    const wallTiles = material(0xffffff, { map: textured(tex.wallTiles, 3, 8), roughness: 0.3, transparent: true, opacity: 1 });
    wallTileMaterials.push(wallTiles);
    for (const floor of [SUB_TOP, GF_TOP]) {
      const y = floor + 1.2;
      box(g, wallTiles, 0.01, 2.4, 1.8, T / 2 + 0.01, y, 6.95);
      box(g, wallTiles, 1.55, 2.4, 0.01, 0.9, y, 8 - T / 2 - 0.01);
      box(g, wallTiles, 0.01, 2.4, 1.8, 1.7 - 0.085, y, 6.95);
      box(g, wallTiles, 0.38, 2.4, 0.01, 0.31, y, 6.085);
    }
  });

  add("second-fix", (g) => {
    const white = material(0xffffff, { roughness: 0.25 });
    const chrome = material(0xd0d4d8, { metalness: 0.9, roughness: 0.2 });
    const counter = material(0x3a3f45, { roughness: 0.4 });
    for (const floor of [SUB_TOP + 0.03, GF_TOP + 0.03]) {
      // WC
      box(g, white, 0.4, 0.4, 0.55, 0.45, floor + 0.2, 7.45);
      box(g, white, 0.45, 0.35, 0.18, 0.45, floor + 0.6, 7.78);
      // Basin on pedestal
      cylinder(g, white, 0.08, 0.1, 0.75, 1.25, floor + 0.37, 7.7);
      box(g, white, 0.5, 0.15, 0.38, 1.25, floor + 0.82, 7.68);
      box(g, chrome, 0.04, 0.12, 0.04, 1.25, floor + 0.95, 7.82);
      // Shower
      box(g, chrome, 0.03, 1.9, 0.03, T / 2 + 0.05, floor + 1.0, 6.25);
      box(g, chrome, 0.18, 0.03, 0.18, T / 2 + 0.15, floor + 1.95, 6.25);
      cylinder(g, material(0x222222), 0.06, 0.06, 0.01, 0.6, floor + 0.01, 6.5);
      // Ceiling lights
      for (const cx of [2.5, 7.5]) {
        const lamp = material(0xffffff, { emissive: 0xfff2d0, emissiveIntensity: 0.2 });
        lampMaterials.push(lamp);
        cylinder(g, lamp, 0.18, 0.18, 0.04, cx, floor + 2.55, 4, 16);
      }
    }
    // Kitchen counter and sink under the back window
    box(g, counter, 3.0, 0.9, 0.6, 7.5, SUB_TOP + 0.45, 8 - T / 2 - 0.32);
    box(g, chrome, 0.8, 0.05, 0.45, 7.5, SUB_TOP + 0.91, 8 - T / 2 - 0.32);
  });

  // ---------- External works & handover ----------
  add("external-works", (g) => {
    const fence = material(C.paint, { roughness: 0.8 });
    const cap = material(C.white);
    const h = 2.1;
    const sides: [number, number, number, number][] = [
      [PLOT.x0, PLOT.z0, GATE.x0, PLOT.z0], [GATE.x1, PLOT.z0, PLOT.x1, PLOT.z0],
      [PLOT.x0, PLOT.z1, PLOT.x1, PLOT.z1], [PLOT.x0, PLOT.z0, PLOT.x0, PLOT.z1], [PLOT.x1, PLOT.z0, PLOT.x1, PLOT.z1],
    ];
    for (const [x1, z1, x2, z2] of sides) {
      const alongX = z1 === z2;
      const len = Math.hypot(x2 - x1, z2 - z1);
      box(g, fence, alongX ? len : 0.15, h, alongX ? 0.15 : len, (x1 + x2) / 2, h / 2, (z1 + z2) / 2);
      box(g, cap, alongX ? len + 0.1 : 0.25, 0.08, alongX ? 0.25 : len + 0.1, (x1 + x2) / 2, h + 0.04, (z1 + z2) / 2);
      for (let t = 0; t <= len + 0.01; t += 3) box(g, cap, 0.3, h + 0.2, 0.3, alongX ? x1 + t : x1, (h + 0.2) / 2, alongX ? z1 : z1 + t);
    }
    // Sliding steel gate
    const steel = material(0x1f2428, { metalness: 0.7, roughness: 0.35 });
    box(g, steel, GATE.x1 - GATE.x0, 0.08, 0.06, (GATE.x0 + GATE.x1) / 2, 0.1, PLOT.z0);
    box(g, steel, GATE.x1 - GATE.x0, 0.08, 0.06, (GATE.x0 + GATE.x1) / 2, 1.9, PLOT.z0);
    for (let x = GATE.x0 + 0.1; x < GATE.x1; x += 0.15) box(g, steel, 0.03, 1.8, 0.03, x, 1.0, PLOT.z0);
    // Interlocking paving: driveway and apron round the house
    const paving = material(0xffffff, { map: textured(tex.paving, 6, 16), roughness: 0.8 });
    box(g, paving, GATE.x1 - GATE.x0 + 0.6, 0.04, 7.6, (GATE.x0 + GATE.x1) / 2, 0.02, -4.1).castShadow = false;
    const apron = material(0xffffff, { map: textured(tex.paving, 24, 2), roughness: 0.8 });
    box(g, apron, 11.6, 0.04, 1.0, 5, 0.02, -0.75).castShadow = false;
    box(g, apron, 11.6, 0.04, 1.0, 5, 0.02, 8.75).castShadow = false;
    // Drain along the front fence
    box(g, material(0x2a2e33), 17.4, 0.03, 0.4, 5, 0.015, PLOT.z0 + 0.5).castShadow = false;
    // Garden trees and shrubs
    const trunk = material(0x6b4a2f);
    const leaf = material(0x3f7a2c, { roughness: 0.9 });
    const ico = new THREE.IcosahedronGeometry(1, 1);
    disposables.push(ico);
    for (const [x, z, s] of [[-2.5, -5.5, 1.2], [12.5, -5.5, 1.0], [-2.5, 1.5, 0.9], [12.6, 9.6, 1.3]]) {
      cylinder(g, trunk, 0.1, 0.14, 1.6 * s, x, 0.8 * s, z, 8);
      const crown = new THREE.Mesh(ico, leaf);
      crown.position.set(x, 2.1 * s, z);
      crown.scale.setScalar(1.1 * s);
      crown.castShadow = true;
      g.add(crown);
    }
  }, { anim: "xyz" });

  add("handover", (g) => {
    // Ribbon across the gate
    const ribbon = material(0xc8102e, { roughness: 0.4 });
    box(g, ribbon, GATE.x1 - GATE.x0, 0.12, 0.02, (GATE.x0 + GATE.x1) / 2, 1.1, PLOT.z0 - 0.1);
    box(g, ribbon, 0.35, 0.35, 0.05, (GATE.x0 + GATE.x1) / 2, 1.1, PLOT.z0 - 0.12).rotation.z = Math.PI / 4;
  }, { anim: "xyz" });

  // Permanent trees outside the plot
  {
    const trunk = new THREE.MeshStandardMaterial({ color: 0x6b4a2f });
    const leaf = new THREE.MeshStandardMaterial({ color: 0x3d6b29, roughness: 0.9 });
    const ico = new THREE.IcosahedronGeometry(1, 1);
    disposables.push(trunk, leaf, ico);
    for (const [x, z, s] of [[-9, -2, 1.6], [-11, 14, 1.3], [20, 3, 1.5], [19, 14, 1.2], [3, 18, 1.4], [-6, -13, 1.1], [17, -12, 1.3]]) {
      cylinder(scene, trunk, 0.15, 0.2, 2 * s, x, s, z, 8);
      const crown = new THREE.Mesh(ico, leaf);
      crown.position.set(x, 2.6 * s, z);
      crown.scale.setScalar(1.4 * s);
      crown.castShadow = true;
      scene.add(crown);
    }
  }

  // ---------- Workers ----------
  const workerParts = {
    vest: new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.6 }),
    trousers: new THREE.MeshStandardMaterial({ color: 0x2c3e50 }),
    skin: new THREE.MeshStandardMaterial({ color: 0x6b4226 }),
    helmet: new THREE.MeshStandardMaterial({ color: 0xffd400, roughness: 0.4 }),
    whiteHelmet: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),
    suit: new THREE.MeshStandardMaterial({ color: 0x1f2a44 }),
  };
  Object.values(workerParts).forEach((m) => disposables.push(m));
  const head = new THREE.SphereGeometry(0.12, 12, 10);
  const hat = new THREE.SphereGeometry(0.14, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  disposables.push(head, hat);
  const figure = (kind: "worker" | "engineer" | "client") => {
    const f = new THREE.Group();
    const torso = kind === "client" ? workerParts.suit : workerParts.vest;
    box(f, workerParts.trousers, 0.12, 0.8, 0.14, -0.08, 0.4, 0);
    box(f, workerParts.trousers, 0.12, 0.8, 0.14, 0.08, 0.4, 0);
    box(f, torso, 0.38, 0.6, 0.2, 0, 1.1, 0);
    box(f, torso, 0.1, 0.55, 0.12, -0.25, 1.1, 0);
    box(f, torso, 0.1, 0.55, 0.12, 0.25, 1.1, 0);
    const h = new THREE.Mesh(head, workerParts.skin);
    h.position.y = 1.55;
    f.add(h);
    if (kind !== "client") {
      const helmet = new THREE.Mesh(hat, kind === "engineer" ? workerParts.whiteHelmet : workerParts.helmet);
      helmet.position.y = 1.6;
      f.add(helmet);
    }
    f.traverse((o) => ((o as THREE.Mesh).castShadow = true));
    return f;
  };
  // [step, kind, x, y, z, facing]
  const crew: [string, "worker" | "engineer" | "client", number, number, number, number][] = [
    ["survey", "engineer", -1.2, 0, -4.6, 2.4],
    ["survey", "worker", 6, 0, 5, -0.5],
    ["mobilisation", "worker", 2, 0, -2, 0.6], ["mobilisation", "worker", 8, 0, 3, -1], ["mobilisation", "engineer", 0.6, 0, 8.6, 3.1],
    ["setting-out", "engineer", -1.2, 0, -1.4, 0.8], ["setting-out", "worker", 10.8, 0, -1, -0.8],
    ["excavation", "worker", 4, 0, -0.8, 0], ["excavation", "worker", 10.8, 0, 4, -1.6],
    ["blinding", "worker", 2, 0, -0.7, 0], ["blinding", "worker", 7, 0, 8.7, 3.1],
    ["footing", "worker", 11.3, 0, 2.6, -1.4], ["footing", "worker", 3, 0, -0.8, 0], ["footing", "engineer", -1, 0, 4, 1.6],
    ["substructure-walls", "worker", 2.5, 0, -0.6, 0], ["substructure-walls", "worker", 10.6, 0, 6, -1.6],
    ["ground-slab", "worker", 2.5, 0.2, 3, 0.4], ["ground-slab", "worker", 7.5, 0.2, 5, 2], ["ground-slab", "engineer", -1, 0, 0, 1],
    ["gf-columns", "worker", 5.3, 0.2, 0.5, 2.6], ["gf-columns", "worker", 0.5, 0.2, 7.4, 0.8],
    ["gf-walls", "worker", 2.5, 0.2, 0.6, 3.1], ["gf-walls", "worker", 7.5, 0.2, 7.3, 0], ["gf-walls", "worker", 11.4, 0, 6.9, -1.6],
    ["ff-slab", "worker", 3, GF_TOP, 2, 0.3], ["ff-slab", "worker", 7, GF_TOP, 5, 2.4], ["ff-slab", "engineer", 8.6, GF_TOP, 1.2, -0.7],
    ["first-floor", "worker", 2.5, GF_TOP, 0.6, 3.1], ["first-floor", "worker", 7.5, GF_TOP + 1.8, -0.8, 3.1],
    ["roof-carcass", "worker", 2, FF_TOP, 0.4, 0], ["roof-carcass", "worker", 8, FF_TOP, 7.6, 3.1],
    ["roof-covering", "worker", 3, FF_TOP + 1.3, 1.6, 0], ["roof-covering", "worker", 7.5, FF_TOP + 1.3, 6.4, 3.1],
    ["mep-first-fix", "worker", 2.5, SUB_TOP, 2, 3.1], ["mep-first-fix", "worker", 7.5, GF_TOP, 6, 0],
    ["plaster", "worker", 3, 0, -0.6, 3.1], ["plaster", "worker", 7, GF_TOP + 1.8, -0.8, 3.1],
    ["windows-doors", "worker", 3.2, 0, -0.7, 3.1], ["windows-doors", "worker", 7.5, 0, -0.9, 3.1],
    ["ceilings", "worker", 2.5, SUB_TOP, 3, 0.5], ["ceilings", "worker", 7.5, GF_TOP, 4, 2],
    ["tiling", "worker", 3, SUB_TOP, 2, 1], ["tiling", "worker", 8, GF_TOP, 5, -1],
    ["painting", "worker", 2, 0, -0.8, 3.1], ["painting", "worker", 8, GF_TOP + 1.8, -0.8, 3.1],
    ["second-fix", "worker", 1.0, SUB_TOP, 6.8, 0], ["second-fix", "worker", 7.5, SUB_TOP, 6.8, 0],
    ["external-works", "worker", 8, 0, -5, 0.4], ["external-works", "worker", 12, 0, -6, -0.8],
    ["handover", "engineer", 7.3, 0, -8.6, 0.2], ["handover", "client", 8.4, 0, -8.6, -0.2], ["handover", "client", 9.1, 0, -8.8, -0.4],
  ];
  const crewMembers: { figure: THREE.Group; step: number; baseY: number; phase: number }[] = [];
  crew.forEach(([step, kind, x, y, z, rot], i) => {
    const f = figure(kind);
    f.position.set(x, y, z);
    f.rotation.y = rot;
    f.visible = false;
    scene.add(f);
    crewMembers.push({ figure: f, step: idx(step), baseY: y, phase: i * 1.7 });
  });

  // ---------- Stage state ----------
  let current = 0;
  let previous = -1;
  const xraySteps = new Set(["mep-first-fix", "ceilings", "tiling", "second-fix"].map(idx));
  const plasterStep = idx("plaster");
  const paintStep = idx("painting");
  const plasterMat = new THREE.MeshStandardMaterial({ color: C.plaster, roughness: 0.95, transparent: true, opacity: 1 });
  const paintMat = new THREE.MeshStandardMaterial({ color: C.paint, roughness: 0.8, transparent: true, opacity: 1 });
  disposables.push(plasterMat, paintMat);
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const clock = new THREE.Clock();

  const applyStep = () => {
    const forward = current > previous;
    const now = clock.getElapsedTime();
    for (const e of entries) {
      const visible = current >= e.from && current < e.until;
      const appearing = visible && !e.group.visible;
      e.group.visible = visible;
      const active = current === e.from && e.highlight;
      if (e.xray) e.xray.visible = current === e.from;
      for (const m of e.materials) {
        m.emissive.set(active ? C.gold : 0x000000);
        m.emissiveIntensity = active ? 0.2 : 0;
      }
      if (appearing && forward && current === e.from && e.anim !== "none" && !reduced) e.start = now;
      if (!visible || !forward) e.start = -1;
      if (e.start < 0) e.group.scale.set(1, 1, 1);
    }
    // Concrete goes see-through while its reinforcement is explained; walls go see-through for interior stages.
    const xray = xraySteps.has(current);
    const wallOpacity = xray ? 0.16 : 1;
    for (const m of [plasterMat, paintMat, ...wallMeshes.map((w) => w.block)]) {
      m.opacity = wallOpacity;
      m.depthWrite = !xray;
    }
    for (const [m, owner] of rebarConcrete) {
      const opacity = xray ? 0.16 : current === owner.from ? 0.28 : 1;
      m.opacity = opacity;
      m.depthWrite = opacity === 1;
    }
    const finish = current >= paintStep ? paintMat : current >= plasterStep ? plasterMat : null;
    for (const { mesh, block } of wallMeshes) mesh.material = finish ?? block;
    const seeThroughTiles = xray && current !== idx("tiling");
    for (const m of wallTileMaterials) {
      m.opacity = seeThroughTiles ? 0.25 : 1;
      m.depthWrite = !seeThroughTiles;
    }
    for (const m of frameMaterials) m.color.set(current >= paintStep ? C.paint : current >= plasterStep ? C.plaster : C.concrete);
    const finishesActive = current === plasterStep || current === paintStep;
    for (const m of [plasterMat, paintMat]) {
      m.emissive.set(finishesActive ? C.gold : 0x000000);
      m.emissiveIntensity = finishesActive ? 0.1 : 0;
    }
    // Ground surface and trench cover
    const ext = idx("external-works");
    plotMat.map = current >= ext || current === 0 ? plotGrass : plotEarth;
    plotMat.color.set(current === 0 ? C.overgrown : current >= ext ? 0x9fd06a : 0xffffff);
    plotMat.needsUpdate = true;
    trenchCover.visible = current < idx("excavation") || current >= idx("substructure-walls");
    // Crew
    for (const c of crewMembers) c.figure.visible = c.step === current;
    // Handover at dusk with the lights on
    const handover = current === idx("handover");
    if (handover !== dusk) {
      dusk = handover;
      if (dusk) setSun(7, 250, 2.2, 0xffb070);
      else setSun(38, 140, 5, 0xfff0dc);
      renderer.toneMappingExposure = dusk ? 0.7 : 0.42;
      scene.environmentIntensity = dusk ? 0.75 : 0.35;
    }
    for (const m of glassMaterials) {
      m.emissive.set(dusk ? 0xffc46b : 0x000000);
      m.emissiveIntensity = dusk ? 2.2 : 0;
      m.opacity = dusk ? 0.85 : 0.45;
    }
    for (const m of lampMaterials) m.emissiveIntensity = dusk ? 2.5 : 0.2;
    const cam = WALKTHROUGH_STEPS[current].camera;
    goalTarget.set(...cam.target);
    toSpherical(cam.position, cam.target, goalSph);
    idleSince = performance.now();
    previous = current;
  };
  // Concrete materials that can turn see-through (to show rebar, or for interior stages), with their stage.
  const rebarConcrete = new Map<THREE.MeshStandardMaterial, Entry>();
  for (const e of entries) for (const m of e.materials) if (m.transparent && m.color.getHex() === C.concrete) rebarConcrete.set(m, e);

  // ---------- Camera and orbit ----------
  const target = new THREE.Vector3();
  const goalTarget = new THREE.Vector3();
  const sph = new THREE.Spherical();
  const goalSph = new THREE.Spherical();
  const toSpherical = (position: [number, number, number], at: [number, number, number], out: THREE.Spherical) =>
    out.setFromVector3(new THREE.Vector3(...position).sub(new THREE.Vector3(...at)));
  let idleSince = performance.now();

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
    idleSince = performance.now();
  };
  const onMove = (event: PointerEvent) => {
    const prev = pointers.get(event.pointerId);
    if (!prev) return;
    idleSince = performance.now();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) {
      goalSph.theta -= (event.clientX - prev.x) * 0.006;
      goalSph.phi = THREE.MathUtils.clamp(goalSph.phi - (event.clientY - prev.y) * 0.005, 0.2, 1.5);
    } else if (pointers.size === 2) {
      const [a, b] = Array.from(pointers.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) goalSph.radius = THREE.MathUtils.clamp(goalSph.radius * (pinch / distance), 4, 70);
      pinch = distance;
    }
  };
  const onUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = 0;
  };
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    idleSince = performance.now();
    goalSph.radius = THREE.MathUtils.clamp(goalSph.radius * (1 + Math.sign(event.deltaY) * 0.08), 4, 70);
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

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

  const ease = reduced ? 1 : 0.06;
  const angleLerp = (a: number, b: number, t: number) => {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  };
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  renderer.setAnimationLoop(() => {
    const time = clock.getElapsedTime();
    // Grow-in animation for new elements
    for (const e of entries) {
      if (e.start < 0) continue;
      const t = Math.min(1, (time - e.start) / 1.1);
      const k = Math.max(0.001, easeOut(t));
      if (e.anim === "y") e.group.scale.set(1, k, 1);
      else e.group.scale.setScalar(k);
      if (t >= 1) e.start = -1;
    }
    if (!reduced) {
      if (excavatorBoom) excavatorBoom.rotation.z = -0.25 + Math.sin(time * 1.2) * 0.25;
      if (excavatorCab) excavatorCab.rotation.y = 0.9 + Math.sin(time * 0.4) * 0.5;
      if (mixerDrum) mixerDrum.rotation.y = time * 2.5;
      for (const c of crewMembers) {
        if (!c.figure.visible) continue;
        c.figure.position.y = c.baseY + Math.abs(Math.sin(time * 2 + c.phase)) * 0.03;
      }
      // Gentle orbit at handover once the visitor stops interacting
      if (dusk && performance.now() - idleSince > 2500) goalSph.theta += 0.0015;
    }
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
      envMap?.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
