import { calculateRate, getRateBankItem } from "@/lib/rates/defaults";
import { localiseLines, type RateLocation } from "@/lib/rates/locations";
import { AFRICA_PRICE_ITEMS } from "@/lib/pricing/africa-catalog";

/**
 * Quantity takeoff from a Pascal Editor scene graph, priced with the Charismak Rate Bank.
 * Measurement is simplified for early budgeting: walls are length × height less openings,
 * slabs/ceilings are polygon areas, roofs are plan area with overhang ÷ cos(pitch), and
 * foundations (which the editor does not draw) are estimated from ground-floor wall lengths.
 */

type Point = [number, number];
type Node = { id: string; type: string; parentId?: string | null; [key: string]: unknown };

export const TAKEOFF_ASSUMPTIONS = {
  storeyHeight: 2.5, // used when neither the wall nor its level states a height
  wallThickness: 0.2,
  slabThickness: 0.15,
  trench: { width: 0.675, depth: 0.9 },
  partitionTrench: { width: 0.45, depth: 0.9 }, // under 150 mm internal walls
  partitionFootingDepth: 0.15,
  footingDepth: 0.225,
  blindingDepth: 0.05,
  foundationWallHeight: 0.825,
  hardcoreDepth: 0.225,
} as const;

/** Starter references from the price library (lib/pricing/africa-catalog.ts) — to be replaced with verified supplier prices. */
const starter = (id: string, fallback: number) => AFRICA_PRICE_ITEMS.find((item) => item.id === id)?.defaultRate ?? fallback;
export const PROVISIONAL_SUPPLY = { securityDoor: starter("security-door", 450_000), flushDoor: starter("flush-door", 85_000), windowPerM2: starter("aluminium-window", 125_000) } as const;

export type TakeoffLine = {
  group: string;
  slug: string;
  title: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  basis: string;
  estimated?: boolean;
  provisional?: boolean; // price-library starter reference, not a Rate Bank build-up
};

export type Takeoff = {
  lines: TakeoffLine[];
  total: number;
  floorArea: number; // inside the external walls (slab area)
  grossFloorArea: number; // to the outside face of the external walls — the usual basis for cost per m²
  counts: { walls: number; slabs: number; ceilings: number; roofs: number; doors: number; windows: number; levels: number };
  warnings: string[];
};

const num = (value: unknown, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);
const r2 = (value: number) => Math.round(value * 100) / 100;

const polygonArea = (points: unknown): number => {
  if (!Array.isArray(points) || points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [x1, z1] = points[i] as Point;
    const [x2, z2] = points[(i + 1) % points.length] as Point;
    sum += x1 * z2 - x2 * z1;
  }
  return Math.abs(sum) / 2;
};

const surfaceArea = (node: Node) => {
  const holes = Array.isArray(node.holes) ? (node.holes as unknown[]).reduce<number>((total, hole) => total + polygonArea(hole), 0) : 0;
  return Math.max(0, polygonArea(node.polygon) - holes);
};

