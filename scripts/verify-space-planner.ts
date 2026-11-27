import assert from "node:assert/strict";

import { marketPrice } from "../lib/planner/catalog";
import { planElevations, wallElevation } from "../lib/planner/elevation";
import { examplePlan } from "../lib/planner/example";
import { crossSection } from "../lib/planner/section";
import { defaultSpec, keySizes, servicesProvision, specSchedule } from "../lib/planner/spec";
import { arcOf, bulgeForRadius, bulgeThrough, dist, pointOnWall, wallPolyline, detectRooms, emptyPlan, enclosedArea, floorArea, outlineWalls, pointAtLength, projectOnWall, readSaved, rectangleRoom, schedule, shapeOutline, snapPoint, uid, wallLength, withLength, type Plan, type Pt, type Wall } from "../lib/planner/model";

const wall = (a: Pt, b: Pt): Wall => ({ id: uid("w"), a, b, thickness: 0 }); // zero-thickness walls: pure geometry checks
const near0 = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b}`);
const areas = (walls: Wall[]) => detectRooms(walls).map((r) => Math.round(r.area * 100) / 100).sort((m, n) => m - n);

// One rectangular room of 3000 x 1800 = 5.4 m².
const walls = rectangleRoom(3000, 1800, 0);
assert.deepEqual(areas(walls), [5.4]);
assert.equal(enclosedArea(walls.slice(0, 3)), null, "an open outline has no area");

// A wall from the middle of the top wall to the middle of the bottom wall makes two rooms.
const big = rectangleRoom(6000, 3000, 0);
assert.deepEqual(areas([...big, wall({ x: 3000, y: 0 }, { x: 3000, y: 3000 })]), [9, 9]);
// A wall starting part-way along another (not at a corner or midpoint): 2000 + 4000 split.
assert.deepEqual(areas([...big, wall({ x: 2000, y: 0 }, { x: 2000, y: 3000 })]), [6, 12]);
// Two walls crossing make four rooms.
assert.deepEqual(areas([...big, wall({ x: 2000, y: 0 }, { x: 2000, y: 3000 }), wall({ x: 0, y: 1000 }, { x: 6000, y: 1000 })]), [2, 4, 4, 8]);
// A dead-end wall poking into a room does not change it.
assert.deepEqual(areas([...big, wall({ x: 3000, y: 0 }, { x: 3000, y: 1500 })]), [18]);
// Shapes: an L of 6000 x 4000 with a 2000 x 1500 notch = 21 m²; T and U as drawn.
assert.deepEqual(areas(outlineWalls(shapeOutline("L", 0, 0, 6000, 4000, 2000, 1500), 0)), [21]);
assert.deepEqual(areas(outlineWalls(shapeOutline("T", 0, 0, 6000, 4000, 2000, 1500), 0)), [14]);
assert.deepEqual(areas(outlineWalls(shapeOutline("U", 0, 0, 6000, 4000, 2000, 1500), 0)), [21]);
// Two separate buildings each count.
assert.deepEqual(areas([...rectangleRoom(3000, 3000, 0), ...outlineWalls(shapeOutline("rect", 5000, 0, 2000, 2000), 0)]), [4, 9]);

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
// Real walls: floor area is measured to the inside faces. 3000 × 1800 on 150 mm wall centre-lines = 2850 × 1650 internal.
near0(floorArea({ ...plan, walls: rectangleRoom(3000, 1800, 150) })!, 2.85 * 1.65, 1e-9, "internal floor area");
near0(floorArea({ ...plan, walls: rectangleRoom(3000, 1800, 230) })!, 2.77 * 1.57, 1e-9, "internal area follows wall thickness");

// Saved plans: junk ignored; plans saved with the old room boxes become walls plus room names.
assert.equal(readSaved("not json"), null);
assert.equal(readSaved(JSON.stringify({ version: 2 })), null);
const legacy = readSaved(JSON.stringify({ ...emptyPlan(), tags: undefined, rooms: [{ id: "r1", name: "Living", shape: "L", x: 0, y: 0, w: 6000, l: 4000, a: 2000, b: 1500, rot: 0, thickness: 150 }], openings: [{ id: "d", wallId: "r1:0", kind: "door", t: 0.5, width: 900 }] }))!;
assert.equal(legacy.walls.length, 6);
assert.equal(legacy.openings[0].wallId, legacy.walls[0].id);
assert.equal(detectRooms(legacy.walls, legacy.tags)[0].name, "Living");
assert.equal("rooms" in legacy, false);

// ---------- Curved walls ----------
const near = (a: number, b: number, tol: number, msg?: string) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ""} ${a} vs ${b}`);
// Semicircle: chord 4000, bulge 2000 -> radius 2000, length = pi * 2000.
const semi: Wall = { id: "s", a: { x: 0, y: 0 }, b: { x: 4000, y: 0 }, thickness: 150, bulge: 2000 };
near(arcOf(semi)!.r, 2000, 1e-6, "semicircle radius");
near(wallLength(semi), Math.PI * 2000, 1e-6, "semicircle length");
near(pointOnWall(semi, 0.5).x, 2000, 1e-6); near(Math.abs(pointOnWall(semi, 0.5).y), 2000, 1e-6, "arc midpoint");
// Every polyline point lies on the circle, and pieces are at most 2 degrees.
const arcS = arcOf(semi)!;
for (const q of wallPolyline(semi)) near(dist(q, arcS.c), 2000, 1e-6, "polyline on circle");
assert.ok(wallPolyline(semi).length - 1 >= 90);

