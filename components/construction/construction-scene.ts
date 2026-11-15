import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { assertWalkthroughLighting, createWalkthroughLighting } from "./construction-lighting";

export type SceneHandle = { update: (stage: number, cutaway: boolean) => void; reset: () => void; dispose: () => void };
type Options = { onSelect: (stage: number) => void; onReady: () => void; onError: () => void };

export async function createConstructionScene(host: HTMLElement, options: Options): Promise<SceneHandle> {
  type ModelRenderer = { domElement: HTMLElement | SVGElement; setSize: (w: number, h: number) => void; render: (scene: THREE.Scene, camera: THREE.Camera) => void; dispose?: () => void };
  type SceneEngine = Pick<typeof THREE, "AmbientLight" | "BoxGeometry" | "BufferGeometry" | "CanvasTexture" | "Color" | "DirectionalLight" | "Float32BufferAttribute" | "GridHelper" | "Group" | "HemisphereLight" | "IcosahedronGeometry" | "Line" | "LineBasicMaterial" | "Mesh" | "MeshStandardMaterial" | "PerspectiveCamera" | "Raycaster" | "Scene" | "Vector2" | "Vector3">;
  let Engine: SceneEngine = THREE;
  let renderer: ModelRenderer | undefined;
  if ("gpu" in navigator) {
    try {
      const gpuEngine = await import("three/webgpu");
      const gpu = new gpuEngine.WebGPURenderer({ antialias: true, alpha: true });
      try {
        await gpu.init(); gpu.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
        gpu.toneMapping = THREE.ACESFilmicToneMapping; gpu.toneMappingExposure = 1.25; gpu.shadowMap.enabled = true;
        renderer = gpu;
        Engine = gpuEngine;
      } catch { try { gpu.dispose(); } catch { /* A partially initialised backend may have no context. */ } }
    } catch { /* Try the compatible renderers below. */ }
  }
  if (!renderer) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { antialias: true, alpha: true });
    if (context) {
      const gl = new THREE.WebGLRenderer({ canvas, context, antialias: true, alpha: true });
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.6)); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.25; gl.shadowMap.enabled = true;
      renderer = gl;
    }
  }
  const software = !renderer;
  if (!renderer) {
    const { SVGRenderer } = await import("three/addons/renderers/SVGRenderer.js");
    const svg = new SVGRenderer(); svg.setClearColor(new Engine.Color("#d8dfd1"), 0); svg.setPrecision(2); renderer = svg;
  }
  const world = new Engine.Scene();
  const camera = new Engine.PerspectiveCamera(35, 1, 0.1, 100);
  const home = new Engine.Vector3(20, 16, 23);
  camera.position.copy(home);
  const controls = new OrbitControls(camera, renderer.domElement as HTMLElement);
  controls.target.set(0, 0.8, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 15;
  controls.maxDistance = 42;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.enablePan = false;
  const lighting = createWalkthroughLighting(Engine, software);
  assertWalkthroughLighting(renderer, lighting);
  world.add(...lighting);
  world.add(lighting[2].target);

  const groups = Array.from({ length: 14 }, (_, stage) => {
    const group = new Engine.Group(); group.userData.stage = stage; world.add(group); return group;
  });
  const wallFaces: THREE.Group[] = [];
  const material = (color: string, roughness = 0.85, metalness = 0) => new Engine.MeshStandardMaterial({ color, roughness, metalness });
  const dirt = material("#a88e6d"); const earthSide = material("#705842");
  const concrete = material("#bebbb0"); const timber = material("#b68b53"); const darkSteel = material("#354c50", 0.45, 0.4);
  const cream = material("#eee6d5"); const roofMat = material("#334a4f", 0.45, 0.35); const gold = material("#ddb465", 0.45, 0.3);
  const glass = new Engine.MeshStandardMaterial({ color: "#91bac5", metalness: 0.35, roughness: 0.15, transparent: true, opacity: 0.7 });
  const baseY = 0.43;
  const box = (parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const segments = (length: number) => software ? Math.max(1, Math.min(18, Math.ceil(length / 1.1))) : 1;
    const mesh = new Engine.Mesh(new Engine.BoxGeometry(w, h, d, segments(w), segments(h), segments(d)), mat); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const line = (parent: THREE.Object3D, a: number[], b: number[], color: string) => {
    const geometry = new Engine.BufferGeometry().setFromPoints([new Engine.Vector3(...a), new Engine.Vector3(...b)]);
    const mesh = new Engine.Line(geometry, new Engine.LineBasicMaterial({ color })); parent.add(mesh); return mesh;
  };
  const member = (parent: THREE.Object3D, a: number[], b: number[], thickness: number, mat: THREE.Material) => {
    const start = new Engine.Vector3(...a), end = new Engine.Vector3(...b), delta = end.clone().sub(start);
    const mesh = new Engine.Mesh(new Engine.BoxGeometry(thickness, delta.length(), thickness), mat);
    mesh.position.copy(start.add(end).multiplyScalar(0.5)); mesh.quaternion.setFromUnitVectors(new Engine.Vector3(0, 1, 0), delta.normalize()); mesh.castShadow = true; parent.add(mesh);
  };
  const texture = (kind: "blocks" | "tiles") => {
    const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 128;
    const context = canvas.getContext("2d")!;
    context.fillStyle = kind === "blocks" ? "#b8b3a2" : "#d9d2c4"; context.fillRect(0, 0, 256, 128);
    context.strokeStyle = kind === "blocks" ? "#8e8a7c" : "#f2eee7"; context.lineWidth = 3;
    for (let row = 0; row < 2; row++) {
      const offset = row % 2 ? 64 : 0;
      for (let x = -1; x < 3; x++) context.strokeRect(x * 128 + offset, row * 64, 128, 64);
    }
    const map = new Engine.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping; return map;
  };
  const blockMap = texture("blocks");
  const blockMat = (length: number, height: number) => {
    const map = blockMap.clone(); map.repeat.set(length / 0.9, height / 0.45);
    return new Engine.MeshStandardMaterial({ map, color: software ? "#b9b4a4" : "#e1d8c2", roughness: 1 });
  };

  // A cut soil base makes excavation and the below-ground foundation visible.
  const soilBase = box(world, 22, 0.32, 19, 0, -1.24, 0, earthSide);
  const uncutGround = new Engine.Group(); world.add(uncutGround);
  box(uncutGround, 22, 1.05, 19, 0, -0.55, 0, dirt);
  const cutGround = new Engine.Group(); world.add(cutGround);
  box(cutGround, 22, 1.05, 4, 0, -0.55, -7.5, dirt);
  box(cutGround, 22, 1.05, 4, 0, -0.55, 7.5, dirt);
  box(cutGround, 4.6, 1.05, 11, -8.7, -0.55, 0, dirt);
  box(cutGround, 4.6, 1.05, 11, 8.7, -0.55, 0, dirt);
  for (const x of [-3, 3]) for (const z of [-2.5, 2.5]) box(cutGround, 5.15, 1.05, 4.15, x, -0.55, z, dirt);
  const datum = new Engine.GridHelper(21, 21, 0x8eaa9c, 0xc2c8b8); datum.position.y = -0.015; world.add(datum);

  // Setting-out profiles and offset strings remain visible until walling begins.
  for (const x of [-6.8, 6.8]) for (const z of [-5.8, 5.8]) {
    box(groups[1], 0.09, 0.9, 0.09, x, 0.4, z, timber);
    box(groups[1], 0.7, 0.08, 0.08, x, 0.7, z, timber);
  }
  for (const z of [-5, 5]) line(groups[1], [-7, 0.65, z], [7, 0.65, z], "#f4c673");
  for (const x of [-6, 6]) line(groups[1], [x, 0.65, -6], [x, 0.65, 6], "#f4c673");

  const runs = [{ x: 0, z: -5, w: 12, d: 0.6 }, { x: 0, z: 5, w: 12, d: 0.6 }, { x: -6, z: 0, w: 0.6, d: 10 }, { x: 6, z: 0, w: 0.6, d: 10 }, { x: 0, z: 0, w: 0.6, d: 10 }, { x: 0, z: 0, w: 12, d: 0.6 }, { x: -4, z: -2, w: 4, d: 0.6 }];
  for (const run of runs) {
    box(groups[2], run.w + 0.12, 0.04, run.d + 0.12, run.x, -1.05, run.z, material("#574638"));
    box(groups[3], run.w, 0.225, run.d, run.x, -0.86, run.z, concrete);
    box(groups[3], run.w > 1 ? run.w : 0.23, 0.9, run.d > 1 ? run.d : 0.23, run.x, -0.3, run.z, blockMat(Math.max(run.w, run.d), 0.9));
    for (let n = -1; n <= 1; n++) {
      const alongX = run.w > run.d;
      member(groups[3], [run.x - (alongX ? run.w / 2 : n * 0.16), -0.88, run.z - (alongX ? n * 0.16 : run.d / 2)], [run.x + (alongX ? run.w / 2 : -n * 0.16), -0.88, run.z + (alongX ? -n * 0.16 : run.d / 2)], 0.016, darkSteel);
    }
  }
  const floorLayers = [{ h: 0.2, color: "#b48b61" }, { h: 0.15, color: "#99978a" }, { h: 0.05, color: "#e1cda6" }, { h: 0.012, color: "#293e43" }, { h: 0.12, color: "#bfc0b6" }];
  let floorY = -0.102;
  for (const layer of floorLayers) { box(groups[4], 12, layer.h, 10, 0, floorY + layer.h / 2, 0, material(layer.color)); floorY += layer.h; }
  // A mesh sample is visible at the slab edge rather than drawn over finished concrete.
  for (let n = 0; n < 12; n++) line(groups[4], [-5.8 + n, 0.33, 4.7], [-5.8 + n, 0.33, 5], "#687b77");

  type Opening = { at: number; width: number; bottom: number; top: number; door?: boolean };
  const walls: THREE.Mesh[] = [];
  const frames: THREE.Group[] = [];
  const makeWall = (cx: number, cz: number, length: number, rotation: number, openings: Opening[], section: boolean) => {
    const face = new Engine.Group(); face.position.set(cx, baseY, cz); face.rotation.y = rotation; groups[5].add(face);
    if (section) wallFaces.push(face);
    const glazing = new Engine.Group(); glazing.position.copy(face.position); glazing.rotation.copy(face.rotation); groups[11].add(glazing);
    if (section) frames.push(glazing);
    const solid = (left: number, right: number, bottom: number, top: number) => {
      if (right - left < 0.01 || top - bottom < 0.01) return;
      const mesh = box(face, right - left, top - bottom, 0.23, (left + right) / 2, (bottom + top) / 2, 0, blockMat(right - left, top - bottom)); walls.push(mesh);
    };
    let last = -length / 2;
    for (const opening of [...openings].sort((a, b) => a.at - b.at)) {
      const left = opening.at - opening.width / 2, right = opening.at + opening.width / 2;
      solid(last, left, 0, 3); solid(left, right, 0, opening.bottom); solid(left, right, opening.top, 3); last = right;
      const center = (opening.bottom + opening.top) / 2;
      box(glazing, opening.width, opening.top - opening.bottom, 0.055, opening.at, center, 0, opening.door ? material("#885f3d") : glass);
      for (const x of [left, right]) box(glazing, 0.065, opening.top - opening.bottom + 0.07, 0.09, x, center, 0, darkSteel);
      for (const y of [opening.bottom, opening.top]) box(glazing, opening.width + 0.07, 0.065, 0.09, opening.at, y, 0, darkSteel);
      if (!opening.door) box(glazing, 0.045, opening.top - opening.bottom, 0.1, opening.at, center, 0, darkSteel);
      else box(glazing, 0.06, 0.13, 0.08, opening.at + 0.35, 1.05, 0.08, gold);
    }
    solid(last, length / 2, 0, 3);
    box(face, length + 0.02, 0.18, 0.25, 0, 2.91, 0, concrete);
  };
  const win = (at: number): Opening => ({ at, width: 1.8, bottom: 0.9, top: 2.25 });
  const door = (at: number): Opening => ({ at, width: 1, bottom: 0, top: 2.3, door: true });
  makeWall(0, 5, 12, 0, [win(-3.6), door(0.8), win(3.7)], true);
  makeWall(0, -5, 12, 0, [win(-3), win(3)], false);
  makeWall(-6, 0, 10, Math.PI / 2, [win(-2.5), win(2.5)], false);
  makeWall(6, 0, 10, Math.PI / 2, [win(-2.5), win(2.5)], true);
  makeWall(0, 0, 10, Math.PI / 2, [door(-2), door(2)], false);
  makeWall(0, 0, 12, 0, [door(-2.5), door(2.5)], false);
  makeWall(-4, -2, 4, 0, [door(0.7)], false);

  // Hip roof, with separate framing and covering stages.
  for (const z of [-5.15, 5.15]) box(groups[6], 12.4, 0.14, 0.14, 0, 3.52, z, timber);
  for (const x of [-6.15, 6.15]) box(groups[6], 0.14, 0.14, 10.3, x, 3.52, 0, timber);
  member(groups[6], [-2.6, 5.4, 0], [2.6, 5.4, 0], 0.13, timber);
  for (let x = -5.5; x <= 5.5; x += 1.1) {
    const ridgeY = 5.4 - Math.max(0, Math.abs(x) - 2.6) * 0.48;
    member(groups[6], [x, 3.55, 5.6], [x, ridgeY, 0], 0.1, timber);
    member(groups[6], [x, 3.55, -5.6], [x, ridgeY, 0], 0.1, timber);
    member(groups[6], [x, 3.5, -5.15], [x, 3.5, 5.15], 0.09, timber);
  }
  const roofFaces = [[[-6.6, 3.55, 5.6], [6.6, 3.55, 5.6], [2.6, 5.4, 0], [-2.6, 5.4, 0]], [[6.6, 3.55, -5.6], [-6.6, 3.55, -5.6], [-2.6, 5.4, 0], [2.6, 5.4, 0]], [[-6.6, 3.55, -5.6], [-6.6, 3.55, 5.6], [-2.6, 5.4, 0]], [[6.6, 3.55, 5.6], [6.6, 3.55, -5.6], [2.6, 5.4, 0]]];
  roofMat.side = THREE.DoubleSide;
  for (const points of roofFaces) {
    const indices = points.length === 4 ? [0, 1, 2, 0, 2, 3] : [0, 1, 2];
    const geometry = new Engine.BufferGeometry(); geometry.setAttribute("position", new Engine.Float32BufferAttribute(points.flat(), 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = new Engine.Mesh(geometry, roofMat); mesh.castShadow = true; groups[7].add(mesh);
    points.forEach((point, i) => member(groups[7], point, points[(i + 1) % points.length], 0.045, darkSteel));
  }
  for (let x = -6; !software && x <= 6; x += 0.4) {
    const max = 2.6;
    for (const side of [-1, 1]) line(groups[7], [x, 3.57, side * 5.6], [Math.max(-max, Math.min(max, x)), 5.42, 0], "#60757a");
  }
  for (const x of [-6.55, 6.55]) box(groups[7], 0.09, 3.7, 0.09, x, 1.7, 5.5, darkSteel);

  // Above-ground first fix is intentionally distinct from the earlier buried services.
  const serviceBlue = material("#4baad0", 0.6), serviceGold = material("#ecb94c", 0.6);
  for (const x of [-4.8, 2.7]) {
    member(groups[8], [x, 0.55, -4.85], [x, 2.6, -4.85], 0.06, serviceBlue);
    member(groups[8], [x, 2.6, -4.85], [0, 2.6, -4.85], 0.06, serviceBlue);
  }
  for (const z of [-3.3, 2.7]) {
    member(groups[8], [-5.85, 2.8, z], [5.85, 2.8, z], 0.035, serviceGold);
    member(groups[8], [-5.85, 0.9, z], [-5.85, 2.8, z], 0.035, serviceGold);
  }
  // Surface finishes replace block materials on the same wall geometry.
  box(groups[9], 11.8, 0.035, 9.8, 0, 0.442, 0, material("#d8cdb9"));
  const tileMap = texture("tiles"); tileMap.repeat.set(12, 10);
  box(groups[10], 11.85, 0.03, 9.85, 0, 0.47, 0, new Engine.MeshStandardMaterial({ map: tileMap, roughness: 0.55 }));
  const ceiling = box(groups[10], 11.8, 0.045, 9.8, 0, 3.28, 0, cream);
  // Compact kitchen and sanitary fixtures make the section readable.
  for (const x of [-4.9, 3.8]) {
    box(groups[11], 0.5, 0.45, 0.75, x, 0.7, -3.9, cream);
    box(groups[11], 0.5, 0.65, 0.2, x, 0.93, -4.3, cream);
  }
  box(groups[11], 4.2, 0.88, 0.6, 3.15, 0.91, 4.5, material("#ac916c"));
  box(groups[11], 4.35, 0.07, 0.7, 3.15, 1.38, 4.5, material("#eee8dc"));
  box(groups[11], 0.65, 0.035, 0.4, 3.4, 1.43, 4.5, darkSteel);
  box(groups[11], 2.1, 0.08, 1.2, 0.8, 0.14, 5.8, concrete);

  const paving = material("#c5b99f");
  box(groups[12], 15.5, 0.09, 3.6, 0, 0.02, 7.1, paving);
  box(groups[12], 2.1, 0.08, 10.4, 7.3, 0.01, 0, paving);
  const grass = material("#7b9472");
  for (const x of [-8.2, 9.2]) box(groups[12], x > 0 ? 1.4 : 2.4, 0.08, 7.2, x, -0.005, -1.1, grass);
  for (const x of [-8.1, 8.4]) for (const z of [-6.7, 6.6]) {
    box(groups[12], 0.12, 1.1, 0.12, x, 0.5, z, timber);
    const crown = new Engine.Mesh(new Engine.IcosahedronGeometry(0.75, 1), material("#668263")); crown.position.set(x, 1.55, z); crown.castShadow = true; groups[12].add(crown);
  }
  for (let z = -4; z <= 4; z += 0.8) box(groups[12], 0.15, 0.07, 0.45, 6.5, 0.04, z, darkSteel);

  // The software painter draws horizontal ground layers first to avoid
  // interpenetrating large ground triangles. Hardware uses its depth buffer.
  if (software) {
    soilBase.renderOrder = -100;
    uncutGround.traverse((object) => { object.renderOrder = -90; });
    cutGround.traverse((object) => { object.renderOrder = -90; });
    groups[3].traverse((object) => { object.renderOrder = -70; });
    groups[4].traverse((object) => { object.renderOrder = -60; });
    groups[9].traverse((object) => { object.renderOrder = -50; });
    groups[10].traverse((object) => { object.renderOrder = -40; });
    groups[7].traverse((object) => { object.renderOrder = 10; });
    groups[12].traverse((object) => { if (object instanceof Engine.Mesh && object.position.y < 0.2) object.renderOrder = -30; });
  }

  let stage = 5, cutaway = false, disposed = false, dirty = true, frame = 0;
  const animated = groups.map(() => 1);
  const paint = new Engine.MeshStandardMaterial({ color: "#ece5d4", roughness: 0.85 });
  const plaster = new Engine.MeshStandardMaterial({ color: "#d4c9b3", roughness: 1 });
  for (const wall of walls) wall.userData.originalMaterial = wall.material;
  const update = (next: number, section: boolean) => {
    stage = next; cutaway = section; dirty = true;
    uncutGround.visible = stage < 2; cutGround.visible = stage >= 2; datum.visible = stage <= 2;
    groups.forEach((group, i) => { group.visible = i <= stage; if (i === stage) animated[i] = 0.025; });
    groups[1].visible = stage === 1 || stage === 2;
    groups[2].visible = stage === 2;
    groups[3].visible = stage >= 3 && (!software || stage === 3);
    groups[6].visible = (software ? stage === 6 : stage >= 6) && !cutaway;
    groups[7].visible = stage >= 7 && !cutaway;
    groups[8].visible = stage === 8;
    ceiling.visible = !cutaway && !software;
    wallFaces.forEach((face) => { face.visible = !cutaway; });
    frames.forEach((face) => { face.visible = !cutaway; });
    walls.forEach((wall) => { wall.material = stage >= 10 ? paint : stage >= 9 ? plaster : wall.userData.originalMaterial; });
  };
  const resize = () => {
    if (disposed) return;
    const width = host.clientWidth, height = host.clientHeight;
    camera.aspect = width / Math.max(height, 1); camera.zoom = Math.min(1, Math.max(0.45, camera.aspect / 1.5)); camera.updateProjectionMatrix(); renderer.setSize(width, height); dirty = true;
  };
  const observer = new ResizeObserver(resize);
  let down: { x: number; y: number } | null = null;
  const pointerDown = (raw: Event) => { const event = raw as PointerEvent; down = { x: event.clientX, y: event.clientY }; };
  const pointerUp = (raw: Event) => {
    const event = raw as PointerEvent;
    if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return;
    down = null;
    const rect = renderer.domElement.getBoundingClientRect();
    const ray = new Engine.Raycaster(); ray.setFromCamera(new Engine.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
    const hits = ray.intersectObjects(groups.filter((group) => group.visible), true);
    const hit = hits.find((entry) => { let object: THREE.Object3D | null = entry.object; while (object) { if (!object.visible) return false; object = object.parent; } return true; });
    if (!hit) return;
    let object: THREE.Object3D | null = hit.object;
    while (object && object.userData.stage === undefined) object = object.parent;
    if (object) options.onSelect(object.userData.stage);
  };
  const changed = () => { dirty = true; };
  const dispose = () => {
    if (disposed) return;
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
    renderer.domElement.removeEventListener("pointerdown", pointerDown); renderer.domElement.removeEventListener("pointerup", pointerUp);
    const materials = new Set<THREE.Material>([paint, plaster]); const maps = new Set<THREE.Texture>([blockMap, tileMap]);
    world.traverse((object) => {
      if (object instanceof Engine.Mesh || object instanceof Engine.Line) {
        object.geometry.dispose(); const values = Array.isArray(object.material) ? object.material : [object.material];
        values.forEach((value) => materials.add(value));
        if (object.userData.originalMaterial) materials.add(object.userData.originalMaterial);
      }
    });
    materials.forEach((value) => { const map = (value as THREE.MeshStandardMaterial).map; if (map) maps.add(map); value.dispose(); });
    maps.forEach((map) => map.dispose()); renderer.dispose?.(); renderer.domElement.remove();
  };
  try {
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", "Interactive 3D bungalow. Drag to rotate, scroll to zoom; select building parts to open their construction stage.");
    renderer.domElement.addEventListener("pointerdown", pointerDown); renderer.domElement.addEventListener("pointerup", pointerUp);
    controls.addEventListener("change", changed); observer.observe(host); resize(); update(stage, cutaway);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let previous = 0;
    const render = (time: number) => {
      if (disposed) return;
      const elapsed = previous ? Math.min((time - previous) / 1000, 0.05) : 0.016; previous = time;
      controls.update();
      groups.forEach((group, i) => {
        if (animated[i] < 1) { animated[i] = reduced ? 1 : Math.min(1, animated[i] + elapsed * 2.5); group.scale.y = 1 - (1 - animated[i]) ** 3; dirty = true; }
      });
      if (dirty && document.visibilityState !== "hidden") { renderer.render(world, camera); dirty = false; }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render); options.onReady();
  } catch (error) { console.error("Construction viewer initialization failed:", error); dispose(); options.onError(); }
  return { update, reset: () => { camera.position.copy(home); controls.target.set(0, 0.8, 0); controls.update(); dirty = true; }, dispose };
}
