import * as THREE from "three";

import type { RateBankItem, RateCostLine } from "@/lib/rates/defaults";
import type { RateScene } from "./scenes";

/**
 * Category-specific parametric models for Rate Bank entries that do not yet
 * have a hand-authored scene. These are interactive scope illustrations:
 * quantities and dimensions must still be checked against the project drawings.
 */

type Vec3 = [number, number, number];

const vec = (v: Vec3) => new THREE.Vector3(v[0], v[1], v[2]);

function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
}

function surfaceTexture(base: string, accent: string, seed: number, repeat = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  const rnd = seeded(seed);
  for (let i = 0; i < 2800; i += 1) {
    ctx.globalAlpha = 0.035 + rnd() * 0.16;
    ctx.fillStyle = accent;
    const w = 1 + rnd() * 2.2;
    const h = 1 + rnd() * 2.2;
    ctx.fillRect(rnd() * 256, rnd() * 256, w, h);
  }
  ctx.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  return texture;
}

function standardMaterial(
  color: string,
  options: Partial<THREE.MeshStandardMaterialParameters> = {},
) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0,
    ...options,
  });
}

function box(
  width: number,
  height: number,
  depth: number,
  x: number,
  y: number,
  z: number,
  color: string,
  options: Partial<THREE.MeshStandardMaterialParameters> = {},
) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    standardMaterial(color, options),
  );
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function sphere(radius: number, x: number, y: number, z: number, color: string) {
  const object = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 16, 12),
    standardMaterial(color, { roughness: 0.68 }),
  );
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function rod(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  color: string,
  metalness = 0.2,
  radialSegments = 10,
) {
  const axis = end.clone().sub(start);
  const object = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, axis.length(), radialSegments),
    standardMaterial(color, { roughness: 0.48, metalness }),
  );
  object.position.copy(start.clone().add(end).multiplyScalar(0.5));
  object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function worker(scale = 1) {
  const g = new THREE.Group();
  g.add(box(0.23, 0.44, 0.14, 0, 0.92, 0, "#E87B24", { roughness: 0.78 }));
  g.add(box(0.085, 0.36, 0.1, -0.07, 0.37, 0, "#24384D"));
  g.add(box(0.085, 0.36, 0.1, 0.07, 0.37, 0, "#24384D"));
  g.add(box(0.09, 0.38, 0.09, -0.17, 0.93, 0, "#D9A77C"));
  g.add(box(0.09, 0.38, 0.09, 0.17, 0.93, 0, "#D9A77C"));
  g.add(sphere(0.105, 0, 1.25, 0, "#B9825B"));
  g.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.122, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    standardMaterial("#F2B544", { roughness: 0.7 }),
  ));
  g.scale.setScalar(scale);
  g.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return g;
}

function smallTruck(scale = 1) {
  const g = new THREE.Group();
  g.add(box(0.68, 0.22, 0.34, 0, 0.25, 0, "#D2D9E0", { roughness: 0.48, metalness: 0.15 }));
  g.add(box(0.26, 0.28, 0.32, -0.2, 0.48, 0, "#E39B2D", { roughness: 0.45, metalness: 0.1 }));
  g.add(box(0.1, 0.13, 0.34, 0.22, 0.42, 0, "#8F9EAB"));
  [-0.23, 0.23].forEach((x) => {
    [-0.17, 0.17].forEach((z) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.055, 16),
        standardMaterial("#202832", { roughness: 0.96 }),
      );
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.12, z);
      g.add(wheel);
    });
  });
  g.scale.setScalar(scale);
  g.traverse((child) => {
    if (child instanceof THREE.Mesh) child.castShadow = true;
  });
  return g;
}

function pile(height: number, color: string, seed: number) {
  const object = new THREE.Mesh(
    new THREE.ConeGeometry(height * 0.78, height, 32),
    standardMaterial("#FFFFFF", {
      map: surfaceTexture(color, "#453B2E", seed, 1.2),
      roughness: 1,
    }),
  );
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function corrugatedSheet(width: number, length: number, color: string) {
  const shape = new THREE.Shape();
  const pitch = 0.18;
  const rib = 0.035;
  shape.moveTo(-width / 2, 0);
  for (let x = -width / 2; x < width / 2; x += pitch) {
    shape.lineTo(Math.min(x + pitch * 0.25, width / 2), 0);
    shape.lineTo(Math.min(x + pitch * 0.4, width / 2), rib);
    shape.lineTo(Math.min(x + pitch * 0.6, width / 2), rib);
    shape.lineTo(Math.min(x + pitch * 0.75, width / 2), 0);
    shape.lineTo(Math.min(x + pitch, width / 2), 0);
  }
  shape.lineTo(width / 2, -0.008);
  shape.lineTo(-width / 2, -0.008);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false });
  geometry.translate(0, 0, -length / 2);
  const object = new THREE.Mesh(
    geometry,
    standardMaterial(color, { metalness: 0.48, roughness: 0.42, side: THREE.DoubleSide }),
  );
  object.castShadow = true;
  object.receiveShadow = true;
  return object;
}

function colourForLine(line: RateCostLine) {
  const text = (line.id + " " + line.label).toLowerCase();
  if (/cement|concrete|mortar|grout/.test(text)) return "#92979B";
  if (/sand|laterite|hardcore|soil|granite|aggregate|stone/.test(text)) return "#C4A477";
  if (/rebar|reinforc|steel|rod|mesh|nail|bolt|screw|metal/.test(text)) return "#697783";
  if (/plywood|timber|wood|carpentry|waler|rafter/.test(text)) return "#B9824C";
  if (/cable|wire|electri|conduit|switch|socket/.test(text)) return "#E39B2D";
  if (/pipe|plumb|drain|water|sanitary|pvc/.test(text)) return "#3D8AB8";
  if (/tile|ceramic|marble|granite finish|paver|kerb/.test(text)) return "#A7ADB4";
  if (line.category === "labour") return "#E87B24";
  if (line.category === "plant") return "#D9A42F";
  if (line.category === "logistics") return "#50677C";
  return "#9CABA8";
}

