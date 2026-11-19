/**
 * Floor plans behind the Quick design samples. Plan coordinates in metres: x across the front,
 * y from the back wall (y = 0) to the front wall (y = L). Walls are given on their centrelines
 * (external 230 mm, internal 150 mm). Openings sit `at` metres from the wall's start point `a`.
 *
 * The 2-bedroom bungalow is taken from Charismak's own drawing "2 Bedroom Project" (floor plan and
 * section A-A): 11.0 × 6.0 m overall, grids A–D at 4555 / 3050 / 3165 mm, 3.0 m clear to the POP
 * ceiling, 0.75 long-span roof. The other plans are drawn the same way for typical Nigerian briefs.
 */

export type P = [number, number];
export type PlanOpening = { kind: "door" | "window"; at: number; w: number; h: number; sill: number };
export type PlanWall = { a: P; b: P; ext?: boolean; railing?: boolean; open?: PlanOpening[] };
export type RoomKind = "living" | "kitchen" | "bedroom" | "dining" | "hallway" | "entry" | "storage" | "laundry";
/** A fitting backs onto one wall of its room ("n" = the back side, "s" = the front side, "w"/"e" = left/right). */
export type Fitting = { id: string; wall: "n" | "s" | "e" | "w"; at: number; line?: number; off?: number };
export type PlanRoom = { name: string; kind?: RoomKind; wet?: boolean; poly: P[]; fit?: Fitting[] };
export type PlanFloor = { walls: PlanWall[]; rooms: PlanRoom[] };
export type ExternalSlab = { name: string; poly: P[]; material: string };
export type HousePlan = {
  id: string;
  label: string;
  note: string;
  summary: string;
  W: number; // centreline width (overall = W + 0.23)
  L: number;
  wallHeight: number;
  roofType: "gable" | "hip";
  pitch: number;
  frontDoorX: number;
  floors: PlanFloor[];
  footprint?: P[]; // inside face of the external walls; defaults to the rectangle
  slabs?: ExternalSlab[]; // porch, steps, terrace — not priced as building floor
  stair?: { x: number; y: number; length: number; width: number };
};

