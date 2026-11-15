import type * as THREE from "three";
import type { ModelId } from "../../lib/construction/learning";
import type { SceneEngine } from "./model-renderer";

export type Point = [number, number, number];
export type TeachingModelId = Exclude<ModelId, "bungalow">;
export type RoutePath = { points: Point[]; color: string; step: number; partId: string };
export type TeachingGeometry = { root: THREE.Group; context: THREE.Group; stages: THREE.Group[]; parts: Map<string, THREE.Group[]>; paths: RoutePath[]; focus: Record<string, { point: Point; radius: number }>; center: Point; radius: number };

export function buildTeachingModel(Engine: SceneEngine, id: TeachingModelId, software: boolean): TeachingGeometry {
  const root = new Engine.Group(), context = new Engine.Group();
  root.add(context);
  const count = id === "concrete-frame" || id === "steel-frame" ? 7 : 6;
  const stages = Array.from({ length: count }, (_, step) => { const group = new Engine.Group(); group.userData.step = step; root.add(group); return group; });
  const parts = new Map<string, THREE.Group[]>(), paths: RoutePath[] = [];
  const focus: TeachingGeometry["focus"] = {};
  const mat = (color: string, metalness = 0) => new Engine.MeshStandardMaterial({ color, roughness: 0.72, metalness });
  const box = (parent: THREE.Object3D, size: Point, position: Point, color: string | THREE.Material) => {
    const segment = (n: number) => software ? Math.max(1, Math.min(14, Math.ceil(n / 1.1))) : 1;
    const mesh = new Engine.Mesh(new Engine.BoxGeometry(...size, segment(size[0]), segment(size[1]), segment(size[2])), typeof color === "string" ? mat(color) : color);
    mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const sphere = (parent: THREE.Object3D, point: Point, radius: number, color: string | THREE.Material) => {
    const mesh = new Engine.Mesh(new Engine.SphereGeometry(radius, 8, 6), typeof color === "string" ? mat(color) : color); mesh.position.set(...point); parent.add(mesh); return mesh;
  };
  const cylinder = (parent: THREE.Object3D, a: Point, b: Point, radius: number, color: string | THREE.Material, sides = 8) => {
    const start = new Engine.Vector3(...a), end = new Engine.Vector3(...b), delta = end.clone().sub(start);
    const mesh = new Engine.Mesh(new Engine.CylinderGeometry(radius, radius, delta.length(), sides), typeof color === "string" ? mat(color) : color);
    mesh.position.copy(start.add(end).multiplyScalar(0.5)); mesh.quaternion.setFromUnitVectors(new Engine.Vector3(0, 1, 0), delta.normalize()); mesh.castShadow = true; parent.add(mesh); return mesh;
  };
  const beam = (parent: THREE.Object3D, a: Point, b: Point, width: number, depth: number, color: string, iSection = false) => {
    const start = new Engine.Vector3(...a), end = new Engine.Vector3(...b), delta = end.clone().sub(start), length = delta.length();
    const group = new Engine.Group(); group.position.copy(start.add(end).multiplyScalar(0.5)); group.quaternion.setFromUnitVectors(new Engine.Vector3(0, 1, 0), delta.normalize()); parent.add(group);
    if (iSection) {
      box(group, [width, length, depth * 0.08], [0, 0, depth * 0.46], color);
      box(group, [width, length, depth * 0.08], [0, 0, -depth * 0.46], color);
      box(group, [width * 0.09, length, depth * 0.84], [0, 0, 0], color);
    } else box(group, [width, length, depth], [0, 0, 0], color);
    return group;
  };
  const pipe = (parent: THREE.Object3D, points: Point[], radius: number, color: string) => {
    const material = mat(color, 0.08);
    for (let n = 0; n < points.length - 1; n++) cylinder(parent, points[n], points[n + 1], radius, material);
    for (let n = 1; n < points.length - 1; n++) sphere(parent, points[n], radius * 1.09, material);
  };
  const part = (partId: string, step: number) => {
    const group = new Engine.Group(); group.userData.partId = partId; group.userData.step = step;
    stages[step].add(group); parts.set(partId, [...parts.get(partId) ?? [], group]); return group;
  };
  const base = (w: number, d: number) => {
    const ground = box(context, [w, 0.15, d], [0, -0.17, 0], "#34475d"); ground.renderOrder = software ? -100 : 0;
    const grid = new Engine.GridHelper(Math.max(w, d), Math.max(w, d), 0x8d9e90, 0xb0bcae); grid.position.y = -0.085; context.add(grid);
  };
  const section = (object: THREE.Object3D) => { object.userData.hideInSection = true; return object; };
  const shell = () => {
    base(16, 12);
    box(context, [8, 0.17, 6], [0, 0.02, 0], "#729fbd");
    box(context, [8, 0.15, 3.4], [0, 3.15, -1.3], "#729fbd");
    section(box(context, [8, 0.15, 2.6], [0, 3.15, 1.7], "#729fbd"));
    section(box(context, [8, 0.15, 6], [0, 6.35, 0], "#729fbd"));
    box(context, [8, 6.25, 0.13], [0, 3.1, -3], "#b7cadb");
    box(context, [0.13, 6.25, 6], [-4, 3.1, 0], "#b7cadb");
    section(box(context, [8, 6.25, 0.13], [0, 3.1, 3], "#b7cadb"));
    section(box(context, [0.13, 6.25, 6], [4, 3.1, 0], "#b7cadb"));
    for (const x of [-4, 4]) for (const z of [-3, 3]) box(context, [0.2, 6.4, 0.2], [x, 3.1, z], "#4b688a");
  };

  let center: Point = [0, 2.5, 0], radius = 10;
  if (id === "concrete-frame") {
    base(19, 17); center = [0, 5.7, 0]; radius = 11;
    const supports = part("rc-footings", 0);
    for (const x of [-6, -2, 2, 6]) for (const z of [-5, 0, 5]) box(supports, [1.55, 0.45, 1.55], [x, 0.15, z], "#8396b0");
    for (const z of [-5, 0, 5]) box(supports, [12.2, 0.3, 0.32], [0, 0.42, z], "#8396b0");
    for (const x of [-6, -2, 2, 6]) box(supports, [0.32, 0.3, 10.2], [x, 0.42, 0], "#8396b0");
    const columns = part("rc-columns", 1), core = part("rc-core", 1);
    const coreLift = (parent: THREE.Group, bottom: number, height: number) => {
      box(parent, [0.2, height, 4.25], [-1.7, bottom + height / 2, 0], "#8548a0");
      box(parent, [3.6, height, 0.2], [0, bottom + height / 2, -2.1], "#8548a0");
      section(box(parent, [0.2, height, 4.25], [1.7, bottom + height / 2, 0], "#8548a0"));
    };
    for (const x of [-6, -2, 2, 6]) for (const z of [-5, 0, 5]) box(columns, [0.38, 3, 0.38], [x, 1.95, z], "#397bb3");
    coreLift(core, 0.45, 3);
    const floor = (parent: THREE.Group, y: number) => {
      for (const z of [-5, 5]) box(parent, [12.35, 0.4, 0.3], [0, y - 0.13, z], "#397bb3");
      for (const x of [-6, -2, 2, 6]) box(parent, [0.3, 0.4, 10.3], [x, y - 0.13, 0], "#397bb3");
      for (const x of [-4, 4]) box(parent, [4, 0.4, 0.3], [x, y - 0.13, 0], "#397bb3");
      for (const x of [-4, 4]) box(parent, [4.05, 0.18, 10.2], [x, y + 0.12, 0], "#cc9149");
      for (const z of [-3.6, 3.6]) box(parent, [4, 0.18, 3], [0, y + 0.12, z], "#cc9149");
    };
    const first = part("rc-first", 2); floor(first, 3.45);
    const props = new Engine.Group(); stages[2].add(props); props.userData.removeAfter = 3;
    for (const x of [-4.5, 4.5]) for (const z of [-3.5, 3.5]) cylinder(props, [x, 0.5, z], [x, 3.25, z], 0.055, "#be985f");
    const upper = part("rc-upper", 3), upperCore = part("rc-core", 3);
    for (let level = 1; level < 4; level++) {
      for (const x of [-6, -2, 2, 6]) for (const z of [-5, 0, 5]) box(upper, [0.38, 3, 0.38], [x, 1.95 + level * 3, z], "#397bb3");
      floor(upper, 3.45 + level * 3);
    }
    coreLift(upperCore, 3.45, 9);
    const stairs = part("rc-stairs", 4);
    for (let level = 0; level < 4; level++) {
      for (let n = 0; n < 8; n++) {
        box(stairs, [1.25, 0.12, 0.37], [-0.72, 0.55 + level * 3 + n * 0.1875, -1.55 + n * 0.35], "#ded9c8");
        box(stairs, [1.25, 0.12, 0.37], [0.72, 2.05 + level * 3 + n * 0.1875, 0.9 - n * 0.35], "#ded9c8");
      }
      box(stairs, [2.8, 0.15, 0.85], [0, 1.92 + level * 3, 1.35], "#ded9c8");
      cylinder(stairs, [-1.35, 1.4 + level * 3, -1.5], [-1.35, 2.8 + level * 3, 1.3], 0.025, "#b19c70");
    }
    const envelope = part("rc-envelope", 5);
    for (const z of [-5.17, 5.17]) for (let level = 0; level < 4; level++) for (let x = -5.25; x < 6; x += 1.5) {
      const panel = box(envelope, [1.35, 2.65, 0.06], [x, 1.9 + level * 3, z], "#54b8db");
      if (z > 0) section(panel);
    }
    for (const x of [-6.17, 6.17]) for (let level = 0; level < 4; level++) {
      const panel = box(envelope, [0.06, 2.65, 10], [x, 1.9 + level * 3, 0], "#54b8db"); if (x > 0) section(panel);
    }
    for (const x of [-6, 6]) paths.push({ partId: "rc-columns", step: 3, color: "#e0ae4c", points: [[x > 0 ? 4 : -4, 12.7, 5], [x, 12.7, 5], [x, 0.6, 5], [x, 0.1, 5]] });
    focus["rc-stairs"] = { point: [0, 5, 0], radius: 4.5 };
  }
  if (id === "truss-bridge") {
    base(23, 12); center = [0, 2, 0]; radius = 11;
    box(context, [14, 0.025, 9], [0, -0.07, 0], "#a8c0ba");
    const supports = part("bridge-supports", 0), bearings = part("bridge-bearings", 1), trusses = part("bridge-trusses", 2), cross = part("bridge-cross", 3), deck = part("bridge-deck", 4), rails = part("bridge-rails", 4);
    for (const x of [-9, 9]) {
      box(supports, [2, 1.8, 6.4], [x, 0.78, 0], "#8497b5");
      for (const z of [-2.5, 2.5]) box(bearings, [0.7, 0.16, 0.75], [x, 1.76, z], "#e9ac29");
    }
    for (const z of [-2.5, 2.5]) {
      const side = new Engine.Group(), railSide = new Engine.Group(); trusses.add(side); rails.add(railSide);
      if (z > 0) { section(side); section(railSide); }
      beam(side, [-9, 2, z], [9, 2, z], 0.24, 0.3, "#2459a6"); beam(side, [-9, 5.2, z], [9, 5.2, z], 0.24, 0.3, "#2459a6");
      for (let n = 0; n <= 6; n++) {
        const x = -9 + n * 3; beam(side, [x, 2, z], [x, 5.2, z], 0.16, 0.18, "#376ec0");
        if (n < 6) beam(side, [x, n % 2 ? 5.2 : 2, z], [x + 3, n % 2 ? 2 : 5.2, z], 0.18, 0.2, "#2459a6");
        box(side, [0.4, 0.4, 0.045], [x, 2, z + (z > 0 ? 0.17 : -0.17)], "#bdad84");
      }
      beam(railSide, [-9, 3.5, z], [9, 3.5, z], 0.05, 0.05, "#b6b4a4");
      for (let x = -9; x <= 9; x += 1.5) beam(railSide, [x, 2.4, z], [x, 3.5, z], 0.04, 0.04, "#b6b4a4");
    }
    for (let x = -9; x <= 9; x += 3) {
      beam(cross, [x, 2.15, -2.5], [x, 2.15, 2.5], 0.2, 0.28, "#4f78bb");
      beam(cross, [x, 5.2, -2.5], [x, 5.2, 2.5], 0.12, 0.14, "#4f78bb");
      if (x < 9) box(deck, [2.94, 0.18, 4.9], [x + 1.5, 2.38, 0], "#d9a755");
    }
    for (const x of [-9, 6]) {
      beam(cross, [x, 5.2, -2.5], [x + 3, 5.2, 2.5], 0.075, 0.075, "#df693e");
      beam(cross, [x, 5.2, 2.5], [x + 3, 5.2, -2.5], 0.075, 0.075, "#df693e");
    }
    paths.push({ partId: "bridge-trusses", step: 4, color: "#e0ae4c", points: [[0, 2.6, 0], [0, 2.6, 2.5], [3, 5.25, 2.5], [9, 5.25, 2.5], [9, 1.7, 2.5], [9, 0.1, 2.5]] });
    focus["bridge-bearings"] = { point: [9, 1.8, 2.5], radius: 1.5 };
  }
  if (id === "steel-frame") {
    base(21, 17); center = [0, 2.3, 0]; radius = 10;
    const supports = part("steel-supports", 0), bases = part("steel-bases", 1), portals = part("steel-portals", 2), braces = part("steel-bracing", 3), joints = part("steel-connections", 3), secondary = part("steel-secondary", 4), covering = part("steel-cladding", 5);
    const frames = [-6, -3, 0, 3, 6];
    for (const x of frames) for (const z of [-5, 5]) {
      box(supports, [1.35, 0.4, 1.35], [x, 0.1, z], "#899bb8");
      box(bases, [0.78, 0.08, 0.78], [x, 0.35, z], "#cdc1a1"); box(bases, [0.84, 0.08, 0.84], [x, 0.43, z], "#e9ac29");
      for (const dx of [-0.28, 0.28]) for (const dz of [-0.28, 0.28]) {
        cylinder(bases, [x + dx, 0.22, z + dz], [x + dx, 0.65, z + dz], 0.035, "#a3adb1");
        cylinder(bases, [x + dx, 0.5, z + dz], [x + dx, 0.59, z + dz], 0.075, "#a3adb1", 6);
      }
      beam(portals, [x, 0.48, z], [x, 4.7, z], 0.26, 0.42, "#2459a6", true);
      beam(portals, [x, 4.7, z], [x, 6.4, 0], 0.26, 0.42, "#2459a6", true);
      box(joints, [0.065, 0.8, 0.55], [x + 0.17, 4.65, z], "#e9ac29");
      for (const dy of [-0.23, 0.23]) for (const dz of [-0.15, 0.15]) cylinder(joints, [x + 0.12, 4.65 + dy, z + dz], [x + 0.25, 4.65 + dy, z + dz], 0.055, "#b4bec0", 6);
    }
    const temporary = new Engine.Group(); stages[2].add(temporary); temporary.userData.removeAfter = 3;
    for (const z of [-5, 5]) cylinder(temporary, [-6, 4.7, z], [-8.5, 0.1, z > 0 ? 7.5 : -7.5], 0.025, "#c6a16b");
    for (const z of [-5, 5]) for (const x of [-6, 3]) {
      cylinder(braces, [x, 0.65, z], [x + 3, 4.7, z], 0.065, "#df693e"); cylinder(braces, [x + 3, 0.65, z], [x, 4.7, z], 0.065, "#df693e");
    }
    for (const x of [-6, 3]) {
      cylinder(braces, [x, 4.8, 5], [x + 3, 6.5, 0], 0.05, "#df693e"); cylinder(braces, [x + 3, 4.8, 5], [x, 6.5, 0], 0.05, "#df693e");
    }
    for (const z of [-5, -2.5, 0, 2.5, 5]) {
      const y = 6.55 - Math.abs(z) * 0.34;
      beam(secondary, [-6.3, y, z], [6.3, y, z], 0.12, 0.15, "#6fa8b8");
    }
    for (const z of [-5, 5]) for (const y of [1.7, 3.1]) beam(secondary, [-6.2, y, z], [6.2, y, z], 0.1, 0.15, "#6fa8b8");
    for (const side of [-1, 1]) {
      const roof = box(covering, [13, 0.06, 5.6], [0, 5.65, side * 2.65], "#234c74"); roof.rotation.x = side * Math.atan(0.34); section(roof);
      section(box(covering, [12.8, 4.2, 0.045], [0, 2.6, side * 5.1], "#5c8b9d"));
    }
    for (const x of [-6.4, 6.4]) {
      if (x < 0) section(box(covering, [0.06, 4.2, 10.2], [x, 2.6, 0], "#5c8b9d"));
      else {
        for (const z of [-3.2, 3.2]) section(box(covering, [0.06, 4.2, 3.8], [x, 2.6, z], "#5c8b9d"));
        section(box(covering, [0.06, 1.5, 2.6], [x, 3.95, 0], "#5c8b9d"));
        section(box(covering, [0.08, 2.7, 2.6], [x + 0.02, 1.85, 0], "#28b4ce"));
      }
      const geometry = new Engine.BufferGeometry(); geometry.setAttribute("position", new Engine.Float32BufferAttribute([x, 4.7, -5.1, x, 4.7, 5.1, x, 6.4, 0], 3)); geometry.computeVertexNormals(); const material = mat("#5c8b9d"); material.side = 2; const gable = new Engine.Mesh(geometry, material); section(gable); covering.add(gable);
    }
    paths.push({ partId: "steel-portals", step: 2, color: "#e0ae4c", points: [[6, 6.5, 0], [6, 4.7, 5], [6, 0.5, 5], [6, 0.05, 5]] });
    focus["steel-bases"] = { point: [6, 0.48, 5], radius: 1.25 }; focus["steel-connections"] = { point: [6, 4.7, 5], radius: 1.7 };
  }
  if (id === "plumbing") {
    shell(); center = [0.5, 2.8, 0.5]; radius = 9;
    const source = part("plumb-source", 0), cold = part("plumb-cold", 1), heaters = part("plumb-heaters", 2), hot = part("plumb-hot", 2), waste = part("plumb-waste", 3), vent = part("plumb-vent", 3), traps = part("plumb-traps", 4);
    cylinder(source, [-6, 0.15, 2], [-6, 2, 2], 0.8, "#567c88", 16); box(source, [0.65, 0.45, 0.55], [-4.8, 0.35, 2], "#c5a568");
    pipe(source, [[-6, 0.3, 2], [-4.8, 0.3, 2]], 0.09, "#1479d0");
    pipe(cold, [[-4.8, 0.45, 2], [-3.5, 0.45, 2], [-3.5, 6, 2]], 0.075, "#1479d0");
    for (const floor of [0, 3.2]) {
      const level = floor + 0.18;
      for (const x of [-2, 0, 2.5]) {
        pipe(cold, [[-3.5, level + 1.3, 2], [x, level + 1.3, 2], [x, level + 0.9, 1.3]], 0.055, "#1479d0");
        sphere(cold, [x, level + 1.3, 2], 0.11, "#c3a363");
      }
      cylinder(heaters, [1.1, level + 1.6, 2.4], [1.1, level + 2.3, 2.4], 0.28, "#dbd8c5", 12);
      pipe(cold, [[1.1, level + 1.3, 2], [1.1, level + 1.6, 2.4]], 0.055, "#1479d0");
      for (const x of [0, 2.5]) pipe(hot, [[1.1, level + 1.65, 2.4], [1.3, level + 1.65, 2.2], [x + 0.18, level + 1.65, 2.2], [x + 0.18, level + 0.9, 1.3]], 0.05, "#e14a3b");
      box(cold, [0.55, 0.45, 0.75], [-2, level + 0.3, 1.3], "#ece8d8"); box(cold, [0.55, 0.65, 0.18], [-2, level + 0.55, 1], "#ece8d8");
      box(cold, [0.6, 0.16, 0.45], [0, level + 0.92, 1.3], "#ece8d8"); box(cold, [0.9, 0.08, 0.9], [2.5, level + 0.06, 1.3], "#ece8d8");
      box(hot, [0.36, 0.13, 0.12], [2.59, level + 0.9, 1.3], "#b7b8a6");
      pipe(hot, [[2.59, level + 0.97, 1.3], [2.59, level + 2.05, 1.3], [2.59, level + 2.05, 0.95]], 0.045, "#bc9277");
      cylinder(hot, [2.59, level + 2, 0.95], [2.59, level + 2.07, 0.95], 0.13, "#bcc3bb", 12);
      pipe(waste, [[-2, level + 0.18, 1.3], [4.8, level + 0.1, 1.4]], 0.09, "#9d6130");
      pipe(waste, [[0.45, level + 0.65, 1.3], [4.8, level + 0.4, 1.4]], 0.065, "#9d6130");
      pipe(waste, [[2.5, level + 0.04, 1.3], [4.8, level + 0.025, 1.4]], 0.055, "#9d6130");
      cylinder(traps, [2.5, level + 0.04, 1.3], [2.5, level + 0.09, 1.3], 0.13, "#8c968b", 10);
      pipe(traps, [[0, level + 0.85, 1.3], [0, level + 0.4, 1.3], [0.22, level + 0.3, 1.3], [0.45, level + 0.4, 1.3], [0.45, level + 0.65, 1.3]], 0.065, "#9d6130");
    }
    pipe(waste, [[4.8, 3.78, 1.4], [4.8, 0.2, 1.4], [6.3, 0.05, 3.5]], 0.12, "#9d6130");
    pipe(vent, [[4.8, 3.78, 1.4], [4.8, 7.35, 1.4]], 0.09, "#149775");
    box(traps, [1.15, 0.55, 1.15], [6.3, -0.08, 3.5], "#a0ada2"); box(traps, [0.95, 0.06, 0.95], [6.3, 0.22, 3.5], "#71877b");
    paths.push({ partId: "plumb-cold", step: 1, color: "#1479d0", points: [[-6, 0.4, 2], [-3.5, 0.4, 2], [-3.5, 4.68, 2], [0, 4.68, 2], [0, 4.28, 1.3]] }, { partId: "plumb-hot", step: 2, color: "#e14a3b", points: [[1.1, 5.03, 2.4], [1.3, 5.03, 2.2], [2.68, 5.03, 2.2], [2.68, 4.28, 1.3]] }, { partId: "plumb-waste", step: 3, color: "#ad865e", points: [[-2, 3.56, 1.3], [4.8, 3.48, 1.4], [4.8, 0.2, 1.4], [6.3, 0.05, 3.5]] });
    focus["plumb-traps"] = { point: [0.2, 0.8, 1.3], radius: 1.1 }; focus["plumb-heaters"] = { point: [1.1, 5.2, 2.4], radius: 1.2 };
  }
  if (id === "electrical") {
    shell(); center = [-0.3, 2.5, 0.4]; radius = 9;
    const supply = part("elec-supply", 0), board = part("elec-board", 1), earth = part("elec-earth", 1), lights = part("elec-lights", 2), sockets = part("elec-sockets", 3), dedicated = part("elec-dedicated", 4);
    box(supply, [0.2, 4.8, 0.2], [-6.2, 2.3, 3], "#72877e"); box(supply, [0.55, 0.8, 0.25], [-4.1, 1.8, 3.25], "#9eaba5");
    pipe(supply, [[-6.2, 4.5, 3], [-4.1, 2.1, 3.3], [-2.8, 2.1, 3.3]], 0.055, "#4a6165");
    box(board, [0.95, 1.2, 0.28], [-2.8, 2.1, 3.3], "#e2dfcc");
    for (let n = 0; n < 6; n++) {
      box(board, [0.1, 0.25, 0.09], [-3.15 + n * 0.14, 2.16, 3.5], n < 2 ? "#e3a500" : n < 4 ? "#008fad" : "#8d40c7");
      box(board, [0.07, 0.08, 0.06], [-3.15 + n * 0.14, 2.2, 3.57], "#456069");
    }
    pipe(earth, [[-2.8, 1.55, 3.3], [-2.8, 0.1, 3.3], [-5.1, 0.1, 3.3], [-5.1, -0.65, 3.3]], 0.05, "#61ab42");
    cylinder(earth, [-5.1, 0.15, 3.3], [-5.1, -0.7, 3.3], 0.07, "#b0955d");
    for (const floor of [0, 3.2]) {
      const lightY = floor + 2.9;
      for (const x of [-1.5, 2]) {
        const route: Point[] = [[-2.8, 2.4, 3.4], [-2.8, lightY, 3.4], [x, lightY, 3.4], [x, lightY, 1.1]];
        pipe(lights, route, 0.045, "#e3a500"); cylinder(lights, [x, lightY - 0.08, 1.1], [x, lightY + 0.02, 1.1], 0.25, "#eddb9b", 12);
        paths.push({ partId: "elec-lights", step: 2, color: "#e3a500", points: route });
      }
      for (const x of [-0.5, 2.8]) {
        const route: Point[] = [[-2.8, 1.9, 3.4], [-2.45, 1.9, 3.4], [-2.45, floor + 1.1, 2.7], [x, floor + 1.1, 2.7], [x, floor + 0.55, 2.7]];
        pipe(sockets, route, 0.045, "#008fad"); box(sockets, [0.3, 0.22, 0.08], [x, floor + 0.55, 2.7], "#e5e3d5");
        box(sockets, [0.025, 0.06, 0.015], [x - 0.05, floor + 0.55, 2.75], "#4b6570"); box(sockets, [0.025, 0.06, 0.015], [x + 0.05, floor + 0.55, 2.75], "#4b6570");
        paths.push({ partId: "elec-sockets", step: 3, color: "#008fad", points: route });
      }
    }
    const ac: Point[] = [[-2.8, 2.3, 3.4], [-2.3, 2.3, 3.4], [-2.3, 5.5, 2.8], [2.7, 5.5, 2.8], [2.7, 5.5, -2.8]];
    const heater: Point[] = [[-2.8, 2.3, 3.4], [-2.2, 2.3, 3.4], [3, 2.3, 2.8], [3, 2.3, 1.3]];
    pipe(dedicated, ac, 0.055, "#8d40c7"); pipe(dedicated, heater, 0.055, "#8d40c7");
    box(dedicated, [1.3, 0.4, 0.3], [2.7, 5.5, -2.75], "#e0e0d4"); cylinder(dedicated, [3, 1.8, 1.3], [3, 2.6, 1.3], 0.27, "#e0e0d4", 12);
    paths.push({ partId: "elec-dedicated", step: 4, color: "#8d40c7", points: ac }, { partId: "elec-dedicated", step: 4, color: "#8d40c7", points: heater });
    focus["elec-board"] = { point: [-2.8, 2.1, 3.3], radius: 1.1 }; focus["elec-earth"] = { point: [-5, 0, 3.3], radius: 1.6 };
  }
  return { root, context, stages, parts, paths, focus, center, radius };
}
