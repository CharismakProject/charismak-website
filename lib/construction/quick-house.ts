import { AGENT_OPERATIONS } from "@pascal-app/core/agent-operations";
import { CATALOG_ITEMS } from "@pascal-app/editor/catalog";

import hostedItems from "./hosted-items.json";
import { getPlan, HOUSE_PLANS, type P, type PlanId, type PlanRoom } from "./quick-plans";
import templatesFile from "./quick-house-templates.json";

/**
 * Builds a complete, furnished Pascal scene graph from one of the Quick design floor plans
 * (lib/construction/quick-plans.ts): every room, toilet fitting, door and window as drawn, plus the
 * compound (fence with gate, driveway, walkway, car, septic tank and soakaway, landscaping).
 * Width/length sliders stretch the plan within ±10–30%. World coordinates: the plan is turned so its
 * front faces −Z and centred on the origin.
 */

export type { PlanId } from "./quick-plans";

export type QuickHouse = {
  plan: PlanId;
  width: number; // overall, m
  length: number; // overall, m
  floors: number; // fixed by the plan
  roofType: "gable" | "hip";
  roofPitch: number; // degrees
  walls: string; // Pascal material preset id (exterior)
  roof: string;
  floor: string;
  furnished: boolean;
  outdoor: boolean;
};

// Finishes from Pascal's material library (textures self-hosted under /material).
export const WALL_FINISHES = [
  { id: "preset-cream", label: "Cream paint", swatch: "#efe3cc" },
  { id: "preset-white", label: "White paint", swatch: "#e9e9e9" },
  { id: "preset-peach", label: "Peach paint", swatch: "#f0c3a0" },
  { id: "preset-sage", label: "Sage green paint", swatch: "#bcc5b2" },
  { id: "preset-sky", label: "Sky blue paint", swatch: "#8fb4d4" },
  { id: "preset-terracotta", label: "Terracotta paint", swatch: "#c86f4c" },
  { id: "flooring-rusticbrick", label: "Face brick", swatch: "#a1553c" },
  { id: "concrete-stucco", label: "Stucco", swatch: "#cfc6b6" },
] as const;
// Long-span aluminium colours common in Nigeria (plain colours render everywhere), plus clay tiles.
export const ROOF_FINISHES = [
  { id: "preset-brickred", label: "Long-span red", swatch: "#9e3b34" },
  { id: "preset-royalblue", label: "Long-span blue", swatch: "#3a5a9c" },
  { id: "preset-forest", label: "Long-span green", swatch: "#4f6b57" },
  { id: "preset-charcoal", label: "Long-span charcoal", swatch: "#4e5257" },
  { id: "preset-terracotta", label: "Terracotta", swatch: "#c86f4c" },
  { id: "roof-claytiles", label: "Clay tiles", swatch: "#9c4a33" },
] as const;
export const FLOOR_FINISHES = [
  { id: "flooring-tile20", label: "Porcelain tiles", swatch: "#d8d2c6", tiled: true },
  { id: "flooring-terrazzo19", label: "Terrazzo", swatch: "#cfc8bd", tiled: false },
  { id: "wood-floorplank1", label: "Wood", swatch: "#a8763f", tiled: false },
  { id: "concrete-polished", label: "Polished concrete", swatch: "#9a9a97", tiled: false },
] as const;

const overall = (id: PlanId) => {
  const plan = getPlan(id);
  return { width: Math.round((plan.W + 0.23) * 10) / 10, length: Math.round((plan.L + 0.23) * 10) / 10 };
};
const STYLE: Record<PlanId, Pick<QuickHouse, "walls" | "roof" | "floor">> = {
  shop: { walls: "preset-white", roof: "preset-charcoal", floor: "flooring-terrazzo19" },
  "2bed": { walls: "preset-white", roof: "preset-terracotta", floor: "flooring-tile20" },
  "3bed": { walls: "preset-peach", roof: "preset-royalblue", floor: "flooring-tile20" },
  duplex: { walls: "preset-sage", roof: "preset-forest", floor: "flooring-tile20" },
};
const presetHouse = (id: PlanId): QuickHouse => {
  const plan = getPlan(id);
  return { plan: id, ...overall(id), floors: plan.floors.length, roofType: plan.roofType, roofPitch: plan.pitch, ...STYLE[id], furnished: true, outdoor: true };
};

export const QUICK_PRESETS = HOUSE_PLANS.map((plan) => ({ id: plan.id as PlanId, label: plan.label, note: plan.note, summary: plan.summary, house: presetHouse(plan.id as PlanId) }));

