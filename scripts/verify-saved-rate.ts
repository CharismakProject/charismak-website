import assert from "node:assert/strict";

import { getRateBankItem } from "../lib/rates/defaults";
import { applySavedRate, type SavedRate } from "../lib/rates/saved-rate";

const item = getRateBankItem("230mm-hollow-sandcrete-blockwork")!;
const [first, second] = item.lines;
const saved: SavedRate = {
  version: 1,
  savedAt: "2026-11-08T10:00:00Z",
  workQuantity: 250,
  allowances: { ...item.allowances, op: 0.12, risk: -1 as number },
  lines: [
    { id: first.id, quantity: first.quantity, unitRate: 950 },
    { id: second.id, quantity: Number.NaN, unitRate: second.unitRate },
    { id: "line-charismak-removed", quantity: 1, unitRate: 1 },
  ],
};

const restored = applySavedRate(item, saved);
assert.equal(restored.lines.length, item.lines.length, "line set follows the current published rate");
assert.equal(restored.lines[0].unitRate, 950, "saved price restored");
assert.equal(restored.lines[1].quantity, second.quantity, "invalid saved quantity falls back to published value");
assert.equal(restored.allowances.op, 0.12, "saved O/P restored");
assert.equal(restored.allowances.risk, item.allowances.risk, "invalid saved allowance falls back");
assert.equal(restored.workQuantity, 250);
assert.equal(restored.changedSinceSave, true, "lines added/removed since saving are reported");
assert.notEqual(restored.lines[0], item.lines[0], "published rate objects are not mutated");
assert.equal(item.lines[0].unitRate, first.unitRate);

const clean = applySavedRate(item, { ...saved, allowances: item.allowances, lines: item.lines.map(({ id, quantity, unitRate }) => ({ id, quantity, unitRate })) });
assert.equal(clean.changedSinceSave, false);
assert.equal(applySavedRate(item, { ...saved, workQuantity: 0 }).workQuantity, 1, "zero work quantity falls back to 1");

console.log("Saved rate verification passed.");