type Family =
  | "earthworks"
  | "concrete"
  | "masonry"
  | "formwork"
  | "reinforcement"
  | "roofing"
  | "finishes"
  | "openings"
  | "plumbing"
  | "electrical"
  | "steel"
  | "membrane"
  | "ceiling"
  | "paving"
  | "general";

function familyFor(item: RateBankItem): Family {
  const text = (item.section + " " + item.title + " " + item.specification + " " + item.slug).toLowerCase();
  if (/waterproof|damp-proof|dpm|bitumen membrane|polythene membrane/.test(text)) return "membrane";
  if (/earthworks/.test(item.section.toLowerCase()) || /excavat|trench|backfill|laterite|hardcore|sand filling|bulk fill|compaction/.test(text)) return "earthworks";
  if (/formwork|shuttering|plywood form|slab soffit|column form/.test(text)) return "formwork";
  if (/reinforcement|rebar|brc mesh|steel bar|bar bending|binding wire/.test(text)) return "reinforcement";
  if (/roofing|roof cover|roof sheet|rafter|purlin|ridge cap|flashing|gutter/.test(text)) return "roofing";
  if (/door|window|glazing|glass panel|aluminium frame|aluminum frame/.test(text)) return "openings";
  if (/plumb|drain|soil pipe|waste pipe|water supply|sanitary|manhole|gully|sewer|wc suite|water closet|wash hand basin/.test(text)) return "plumbing";
  if (/electri|wiring|cable|conduit|light fitting|switch|socket|distribution board|consumer unit/.test(text)) return "electrical";
  if (/structural steel|steel fabrication|steel frame|metal fabrication|welded frame|steelwork/.test(text)) return "steel";
  if (/tile|terrazzo|floor finish|screeding|floor screed|interlock|paving|kerb|stone cladding/.test(text)) return "finishes";
  if (/plaster|render|painting|paint|skim coat|wall finish|wallpaper|texture coat/.test(text)) return "finishes";
  if (/blockwork|sandcrete block|masonry|brick wall|brickwork|block wall/.test(text)) return "masonry";
  if (/concrete|blinding|cement-sand|cast in situ|lean mix/.test(text) || /concrete/.test(item.section.toLowerCase())) return "concrete";
  if (/ceiling|gypsum board|plasterboard|carpentry|joinery|timber frame|cabinet|woodwork/.test(text)) return "ceiling";
  if (/paving|kerb|roadwork|interlocking/.test(text)) return "paving";
  return "general";
}

