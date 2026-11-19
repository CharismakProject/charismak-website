import { AGENT_OPERATIONS } from "@pascal-app/core/agent-operations";
import { CATALOG_ITEMS } from "@pascal-app/editor/catalog";

import hostedItems from "./hosted-items.json";
import templatesFile from "./quick-house-templates.json";

/**
 * Generates a furnished, finished Pascal scene graph from a few plain inputs, so visitors can
 * "play" without learning the full editor. The result opens in the full editor too.
 * Coordinates: x across the width, z along the length, centred on the origin; front wall at z = -length/2.
 * Furniture is placed by Pascal's own furnish_room operation; fences by add_fence.
 */

export type QuickHouse = {
  width: number; // m
  length: number; // m
  floors: number; // 1–3
  rooms: number; // rooms per floor (partitions across the length)
  roofType: "gable" | "hip";
  roofPitch: number; // degrees
  walls: string; // Pascal material preset id (exterior)
  roof: string; // Pascal material preset id (roof top)
  floor: string; // Pascal material preset id (floor slabs)
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
  { id: "flooring-tile20", label: "Ceramic tiles", swatch: "#d8d2c6", tiled: true },
  { id: "flooring-terrazzo19", label: "Terrazzo", swatch: "#cfc8bd", tiled: false },
  { id: "wood-floorplank1", label: "Wood", swatch: "#a8763f", tiled: false },
  { id: "concrete-polished", label: "Polished concrete", swatch: "#9a9a97", tiled: false },
] as const;

const DEFAULT_STYLE = { walls: "preset-cream", roof: "preset-brickred", floor: "flooring-tile20", furnished: true, outdoor: true };

export const QUICK_PRESETS: { id: string; label: string; note: string; house: QuickHouse }[] = [
  { id: "shop", label: "Shop / office", note: "8 × 6 m · 1 floor", house: { width: 8, length: 6, floors: 1, rooms: 1, roofType: "gable", roofPitch: 15, ...DEFAULT_STYLE, walls: "preset-white", roof: "preset-charcoal" } },
  { id: "2bed", label: "2-bed bungalow", note: "12 × 9 m · 1 floor", house: { width: 12, length: 9, floors: 1, rooms: 4, roofType: "gable", roofPitch: 30, ...DEFAULT_STYLE } },
  { id: "3bed", label: "3-bed bungalow", note: "15 × 10 m · 1 floor", house: { width: 15, length: 10, floors: 1, rooms: 5, roofType: "hip", roofPitch: 30, ...DEFAULT_STYLE, walls: "preset-peach", roof: "preset-royalblue" } },
  { id: "duplex", label: "4-bed duplex", note: "12 × 10 m · 2 floors", house: { width: 12, length: 10, floors: 2, rooms: 4, roofType: "hip", roofPitch: 30, ...DEFAULT_STYLE, walls: "preset-sage", roof: "preset-forest" } },
];

export const QUICK_LIMITS = {
  width: [5, 20],
  length: [5, 16],
  floors: [1, 3],
  rooms: [1, 6],
  roofPitch: [10, 45],
} as const;

type AnyNode = { id: string; type: string; parentId: string | null; children?: string[]; [key: string]: unknown };
const T = templatesFile.templates as unknown as Record<string, AnyNode>;
const clone = <V>(value: V): V => JSON.parse(JSON.stringify(value)) as V;
const HOSTED = new Set<string>(hostedItems as string[]);

// Pascal's catalog, pointed at the models we self-host.
const CATALOG = (CATALOG_ITEMS as unknown as { id: string; src?: string; thumbnail?: string }[])
  .filter((item) => HOSTED.has(item.id))
  .map((item) => ({ ...item, src: `/items/${item.id}/model.glb`, thumbnail: `/items/${item.id}/thumbnail.webp` }));

/** Pascal stores library materials as "library:<id>" references. */
const lib = (id: string) => `library:${id}`;

const STOREY = 3; // floor-to-floor, m
const OUTER = 0.23; // 9-inch block
const INNER = 0.15; // 6-inch block

const clamp = (value: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, value));
const oneOf = <V extends string>(value: string, list: readonly { id: V }[], fallback: V): V => (list.some((item) => item.id === value) ? (value as V) : fallback);

export function normaliseHouse(house: Partial<QuickHouse>): QuickHouse {
  return {
    width: Math.round(clamp(Number(house.width) || 12, QUICK_LIMITS.width) * 2) / 2,
    length: Math.round(clamp(Number(house.length) || 9, QUICK_LIMITS.length) * 2) / 2,
    floors: Math.round(clamp(Number(house.floors) || 1, QUICK_LIMITS.floors)),
    rooms: Math.round(clamp(Number(house.rooms) || 1, QUICK_LIMITS.rooms)),
    roofType: house.roofType === "hip" ? "hip" : "gable",
    roofPitch: Math.round(clamp(Number(house.roofPitch) || 30, QUICK_LIMITS.roofPitch)),
    walls: oneOf(String(house.walls), WALL_FINISHES, DEFAULT_STYLE.walls as (typeof WALL_FINISHES)[number]["id"]),
    roof: oneOf(String(house.roof), ROOF_FINISHES, DEFAULT_STYLE.roof as (typeof ROOF_FINISHES)[number]["id"]),
    floor: oneOf(String(house.floor), FLOOR_FINISHES, DEFAULT_STYLE.floor as (typeof FLOOR_FINISHES)[number]["id"]),
    furnished: house.furnished !== false,
    outdoor: house.outdoor !== false,
  };
}