/** Stretch range for each plan's width/length sliders. */
export const SCALE_RANGE = [0.9, 1.3] as const;
export function sizeLimits(id: PlanId) {
  const base = overall(id);
  const half = (value: number) => Math.round(value * 2) / 2;
  return { width: [half(base.width * SCALE_RANGE[0]), half(base.width * SCALE_RANGE[1])] as const, length: [half(base.length * SCALE_RANGE[0]), half(base.length * SCALE_RANGE[1])] as const };
}
export const QUICK_LIMITS = { roofPitch: [10, 45] } as const;

type AnyNode = { id: string; type: string; parentId: string | null; children?: string[]; [key: string]: unknown };
const T = templatesFile.templates as unknown as Record<string, AnyNode>;
const clone = <V>(value: V): V => JSON.parse(JSON.stringify(value)) as V;
const HOSTED = new Set<string>(hostedItems as string[]);

// Pascal's catalog, pointed at the models we self-host.
type CatalogItem = { id: string; src?: string; thumbnail?: string; dimensions?: [number, number, number] };
const CATALOG = (CATALOG_ITEMS as unknown as CatalogItem[])
  .filter((item) => HOSTED.has(item.id))
  .map((item) => ({ ...item, src: `/items/${item.id}/model.glb`, thumbnail: `/items/${item.id}/thumbnail.webp` }));
const asset = (id: string) => CATALOG.find((entry) => entry.id === id);
const BASINS = ["sink-cabinet", "bathroom-sink"].map(asset).filter(Boolean) as CatalogItem[];

/** Pascal stores library materials as "library:<id>" references. */
const lib = (id: string) => `library:${id}`;
const OUTER = 0.23; // 9-inch block
const INNER = 0.15; // 6-inch block

const clamp = (value: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, value));
const oneOf = <V extends string>(value: string, list: readonly { id: V }[], fallback: V): V => (list.some((item) => item.id === value) ? (value as V) : fallback);
const isPlan = (value: unknown): value is PlanId => HOUSE_PLANS.some((plan) => plan.id === value);

export function normaliseHouse(house: Partial<QuickHouse>): QuickHouse {
  const id: PlanId = isPlan(house.plan) ? house.plan : "2bed";
  const base = presetHouse(id);
  const limits = sizeLimits(id);
  return {
    plan: id,
    width: Math.round(clamp(Number(house.width) || base.width, limits.width) * 10) / 10,
    length: Math.round(clamp(Number(house.length) || base.length, limits.length) * 10) / 10,
    floors: base.floors,
    roofType: house.roofType === "hip" ? "hip" : house.roofType === "gable" ? "gable" : base.roofType,
    roofPitch: Math.round(clamp(Number(house.roofPitch) || base.roofPitch, QUICK_LIMITS.roofPitch)),
    walls: oneOf(String(house.walls), WALL_FINISHES, base.walls as (typeof WALL_FINISHES)[number]["id"]),
    roof: oneOf(String(house.roof), ROOF_FINISHES, base.roof as (typeof ROOF_FINISHES)[number]["id"]),
    floor: oneOf(String(house.floor), FLOOR_FINISHES, base.floor as (typeof FLOOR_FINISHES)[number]["id"]),
    furnished: house.furnished !== false,
    outdoor: house.outdoor !== false,
  };
}

/** A random plan, size and colour scheme, for the "Surprise me" button. */
export function randomHouse(random: () => number = Math.random): QuickHouse {
  const pick = <V>(list: readonly V[]) => list[Math.floor(random() * list.length)];
  const id = pick(HOUSE_PLANS).id as PlanId;
  const limits = sizeLimits(id);
  const between = ([min, max]: readonly [number, number]) => min + Math.round(random() * (max - min) * 2) / 2;
  return normaliseHouse({
    plan: id,
    width: between(limits.width),
    length: between(limits.length),
    roofType: pick(["gable", "hip"] as const),
    roofPitch: 20 + Math.round(random() * 20),
    walls: pick(WALL_FINISHES).id,
    roof: pick(ROOF_FINISHES).id,
    floor: pick(FLOOR_FINISHES).id,
  });
}

const polygonBox = (poly: P[]) => {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
};