export function buildGenericRateScene(item: RateBankItem): RateScene {
  const parts: RateScene["parts"] = [];
  const context: THREE.Object3D[] = [];
  const colors: Record<string, string> = {};
  const represented = new Set<string>();
  const lines = item.lines;
  const fallbackId = lines[0]?.id ?? "__context";

  lines.forEach((line) => {
    colors[line.id] = colourForLine(line);
  });

  const addPart = (
    lineIds: string | string[],
    object: THREE.Object3D,
    dir: Vec3 = [0, 0.45, 0],
    extras: { appearOnExplode?: boolean; hideOnExplode?: boolean } = {},
  ) => {
    const ids = [...new Set((Array.isArray(lineIds) ? lineIds : [lineIds]).filter(Boolean))];
    if (!ids.length) ids.push(fallbackId);
    ids.forEach((id) => {
      represented.add(id);
      const line = lines.find((candidate) => candidate.id === id);
      if (line) colors[id] = colourForLine(line);
    });
    parts.push({
      lineId: ids.length === 1 ? ids[0] : ids,
      object,
      dir: vec(dir),
      ...extras,
    });
    return object;
  };

  const ids = (pattern: RegExp) => lines.filter((line) => pattern.test(line.id + " " + line.label)).map((line) => line.id);
  const best = (pattern: RegExp, category?: RateCostLine["category"]) => {
    const found = ids(pattern);
    if (found.length) return found;
    const categoryLine = category ? lines.find((line) => line.category === category) : undefined;
    return [categoryLine?.id ?? fallbackId];
  };

  const floorTexture = surfaceTexture("#C9BFB0", "#61584C", 101, 2);
  const terrain = new THREE.Mesh(
    new THREE.CircleGeometry(18, 64),
    standardMaterial("#D2C2A9", { map: surfaceTexture("#CBB89A", "#665944", 102, 22), roughness: 1 }),
  );
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.025;
  terrain.castShadow = false;
  terrain.userData.keepVisible = true;
  context.push(terrain);

  context.push(box(4.75, 0.15, 3.85, 0, 0.075, 0, "#D5D1C8", {
    map: floorTexture,
    roughness: 0.95,
  }));

  // A light, unfinished structural frame gives the rate model a believable site context.
  const frame = "#E8E5DE";
  const frameEdges = "#8D959D";
  [
    [-2.02, 1.43, -1.45],
    [2.02, 1.43, -1.45],
    [-2.02, 1.43, 1.45],
    [2.02, 1.43, 1.45],
  ].forEach(([x, y, z]) => {
    context.push(box(0.16, 2.7, 0.16, x, y, z, frame, {
      roughness: 0.9,
      emissive: frameEdges,
      emissiveIntensity: 0.015,
    }));
  });
  context.push(box(4.2, 0.22, 0.16, 0, 2.77, -1.45, frame));
  context.push(box(4.2, 0.22, 0.16, 0, 2.77, 1.45, frame));
  context.push(box(0.16, 0.22, 2.9, -2.02, 2.77, 0, frame));
  context.push(box(0.16, 0.22, 2.9, 2.02, 2.77, 0, frame));

  const unit = 0.15;
  const baseY = 0.15;
  const family = familyFor(item);
  const concreteTexture = surfaceTexture("#B8B6AF", "#66645F", 120, 2);
  const earthTexture = surfaceTexture("#98734D", "#453328", 121, 2);
  const masonryTexture = surfaceTexture("#B7B0A4", "#6E675B", 122, 1.2);
  const woodTexture = surfaceTexture("#B9824C", "#59391F", 123, 1.3);
  const steelTexture = surfaceTexture("#7D8790", "#2F3941", 124, 1.4);

  const addMaterialPile = (lineId: string, x: number, z: number, pileColour: string, seed: number) => {
    const materialPile = pile(0.36, pileColour, seed);
    materialPile.position.set(x, baseY + 0.18, z);
    addPart(lineId, materialPile, [x < 0 ? -0.2 : 0.2, 0.16, 0.25], { appearOnExplode: true });
  };

  if (family === "earthworks") {
    const excavationLine = best(/excavat|trench|earth|dig|cutting|backfill/, "labour");
    // Trenched earth is shown in section so the excavation depth and side profile are visible.
    addPart(excavationLine, box(1.05, 0.72, 1.7, -0.68, baseY + 0.36, -0.08, "#8E6A49", { map: earthTexture }), [-0.2, 0.45, 0]);
    addPart(excavationLine, box(1.05, 0.72, 1.7, 0.68, baseY + 0.36, -0.08, "#8E6A49", { map: earthTexture }), [0.2, 0.45, 0]);
    addPart(excavationLine, box(0.42, 0.12, 1.55, 0, baseY + 0.08, -0.08, "#604E3D", { roughness: 1 }), [0, -0.1, 0.35]);
    addPart(excavationLine, box(0.18, 0.78, 1.72, -0.17, baseY + 0.39, -0.08, "#B79A79"), [-0.1, 0.3, 0]);
    addPart(excavationLine, box(0.18, 0.78, 1.72, 0.17, baseY + 0.39, -0.08, "#B79A79"), [0.1, 0.3, 0]);
    const fillLines = ids(/laterite|hardcore|sharp sand|sandfill|fill material|aggregate|granite|stone/);
    if (fillLines.length) {
      fillLines.forEach((id, index) => addMaterialPile(id, -1.35 + index * 0.55, 1.25, index % 2 ? "#BBA17B" : "#C2B39A", 130 + index));
    }
    const plantLines = best(/excavator|compactor|plant|diesel|machine|equipment/, "plant");
    const excavator = new THREE.Group();
    excavator.add(box(0.7, 0.3, 0.46, 0, 0.35, 0, "#D89A25", { roughness: 0.55, metalness: 0.08 }));
    excavator.add(box(0.28, 0.24, 0.3, -0.09, 0.61, -0.02, "#F0BC47", { roughness: 0.38 }));
    excavator.add(box(0.76, 0.12, 0.12, 0, 0.14, 0.28, "#303942"));
    excavator.add(box(0.76, 0.12, 0.12, 0, 0.14, -0.28, "#303942"));
    excavator.add(rod(new THREE.Vector3(0.28, 0.48, 0), new THREE.Vector3(0.58, 0.92, 0), 0.075, "#D89A25", 0.15));
    excavator.add(rod(new THREE.Vector3(0.58, 0.92, 0), new THREE.Vector3(0.78, 0.5, 0), 0.055, "#D89A25", 0.15));
    excavator.position.set(1.15, baseY, 1.22);
    addPart(plantLines, excavator, [0.35, 0.1, 0.25], { appearOnExplode: true });
    const labour = best(/excavation labour|manual|trimming|dressing|spreading|compaction labour/, "labour");
    const siteWorker = worker(0.65);
    siteWorker.position.set(-1.4, baseY, 1.1);
    addPart(labour, siteWorker, [-0.2, 0.08, 0.2], { appearOnExplode: true });
  } else if (family === "concrete") {
    const mixLines = best(/concrete|cement|mortar|grout|blinding|sand|granite|aggregate/, "material");
    // Cast concrete section with an exposed face, separate shutter and a chipped edge.
    addPart(mixLines, box(2.1, 0.34, 1.55, -0.05, baseY + 0.34, -0.12, "#B9B7B0", { map: concreteTexture, roughness: 0.97 }), [0, 0.7, 0], { hideOnExplode: true });
    addPart(best(/formwork|shutter|plywood/, "material"), box(2.2, 0.25, 0.05, -0.05, baseY + 0.13, -0.93, "#C99B68", { map: woodTexture }), [0, -0.1, -0.15]);
    const ingredientLines = [
      { pattern: /cement|binder/, x: -1.28, colour: "#A9ADB0", seed: 141 },
      { pattern: /sharp sand|sand|fine aggregate/, x: -0.52, colour: "#C9AB7E", seed: 142 },
      { pattern: /granite|coarse aggregate|stone|gravel/, x: 0.25, colour: "#898783", seed: 143 },
    ];
    ingredientLines.forEach((ingredient) => {
      const found = ids(ingredient.pattern);
      found.forEach((id, index) => addMaterialPile(id, ingredient.x + index * 0.22, 1.08, ingredient.colour, ingredient.seed + index));
    });
    const cementLines = best(/cement|bag/, "material");
    for (let i = 0; i < 4; i += 1) {
      const bag = box(0.34, 0.11, 0.24, -1.42 + (i % 2) * 0.36, baseY + 0.055 + Math.floor(i / 2) * 0.12, -1.05, "#A8ADB2", {
        map: surfaceTexture("#A4A9AF", "#59626C", 145 + i, 1),
        roughness: 0.95,
      });
      addPart(cementLines, bag, [-0.12, 0.1, -0.1]);
    }
    const plantLines = best(/mixer|plant|equipment|vibrator|compactor/, "plant");
    const mixer = new THREE.Group();
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 0.54, 24), standardMaterial("#E39B2D", { metalness: 0.24, roughness: 0.47 }));
    drum.rotation.z = Math.PI / 3;
    drum.position.set(0, 0.5, 0);
    mixer.add(drum);
    mixer.add(box(0.6, 0.07, 0.4, 0, 0.15, 0, "#505B65", { metalness: 0.35 }));
    [-0.23, 0.23].forEach((x) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.065, 18), standardMaterial("#242B31"));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.1, 0.25);
      mixer.add(wheel);
    });
    mixer.position.set(1.45, baseY, 1.16);
    addPart(plantLines, mixer, [0.25, 0.15, 0.2], { appearOnExplode: true });
  } else if (family === "masonry") {
    const blockLines = best(/block|sandcrete|brick|masonry|walling/, "material");
    const mortarLines = best(/mortar|cement|sand|joint/, "material");
    const rows = 5;
    const cols = 5;
    const blockW = 0.34;
    const blockH = 0.17;
    const thickness = 0.28;
    for (let row = 0; row < rows; row += 1) {
      const offset = row % 2 ? blockW / 2 : 0;
      for (let col = 0; col < cols; col += 1) {
        const x = (col - (cols - 1) / 2) * (blockW + 0.018) + offset - 0.08;
        if (Math.abs(x) > 0.96) continue;
        const y = baseY + blockH / 2 + row * (blockH + 0.018);
        const block = box(blockW, blockH, thickness, x, y, -0.05, "#BDB6AA", {
          map: masonryTexture,
          roughness: 0.97,
        });
        addPart(blockLines, block, [x * 0.22, row * 0.07, -0.4]);
        // A few hollow cores are cut-looking dark recesses on the exposed stretcher face.
        if ((row + col) % 3 === 0) {
          [-0.075, 0.075].forEach((holeX) => {
            const cavity = box(0.055, 0.09, 0.012, x + holeX, y, thickness / 2 + 0.002, "#6E6A63", { roughness: 1 });
            addPart(blockLines, cavity, [x * 0.2, 0.12, 0.15]);
          });
        }
      }
    }
    for (let row = 1; row < rows; row += 1) {
      const courseY = baseY + row * (blockH + 0.018) - 0.009;
      const joint = box(1.82, 0.012, thickness + 0.015, -0.08, courseY, -0.05, "#D1CCC3", { map: surfaceTexture("#CFC9C0", "#8F877C", 160 + row, 1), roughness: 1 });
      addPart(mortarLines, joint, [0, (row - 2) * 0.1, 0.15]);
    }
    const bagLines = best(/cement|mortar|bag/, "material");
    addPart(bagLines, box(0.28, 0.1, 0.2, 1.18, baseY + 0.05, 1.0, "#9FA5AC", { map: surfaceTexture("#9FA5AC", "#5C646D", 171) }), [0.18, 0.08, 0.15], { appearOnExplode: true });
    const sandLines = best(/sharp sand|sand|aggregate/, "material");
    const sandPile = pile(0.27, "#CBAE7A", 172);
    sandPile.position.set(0.55, baseY + 0.135, 1.17);
    addPart(sandLines, sandPile, [0.15, 0.12, 0.18], { appearOnExplode: true });
    const mason = worker(0.72);
    mason.position.set(-1.4, baseY, 1.05);
    addPart(best(/mason|block laying|brick laying|labour/, "labour"), mason, [-0.1, 0.08, 0.16], { appearOnExplode: true });
  } else if (family === "formwork") {
    const plyLines = best(/plywood|formwork|shutter|board/, "material");
    const timberLines = best(/timber|2x|waler|joist|bearer|stud|rafter/, "material");
    const fixLines = best(/nail|screw|tie|release agent|oil/, "consumable");
    // Four plywood faces around a cast column with realistic framing and walers.
    const h = 2.25;
    const side = 0.44;
    const panelMaterial = { map: woodTexture, roughness: 0.8 };
    addPart(plyLines, box(0.018, h, side, -side / 2, baseY + h / 2, 0, "#B9824C", panelMaterial), [-0.4, 0, 0]);
    addPart(plyLines, box(0.018, h, side, side / 2, baseY + h / 2, 0, "#B9824C", panelMaterial), [0.4, 0, 0]);
    addPart(plyLines, box(side, h, 0.018, 0, baseY + h / 2, -side / 2, "#C18D55", panelMaterial), [0, 0, -0.35]);
    addPart(plyLines, box(side, h, 0.018, 0, baseY + h / 2, side / 2, "#C18D55", panelMaterial), [0, 0, 0.35]);
    [0.42, 1.08, 1.74].forEach((y) => {
      addPart(timberLines, box(0.09, 0.13, 0.63, 0, baseY + y, 0.32, "#956338", { map: woodTexture }), [0, (y - 1) * 0.18, 0.75]);
      addPart(timberLines, box(0.63, 0.13, 0.09, 0.32, baseY + y, 0, "#956338", { map: woodTexture }), [0.75, (y - 1) * 0.18, 0]);
    });
    const barLines = best(/rebar|reinforc|starter bar|steel rod/, "material");
    [-0.11, 0.11].forEach((x) => {
      [-0.11, 0.11].forEach((z) => {
        addPart(barLines, rod(new THREE.Vector3(x, baseY, z), new THREE.Vector3(x, baseY + h + 0.28, z), 0.018, "#7B5540", 0.45));
      });
    });
    addPart(fixLines, box(0.23, 0.08, 0.16, 1.2, baseY + 0.04, 1.0, "#72808A", { metalness: 0.25 }), [0.2, 0.08, 0.1], { appearOnExplode: true });
    const carpenter = worker(0.66);
    carpenter.position.set(-1.35, baseY, 1.1);
    addPart(best(/carpenter|labour|fixing/, "labour"), carpenter, [-0.14, 0.08, 0.2], { appearOnExplode: true });
  } else if (family === "reinforcement") {
    const steelLines = best(/reinforc|rebar|steel bar|brc mesh|mesh|binding wire/, "material");
    const deck = box(2.2, 0.12, 1.75, 0, baseY + 0.06, -0.05, "#C3C0B8", { map: concreteTexture });
    addPart(best(/concrete|slab|blinding/, "material"), deck, [0, -0.1, 0]);
    // Crossed reinforcing bars with chair supports and perimeter bars.
    for (let i = 0; i < 7; i += 1) {
      const x = -0.9 + i * 0.3;
      addPart(steelLines, rod(new THREE.Vector3(x, baseY + 0.19, -0.78), new THREE.Vector3(x, baseY + 0.19, 0.72), 0.012, "#6F5140", 0.55));
    }
    for (let i = 0; i < 6; i += 1) {
      const z = -0.72 + i * 0.29;
      addPart(steelLines, rod(new THREE.Vector3(-0.95, baseY + 0.22, z), new THREE.Vector3(0.95, baseY + 0.22, z), 0.012, "#6F5140", 0.55));
    }
    [-0.7, 0, 0.7].forEach((x) => {
      [-0.55, 0.4].forEach((z) => addPart(steelLines, rod(new THREE.Vector3(x, baseY + 0.12, z), new THREE.Vector3(x, baseY + 0.22, z), 0.012, "#A0A7AE", 0.55)));
    });
    const wireLines = best(/binding wire|tie wire|accessor/, "consumable");
    addPart(wireLines, box(0.24, 0.13, 0.24, 1.2, baseY + 0.065, 1.0, "#8A929A", { metalness: 0.55 }), [0.2, 0.1, 0.1], { appearOnExplode: true });
  } else if (family === "roofing") {
    const sheetLines = best(/sheet|roof cover|aluminium|aluminum|roofing/, "material");
    const woodLines = best(/timber|rafter|purlin|truss|batten/, "material");
    const angle = Math.atan2(0.62, 2.15);
    const roof = new THREE.Group();
    for (let i = 0; i < 5; i += 1) {
      const sheet = corrugatedSheet(0.78, 2.85, i % 2 ? "#8C3F30" : "#A94B36");
      sheet.position.set((i - 2) * 0.76, 0, 0);
      roof.add(sheet);
    }
    roof.rotation.x = -angle;
    roof.position.set(0, baseY + 2.12, -0.05);
    addPart(sheetLines, roof, [0, 0.75, 0], { hideOnExplode: true });
    [-0.9, -0.3, 0.3, 0.9].forEach((x) => {
      const rafter = box(0.055, 0.12, 3.0, x, baseY + 1.88, -0.05, "#B9824C", { map: woodTexture });
      rafter.rotation.x = -angle;
      addPart(woodLines, rafter, [x * 0.25, 0.5, 0]);
    });
    [0.3, 0.85, 1.4, 1.95].forEach((y) => {
      addPart(woodLines, box(3.8, 0.06, 0.08, 0, baseY + y, 0, "#9C7046", { map: woodTexture }), [0, 0.45, 0]);
    });
    const screwLines = best(/screw|fastener|washer|nail/, "consumable");
    const screws = new THREE.Group();
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        screws.add(rod(new THREE.Vector3((col - 4) * 0.4, 0, (row - 1.5) * 0.65), new THREE.Vector3((col - 4) * 0.4, 0.025, (row - 1.5) * 0.65), 0.008, "#C5CBD0", 0.8, 8));
      }
    }
    screws.position.set(0, baseY + 2.1, -0.05);
    addPart(screwLines, screws, [0, 1, 0], { appearOnExplode: true });
  } else if (family === "openings") {
    const frameLines = best(/frame|aluminium|aluminum|door jamb|window/, "material");
    const glassLines = best(/glass|glazing|pane/, "material");
    const doorLines = best(/door leaf|door|timber panel/, "material");
    const concreteLines = best(/block|wall|masonry|render|concrete/, "material");
    // Masonry return around a true opening; aluminium frame and glazing are separate clickable parts.
    addPart(concreteLines, box(0.5, 2.45, 0.22, -0.73, baseY + 1.225, 0, "#C7C1B6", { map: masonryTexture }));
    addPart(concreteLines, box(0.5, 2.45, 0.22, 0.73, baseY + 1.225, 0, "#C7C1B6", { map: masonryTexture }));
    addPart(concreteLines, box(1.95, 0.38, 0.22, 0, baseY + 2.26, 0, "#C7C1B6", { map: masonryTexture }));
    addPart(frameLines, box(0.07, 2.08, 0.09, -0.48, baseY + 1.04, 0.02, "#667F91", { metalness: 0.62, roughness: 0.32 }));
    addPart(frameLines, box(0.07, 2.08, 0.09, 0.48, baseY + 1.04, 0.02, "#667F91", { metalness: 0.62, roughness: 0.32 }));
    addPart(frameLines, box(1.03, 0.07, 0.09, 0, baseY + 2.08, 0.02, "#667F91", { metalness: 0.62, roughness: 0.32 }));
    if (/door/.test((item.title + " " + item.specification).toLowerCase()) && !/window|glass|glazing/.test((item.title + " " + item.specification).toLowerCase())) {
      addPart(doorLines, box(0.87, 1.94, 0.055, 0, baseY + 0.97, -0.02, "#A97445", { map: woodTexture, roughness: 0.7 }));
      addPart(best(/hinge|handle|lock|ironmongery|hardware/, "consumable"), box(0.035, 0.12, 0.04, 0.36, baseY + 0.96, 0.02, "#D0B06F", { metalness: 0.72, roughness: 0.28 }));
    } else {
      addPart(glassLines, box(0.86, 1.82, 0.025, 0, baseY + 1.03, -0.02, "#9FC5D9", {
        transparent: true,
        opacity: 0.46,
        metalness: 0.2,
        roughness: 0.12,
      }), [0, 0.25, 0], { hideOnExplode: true });
      addPart(best(/sealant|glazing bead|gasket/, "consumable"), box(0.9, 1.88, 0.03, 0, baseY + 1.03, -0.045, "#4E6A7B", { roughness: 0.4 }), [0, 0.3, 0]);
    }
  } else if (family === "plumbing") {
    const pipeLines = best(/pipe|pvc|drain|water supply|soil|waste|rainwater|conduit/, "material");
    const fittingLines = best(/fitting|elbow|tee|valve|bend|coupler|joint|trap/, "material");
    const pipeBlue = "#3D8AB8";
    addPart(pipeLines, rod(new THREE.Vector3(-1.1, baseY + 0.26, -0.25), new THREE.Vector3(1.15, baseY + 0.26, -0.25), 0.075, pipeBlue, 0.08, 20), [0.25, 0.25, 0]);
    addPart(pipeLines, rod(new THREE.Vector3(0.62, baseY + 0.26, -0.25), new THREE.Vector3(0.62, baseY + 1.08, -0.25), 0.075, pipeBlue, 0.08, 20), [0.2, 0.4, 0]);
    addPart(fittingLines, new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.074, 10, 24, Math.PI / 2),
      standardMaterial(pipeBlue, { roughness: 0.38 }),
    ), [0.35, 0.2, 0]);
    const elbow = parts[parts.length - 1].object as THREE.Mesh;
    elbow.position.set(0.62, baseY + 1.0, -0.25);
    elbow.rotation.y = Math.PI / 2;
    const drainChannel = box(1.75, 0.2, 0.46, 0, baseY + 0.1, 0.86, "#858B90", { map: concreteTexture });
    addPart(best(/manhole|chamber|channel|gully|inspection/, "material"), drainChannel, [0, 0.15, 0.25]);
    addPart(best(/cover|grating|grill/, "material"), box(1.55, 0.035, 0.3, 0, baseY + 0.22, 0.86, "#6E777E", { metalness: 0.48, roughness: 0.48 }), [0, 0.35, 0]);
    addPart(best(/tap|basin|wc|water closet|sanitary|fixture/, "material"), box(0.42, 0.35, 0.32, -1.12, baseY + 0.24, 0.75, "#F4F4F1", { roughness: 0.18 }), [0, 0.2, 0]);
  } else if (family === "electrical") {
    const conduitLines = best(/conduit|trunking|pvc pipe/, "material");
    const cableLines = best(/cable|wire|wiring|armoured|armored/, "material");
    const accessoryLines = best(/switch|socket|box|distribution board|consumer unit|light|fitting/, "material");
    addPart(conduitLines, rod(new THREE.Vector3(-1.1, baseY + 0.32, 0), new THREE.Vector3(1.1, baseY + 0.32, 0), 0.035, "#AEB7BF", 0.22, 16), [0.18, 0.15, 0]);
    addPart(conduitLines, rod(new THREE.Vector3(0.55, baseY + 0.32, 0), new THREE.Vector3(0.55, baseY + 1.5, 0), 0.035, "#AEB7BF", 0.22, 16), [0.15, 0.25, 0]);
    const wireColours = ["#C84D35", "#1F2933", "#2F8D61", "#E1B545"];
    wireColours.forEach((colour, index) => {
      addPart(cableLines, rod(new THREE.Vector3(-0.92, baseY + 0.24 + index * 0.025, 0.06), new THREE.Vector3(0.92, baseY + 0.24 + index * 0.025, 0.06), 0.009, colour, 0.05, 8), [0, 0.1, 0]);
    });
    addPart(accessoryLines, box(0.56, 0.78, 0.16, 0.96, baseY + 0.72, 0.12, "#E8EBED", { roughness: 0.43, metalness: 0.12 }));
    addPart(accessoryLines, box(0.2, 0.3, 0.055, -0.98, baseY + 0.65, 0.07, "#F2F1EB", { roughness: 0.32 }));
    const lamp = new THREE.Group();
    lamp.add(box(0.34, 0.065, 0.21, 0, 0, 0, "#D8DDE0", { metalness: 0.24, roughness: 0.35 }));
    lamp.add(box(0.29, 0.025, 0.15, 0, -0.045, 0, "#FFF4CC", { emissive: "#F3CF75", emissiveIntensity: 0.28 }));
    lamp.position.set(0.12, baseY + 2.45, -0.65);
    addPart(best(/light fitting|luminaire|lighting/, "material"), lamp, [0, 0.55, 0], { appearOnExplode: true });
  } else if (family === "steel") {
    const steelLines = best(/steel|metal|fabricat|weld|bolt|plate|frame/, "material");
    const columns = [-0.9, 0.9];
    columns.forEach((x) => {
      // Simplified I-section column flanges and web, not a structural connection design.
      addPart(steelLines, box(0.24, 1.9, 0.07, x, baseY + 0.95, 0, "#6F7A83", { map: steelTexture, metalness: 0.55, roughness: 0.42 }));
      addPart(steelLines, box(0.07, 1.9, 0.26, x, baseY + 0.95, 0, "#85919A", { map: steelTexture, metalness: 0.55, roughness: 0.42 }));
    });
    addPart(steelLines, box(2.05, 0.22, 0.08, 0, baseY + 2.02, 0, "#75818A", { map: steelTexture, metalness: 0.62, roughness: 0.36 }));
    addPart(steelLines, box(0.08, 0.22, 0.28, 0, baseY + 2.02, 0, "#75818A", { map: steelTexture, metalness: 0.62, roughness: 0.36 }));
    addPart(best(/base plate|connection plate|gusset|plate/, "material"), box(0.36, 0.045, 0.32, -0.9, baseY + 0.03, 0, "#88949D", { metalness: 0.66, roughness: 0.35 }));
    [0.78, 1.02, 1.26].forEach((y) => {
      [-0.9, 0.9].forEach((x) => {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 6), standardMaterial("#C0C7CD", { metalness: 0.8, roughness: 0.32 }));
        bolt.rotation.x = Math.PI / 2;
        bolt.position.set(x, baseY + y, 0.15);
        addPart(best(/bolt|fastener|weld/, "consumable"), bolt, [x * 0.2, 0.18, 0.22]);
      });
    });
  } else if (family === "membrane") {
    const membraneLines = best(/membrane|dpm|damp-proof|waterproof|bitumen|polythene/, "material");
    addPart(best(/concrete|slab|screed|substrate/, "material"), box(2.45, 0.25, 1.8, 0, baseY + 0.125, 0, "#B8B6AF", { map: concreteTexture }), [0, -0.1, 0]);
    addPart(membraneLines, box(2.42, 0.025, 1.78, 0, baseY + 0.27, 0, "#30343A", {
      roughness: 0.28,
      metalness: 0.12,
    }), [0, 0.45, 0], { hideOnExplode: true });
    addPart(membraneLines, box(0.11, 0.22, 1.78, -1.15, baseY + 0.36, 0, "#292D32", { roughness: 0.28 }), [-0.22, 0.3, 0]);
    const roll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.58, 24),
      standardMaterial("#282D32", { roughness: 0.38 }),
    );
    roll.rotation.z = Math.PI / 2;
    roll.position.set(1.22, baseY + 0.14, 0.96);
    addPart(membraneLines, roll, [0.25, 0.1, 0.15], { appearOnExplode: true });
  } else if (family === "finishes") {
    const text = (item.title + " " + item.specification).toLowerCase();
    if (/tile|terrazzo|floor|screed|interlock|paving|kerb|stone cladding/.test(text)) {
      const baseLines = best(/concrete|screed|bedding|mortar|sand|sub-base/, "material");
      addPart(baseLines, box(2.35, 0.2, 1.8, 0, baseY + 0.1, 0, "#B9B6AF", { map: concreteTexture }));
      const finishLines = best(/tile|terrazzo|finish|paver|kerb|stone|marble|granite/, "material");
      const tileCols = /kerb/.test(text) ? 5 : 6;
      const tileRows = /kerb/.test(text) ? 2 : 4;
      for (let row = 0; row < tileRows; row += 1) {
        for (let col = 0; col < tileCols; col += 1) {
          const w = /kerb/.test(text) ? 0.39 : 2.25 / tileCols;
          const d = /kerb/.test(text) ? 0.22 : 1.7 / tileRows;
          const tile = box(w - 0.012, 0.045, d - 0.012, (col - (tileCols - 1) / 2) * w, baseY + 0.225, (row - (tileRows - 1) / 2) * d, (row + col) % 3 === 0 ? "#AAAEB2" : "#D6D3CC", {
            roughness: 0.42,
            map: surfaceTexture((row + col) % 3 === 0 ? "#AEB2B6" : "#D7D3CA", "#716E69", 180 + row * 7 + col),
          });
          addPart(finishLines, tile, [0, 0.3, 0]);
        }
      }
      addPart(best(/kerb|edge restraint/, "material"), box(2.4, 0.18, 0.12, 0, baseY + 0.18, 0.93, "#8C969C", { roughness: 0.85 }));
    } else {
      const renderLines = best(/plaster|render|skim|mortar|wall finish/, "material");
      const paintLines = best(/paint|primer|emulsion|texture coat/, "material");
      addPart(best(/block|masonry|wall|substrate/, "material"), box(2.05, 2.15, 0.22, 0, baseY + 1.075, -0.2, "#BCB5AA", { map: masonryTexture }));
      // Render and paint are represented as separate, thin finish coats on the front face.
      addPart(renderLines, box(1.98, 2.08, 0.025, -0.015, baseY + 1.075, -0.065, "#D1CBC1", { roughness: 0.96 }), [-0.15, 0, 0.25]);
      addPart(paintLines, box(0.94, 1.99, 0.025, -0.5, baseY + 1.075, -0.035, "#E9E7DF", { roughness: 0.8 }), [0, 0.25, 0]);
      addPart(paintLines, box(0.94, 1.99, 0.025, 0.48, baseY + 1.075, -0.035, "#C8D8D8", { roughness: 0.8 }), [0, 0.25, 0]);
      const roller = new THREE.Group();
      roller.add(rod(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.3, 0), 0.015, "#9B805E", 0.05));
      roller.add(rod(new THREE.Vector3(-0.11, 0.32, 0), new THREE.Vector3(0.11, 0.32, 0), 0.04, "#D8DCE0", 0.05));
      roller.position.set(1.25, baseY + 0.1, 0.9);
      addPart(best(/paint|roller|brush|labour/, "labour"), roller, [0.25, 0.35, 0.2], { appearOnExplode: true });
    }
  } else if (family === "ceiling") {
    const timberLines = best(/timber|wood|rafter|joist|frame|brandering|batten/, "material");
    const boardLines = best(/ceiling|gypsum|plasterboard|board|plywood/, "material");
    for (let i = 0; i < 6; i += 1) {
      const x = -1.0 + i * 0.4;
      addPart(timberLines, box(0.05, 0.08, 2.0, x, baseY + 2.1, 0, "#B9824C", { map: woodTexture }), [0, 0.45, 0]);
    }
    for (let row = 0; row < 2; row += 1) {
      addPart(boardLines, box(1.95, 0.035, 0.94, 0, baseY + 2.2, row * 0.95 - 0.47, "#E5E4DF", { roughness: 0.82 }), [0, 0.7, 0], { hideOnExplode: true });
    }
    addPart(best(/screw|nail|joint tape|skim/, "consumable"), box(0.25, 0.08, 0.2, 1.2, baseY + 0.04, 0.95, "#C6C8C9"), [0.2, 0.1, 0.15], { appearOnExplode: true });
  } else if (family === "paving") {
    const beddingLines = best(/sand|hardcore|sub-base|bedding/, "material");
    addPart(beddingLines, box(2.45, 0.22, 1.8, 0, baseY + 0.11, 0, "#BBA17B", { map: earthTexture }));
    const paverLines = best(/paver|interlock|kerb|concrete block|stone/, "material");
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 7; col += 1) {
        const block = box(0.32, 0.075, 0.3, (col - 3) * 0.34, baseY + 0.26, (row - 2) * 0.32, (col + row) % 2 ? "#999FA5" : "#C0C2C3", { roughness: 0.92, map: masonryTexture });
        addPart(paverLines, block, [0, 0.25, 0]);
      }
    }
    addPart(best(/kerb|edge restraint/, "material"), box(2.5, 0.22, 0.16, 0, baseY + 0.23, 0.93, "#888F95", { roughness: 0.9 }));
  } else {
    // Neutral building-component model for uncommon work items; line-specific samples below
    // still show every material, labour, plant and logistics line as a selectable part.
    const coreLines = best(/main item|primary|material|work item|supply|install|labour/, "material");
    addPart(coreLines, box(2.15, 0.32, 1.5, 0, baseY + 0.16, -0.1, "#BEC2C4", { map: concreteTexture }));
    addPart(coreLines, box(1.95, 0.06, 1.28, 0, baseY + 0.36, -0.1, "#DAD7D0", { roughness: 0.76 }));
    addPart(best(/frame|steel|timber|support|bracket/, "material"), box(0.08, 1.75, 0.08, -0.82, baseY + 1.15, -0.1, "#8F9AA3", { metalness: 0.25 }));
    addPart(best(/frame|steel|timber|support|bracket/, "material"), box(0.08, 1.75, 0.08, 0.82, baseY + 1.15, -0.1, "#8F9AA3", { metalness: 0.25 }));
  }

  // Every rate line gets a tangible, clickable representation. Lines not directly
  // attached to the category-specific assembly appear as realistic samples on a pallet.
  const unmatched = lines.filter((line) => !represented.has(line.id));
  unmatched.forEach((line, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = -1.48 + col * 0.98;
    const z = 2.05 + row * 0.45;
    const base = box(0.68, 0.045, 0.34, x, baseY + 0.022, z, "#8B6A49", { roughness: 0.96 });
    context.push(base);

    const text = (line.id + " " + line.label).toLowerCase();
    let sample: THREE.Object3D;
    if (/pipe|cable|wire|conduit/.test(text)) {
      sample = rod(new THREE.Vector3(x - 0.22, baseY + 0.16, z), new THREE.Vector3(x + 0.22, baseY + 0.16, z), 0.035, colourForLine(line), 0.22, 12);
    } else if (/rebar|steel|rod|mesh|bar|nail|bolt|screw/.test(text)) {
      sample = rod(new THREE.Vector3(x - 0.24, baseY + 0.14, z), new THREE.Vector3(x + 0.24, baseY + 0.14, z), 0.018, colourForLine(line), 0.55, 10);
    } else if (/sand|granite|aggregate|gravel|hardcore|laterite|stone/.test(text)) {
      sample = pile(0.18, colourForLine(line), 300 + index);
      sample.position.set(x, baseY + 0.1, z);
    } else if (/labour|mason|carpenter|worker|fixing|laying|install/.test(text) || line.category === "labour") {
      sample = worker(0.28);
      sample.position.set(x, baseY, z);
    } else if (/plant|excavator|compactor|mixer|equipment|hire|diesel/.test(text) || line.category === "plant") {
      sample = smallTruck(0.52);
      sample.position.set(x, baseY, z);
    } else if (/logistic|delivery|transport|haul|mobilis/.test(text) || line.category === "logistics") {
      sample = smallTruck(0.52);
      sample.position.set(x, baseY, z);
    } else if (/plywood|timber|wood|board|sheet|formwork|rafter|joist/.test(text)) {
      sample = box(0.44, 0.065, 0.22, x, baseY + 0.08, z, colourForLine(line), { map: woodTexture, roughness: 0.84 });
    } else if (/cement|bag|powder|paint|primer|emulsion/.test(text)) {
      sample = box(0.25, 0.12, 0.18, x, baseY + 0.08, z, colourForLine(line), { roughness: 0.92 });
    } else {
      sample = box(0.3, 0.16, 0.25, x, baseY + 0.1, z, colourForLine(line), { roughness: 0.8 });
    }
    addPart(line.id, sample, [((col % 2) ? 0.1 : -0.1), 0.22, 0.12], { appearOnExplode: true });
  });

  if (!parts.length) {
    addPart(fallbackId, box(0.8, 0.3, 0.8, 0, baseY + 0.15, 0, "#BEC2C4"));
  }

  const focus = family === "roofing" || family === "ceiling"
    ? new THREE.Vector3(0, 1.7, 0)
    : family === "openings" || family === "masonry" || family === "formwork" || family === "steel"
      ? new THREE.Vector3(0, 1.25, 0)
      : new THREE.Vector3(0, 0.75, 0.25);

  return {
    parts,
    context,
    colors,
    overview: {
      target: new THREE.Vector3(0, 1.05, 0.2),
      position: new THREE.Vector3(6.8, 4.9, 8.1),
    },
    focus: {
      target: focus,
      position: new THREE.Vector3(focus.x + 3.6, focus.y + 2.1, focus.z + 4.3),
    },
  };
}