const win = (at: number, w: number, h = 1.2, sill = 0.9): PlanOpening => ({ kind: "window", at, w, h, sill });
const hi = (at: number, w = 0.6): PlanOpening => ({ kind: "window", at, w, h: 0.6, sill: 1.5 }); // toilet / store vent window
const door = (at: number, w: number, h = 2.1): PlanOpening => ({ kind: "door", at, w, h, sill: 0 });
const rect = (x0: number, y0: number, x1: number, y1: number): P[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
const toilet = (wall: Fitting["wall"], at: number, line?: number): Fitting => ({ id: "toilet", wall, at, line });
const shower = (wall: Fitting["wall"], at: number): Fitting => ({ id: "shower-square", wall, at });
const basin = (wall: Fitting["wall"], at: number): Fitting => ({ id: "basin", wall, at });

// ── 2-bedroom bungalow, from the drawing ───────────────────────────────────────────────
const TWO_BED: HousePlan = {
  id: "2bed",
  label: "2-bed bungalow",
  note: "11 × 6 m · Charismak drawing",
  summary: "Living room, kitchen, lobby, 2 bedrooms (both en-suite), visitors' WC, entrance porch, terrace",
  W: 10.77,
  L: 5.77,
  wallHeight: 3.3,
  roofType: "gable",
  pitch: 34, // 2.0 m rise (ceiling 3450 → roof 5450) over a 3.0 m half-span
  frontDoorX: 3.83,
  footprint: [[0.115, 0.115], [10.655, 0.115], [10.655, 4.665], [8.605, 4.665], [8.605, 5.655], [0.115, 5.655]],
  slabs: [
    { name: "Terrace", poly: rect(8.605, 4.895, 10.655, 5.77), material: "flooring-tile20" },
    { name: "Front steps", poly: rect(3.03, 5.885, 4.63, 6.785), material: "concrete-polished" },
  ],
  floors: [
    {
      walls: [
        { a: [0, 0], b: [10.77, 0], ext: true, open: [win(8.3, 0.6), hi(10.03, 0.57)] },
        { a: [10.77, 0], b: [10.77, 5.77], ext: true },
        { a: [0, 0], b: [0, 5.77], ext: true, open: [door(0.59, 0.75), win(1.6, 0.6), win(4.035, 1.2)] },
        { a: [0, 5.77], b: [8.72, 5.77], ext: true, open: [win(0.835, 1.0), hi(2.38), door(3.83, 0.9), hi(5.0), win(6.78, 1.2), win(8.23, 0.6)] },
        { a: [8.72, 5.77], b: [8.72, 4.78], ext: true },
        { a: [8.72, 4.78], b: [10.77, 4.78], ext: true, open: [door(0.55, 0.8), win(1.45, 0.8)] },
        { a: [8.72, 5.77], b: [10.77, 5.77], railing: true },
        { a: [3.64, 0], b: [3.64, 1.3], open: [door(0.65, 0.9)] },
        { a: [0, 2.0], b: [2.85, 2.0] },
        { a: [2.85, 2.0], b: [3.64, 1.3] },
        { a: [4.555, 1.95], b: [5.1, 1.39] },
        { a: [5.1, 1.39], b: [7.605, 1.39], open: [door(1.95, 0.9)] },
        { a: [4.555, 1.95], b: [4.555, 5.77] },
        { a: [4.555, 4.1], b: [6.25, 4.1] },
        { a: [6.25, 4.1], b: [6.25, 5.77], open: [door(0.7, 0.75)] },
        { a: [1.655, 4.55], b: [3.105, 4.55] },
        { a: [1.655, 4.55], b: [1.655, 5.77] },
        { a: [3.105, 4.55], b: [3.105, 5.77], open: [door(0.55, 0.7)] },
        { a: [3.105, 4.55], b: [4.555, 4.55], open: [door(0.725, 0.9)] },
        { a: [7.605, 0], b: [7.605, 5.77], open: [door(0.75, 0.9)] },
        { a: [9.08, 0], b: [9.08, 2.0], open: [door(0.75, 0.7)] },
        { a: [9.08, 2.0], b: [10.77, 2.0] },
      ],
      rooms: [
        { name: "Kitchen", poly: [[0.115, 0.115], [3.565, 0.115], [3.565, 1.27], [2.82, 1.925], [0.115, 1.925]], fit: [{ id: "kitchen", wall: "n", at: 1.6 }, { id: "fridge", wall: "n", at: 3.2 }] },
        { name: "Lobby", kind: "hallway", poly: [[3.715, 0.115], [7.53, 0.115], [7.53, 1.315], [5.07, 1.315], [4.48, 1.93], [4.48, 2.075], [2.95, 2.075], [3.715, 1.36]] },
        { name: "Living room", kind: "living", poly: [[0.115, 2.075], [4.48, 2.075], [4.48, 4.475], [1.58, 4.475], [1.58, 5.655], [0.115, 5.655]] },
        { name: "Bedroom 1", fit: [{ id: "double-bed", wall: "w", at: 2.75 }, { id: "bedside-table", wall: "w", at: 3.75 }, { id: "dresser", wall: "e", at: 3.0 }], poly: [[4.63, 1.97], [5.13, 1.465], [7.53, 1.465], [7.53, 5.655], [6.325, 5.655], [6.325, 4.025], [4.63, 4.025]] },
        { name: "Bath 1 (en-suite)", wet: true, poly: rect(4.63, 4.175, 6.175, 5.655), fit: [shower("w", 5.25), toilet("s", 5.85), basin("n", 5.0)] },
        { name: "Visitors' WC", wet: true, poly: rect(1.73, 4.625, 3.03, 5.655), fit: [toilet("w", 5.2), basin("n", 2.55)] },
        { name: "Entrance porch", kind: "entry", poly: rect(3.18, 4.625, 4.48, 5.655) },
        { name: "Bedroom 2", fit: [{ id: "double-bed", wall: "e", at: 3.4 }, { id: "bedside-table", wall: "e", at: 4.45 }, { id: "closet", wall: "w", at: 3.3, line: 7.68 }], poly: [[7.68, 0.115], [9.005, 0.115], [9.005, 2.075], [10.655, 2.075], [10.655, 4.705], [8.795, 4.705], [8.795, 5.655], [7.68, 5.655]] },
        { name: "Bath 2 (en-suite)", wet: true, poly: rect(9.155, 0.115, 10.655, 1.925), fit: [toilet("s", 9.55), shower("e", 1.5), basin("n", 10.2)] },
        { name: "Terrace", poly: rect(8.795, 4.855, 10.655, 5.77), fit: [{ id: "lounge-chair", wall: "n", at: 9.4 }, { id: "lounge-chair", wall: "n", at: 10.1 }] },
      ],
    },
  ],
};

// ── Shop / office ─────────────────────────────────────────────────────────────────────
const SHOP: HousePlan = {
  id: "shop",
  label: "Shop / office",
  note: "9 × 7.2 m · 1 floor",
  summary: "Shop floor with glazed front, sales counter, office, store with back door, WC, tea point",
  W: 8.77,
  L: 6.97,
  wallHeight: 3.3,
  roofType: "gable",
  pitch: 15,
  frontDoorX: 4.385,
  slabs: [{ name: "Front walkway", poly: rect(-0.115, 7.085, 8.885, 8.585), material: "concrete-polished" }],
  floors: [
    {
      walls: [
        { a: [0, 0], b: [8.77, 0], ext: true, open: [win(2.0, 1.2), door(5.4, 0.9), hi(7.7)] },
        { a: [0, 0], b: [0, 6.97], ext: true, open: [win(1.45, 1.2), win(4.9, 1.2)] },
        { a: [8.77, 0], b: [8.77, 6.97], ext: true, open: [win(4.9, 1.2)] },
        { a: [0, 6.97], b: [8.77, 6.97], ext: true, open: [win(1.9, 2.4, 1.8, 0.6), door(4.385, 1.8, 2.4), win(6.87, 2.4, 1.8, 0.6)] },
        { a: [0, 2.9], b: [6.6, 2.9], open: [door(2.8, 0.9), door(5.4, 0.9)] },
        { a: [4.2, 0], b: [4.2, 2.9] },
        { a: [6.6, 0], b: [6.6, 2.9] },
        { a: [6.6, 1.7], b: [8.77, 1.7], open: [door(1.0, 0.7)] },
      ],
      rooms: [
        {
          name: "Shop floor",
          poly: [[0.115, 2.975], [6.525, 2.975], [6.525, 1.775], [8.655, 1.775], [8.655, 6.855], [0.115, 6.855]],
          fit: [
            { id: "office-table", wall: "n", at: 1.3, line: 2.975, off: 0.6 },
            { id: "office-chair", wall: "n", at: 1.3, line: 2.975 },
            { id: "bookshelf", wall: "w", at: 3.7 },
            { id: "bookshelf", wall: "w", at: 6.2 },
            { id: "bookshelf", wall: "e", at: 3.7 },
            { id: "bookshelf", wall: "e", at: 6.2 },
            { id: "kitchen-counter", wall: "n", at: 7.6, line: 1.775 },
            { id: "indoor-plant", wall: "s", at: 0.6 },
          ],
        },
        { name: "Office", poly: rect(0.115, 0.115, 4.125, 2.825), fit: [{ id: "office-table", wall: "n", at: 2.0 }, { id: "office-chair", wall: "n", at: 2.0, off: 0.7 }, { id: "bookshelf", wall: "e", at: 1.2 }] },
        { name: "Store", poly: rect(4.275, 0.115, 6.525, 2.825), fit: [{ id: "bookshelf", wall: "w", at: 1.2 }, { id: "bookshelf", wall: "e", at: 1.2 }] },
        { name: "WC", wet: true, poly: rect(6.675, 0.115, 8.655, 1.625), fit: [toilet("n", 8.2), basin("w", 0.85)] },
      ],
    },
  ],
};

// ── 3-bedroom bungalow ────────────────────────────────────────────────────────────────
const THREE_BED: HousePlan = {
  id: "3bed",
  label: "3-bed bungalow",
  note: "14.4 × 9.6 m · 1 floor",
  summary: "Living + dining, kitchen, store, visitors' WC, corridor, master bedroom with en-suite and wardrobe, 2 bedrooms, shared bath, front porch",
  W: 14.17,
  L: 9.37,
  wallHeight: 3.3,
  roofType: "hip",
  pitch: 30,
  frontDoorX: 2.3,
  slabs: [{ name: "Front porch", poly: rect(1.1, 9.485, 3.5, 10.985), material: "flooring-tile20" }],
  floors: [
    {
      walls: [
        { a: [0, 0], b: [14.17, 0], ext: true, open: [win(2.0, 1.5), hi(5.3), hi(7.0), hi(8.9), win(12.0, 1.5)] },
        { a: [0, 0], b: [0, 9.37], ext: true, open: [win(1.6, 1.2), door(2.9, 0.9), win(4.8, 1.2), win(7.5, 1.5)] },
        { a: [14.17, 0], b: [14.17, 9.37], ext: true, open: [win(1.8, 1.2), win(4.2, 0.6), win(7.1, 1.2)] },
        { a: [0, 9.37], b: [14.17, 9.37], ext: true, open: [win(0.9, 1.0), door(2.3, 1.2), win(3.7, 1.0), win(6.9, 1.5), win(11.7, 1.5)] },
        { a: [0, 3.6], b: [4.6, 3.6], open: [door(3.5, 0.9)] },
        { a: [4.6, 0], b: [4.6, 3.6], open: [door(1.0, 0.8)] },
        { a: [4.6, 2.0], b: [6.0, 2.0] },
        { a: [6.0, 0], b: [6.0, 3.6] },
        { a: [8.0, 0], b: [8.0, 3.6] },
        { a: [8.0, 2.2], b: [9.8, 2.2] },
        { a: [9.8, 0], b: [9.8, 3.6], open: [door(1.1, 0.75), door(2.9, 0.8)] },
        { a: [4.6, 3.6], b: [14.17, 3.6], open: [door(0.7, 0.7), door(2.4, 0.75), door(5.9, 0.9)] },
        { a: [4.6, 4.8], b: [14.17, 4.8], open: [door(1.0, 0.9), door(5.6, 0.9)] },
        { a: [4.6, 4.8], b: [4.6, 9.37] },
        { a: [9.2, 4.8], b: [9.2, 9.37] },
      ],
      rooms: [
        { name: "Kitchen", poly: rect(0.115, 0.115, 4.525, 3.525), fit: [{ id: "kitchen", wall: "n", at: 2.0 }, { id: "fridge", wall: "n", at: 3.9 }, { id: "dining-table", wall: "s", at: 1.6, off: 0.6 }] },
        { name: "Store", poly: rect(4.675, 0.115, 5.925, 1.925), fit: [{ id: "bookshelf", wall: "e", at: 1.0 }] },
        { name: "Visitors' WC", wet: true, poly: rect(4.675, 2.075, 5.925, 3.525), fit: [toilet("n", 5.0), basin("e", 2.75)] },
        { name: "Bathroom", wet: true, poly: rect(6.075, 0.115, 7.925, 3.525), fit: [shower("n", 7.5), toilet("w", 1.6), basin("e", 2.3)] },
        { name: "Master en-suite", wet: true, poly: rect(8.075, 0.115, 9.725, 2.125), fit: [shower("n", 8.5), toilet("w", 1.6), basin("s", 9.25)] },
        { name: "Wardrobe", poly: rect(8.075, 2.275, 9.725, 3.525), fit: [{ id: "bookshelf", wall: "n", at: 8.6 }, { id: "bookshelf", wall: "n", at: 9.25 }] },
        { name: "Master bedroom", kind: "bedroom", poly: rect(9.875, 0.115, 14.095, 3.525) },
        { name: "Corridor", kind: "hallway", poly: rect(4.6, 3.675, 14.095, 4.725) },
        { name: "Dining", kind: "dining", poly: rect(0.115, 3.675, 4.525, 6.0) },
        { name: "Living room", kind: "living", poly: rect(0.115, 6.0, 4.525, 9.295) },
        { name: "Bedroom 2", kind: "bedroom", poly: rect(4.675, 4.875, 9.125, 9.295) },
        { name: "Bedroom 3", kind: "bedroom", poly: rect(9.275, 4.875, 14.095, 9.295) },
      ],
    },
  ],
};

// ── 4-bedroom duplex ──────────────────────────────────────────────────────────────────
const DUPLEX: HousePlan = {
  id: "duplex",
  label: "4-bed duplex",
  note: "12 × 10.4 m · 2 floors",
  summary: "Ground: living, dining, kitchen, store, laundry, visitors' WC, stair hall, guest room en-suite. First: master suite with wardrobe, 2 bedrooms, bathroom, family lounge, landing",
  W: 11.77,
  L: 10.17,
  wallHeight: 3.3,
  roofType: "hip",
  pitch: 30,
  frontDoorX: 7.6,
  slabs: [{ name: "Front porch", poly: rect(6.5, 10.285, 8.7, 11.785), material: "flooring-tile20" }],
  stair: { x: 6.975, y: 7.6, length: 4.6, width: 1.0 },
  floors: [
    {
      walls: [
        { a: [0, 0], b: [11.77, 0], ext: true, open: [door(1.0, 0.9), win(2.7, 1.2), win(5.1, 1.5), hi(7.6), win(10.3, 1.2)] },
        { a: [0, 0], b: [0, 10.17], ext: true, open: [win(1.9, 1.2), win(7.6, 1.5)] },
        { a: [11.77, 0], b: [11.77, 10.17], ext: true, open: [hi(4.5), win(7.9, 1.2)] },
        { a: [0, 10.17], b: [11.77, 10.17], ext: true, open: [win(1.6, 1.5, 1.5, 0.6), win(4.6, 1.5, 1.5, 0.6), door(7.6, 1.2), win(10.3, 1.2)] },
        { a: [3.8, 0], b: [3.8, 3.8], open: [door(2.6, 0.9)] },
        { a: [0, 3.8], b: [3.8, 3.8], open: [door(3.0, 0.8)] },
        { a: [0, 5.0], b: [3.8, 5.0] },
        { a: [6.4, 0], b: [6.4, 10.17], open: [door(2.3, 0.8), door(9.0, 1.2)] },
        { a: [6.4, 1.8], b: [8.8, 1.8], open: [door(0.6, 0.7)] },
        { a: [8.8, 0], b: [8.8, 10.17], open: [door(2.6, 0.8), door(4.4, 0.9)] },
        { a: [8.8, 3.4], b: [11.77, 3.4] },
        { a: [10.2, 3.4], b: [10.2, 5.6], open: [door(1.1, 0.7)] },
        { a: [10.2, 5.6], b: [11.77, 5.6] },
      ],
      rooms: [
        { name: "Kitchen", kind: "kitchen", poly: rect(0.115, 0.115, 3.725, 3.725) },
        { name: "Store", kind: "storage", poly: rect(0.115, 3.875, 3.725, 4.925) },
        { name: "Dining", kind: "dining", poly: rect(3.875, 0.115, 6.325, 4.925) },
        { name: "Living room", kind: "living", poly: rect(0.115, 5.075, 6.325, 10.095) },
        { name: "Visitors' WC", wet: true, poly: rect(6.475, 0.115, 8.725, 1.725), fit: [toilet("n", 7.8), basin("w", 1.0)] },
        { name: "Stair hall", kind: "entry", poly: rect(6.475, 1.875, 8.725, 10.095) },
        { name: "Laundry", kind: "laundry", poly: rect(8.875, 0.115, 11.695, 3.325) },
        { name: "Guest en-suite", wet: true, poly: rect(10.275, 3.475, 11.695, 5.525), fit: [toilet("n", 11.0), shower("s", 11.2)] },
        { name: "Guest bedroom", fit: [{ id: "double-bed", wall: "e", at: 7.9 }, { id: "bedside-table", wall: "e", at: 6.6 }, { id: "closet", wall: "w", at: 8.0 }], poly: [[8.875, 3.475], [10.125, 3.475], [10.125, 5.675], [11.695, 5.675], [11.695, 10.095], [8.875, 10.095]] },
      ],
    },
    {
      walls: [
        { a: [0, 0], b: [11.77, 0], ext: true, open: [win(3.2, 1.5), hi(7.6), win(10.3, 1.5)] },
        { a: [0, 0], b: [0, 10.17], ext: true, open: [win(1.6, 1.2), hi(4.4), win(7.9, 1.5)] },
        { a: [11.77, 0], b: [11.77, 10.17], ext: true, open: [win(1.7, 1.2), hi(4.5), win(7.9, 1.2)] },
        { a: [0, 10.17], b: [11.77, 10.17], ext: true, open: [win(1.6, 1.5), win(4.6, 1.5), win(7.6, 1.2), win(10.3, 1.2)] },
        { a: [0, 3.2], b: [6.4, 3.2] },
        { a: [0, 5.6], b: [6.4, 5.6], open: [door(1.4, 0.75), door(4.6, 0.9)] },
        { a: [2.8, 3.2], b: [2.8, 5.6] },
        { a: [6.4, 0], b: [6.4, 10.17], open: [door(2.5, 0.9), door(8.6, 0.9)] },
        { a: [6.4, 1.8], b: [8.8, 1.8], open: [door(1.2, 0.8)] },
        { a: [8.8, 0], b: [8.8, 10.17], open: [door(1.7, 1.2), door(4.5, 0.75), door(6.4, 0.9)] },
        { a: [8.8, 3.4], b: [11.77, 3.4] },
        { a: [8.8, 5.6], b: [11.77, 5.6] },
      ],
      rooms: [
        { name: "Bedroom 2", kind: "bedroom", poly: rect(0.115, 0.115, 6.325, 3.125) },
        { name: "Master en-suite", wet: true, poly: rect(0.115, 3.275, 2.725, 5.525), fit: [shower("n", 0.6), toilet("e", 4.0), basin("n", 1.9)] },
        { name: "Wardrobe", poly: rect(2.875, 3.275, 6.325, 5.525), fit: [{ id: "closet", wall: "n", at: 4.6 }, { id: "dresser", wall: "e", at: 4.4 }] },
        { name: "Master bedroom", kind: "bedroom", poly: rect(0.115, 5.675, 6.325, 10.095) },
        { name: "Store", poly: rect(6.475, 0.115, 8.725, 1.725), fit: [{ id: "bookshelf", wall: "n", at: 7.6 }] },
        { name: "Landing", kind: "hallway", poly: rect(6.475, 1.875, 8.725, 10.095) },
        { name: "Family lounge", kind: "living", poly: rect(8.875, 0.115, 11.695, 3.325) },
        { name: "Bathroom", wet: true, poly: rect(8.875, 3.475, 11.695, 5.525), fit: [toilet("n", 10.4), shower("e", 5.0), basin("s", 9.6)] },
        { name: "Bedroom 3", kind: "bedroom", poly: rect(8.875, 5.675, 11.695, 10.095) },
      ],
    },
  ],
};

export const HOUSE_PLANS: HousePlan[] = [SHOP, TWO_BED, THREE_BED, DUPLEX];
export type PlanId = "shop" | "2bed" | "3bed" | "duplex";
export const getPlan = (id: string): HousePlan => HOUSE_PLANS.find((plan) => plan.id === id) ?? TWO_BED;