/** A random but sensible house, for the "Surprise me" button. */
export function randomHouse(random: () => number = Math.random): QuickHouse {
  const pick = <V>(list: readonly V[]) => list[Math.floor(random() * list.length)];
  const floors = pick([1, 1, 2, 2, 3]);
  return normaliseHouse({
    width: 8 + Math.round(random() * 20) / 2,
    length: 7 + Math.round(random() * 14) / 2,
    floors,
    rooms: 2 + Math.floor(random() * 4),
    roofType: pick(["gable", "hip"] as const),
    roofPitch: 20 + Math.round(random() * 20),
    walls: pick(WALL_FINISHES).id,
    roof: pick(ROOF_FINISHES).id,
    floor: pick(FLOOR_FINISHES).id,
    furnished: true,
    outdoor: true,
  });
}

/** Room types by position: ground floor front = living, back = kitchen; upper floors = bedrooms + a bathroom. */
function roomTypes(floor: number, rooms: number): ("living" | "kitchen" | "bedroom" | "bathroom" | "dining")[] {
  if (rooms === 1) return [floor === 0 ? "living" : "bedroom"];
  if (floor === 0) {
    const list: ("living" | "kitchen" | "bedroom" | "bathroom" | "dining")[] = ["living"];
    for (let i = 1; i < rooms - 1; i += 1) list.push(i === rooms - 2 && rooms > 3 ? "bathroom" : "bedroom");
    list.push("kitchen");
    return list;
  }
  return Array.from({ length: rooms }, (_, i) => (i === rooms - 1 ? "bathroom" : "bedroom"));
}

const ROOM_NAMES = { living: "Living room", kitchen: "Kitchen", bedroom: "Bedroom", bathroom: "Bathroom", dining: "Dining" } as const;