/** Measures the scene. Pure function: no pricing, easy to test. */
export function measureScene(nodes: Record<string, Node>) {
  const all = Object.values(nodes).filter((node) => node && typeof node === "object" && typeof node.type === "string");
  const byType = (type: string) => all.filter((node) => node.type === type);
  const levelOf = (node: Node): Node | undefined => {
    let current: Node | undefined = node;
    for (let guard = 0; current && guard < 20; guard += 1) {
      if (current.type === "level") return current;
      current = current.parentId ? nodes[current.parentId] : undefined;
    }
    return undefined;
  };
  const levelIndex = (node: Node) => num(levelOf(node)?.level, 0);

  const openingsByWall = new Map<string, number>();
  const wallThickness = new Map(byType("wall").map((wall) => [wall.id, num(wall.thickness, TAKEOFF_ASSUMPTIONS.wallThickness)]));
  const doors = byType("door");
  const windows = byType("window");
  for (const opening of [...doors, ...windows]) {
    const wallId = typeof opening.wallId === "string" ? opening.wallId : null;
    if (!wallId) continue;
    const area = num(opening.width, opening.type === "door" ? 0.9 : 1.5) * num(opening.height, opening.type === "door" ? 2.1 : 1.5);
    openingsByWall.set(wallId, (openingsByWall.get(wallId) ?? 0) + area);
  }

  let thickWall = 0;
  let thinWall = 0;
  let groundWallLength = 0;
  let groundThinLength = 0;
  // Railing walls (open guards) are not blockwork.
  const walls = byType("wall").filter((wall) => wall.wallType !== "railing");
  for (const wall of walls) {
    const [sx, sz] = (Array.isArray(wall.start) ? wall.start : [0, 0]) as Point;
    const [ex, ez] = (Array.isArray(wall.end) ? wall.end : [0, 0]) as Point;
    const length = Math.hypot(ex - sx, ez - sz);
    const height = num(wall.height, num(levelOf(wall)?.height, TAKEOFF_ASSUMPTIONS.storeyHeight));
    const area = Math.max(0, length * height - (openingsByWall.get(wall.id) ?? 0));
    if (num(wall.thickness, TAKEOFF_ASSUMPTIONS.wallThickness) >= 0.18) thickWall += area;
    else thinWall += area;
    if (levelIndex(wall) === 0) {
      groundWallLength += length;
      if (num(wall.thickness, TAKEOFF_ASSUMPTIONS.wallThickness) < 0.18) groundThinLength += length;
    }
  }

  // Floors: drawn slabs; on a level with no slab, the room zones stand in for the floor area.
  const slabByLevel = new Map<number, number>();
  let tiledFloor = 0;
  // Paving, porches and steps marked external are site works, not building floor.
  const slabs = byType("slab").filter((slab) => !(slab.metadata && typeof slab.metadata === "object" && (slab.metadata as { external?: unknown }).external === true));
  for (const slab of slabs) {
    slabByLevel.set(levelIndex(slab), (slabByLevel.get(levelIndex(slab)) ?? 0) + surfaceArea(slab));
    if (typeof slab.materialPreset === "string" && /^(library:)?flooring-(tile|ceramic|lightceramic|darkceramic)/.test(slab.materialPreset)) tiledFloor += surfaceArea(slab);
  }
  const zoneByLevel = new Map<number, number>();
  for (const zone of byType("zone")) zoneByLevel.set(levelIndex(zone), (zoneByLevel.get(levelIndex(zone)) ?? 0) + surfaceArea(zone));
  let groundSlab = 0;
  let upperSlab = 0;
  let floorsFromZones = false;
  for (const level of new Set([...slabByLevel.keys(), ...zoneByLevel.keys()])) {
    let area = slabByLevel.get(level) ?? 0;
    if (!area && zoneByLevel.get(level)) {
      area = zoneByLevel.get(level)!;
      floorsFromZones = true;
    }
    if (level === 0) groundSlab += area;
    else upperSlab += area;
  }
  // Gross floor area: each building slab grown out to the outside face of a 230 mm external wall.
  let grossFloorArea = 0;
  for (const slab of slabs) {
    const pts = Array.isArray(slab.polygon) ? (slab.polygon as Point[]) : [];
    let perimeter = 0;
    for (let i = 0; i < pts.length; i += 1) { const [x1, z1] = pts[i]; const [x2, z2] = pts[(i + 1) % pts.length]; perimeter += Math.hypot(x2 - x1, z2 - z1); }
    grossFloorArea += surfaceArea(slab) + perimeter * 0.23 + 4 * 0.23 * 0.23;
  }
  const ceilings = byType("ceiling").reduce((total, ceiling) => total + surfaceArea(ceiling), 0);

  let roofSlope = 0;
  // Roof carcass (estimated): rafters at 600 mm centres, a tie with struts every 1.2 m, purlins at 900 mm up the slope, wall plate round the building.
  const roofTimber = { wallPlate: 0, rafters: 0, tiesStruts: 0, purlins: 0 };
  const roofSegments = byType("roof-segment");
  for (const segment of roofSegments) {
    const overhang = num(segment.overhang, 0.3);
    const w = num(segment.width, 8), d = num(segment.depth, 6);
    const plan = (w + 2 * overhang) * (d + 2 * overhang);
    const pitch = Math.min(80, Math.max(0, num(segment.pitch, 40)));
    const cos = Math.cos((pitch * Math.PI) / 180);
    roofSlope += plan / cos;
    const run = Math.max(w, d), span = Math.min(w, d);
    const rafter = (span / 2 + overhang) / Math.max(0.2, cos);
    roofTimber.wallPlate += 2 * (run + span);
    roofTimber.rafters += (Math.ceil((run + 2 * overhang) / 0.6) + 1) * 2 * rafter;
    roofTimber.tiesStruts += (Math.ceil(run / 1.2) + 1) * span * 1.5;
    roofTimber.purlins += 2 * (Math.ceil(rafter / 0.9) + 1) * (run + 2 * overhang);
  }
  // Openings for supply allowances: external doors (in walls ≥ 180 mm) get a security door set.
  let externalDoors = 0, internalDoors = 0, windowArea = 0;
  for (const door of doors) (wallThickness.get(String(door.wallId)) ?? 0) >= 0.18 ? (externalDoors += 1) : (internalDoors += 1);
  for (const window of windows) windowArea += num(window.width, 1.2) * num(window.height, 1.2);

  const levels = new Set(all.filter((node) => node.type === "level").map((node) => node.id)).size;
  return {
    thickWall: r2(thickWall),
    thinWall: r2(thinWall),
    groundWallLength: r2(groundWallLength),
    groundThinLength: r2(groundThinLength),
    grossFloorArea: r2(grossFloorArea),
    groundSlab: r2(groundSlab),
    upperSlab: r2(upperSlab),
    ceilings: r2(ceilings),
    roofSlope: r2(roofSlope),
    roofTimber: { wallPlate: r2(roofTimber.wallPlate), rafters: r2(roofTimber.rafters), tiesStruts: r2(roofTimber.tiesStruts), purlins: r2(roofTimber.purlins) },
    externalDoors,
    internalDoors,
    windowArea: r2(windowArea),
    doors: doors.length,
    windows: windows.length,
    floorsFromZones,
    tiledFloor: r2(tiledFloor),
    counts: {
      walls: walls.length,
      slabs: slabs.length,
      ceilings: byType("ceiling").length,
      roofs: roofSegments.length,
      doors: doors.length,
      windows: windows.length,
      levels,
    },
  };
}