// Three-point arc: the arc through a, b and p passes exactly through p, on either side.
for (const p of [{ x: 1000, y: -700 }, { x: 2500, y: 900 }, { x: 3900, y: -150 }]) {
  const bl = bulgeThrough({ x: 0, y: 0 }, { x: 4000, y: 0 }, p)!;
  const arc = arcOf({ ...semi, bulge: bl })!;
  near(dist(arc.c, p), arc.r, 1e-6, "3-point arc passes through p");
}
assert.equal(bulgeThrough({ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 2000, y: 0 }), null, "points in a line make no arc");
// Radius entry: radius 2500 on chord 4000 gives bulge 1000 (minor arc) or 4000 (major arc).
near(bulgeForRadius(4000, 2500, 1)!, 1000, 1e-6); near(bulgeForRadius(4000, 2500, -1, true)!, -4000, 1e-6);
assert.equal(bulgeForRadius(4000, 1500, 1), null, "radius smaller than half the chord is impossible");

// Room with a curved wall: 4000 x 3000 with the top wall bowing out 1000 mm adds a circular segment
// (r = 2500, angle = 4·atan(0.5)): exact area = 12 + r²/2·(θ − sin θ) m².
const r = 2.5, th = 4 * Math.atan(0.5), seg = (r * r / 2) * (th - Math.sin(th));
const box = rectangleRoom(4000, 3000, 0); // top wall runs (0,0) -> (4000,0)
const out = areas([{ ...box[0], bulge: -1000 }, ...box.slice(1)]), inn = areas([{ ...box[0], bulge: 1000 }, ...box.slice(1)]);
near(out[0], 12 + seg, 0.01, "bowing out adds the segment");
near(inn[0], 12 - seg, 0.01, "bowing in removes the segment");
// Accuracy of the detected area itself (before rounding): within 0.05% of exact.
near(detectRooms([{ ...box[0], bulge: -1000 }, ...box.slice(1)])[0].area, 12 + seg, (12 + seg) * 0.0005, "curved area accuracy");

// A straight wall ending on a curved wall splits the room correctly.
const curvedTop: Wall = { ...box[0], bulge: -1000 };
const onArc = pointOnWall(curvedTop, 0.5);
const split = areas([curvedTop, ...box.slice(1), wall({ x: onArc.x, y: onArc.y }, { x: 2000, y: 3000 })]);
near(split[0] + split[1], 12 + seg, 0.02, "split curved room keeps the total");
near(split[0], split[1], 0.02, "symmetric halves");
// Snapping onto a curved wall lands exactly on the arc.
const sn = snapPoint({ x: 1200, y: -900 }, [curvedTop], 300);
assert.equal(sn.kind, "on");
near(dist(sn.pt, arcOf(curvedTop)!.c), arcOf(curvedTop)!.r, 1e-6, "on-arc snap is on the circle");
// Arc midpoint snap.
const mid = snapPoint({ x: onArc.x + 30, y: onArc.y + 20 }, [curvedTop], 100);
assert.equal(mid.kind, "mid");
// Length edit keeps the curve's proportion.
near(withLength(curvedTop, wallLength(curvedTop) * 2).bulge!, -2000, 1e-6);