export function generateHouseScene(input: Partial<QuickHouse>) {
  const house = normaliseHouse(input);
  const plan = getPlan(house.plan);
  const sx = house.width / (plan.W + OUTER);
  const sy = house.length / (plan.L + OUTER);
  const W = plan.W * sx;
  const L = plan.L * sy;
  const H = plan.wallHeight;
  // Plan (x across, y from the back) → world (front at −Z, centred): a half-turn, not a mirror.
  const sp = ([x, y]: P): P => [x * sx, y * sy];
  const world = ([x, y]: P): [number, number] => [Math.round((W / 2 - x) * 1000) / 1000, Math.round((L / 2 - y) * 1000) / 1000];
  const FACE = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 } as const;

  const nodes: Record<string, AnyNode> = {};
  const put = (node: AnyNode) => {
    nodes[node.id] = node;
    if (node.parentId && nodes[node.parentId]) nodes[node.parentId].children = [...(nodes[node.parentId].children ?? []), node.id];
    return node;
  };
  let count = 0;
  const nextId = (prefix: string) => `${prefix}_q${(count += 1)}`;

  // Compound: 3 m each side, 3.5 m behind, 9 m in front for the driveway and parking.
  const plot = { x0: -0.115 - 3, x1: W + 0.115 + 3, y0: -0.115 - 3.5, y1: L + 0.115 + 9 };
  const margin = Math.max(...[plot.x0, plot.x1, plot.y0, plot.y1].map((v, i) => Math.abs(v - (i < 2 ? W / 2 : L / 2)))) + 8;
  put({ ...clone(T.site), id: "site_quick", parentId: null, children: [], polygon: { type: "polygon", points: [[-margin, -margin], [margin, -margin], [margin, margin], [-margin, margin]] } });
  put({ ...clone(T.building), id: "building_quick", parentId: "site_quick", children: [] });

  const item = (levelId: string, id: string, [x, y]: P, face: keyof typeof FACE | number = "n") => {
    const entry = asset(id);
    if (!entry) return;
    const [wx, wz] = world([x, y]);
    put({ object: "node", id: nextId("item"), type: "item", parentId: levelId, visible: true, metadata: {}, children: [], position: [wx, 0, wz], rotation: [0, typeof face === "number" ? face : FACE[face], 0], scale: [1, 1, 1], asset: { ...entry } });
  };
  const slab = (levelId: string, poly: P[], material: string, metadata: Record<string, unknown> = {}, elevation?: number) =>
    put({ object: "node", id: nextId("slab"), type: "slab", parentId: levelId, visible: true, metadata, polygon: poly.map(world), holes: [], materialPreset: lib(material), ...(elevation !== undefined ? { elevation } : {}) });

  const rooms: { zoneId: string; levelId: string; kind: NonNullable<PlanRoom["kind"]> }[] = [];
  const footprint = (plan.footprint ?? [[0.115, 0.115], [plan.W - 0.115, 0.115], [plan.W - 0.115, plan.L - 0.115], [0.115, plan.L - 0.115]]).map(sp);

  plan.floors.forEach((floor, f) => {
    const levelId = `level_q${f}`;
    put({ ...clone(T.level), id: levelId, parentId: "building_quick", children: [], level: f, baseElevation: 0, height: H });

    for (const spec of floor.walls) {
      const a = sp(spec.a);
      const b = sp(spec.b);
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const scale = length / Math.hypot(spec.b[0] - spec.a[0], spec.b[1] - spec.a[1]);
      const wallId = nextId("wall");
      put({
        ...clone(T.wall),
        id: wallId,
        parentId: levelId,
        children: [],
        start: world(a),
        end: world(b),
        thickness: spec.railing ? 0.08 : spec.ext ? OUTER : INNER,
        height: spec.railing ? 1.1 : H,
        ...(spec.railing
          ? { wallType: "railing", railing: { style: "metal", postSpacing: 1.2, postSize: 0.08, infillSize: 0.02, infillGap: 0.1, bottomClearance: 0.08, cap: false } }
          : spec.ext
            ? { exteriorMaterialPreset: lib(house.walls), interiorMaterialPreset: lib("concrete-plaster") }
            : { materialPreset: lib("concrete-plaster") }),
      });
      for (const o of spec.open ?? []) {
        const along = clamp(o.at * scale, [o.w / 2 + 0.12, length - o.w / 2 - 0.12]);
        put({ ...clone(T[o.kind]), id: nextId(o.kind), parentId: wallId, wallId, position: [Math.round(along * 1000) / 1000, o.sill + o.h / 2, 0], width: o.w, height: o.h });
      }
    }

    slab(levelId, footprint, house.floor);
    put({ ...clone(T.ceiling), id: `ceiling_q${f}`, parentId: levelId, children: [], polygon: footprint.map(world), height: H - 0.05 });

    for (const room of floor.rooms) {
      const poly = room.poly.map(sp);
      const zoneId = nextId("zone");
      put({ ...clone(T.zone), id: zoneId, parentId: levelId, name: room.name, polygon: poly.map(world) });
      if (room.kind) rooms.push({ zoneId, levelId, kind: room.kind });
      if (!house.furnished && !room.wet) continue;
      // Fittings stand against the named wall of the room (toilets, showers and basins always go in).
      const box = polygonBox(poly);
      for (const fit of room.fit ?? []) {
        const entry = fit.id === "basin" ? BASINS.find((b) => (b.dimensions?.[0] ?? 1) <= Math.max(box.maxX - box.minX, box.maxY - box.minY) - 0.5) : asset(fit.id);
        if (!entry) continue;
        const depth = entry.dimensions?.[2] ?? 0.6;
        const gap = depth / 2 + 0.03 + (fit.off ?? 0);
        const turn = fit.id === "office-chair" && fit.off ? Math.PI : 0;
        const along = fit.wall === "n" || fit.wall === "s" ? fit.at * sx : fit.at * sy;
        const line = fit.line !== undefined ? (fit.wall === "n" || fit.wall === "s" ? fit.line * sy : fit.line * sx) : undefined;
        const at: Record<typeof fit.wall, P> = {
          n: [along, (line ?? box.minY) + gap],
          s: [along, (line ?? box.maxY) - gap],
          w: [(line ?? box.minX) + gap, along],
          e: [(line ?? box.maxX) - gap, along],
        };
        const opposite = { n: "s", s: "n", w: "e", e: "w" } as const;
        item(levelId, entry.id, at[fit.wall], FACE[opposite[fit.wall]] + turn);
      }
    }
  });

  for (const extra of plan.slabs ?? []) {
    slab("level_q0", extra.poly.map(sp), extra.material, { external: true, name: extra.name });
    put({ ...clone(T.zone), id: nextId("zone"), parentId: "level_q0", name: extra.name, polygon: extra.poly.map(sp).map(world) });
  }

  const [spawnX, spawnZ] = world([plan.frontDoorX * sx, L - 1.0]);
  put({ object: "node", id: "spawn_quick", type: "spawn", parentId: "level_q0", visible: true, metadata: {}, position: [spawnX, 0, spawnZ], rotation: 0 });

  const top = `level_q${plan.floors.length - 1}`;
  put({ ...clone(T.roof), id: "roof_quick", parentId: top, children: [], position: [0, H, 0] });
  put({ ...clone(T.roofSegment), id: "rseg_quick", parentId: "roof_quick", roofType: house.roofType, width: W + OUTER, depth: L + OUTER, pitch: house.roofPitch, overhang: 0.6, topMaterialPreset: lib(house.roof), edgeMaterialPreset: lib(house.roof) });

  // Apply a Pascal agent operation's created nodes to our graph (best effort: a refusal just skips).
  const apply = (outcome: { changes?: { create?: { node: unknown; parentId?: string }[] } }) => {
    for (const { node, parentId } of outcome.changes?.create ?? []) {
      const created = node as AnyNode;
      put({ ...created, parentId: parentId ?? created.parentId ?? null });
    }
  };
  const context = { activeLevelId: "level_q0", catalog: CATALOG as never };

  if (plan.stair && plan.floors.length > 1) {
    const [x, z] = world(sp([plan.stair.x, plan.stair.y]));
    try {
      apply(AGENT_OPERATIONS.create_stair(nodes as never, { x, z, rotation: 0, layout: "straight", width: plan.stair.width, length: plan.stair.length, toLevelId: "level_q1", railingStyle: "metal" } as never, context as never) as never);
    } catch {
      // No stair if the operation refuses.
    }
  }

  if (house.furnished) {
    for (const room of rooms) {
      try {
        apply(AGENT_OPERATIONS.furnish_room(nodes as never, { zoneId: room.zoneId, roomType: room.kind } as never, { ...context, activeLevelId: room.levelId }) as never);
      } catch {
        // A room the operation cannot furnish stays empty.
      }
    }
  }

  if (house.outdoor) {
    const g = "level_q0";
    const doorX = plan.frontDoorX * sx;
    const driveX = doorX < W / 2 ? W * 0.72 : W * 0.25; // driveway on the side away from the front door
    const gate = [driveX - 1.9, driveX + 1.9];
    const fy = plot.y1;
    try {
      apply(AGENT_OPERATIONS.add_fence(nodes as never, { levelId: g, points: [[gate[1], fy], [plot.x1, fy], [plot.x1, plot.y0], [plot.x0, plot.y0], [plot.x0, fy], [gate[0], fy]].map((p) => world(p as P)), closed: false, height: 1.5 } as never, context as never) as never);
    } catch {
      // No fence if the operation refuses.
    }
    const ext = (name: string, poly: P[], material: string) => {
      slab(g, poly, material, { external: true, name });
      put({ ...clone(T.zone), id: nextId("zone"), parentId: g, name, polygon: poly.map(world) });
    };
    const front = L + 0.115;
    ext("Driveway", [[driveX - 1.8, front + 0.2], [driveX + 1.8, front + 0.2], [driveX + 1.8, fy], [driveX - 1.8, fy]], "concrete-polished");
    const walkStart = front + (plan.slabs?.length ? 1.6 : 0.2);
    if (Math.abs(doorX - driveX) > 2.5) ext("Walkway", [[doorX - 0.6, walkStart], [doorX + 0.6, walkStart], [doorX + 0.6, fy - 0.2], [doorX - 0.6, fy - 0.2]], "flooring-terrazzo19");
    item(g, "tesla", [driveX, front + 4.2], "s");
    // Septic tank and soakaway in the side yard, away from the kitchen side.
    const sideX = W + 0.115 + 0.8;
    ext("Septic tank", [[sideX, 0.8], [sideX + 1.5, 0.8], [sideX + 1.5, 3.5], [sideX, 3.5]], "concrete-polished");
    ext("Soakaway", [[sideX, 4.2], [sideX + 1.5, 4.2], [sideX + 1.5, 5.7], [sideX, 5.7]], "concrete-polished");
    // Landscaping.
    item(g, "palm", [plot.x0 + 1, fy - 1]);
    item(g, "palm", [plot.x1 - 1, fy - 1]);
    item(g, "palm", [plot.x0 + 1, front + 2]);
    item(g, "tree", [plot.x0 + 1.4, plot.y0 + 1.4]);
    item(g, "tree", [plot.x1 - 1.4, plot.y0 + 1.4]);
    item(g, "bush", [(plot.x0 + gate[0]) / 2, fy - 0.8]);
    if (plot.x1 - gate[1] > 4) item(g, "bush", [(gate[1] + plot.x1) / 2, fy - 0.8]);
    item(g, "patio-umbrella", [W * 0.35, -2]);
    item(g, "sunbed", [W * 0.35 - 1, -2], "s");
    item(g, "sunbed", [W * 0.35 + 1, -2], "s");
    item(g, "trash-bin", [gate[1] + 0.6, fy - 0.5], "s");
  }

  return {
    nodes,
    rootNodeIds: ["site_quick"],
    materials: clone(templatesFile.materials),
    collections: {},
    installedPlugins: [] as string[],
    house,
    plan,
  };
}