/** Measures and prices the scene for the chosen state. */
export function priceDesign(nodes: Record<string, Node>, location: RateLocation): Takeoff {
  const m = measureScene(nodes);
  const A = TAKEOFF_ASSUMPTIONS;
  const lines: TakeoffLine[] = [];
  const add = (group: string, slug: string, quantity: number, basis: string, estimated = false) => {
    if (!(quantity > 0)) return;
    const item = getRateBankItem(slug);
    if (!item) return;
    const rate = calculateRate(localiseLines(item.lines, location), item.allowances).total;
    const q = r2(quantity);
    lines.push({ group, slug, title: item.shortTitle, unit: item.unit, quantity: q, rate, amount: rate * q, basis, estimated });
  };

  // Substructure, estimated from ground-floor walls (the editor does not draw foundations).
  // External/load-bearing walls on 675 × 225 mm footings with 230 mm blockwork to DPC; 150 mm partitions on 450 × 150 mm footings with 150 mm blockwork.
  const L = r2(m.groundWallLength - m.groundThinLength);
  const P = m.groundThinLength;
  const T = A.partitionTrench;
  add("Substructure (estimated)", "mechanical-excavation-wall-trenches", L * A.trench.width * A.trench.depth + P * T.width * T.depth, `${L} m of main wall × 0.675 × 0.9 m + ${P} m of partitions × 0.45 × 0.9 m`, true);
  add("Substructure (estimated)", "c15-blinding-1-3-6", (L * A.trench.width + P * T.width) * A.blindingDepth, "50 mm blinding under the footings", true);
  add("Substructure (estimated)", "c20-nominal-concrete-1-2-4", L * A.trench.width * A.footingDepth + P * T.width * A.partitionFootingDepth, "675 × 225 mm strip footing (main walls), 450 × 150 mm (partitions)", true);
  add("Substructure (estimated)", "230mm-hollow-sandcrete-blockwork", L * A.foundationWallHeight, "Foundation blockwork to DPC (0.825 m), main walls", true);
  add("Substructure (estimated)", "150mm-hollow-sandcrete-blockwork", P * A.foundationWallHeight, "Foundation blockwork to DPC (0.825 m), partitions", true);
  add("Substructure (estimated)", "hardcore-fill-compacted", m.groundSlab * A.hardcoreDepth, "225 mm hardcore under the ground slab", true);
  add("Substructure (estimated)", "dpm-1000-gauge", m.groundSlab, "DPM under the ground slab", true);

  // Floors
  add("Floors", "brc-mesh-a142-laid", m.groundSlab, "Ground slab mesh");
  add("Floors", "c20-nominal-concrete-1-2-4", m.groundSlab * A.slabThickness, `Ground slab ${m.groundSlab} m² × 0.15 m`);
  add("Floors", "c25-structural-concrete-310kg", m.upperSlab * A.slabThickness, `Suspended slabs ${m.upperSlab} m² × 0.15 m`);
  add("Floors", "plywood-formwork-slab-soffit", m.upperSlab, "Soffit formwork to suspended slabs");
  add("Floors", "30mm-floor-screed", m.groundSlab + m.upperSlab, "All drawn floor areas");
  add("Floors", "600x600-floor-tiling", m.tiledFloor, "Floors finished in ceramic tiles");

  // Walls
  add("Walls", "230mm-hollow-sandcrete-blockwork", m.thickWall, "Walls ≥ 200 mm thick, less openings");
  add("Walls", "150mm-hollow-sandcrete-blockwork", m.thinWall, "Walls under 200 mm thick, less openings");
  add("Walls", "15mm-cement-sand-plaster", (m.thickWall + m.thinWall) * 2, "Both faces of all walls");
  add("Walls", "three-coat-emulsion-paint", (m.thickWall + m.thinWall) * 2, "Both faces of all walls");

  // Roof, ceilings, openings
  add("Roof", "50x150-wall-plate-tie-beam", m.roofTimber.wallPlate, "Round the external walls", true);
  add("Roof", "50x100-rafter", m.roofTimber.rafters, "Rafters at 600 mm centres, with overhang", true);
  add("Roof", "50x100-strut-tie", m.roofTimber.tiesStruts, "A tie with struts every 1.2 m (≈ 1.5 × span)", true);
  add("Roof", "50x75-purlin", m.roofTimber.purlins, "Purlins at 900 mm up each slope", true);
  add("Roof", "055mm-aluminium-roof-covering", m.roofSlope, "Plan area with overhang ÷ cos(pitch)");
  add("Ceilings", "standard-pop-ceiling", m.ceilings, "Drawn ceiling areas");
  add("Doors & windows", "door-installation-dressing", m.doors, "Installation only; doors supplied separately");
  add("Doors & windows", "aluminium-window-installation", m.windows, "Installation only; windows supplied separately");
  // Supply of doors and windows: provisional allowances from the price library's starter references (not verified quotations).
  const allowance = (slug: string, title: string, unit: string, quantity: number, rate: number, basis: string) => {
    if (!(quantity > 0)) return;
    const q = r2(quantity);
    lines.push({ group: "Doors & windows (supply, provisional)", slug, title, unit, quantity: q, rate, amount: rate * q, basis, provisional: true });
  };
  allowance("security-door", "Steel security entrance door set", "nr", m.externalDoors, PROVISIONAL_SUPPLY.securityDoor, "External doors · provisional allowance");
  allowance("flush-door", "Internal flush door leaf", "nr", m.internalDoors, PROVISIONAL_SUPPLY.flushDoor, "Internal doors (leaf only; frame and ironmongery extra) · provisional allowance");
  allowance("aluminium-window", "Powder-coated aluminium glazed window", "m²", m.windowArea, PROVISIONAL_SUPPLY.windowPerM2, "Window area drawn · provisional allowance");

  const warnings: string[] = [];
  if (m.counts.walls === 0) warnings.push("No walls drawn yet. Use Build → Rectangle or Walls.");
  if (m.counts.roofs === 0 && m.counts.walls > 0) warnings.push("No roof drawn, so roofing is not priced.");
  if (m.groundSlab + m.upperSlab === 0 && m.counts.walls > 0) warnings.push("No floors or rooms found; floors are not priced.");
  if (m.floorsFromZones) warnings.push("Floor areas are taken from the room outlines (no slab drawn).");

  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
    floorArea: r2(m.groundSlab + m.upperSlab),
    grossFloorArea: m.grossFloorArea,
    counts: m.counts,
    warnings,
  };
}