// ---------- Wall elevations ----------
{
  const room = rectangleRoom(4000, 3000); // top (0,0)->(4000,0), right, bottom (4000,3000)->(0,3000), left
  const [top, right, bottom] = room;
  const ep: Plan = {
    ...emptyPlan(),
    walls: room,
    openings: [{ id: "d", wallId: top.id, kind: "door", t: 0.25, width: 900 }, { id: "w", wallId: right.id, kind: "window", t: 0.5, width: 1200 }],
    items: [
      { id: "wc1", type: "wall-cabinet", x: 3000, y: 250, w: 600, d: 350, h: 700, rot: 0 },
      { id: "sofa", type: "sofa", x: 1000, y: 2550, w: 2000, d: 900, h: 850, rot: 0 },
      { id: "mid", type: "table", x: 2000, y: 1500, w: 1600, d: 900, h: 750, rot: 0 },
      { id: "bulb", type: "bulb", x: 2000, y: 200, w: 250, d: 250, h: 100, rot: 0 },
    ],
  };
  const eTop = wallElevation(top, ep, 1);
  // Positions are from the inside face of the wall at the left end (75 mm in from the centre-line).
  assert.deepEqual(eTop.parts.find((q) => q.kind === "door"), { kind: "door", name: "Door", x: 475, w: 900, y: 0, h: 2100 });
  assert.equal(eTop.length, 3850, "internal length of a 4000 wall between 150 walls");
  const cab = eTop.parts.find((q) => q.name === "Wall cabinet")!;
  assert.deepEqual([cab.x, cab.w, cab.y, cab.h], [2625, 600, 1450, 700], "wall cabinet at its mounting height");
  assert.equal(eTop.parts.some((q) => q.name === "Light bulb"), false, "ceiling items are left out");
  assert.equal(eTop.parts.some((q) => q.name === "Dining table"), false, "items in the middle of the room are left out");
  const eRight = wallElevation(right, ep, 1);
  assert.deepEqual(eRight.parts.map((q) => [q.kind, q.x, q.y, q.h]), [["window", 825, 900, 1200]]);
  // Bottom wall runs right-to-left; seen from inside, the sofa near x=0..2000 is on the viewer's right: 2000..4000.
  const eBottom = wallElevation(bottom, ep, 1);
  const sofa = eBottom.parts.find((q) => q.name === "Sofa (3-seat)")!;
  assert.deepEqual([Math.round(sofa.x), Math.round(sofa.w)], [1925, 1925]); // 75 mm of the test sofa sits in the left wall's thickness
  // Auto-chosen elevations: walls with things on them, most first, lettered.
  const els = planElevations(ep);
  // Top has the door and cabinet (2 parts); the corner sofa touches the bottom and left walls; ties go to the longer wall.
  assert.deepEqual(els.map((e) => [e.letter, e.wallId]), [["A", top.id], ["B", bottom.id], ["C", right.id], ["D", room[3].id]]);
  assert.ok(els[0].marker.at.y > 0, "the plan marker for the top wall sits inside the room");
  // With nothing placed: the four longest walls.
  assert.equal(planElevations({ ...emptyPlan(), walls: room }).length, 4);
  // Curved wall: unrolled along its true length.
  const curved = { ...top, bulge: -1000 };
  const eC = wallElevation(curved, { ...ep, walls: [curved, ...room.slice(1)], openings: [{ id: "d", wallId: top.id, kind: "door", t: 0.5, width: 900 }], items: [] }, 1);
  assert.ok(eC.curved);
  near(eC.length, wallLength(curved), 1e-6);
  near(eC.parts[0].x, wallLength(curved) / 2 - 450, 1e-6, "door centred on the unrolled curve");
}