/** The chosen plan at the chosen size, in plan metres (x across, y from the back), for 2D drawings. */
export function planGeometry(input: Partial<QuickHouse>) {
  const house = normaliseHouse(input);
  const plan = getPlan(house.plan);
  const sx = house.width / (plan.W + OUTER);
  const sy = house.length / (plan.L + OUTER);
  const sp = ([x, y]: P): P => [x * sx, y * sy];
  return {
    house,
    plan,
    W: plan.W * sx,
    L: plan.L * sy,
    frontDoorX: plan.frontDoorX * sx,
    slabs: (plan.slabs ?? []).map((slab) => ({ name: slab.name, poly: slab.poly.map(sp) })),
    stair: plan.stair ? { x: plan.stair.x * sx, y: plan.stair.y * sy, length: plan.stair.length, width: plan.stair.width } : undefined,
    floors: plan.floors.map((floor) => ({
      walls: floor.walls.map((spec) => {
        const a = sp(spec.a);
        const b = sp(spec.b);
        const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const scale = length / Math.hypot(spec.b[0] - spec.a[0], spec.b[1] - spec.a[1]);
        return {
          a,
          b,
          length,
          thickness: spec.railing ? 0.08 : spec.ext ? OUTER : INNER,
          railing: Boolean(spec.railing),
          open: (spec.open ?? []).map((o) => ({ ...o, at: clamp(o.at * scale, [o.w / 2 + 0.12, length - o.w / 2 - 0.12]) })),
        };
      }),
      rooms: floor.rooms.map((room) => {
        const poly = room.poly.map(sp);
        const box = polygonBox(poly);
        const area = Math.abs(poly.reduce((s, [x1, y1], i) => { const [x2, y2] = poly[(i + 1) % poly.length]; return s + x1 * y2 - x2 * y1; }, 0)) / 2;
        return { name: room.name, poly, area, box, rect: poly.length === 4 };
      }),
    })),
  };
}