export function generateHouseScene(input: Partial<QuickHouse>) {
  const house = normaliseHouse(input);
  const { width: W, length: L } = house;
  const nodes: Record<string, AnyNode> = {};
  const put = (node: AnyNode) => {
    nodes[node.id] = node;
    if (node.parentId && nodes[node.parentId]) nodes[node.parentId].children = [...(nodes[node.parentId].children ?? []), node.id];
    return node;
  };

  const plotX = W / 2 + 4;
  const plotFront = -L / 2 - 7;
  const plotBack = L / 2 + 4;
  const margin = Math.max(plotX, -plotFront, plotBack) + 6;
  put({ ...clone(T.site), id: "site_quick", parentId: null, children: [], polygon: { type: "polygon", points: [[-margin, -margin], [margin, -margin], [margin, margin], [-margin, margin]] } });
  put({ ...clone(T.building), id: "building_quick", parentId: "site_quick", children: [] });

  const x0 = -W / 2, x1 = W / 2, z0 = -L / 2, z1 = L / 2;
  let openingCount = 0;
  const opening = (kind: "door" | "window", wallId: string, along: number, width: number, height: number, centreY: number) =>
    put({ ...clone(T[kind]), id: `${kind}_q${(openingCount += 1)}`, parentId: wallId, wallId, position: [along, centreY, 0], width, height });

  const wall = (id: string, levelId: string, start: [number, number], end: [number, number], thickness: number, exterior: boolean) =>
    put({
      ...clone(T.wall),
      id,
      parentId: levelId,
      children: [],
      start,
      end,
      thickness,
      height: STOREY,
      ...(exterior ? { exteriorMaterialPreset: lib(house.walls), interiorMaterialPreset: lib("concrete-plaster") } : { materialPreset: lib("concrete-plaster") }),
    });

  const windows = (wallId: string, length: number, skipCentre: boolean) => {
    const count = Math.max(1, Math.floor(length / 3));
    for (let i = 0; i < count; i += 1) {
      const along = ((i + 0.5) * length) / count;
      if (skipCentre && Math.abs(along - length / 2) < 1.4) continue;
      if (along < 0.9 || along > length - 0.9) continue;
      opening("window", wallId, along, 1.2, 1.2, 1.5);
    }
  };

  const rooms: { zoneId: string; levelId: string; type: ReturnType<typeof roomTypes>[number] }[] = [];
  for (let f = 0; f < house.floors; f += 1) {
    const levelId = `level_q${f}`;
    put({ ...clone(T.level), id: levelId, parentId: "building_quick", children: [], level: f, baseElevation: 0, height: STOREY });
    const s = wall(`wall_q${f}s`, levelId, [x0, z0], [x1, z0], OUTER, true);
    wall(`wall_q${f}e`, levelId, [x1, z0], [x1, z1], OUTER, true);
    wall(`wall_q${f}n`, levelId, [x1, z1], [x0, z1], OUTER, true);
    wall(`wall_q${f}w`, levelId, [x0, z1], [x0, z0], OUTER, true);
    if (f === 0) opening("door", s.id, W / 2, 1.2, 2.1, 1.05);
    windows(`wall_q${f}s`, W, f === 0);
    windows(`wall_q${f}n`, W, false);
    windows(`wall_q${f}e`, L, false);
    windows(`wall_q${f}w`, L, false);

    const inner = OUTER / 2;
    put({ object: "node", id: `slab_q${f}`, type: "slab", parentId: levelId, visible: true, metadata: {}, polygon: [[x0 + inner, z0 + inner], [x1 - inner, z0 + inner], [x1 - inner, z1 - inner], [x0 + inner, z1 - inner]], holes: [], materialPreset: lib(house.floor) });

    const types = roomTypes(f, house.rooms);
    for (let k = 0; k < house.rooms; k += 1) {
      const za = z0 + (k * L) / house.rooms;
      const zb = z0 + ((k + 1) * L) / house.rooms;
      if (k > 0) {
        const p = wall(`wall_q${f}p${k}`, levelId, [x0, za], [x1, za], INNER, false);
        opening("door", p.id, Math.min(W - 0.8, 1.4), 0.9, 2.1, 1.05);
      }
      const zoneId = `zone_q${f}r${k}`;
      put({ ...clone(T.zone), id: zoneId, parentId: levelId, name: ROOM_NAMES[types[k]], polygon: [[x0 + inner, za + (k > 0 ? INNER / 2 : inner)], [x1 - inner, za + (k > 0 ? INNER / 2 : inner)], [x1 - inner, zb - (k < house.rooms - 1 ? INNER / 2 : inner)], [x0 + inner, zb - (k < house.rooms - 1 ? INNER / 2 : inner)]] });
      rooms.push({ zoneId, levelId, type: types[k] });
    }
    put({ ...clone(T.ceiling), id: `ceiling_q${f}`, parentId: levelId, children: [], polygon: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], height: STOREY - 0.3 });
  }

  put({ object: "node", id: "spawn_quick", type: "spawn", parentId: "level_q0", visible: true, metadata: {}, position: [0, 0, z0 + 1.2], rotation: 0 });

  const top = `level_q${house.floors - 1}`;
  put({ ...clone(T.roof), id: "roof_quick", parentId: top, children: [], position: [0, STOREY, 0] });
  put({ ...clone(T.roofSegment), id: "rseg_quick", parentId: "roof_quick", roofType: house.roofType, width: W, depth: L, pitch: house.roofPitch, overhang: 0.6, topMaterialPreset: lib(house.roof), edgeMaterialPreset: lib(house.roof) });

  // Apply a Pascal agent operation's created nodes to our graph (best effort: a refusal just skips).
  const apply = (outcome: { changes?: { create?: { node: unknown; parentId?: string }[] } }) => {
    for (const { node, parentId } of outcome.changes?.create ?? []) {
      const created = node as AnyNode;
      put({ ...created, parentId: parentId ?? created.parentId ?? null });
    }
  };
  const context = { activeLevelId: "level_q0", catalog: CATALOG as never };

  if (house.furnished) {
    for (const room of rooms) {
      try {
        apply(AGENT_OPERATIONS.furnish_room(nodes as never, { zoneId: room.zoneId, roomType: room.type } as never, { ...context, activeLevelId: room.levelId }) as never);
      } catch {
        // A room the operation cannot furnish stays empty.
      }
    }
  }

  if (house.outdoor) {
    try {
      apply(AGENT_OPERATIONS.add_fence(nodes as never, { levelId: "level_q0", points: [[-plotX, plotFront], [plotX, plotFront], [plotX, plotBack], [-plotX, plotBack]], closed: true, height: 1.8 } as never, context as never) as never);
    } catch {
      // No fence if the operation refuses.
    }
    const item = (assetId: string, x: number, z: number, rotationY = 0) => {
      const asset = CATALOG.find((entry) => entry.id === assetId);
      if (!asset) return;
      put({ object: "node", id: `item_q${Object.keys(nodes).length}`, type: "item", parentId: "level_q0", visible: true, metadata: {}, children: [], position: [x, 0, z], rotation: [0, rotationY, 0], scale: [1, 1, 1], asset: { ...asset } });
    };
    item("parking-spot", W / 4, plotFront + 2.5, Math.PI / 2);
    item("palm", -plotX + 1.2, plotFront + 1.2);
    item("palm", plotX - 1.2, plotFront + 1.2);
    item("tree", -plotX + 1.5, plotBack - 1.5);
    item("tree", plotX - 1.5, plotBack - 1.5);
    item("fir-tree", -plotX + 1, 0);
  }

  return {
    nodes,
    rootNodeIds: ["site_quick"],
    materials: clone(templatesFile.materials),
    collections: {},
    installedPlugins: [] as string[],
    house,
  };
}
