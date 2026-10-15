import * as THREE from "three";

import { RATE_3D_SLUGS } from "./slugs";

/**
 * Parametric 3D templates for rate build-ups. Each part is tied to a rate line
 * id, so clicking a part shows that line's quantity and cost. Parts move along
 * `dir` as the explode factor goes from 0 (assembled) to 1 (exploded).
 */
export type ScenePart = {
  /** Rate line id(s) this part represents; a mortar bed is cement + sand. */
  lineId: string | string[];
  object: THREE.Object3D;
  dir: THREE.Vector3;
  /** Only shown when exploded (e.g. the cement and sand inside the mortar). */
  appearOnExplode?: boolean;
};

export type RateScene = {
  parts: ScenePart[];
  colors: Record<string, string>;
  cameraDistance: number;
  target: THREE.Vector3;
};

const box = (w: number, h: number, d: number, color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts }));

const at = <T extends THREE.Object3D>(object: T, x: number, y: number, z: number) => {
  object.position.set(x, y, z);
  return object;
};

function blockwork(thickness: number, prefix: string): RateScene {
  const colors = {
    [prefix]: "#B8B2A6",
    [`${prefix}-cem`]: "#8E9399",
    [`${prefix}-sand`]: "#D9B77A",
  };
  const parts: ScenePart[] = [];
  const L = 0.45;
  const H = 0.225;
  const joint = 0.01;
  const courses = 4;
  const wallWidth = 2 * L + joint;

  for (let c = 0; c < courses; c += 1) {
    const y = joint + c * (H + joint) + H / 2;
    // Stretcher bond: even courses two full blocks, odd courses half + full + half.
    const pieces = c % 2 === 0 ? [L, L] : [L / 2 - joint / 2, L, L / 2 - joint / 2];
    let x = -wallWidth / 2;
    for (const len of pieces) {
      const cx = x + len / 2;
      const block = at(box(len, H, thickness, colors[prefix]), cx, y, 0);
      parts.push({ lineId: prefix, object: block, dir: new THREE.Vector3(cx * 0.7, (y - 0.47) * 0.8, 0) });
      x += len + joint;
    }
    // Mortar bed under each course.
    const bedY = c * (H + joint) + joint / 2;
    const bed = at(box(wallWidth, joint, thickness, "#C9C5BC"), 0, bedY, 0);
    parts.push({ lineId: [`${prefix}-cem`, `${prefix}-sand`], object: bed, dir: new THREE.Vector3(0, (bedY - 0.47) * 0.8, 0.3) });
  }

  // Mortar ingredients appear beside the wall when exploded.
  const bag = at(box(0.32, 0.1, 0.48, colors[`${prefix}-cem`]), 0.95, 0.05, 0.35);
  parts.push({ lineId: `${prefix}-cem`, object: bag, dir: new THREE.Vector3(0.25, 0, 0.1), appearOnExplode: true });
  const sand = at(
    new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 24), new THREE.MeshStandardMaterial({ color: colors[`${prefix}-sand`], roughness: 1 })),
    -0.95,
    0.1,
    0.35,
  );
  parts.push({ lineId: `${prefix}-sand`, object: sand, dir: new THREE.Vector3(-0.25, 0, 0.1), appearOnExplode: true });

  return { parts, colors, cameraDistance: 3.3, target: new THREE.Vector3(0, 0.45, 0) };
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
  const parts: ScenePart[] = [];
  const size = 0.3;
  const height = 2.4;
  const ply = 0.018;
  const faces = [
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
  ];

  // Concrete column shown as a ghost for context (not part of this rate).
  const core = at(box(size, height, size, "#9AA3AD", { transparent: true, opacity: 0.18 }), 0, height / 2, 0);
  parts.push({ lineId: "__context", object: core, dir: new THREE.Vector3() });

  faces.forEach((n, i) => {
    const alongX = n.z !== 0; // panel lies in the X direction
    const width = i < 2 ? size : size + 2 * ply;
    const off = size / 2 + ply / 2;
    const panel = at(box(alongX ? width : ply, height, alongX ? ply : width, colors[`${prefix}-ply`]), n.x * off, height / 2, n.z * off);
    parts.push({ lineId: `${prefix}-ply`, object: panel, dir: n.clone().multiplyScalar(0.35) });

    // Two vertical 2x3 studs on each face.
    [-0.09, 0.09].forEach((s) => {
      const so = off + ply / 2 + 0.0375;
      const stud = at(box(alongX ? 0.05 : 0.075, height, alongX ? 0.075 : 0.05, colors[`${prefix}-2x3`]), n.x * so + (alongX ? s : 0), height / 2, n.z * so + (alongX ? 0 : s));
      parts.push({ lineId: `${prefix}-2x3`, object: stud, dir: n.clone().multiplyScalar(0.65) });
    });

    // 2x6 walers (yokes) at four levels.
    [0.3, 0.9, 1.5, 2.1].forEach((y) => {
      const wo = off + ply / 2 + 0.075 + 0.025;
      const len = size + 0.5;
      const waler = at(box(alongX ? len : 0.05, 0.15, alongX ? 0.05 : len, colors[`${prefix}-2x6`]), n.x * wo, y, n.z * wo);
      parts.push({ lineId: `${prefix}-2x6`, object: waler, dir: n.clone().multiplyScalar(0.95).add(new THREE.Vector3(0, (y - 1.2) * 0.25, 0)) });
    });
  });

  // 2x2 diagonal braces on two faces, from ground to two-thirds height.
  [faces[0], faces[2]].forEach((n) => {
    const foot = n.clone().multiplyScalar(1.1);
    const top = n.clone().multiplyScalar(0.24).add(new THREE.Vector3(0, 1.6, 0));
    const vec = top.clone().sub(foot);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.05, vec.length(), 0.05), new THREE.MeshStandardMaterial({ color: colors[`${prefix}-2x2`], roughness: 0.85 }));
    brace.position.copy(foot.clone().add(top).multiplyScalar(0.5));
    brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec.clone().normalize());
    parts.push({ lineId: `${prefix}-2x2`, object: brace, dir: n.clone().multiplyScalar(0.6) });
  });

  // Consumables appear beside the column when exploded.
  const nailBag = at(box(0.25, 0.12, 0.35, colors[`${prefix}-nail`]), -1.0, 0.06, 0.8);
  parts.push({ lineId: `${prefix}-nail`, object: nailBag, dir: new THREE.Vector3(-0.2, 0, 0.1), appearOnExplode: true });
  const can = at(
    new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.28, 24), new THREE.MeshStandardMaterial({ color: colors[`${prefix}-release`], roughness: 0.5 })),
    1.0,
    0.14,
    0.8,
  );
  parts.push({ lineId: `${prefix}-release`, object: can, dir: new THREE.Vector3(0.2, 0, 0.1), appearOnExplode: true });

  return { parts, colors, cameraDistance: 4.2, target: new THREE.Vector3(0, 1.1, 0) };
}

const TEMPLATES: Record<(typeof RATE_3D_SLUGS)[number], () => RateScene> = {
  "230mm-hollow-sandcrete-blockwork": () => blockwork(0.225, "block225"),
  "150mm-hollow-sandcrete-blockwork": () => blockwork(0.15, "block150"),
  "plywood-formwork-columns": () => columnFormwork("fwc"),
};

export const buildRateScene = (slug: string): RateScene | undefined =>
  (TEMPLATES as Record<string, () => RateScene>)[slug]?.();
