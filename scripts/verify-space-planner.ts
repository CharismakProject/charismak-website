import assert from "node:assert/strict";

import { marketPrice } from "../lib/planner/catalog";
import { detectRooms, emptyPlan, enclosedArea, floorArea, outlineWalls, pointAtLength, projectOnWall, readSaved, rectangleRoom, schedule, shapeOutline, snapPoint, uid, wallLength, withLength, type Plan, type Pt, type Wall } from "../lib/planner/model";

const wall = (a: Pt, b: Pt): Wall => ({ id: uid("w"), a, b, thickness: 150 });
const areas = (walls: Wall[]) => detectRooms(walls).map((r) => Math.round(r.area * 100) / 100).sort((m, n) => m - n);

// One rectangular room of 3000 x 1800 = 5.4 m².
const walls = rectangleRoom(3000, 1800);
assert.deepEqual(areas(walls), [5.4]);
assert.equal(enclosedArea(walls.slice(0, 3)), null, "an open outline has no area");

// A wall from the middle of the top wall to the middle of the bottom wall makes two rooms.
const big = rectangleRoom(6000, 3000);
assert.deepEqual(areas([...big, wall({ x: 3000, y: 0 }, { x: 3000, y: 3000 })]), [9, 9]);
// A wall starting part-way along another (not at a corner or midpoint): 2000 + 4000 split.
assert.deepEqual(areas([...big, wall({ x: 2000, y: 0 }, { x: 2000, y: 3000 })]), [6, 12]);
// Two walls crossing make four rooms.
assert.deepEqual(areas([...big, wall({ x: 2000, y: 0 }, { x: 2000, y: 3000 }), wall({ x: 0, y: 1000 }, { x: 6000, y: 1000 })]), [2, 4, 4, 8]);
// A dead-end wall poking into a room does not change it.
assert.deepEqual(areas([...big, wall({ x: 3000, y: 0 }, { x: 3000, y: 1500 })]), [18]);
// Shapes: an L of 6000 x 4000 with a 2000 x 1500 notch = 21 m²; T and U as drawn.
assert.deepEqual(areas(outlineWalls(shapeOutline("L", 0, 0, 6000, 4000, 2000, 1500))), [21]);
assert.deepEqual(areas(outlineWalls(shapeOutline("T", 0, 0, 6000, 4000, 2000, 1500))), [14]);
assert.deepEqual(areas(outlineWalls(shapeOutline("U", 0, 0, 6000, 4000, 2000, 1500))), [21]);
// Two separate buildings each count.
assert.deepEqual(areas([...rectangleRoom(3000, 3000), ...outlineWalls(shapeOutline("rect", 5000, 0, 2000, 2000))]), [4, 9]);

// Room names come from tags placed inside them.
const tagged = detectRooms([...big, wall({ x: 2000, y: 0 }, { x: 2000, y: 3000 })], [{ id: "t1", name: "Kitchen", x: 1000, y: 1500 }]);
assert.equal(tagged.find((r) => Math.round(r.area) === 6)?.name, "Kitchen");

// Snapping like CAD: ends, midpoints, any point on a wall; otherwise straight lines rounded to 10 mm.
assert.equal(snapPoint({ x: 6020, y: 15 }, big, 60).kind, "end");
assert.deepEqual(snapPoint({ x: 6020, y: 15 }, big, 60).pt, { x: 6000, y: 0 });
assert.equal(snapPoint({ x: 2980, y: 20 }, rectangleRoom(5960, 3000), 60).kind, "mid");
const on = snapPoint({ x: 1234, y: 30 }, big, 60);
assert.equal(on.kind, "on");
assert.equal(on.pt.y, 0);
assert.deepEqual(snapPoint({ x: 2003, y: 1120 }, [], 50, { x: 0, y: 1000 }), { pt: { x: 2000, y: 1000 }, kind: "ortho" });
// Drawing from inside towards a wall prefers the square point straight across.
assert.deepEqual(snapPoint({ x: 1530, y: 40 }, big, 60, { x: 1500, y: 2000 }).pt, { x: 1500, y: 0 });
// Typed length along the pointer direction.
assert.deepEqual(pointAtLength({ x: 0, y: 0 }, { x: 10, y: 0 }, 3000), { x: 3000, y: 0 });

// Wall length edit keeps the direction.
const longer = withLength(walls[0], 4200);
assert.equal(Math.round(wallLength(longer)), 4200);
assert.equal(longer.a.y, longer.b.y);
const pr = projectOnWall({ x: 1500, y: 300 }, walls[0]);
assert.equal(pr.t, 0.5);

// Schedule: market price when no own price; own price wins; unpriced counted; windows per m²; orphan openings ignored.
const wc = marketPrice("wc-set")!;
assert.ok(wc.rate > 0);
const plan: Plan = {
  ...emptyPlan(),
  walls,
  items: [
    { id: "a", type: "wc", x: 0, y: 0, w: 380, d: 680, h: 780, rot: 0 },
    { id: "b", type: "wc", x: 0, y: 0, w: 380, d: 680, h: 780, rot: 0 },
    { id: "c", type: "chair", x: 0, y: 0, w: 450, d: 500, h: 900, rot: 0 },
    { id: "d", type: "chair", x: 0, y: 0, w: 450, d: 500, h: 900, rot: 0, price: 25000 },
  ],
  openings: [{ id: "o", wallId: walls[0].id, kind: "window", t: 0.5, width: 1200 }, { id: "x", wallId: "gone", kind: "door", t: 0.5, width: 900 }],
};
const s = schedule(plan);
assert.equal(s.lines.find((l) => l.name === "WC")!.total, wc.rate * 2);
assert.equal(s.lines.find((l) => l.name === "Chair" && l.source === "own")!.total, 25000);
assert.equal(s.unpriced, 1);
const win = s.lines.find((l) => l.name === "Window")!;
assert.equal(win.unitPrice, Math.round((marketPrice("aluminium-window")!.rate * 1200 * 1200) / 1e6));
assert.equal(s.lines.find((l) => l.name === "Door"), undefined, "a door on a deleted wall is dropped");
assert.equal(floorArea(plan), 5.4);

// Saved plans: junk ignored; plans saved with the old room boxes become walls plus room names.
assert.equal(readSaved("not json"), null);
assert.equal(readSaved(JSON.stringify({ version: 2 })), null);
const legacy = readSaved(JSON.stringify({ ...emptyPlan(), tags: undefined, rooms: [{ id: "r1", name: "Living", shape: "L", x: 0, y: 0, w: 6000, l: 4000, a: 2000, b: 1500, rot: 0, thickness: 150 }], openings: [{ id: "d", wallId: "r1:0", kind: "door", t: 0.5, width: 900 }] }))!;
assert.equal(legacy.walls.length, 6);
assert.equal(legacy.openings[0].wallId, legacy.walls[0].id);
assert.equal(detectRooms(legacy.walls, legacy.tags)[0].name, "Living");
assert.equal("rooms" in legacy, false);

console.log("Space Planner checks passed.");