// The example plan (Mpape kitchen) is one named room with every item and opening on a real wall.
{
  const ex = examplePlan();
  const exRooms = detectRooms(ex.walls, ex.tags);
  assert.equal(exRooms.length, 1);
  assert.equal(exRooms[0].name, "Kitchen");
  // Inside faces are 3000 × 1800 with the lobby corner cut off by the angled wall.
  assert.ok(exRooms[0].area > 5.0 && exRooms[0].area < 5.4, `kitchen area ${exRooms[0].area}`);
  const ix = exRooms[0].inner.map((q) => q.x), iy = exRooms[0].inner.map((q) => q.y);
  assert.deepEqual([Math.round(Math.max(...ix) - Math.min(...ix)), Math.round(Math.max(...iy) - Math.min(...iy))], [3000, 1800], "example kitchen is 3000 × 1800 internal");
  assert.equal(ex.openings.every((o) => ex.walls.some((w) => w.id === o.wallId)), true);
  assert.ok(planElevations(ex).length >= 3, "the example produces wall elevations");
  assert.ok(schedule(ex).lines.length >= 8);
}

// ---------- Cross-sections and specification ----------
{
  const room = rectangleRoom(3000, 1800); // walls on centre-lines at y = 0 and y = 1800, 150 thick
  const sp: Plan = {
    ...emptyPlan(), walls: room,
    openings: [{ id: "bd", wallId: room[3].id, kind: "door", t: 0.5, width: 800 }, { id: "win", wallId: room[0].id, kind: "window", t: 0.5, width: 700 }],
    items: [
      { id: "sink", type: "kitchen-sink", x: 1500, y: 375, w: 700, d: 600, h: 900, rot: 0 },
      { id: "ctr", type: "fold-counter", x: 1500, y: 1525, w: 1000, d: 400, h: 30, rot: 180 },
      { id: "cab", type: "wall-cabinet", x: 2600, y: 1550, w: 600, d: 350, h: 900, rot: 180, mount: 1500 },
    ],
  };
  const cs = crossSection(sp, { id: "c", label: "C", a: { x: 1500, y: -500 }, b: { x: 1500, y: 2300 } });
  assert.equal(cs.internal, 1650, "internal = 1800 between centre-lines minus two half walls");
  assert.equal(cs.walkway, 1325 - 675, "clear between the sink unit front and the counter front");
  assert.ok(cs.parts.some((q) => q.kind === "glass"), "the window in the cut wall shows as glass");
  assert.ok(cs.parts.some((q) => q.kind === "item" && q.type === "kitchen-sink"));
  // Looking to the left of a→b (towards x = 0): the back door in the left wall is beyond; the wall cabinet (x = 2600) is behind the viewer.
  assert.ok(cs.parts.some((q) => q.kind === "door-beyond"));
  assert.equal(cs.parts.some((q) => q.name === "Wall cabinet"), false);
  // Specification and services.
  assert.match(defaultSpec(sp.items[2]), /1500–2400 above floor/);
  assert.equal(specSchedule(sp).length, 5);
  assert.ok(servicesProvision(sp).some((l) => l.startsWith("Water:")));
  assert.ok(keySizes(sp, detectRooms(sp.walls), cs.walkway).some((l) => l.includes("Walkway 650")));
}

// The example's window-wall elevation reads like the CPNL drawing: 50 | 600 | 600 | 700 | 600 | 450 = 3000 internal.
{
  const ex = examplePlan();
  const top = ex.walls.find((w) => w.id === "ex-top")!;
  const e = wallElevation(top, ex, 1);
  assert.equal(Math.round(e.length), 3000);
  const run = e.parts.filter((q) => q.kind !== "item" || q.y < 1000).flatMap((q) => [Math.round(q.x), Math.round(q.x + q.w)]);
  const edges = [...new Set([0, 3000, ...run])].sort((a, b) => a - b);
  assert.deepEqual(edges.slice(1).map((v, i) => v - edges[i]), [50, 600, 600, 700, 600, 450]);
}

console.log("Space Planner checks passed.");
