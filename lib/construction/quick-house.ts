import templatesFile from "./quick-house-templates.json";

/**
 * Generates a simple Pascal scene graph from a few plain inputs, so visitors can
 * "play" without learning the full editor. The result opens in the full editor too.
 * Coordinates: x across the width, z along the length, centred on the origin; front wall at z = -length/2.
 */

export type QuickHouse = {
  width: number; // m
  length: number; // m
  floors: number; // 1–3
  rooms: number; // rooms per floor (partitions across the length)
  roofType: "gable" | "hip";
  roofPitch: number; // degrees
};

export const QUICK_PRESETS: { id: string; label: string; note: string; house: QuickHouse }[] = [
  { id: "shop", label: "Shop / office", note: "8 × 6 m · 1 floor", house: { width: 8, length: 6, floors: 1, rooms: 1, roofType: "gable", roofPitch: 15 } },
  { id: "2bed", label: "2-bed bungalow", note: "12 × 9 m · 1 floor", house: { width: 12, length: 9, floors: 1, rooms: 3, roofType: "gable", roofPitch: 30 } },
  { id: "3bed", label: "3-bed bungalow", note: "15 × 10 m · 1 floor", house: { width: 15, length: 10, floors: 1, rooms: 4, roofType: "hip", roofPitch: 30 } },
  { id: "duplex", label: "4-bed duplex", note: "12 × 10 m · 2 floors", house: { width: 12, length: 10, floors: 2, rooms: 3, roofType: "hip", roofPitch: 30 } },
];

export const QUICK_LIMITS = {
  width: [5, 20],
  length: [5, 16],
  floors: [1, 3],
  rooms: [1, 5],
  roofPitch: [10, 45],
} as const;

type AnyNode = { id: string; type: string; parentId: string | null; children?: string[]; [key: string]: unknown };
const T = templatesFile.templates as unknown as Record<string, AnyNode>;
const clone = <V>(value: V): V => JSON.parse(JSON.stringify(value)) as V;

const STOREY = 3; // floor-to-floor, m
const OUTER = 0.23; // 9-inch block
const INNER = 0.15; // 6-inch block

const clamp = (value: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, value));

export function normaliseHouse(house: QuickHouse): QuickHouse {
  return {
    width: Math.round(clamp(house.width, QUICK_LIMITS.width) * 2) / 2,
    length: Math.round(clamp(house.length, QUICK_LIMITS.length) * 2) / 2,
    floors: Math.round(clamp(house.floors, QUICK_LIMITS.floors)),
    rooms: Math.round(clamp(house.rooms, QUICK_LIMITS.rooms)),
    roofType: house.roofType === "hip" ? "hip" : "gable",
    roofPitch: Math.round(clamp(house.roofPitch, QUICK_LIMITS.roofPitch)),
  };
}

export function generateHouseScene(input: QuickHouse) {
  const house = normaliseHouse(input);
  const { width: W, length: L } = house;
  const nodes: Record<string, AnyNode> = {};
  const put = (node: AnyNode) => {
    nodes[node.id] = node;
    if (node.parentId && nodes[node.parentId]) nodes[node.parentId].children = [...(nodes[node.parentId].children ?? []), node.id];
    return node;
  };

  const margin = Math.max(W, L) / 2 + 8;
  put({ ...clone(T.site), id: "site_quick", parentId: null, children: [], polygon: { type: "polygon", points: [[-margin, -margin], [margin, -margin], [margin, margin], [-margin, margin]] } });
  put({ ...clone(T.building), id: "building_quick", parentId: "site_quick", children: [] });

  const x0 = -W / 2, x1 = W / 2, z0 = -L / 2, z1 = L / 2;
  let openingCount = 0;
  const opening = (kind: "door" | "window", wallId: string, along: number, width: number, height: number, centreY: number) =>
    put({ ...clone(T[kind]), id: `${kind}_q${(openingCount += 1)}`, parentId: wallId, wallId, position: [along, centreY, 0], width, height });

  const wall = (id: string, levelId: string, start: [number, number], end: [number, number], thickness: number) =>
    put({ ...clone(T.wall), id, parentId: levelId, children: [], start, end, thickness, height: STOREY });

  /** Evenly spaced windows along a wall, skipping a central gap (for the front door). */
  const windows = (wallId: string, length: number, skipCentre: boolean) => {
    const count = Math.max(1, Math.floor(length / 3));
    for (let i = 0; i < count; i += 1) {
      const along = ((i + 0.5) * length) / count;
      if (skipCentre && Math.abs(along - length / 2) < 1.4) continue;
      if (along < 0.9 || along > length - 0.9) continue;
      opening("window", wallId, along, 1.2, 1.2, 1.5);
    }
  };

  for (let f = 0; f < house.floors; f += 1) {
    const levelId = `level_q${f}`;
    put({ ...clone(T.level), id: levelId, parentId: "building_quick", children: [], level: f, baseElevation: 0, height: STOREY });
    const s = wall(`wall_q${f}s`, levelId, [x0, z0], [x1, z0], OUTER);
    wall(`wall_q${f}e`, levelId, [x1, z0], [x1, z1], OUTER);
    wall(`wall_q${f}n`, levelId, [x1, z1], [x0, z1], OUTER);
    wall(`wall_q${f}w`, levelId, [x0, z1], [x0, z0], OUTER);
    if (f === 0) opening("door", s.id, W / 2, 1.2, 2.1, 1.05); // front door
    windows(`wall_q${f}s`, W, f === 0);
    windows(`wall_q${f}n`, W, false);
    windows(`wall_q${f}e`, L, false);
    windows(`wall_q${f}w`, L, false);
    // Room partitions across the length, each with a door
    for (let k = 1; k < house.rooms; k += 1) {
      const z = z0 + (k * L) / house.rooms;
      const p = wall(`wall_q${f}p${k}`, levelId, [x0, z], [x1, z], INNER);
      opening("door", p.id, Math.min(W - 0.8, 1.4), 0.9, 2.1, 1.05);
    }
    const inner = OUTER / 2;
    put({ ...clone(T.zone), id: `zone_q${f}`, parentId: levelId, name: f === 0 ? "Ground floor" : `Floor ${f + 1}`, polygon: [[x0 + inner, z0 + inner], [x1 - inner, z0 + inner], [x1 - inner, z1 - inner], [x0 + inner, z1 - inner]] });
    put({ ...clone(T.ceiling), id: `ceiling_q${f}`, parentId: levelId, children: [], polygon: [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], height: STOREY - 0.3 });
  }

  const top = `level_q${house.floors - 1}`;
  put({ ...clone(T.roof), id: "roof_quick", parentId: top, children: [], position: [0, STOREY, 0] });
  put({ ...clone(T.roofSegment), id: "rseg_quick", parentId: "roof_quick", roofType: house.roofType, width: W, depth: L, pitch: house.roofPitch, overhang: 0.6 });

  return {
    nodes,
    rootNodeIds: ["site_quick"],
    materials: clone(templatesFile.materials),
    collections: {},
    installedPlugins: [] as string[],
    house,
  };
}
