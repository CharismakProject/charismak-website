import assert from "node:assert/strict";

import { marketPrice } from "../lib/planner/catalog";
import { emptyPlan, enclosedArea, projectOnWall, readSaved, rectangleRoom, schedule, snapEnd, wallLength, withLength, type Plan } from "../lib/planner/model";

// Room of 3000 x 1800 mm = 5.4 m², four walls.
const walls = rectangleRoom(3000, 1800);
assert.equal(walls.length, 4);
assert.equal(Math.round((enclosedArea(walls) ?? 0) * 100) / 100, 5.4);
assert.equal(enclosedArea(walls.slice(0, 3)), null, "an open outline has no area");

// Wall length edit keeps the direction.
const longer = withLength(walls[0], 4200);
assert.equal(Math.round(wallLength(longer)), 4200);
assert.equal(longer.a.y, longer.b.y);

// Snapping: near-horizontal locks horizontal and rounds to 10 mm; near an existing corner snaps onto it.
assert.deepEqual(snapEnd({ x: 0, y: 0 }, { x: 2003, y: 120 }, [], 50), { x: 2000, y: 0 });
assert.deepEqual(snapEnd({ x: 500, y: 500 }, { x: 2990, y: 12 }, walls, 50), { x: 3000, y: 0 });

// Projection onto a wall.
const pr = projectOnWall({ x: 1500, y: 300 }, walls[0]);
assert.equal(pr.t, 0.5);
assert.equal(Math.round(pr.distance), 300);

// Schedule: market price used when no own price; own price wins; unpriced counted; windows priced per m².
const wc = marketPrice("wc-set");
assert.ok(wc && wc.rate > 0, "WC has a market price");
const plan: Plan = {
  ...emptyPlan(),
  walls,
  items: [
    { id: "a", type: "wc", x: 0, y: 0, w: 380, d: 680, h: 780, rot: 0 },
    { id: "b", type: "wc", x: 0, y: 0, w: 380, d: 680, h: 780, rot: 0 },
    { id: "c", type: "chair", x: 0, y: 0, w: 450, d: 500, h: 900, rot: 0 },
    { id: "d", type: "chair", x: 0, y: 0, w: 450, d: 500, h: 900, rot: 0, price: 25000 },
  ],
  openings: [{ id: "o", wallId: walls[0].id, kind: "window", t: 0.5, width: 1200 }],
};
const s = schedule(plan);
const wcLine = s.lines.find((l) => l.name === "WC")!;
assert.equal(wcLine.qty, 2);
assert.equal(wcLine.total, wc!.rate * 2);
assert.equal(wcLine.source, "market");
const ownChair = s.lines.find((l) => l.name === "Chair" && l.source === "own")!;
assert.equal(ownChair.total, 25000);
assert.equal(s.unpriced, 1, "the chair without a price is counted as unpriced");
const win = s.lines.find((l) => l.name === "Window")!;
assert.equal(win.unitPrice, Math.round((marketPrice("aluminium-window")!.rate * 1200 * 1200) / 1e6));
assert.equal(s.total, wc!.rate * 2 + 25000 + win.unitPrice!);

// Saved plans: valid ones load, junk is ignored.
assert.equal(readSaved("not json"), null);
assert.equal(readSaved(JSON.stringify({ version: 2 })), null);
assert.equal(readSaved(JSON.stringify(plan))?.items.length, 4);

console.log("Space Planner checks passed.");
