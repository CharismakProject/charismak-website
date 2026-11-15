import assert from "node:assert/strict";
import { cleanCostEdits, costKey, getCostStages, priceConstruction, roundCost, type CostEdits } from "../lib/construction/costs";
import { LEARNING_MODELS } from "../lib/construction/learning";
import { priceStages } from "../lib/construction/walkthrough";

let items = 0;
for (const model of LEARNING_MODELS) {
  const stages = priceConstruction(model.id, "fct");
  assert.equal(stages.length, model.lessons.length, `${model.id}: cost stages must follow the visual tour`);
  const ids = stages.flatMap(stage => stage.items.map(work => work.id));
  assert.equal(new Set(ids).size, ids.length, `${model.id}: editing one scope must not alter another stage`);
  for (const stage of stages) {
    assert.equal(stage.total, roundCost(stage.items.reduce((sum, work) => sum + work.amount, 0)));
    for (const work of stage.items) {
      items++;
      assert.ok(work.lines.length > 0 && work.lines.every(line => Number.isFinite(line.quantity)));
      assert.equal(new Set(work.lines.map(line => line.id)).size, work.lines.length);
      assert.equal(work.calculation.total, work.calculation.directCost + work.calculation.materialFluctuation + work.calculation.labourFluctuation + work.calculation.plantFluctuation + work.calculation.risk + work.calculation.op);
      if (work.rate !== null) assert.equal(work.rate, roundCost(work.calculation.total));
      if (work.missing) { assert.equal(work.rate, null); assert.equal(work.amount, 0, "A partial resource analysis must not masquerade as a full rate"); }
      assert.ok(Number.isFinite(work.amount));
    }
  }
}
const published = priceStages("fct"), base = priceConstruction("bungalow", "fct");
for (let step = 0; step < base.length; step++) for (let n = 0; n < base[step].items.length; n++) assert.equal(base[step].items[n].rate, published[step].items[n].rate, "Preserve existing Rate Bank references and allowances");
const wall = base[5].items[0], key = costKey("bungalow", "fct", wall.id), material = wall.lines.find(line => line.category === "material")!;
const edited: CostEdits = { [key]: { quantity: 220, resources: { [material.id]: { unitRate: material.unitRate! + 100 } } } };
const changed = priceConstruction("bungalow", "fct", edited)[5].items[0];
assert.ok(changed.rate! > wall.rate!);
assert.equal(changed.amount, roundCost(changed.rate! * 220), "Work quantity scales the analysed rate exactly once");
assert.equal(priceConstruction("bungalow", "lagos", edited)[5].items[0].quantity, wall.quantity, "Edits remain scoped to the selected location");
assert.equal(priceConstruction("concrete-frame", "fct", edited)[0].total, priceConstruction("concrete-frame", "fct")[0].total, "Bungalow edits do not alter another model");
const noMargins = priceConstruction("bungalow", "fct", { [key]: { allowances: { materialFluctuation: 0, labourFluctuation: 0, plantFluctuation: 0, risk: 0, op: 0 } } })[5].items[0];
assert.equal(noMargins.rate, roundCost(noMargins.calculation.directCost));
const manual = priceConstruction("bungalow", "fct", { [key]: { rate: 20000 } })[5].items[0];
assert.equal(roundCost(manual.knownRate + manual.adjustment), 20000, "A manual rate must have a disclosed reconciliation adjustment");
assert.equal(manual.amount, 2200000);
const unpriced = base[0].items[0], unpricedKey = costKey("bungalow", "fct", unpriced.id);
const free = priceConstruction("bungalow", "fct", { [unpricedKey]: { rate: 0 } })[0];
assert.equal(free.items[0].rate, 0); assert.equal(free.unpriced, 0, "An explicit zero quotation is valid");
assert.equal(priceConstruction("bungalow", "fct", { [unpricedKey]: { quantity: 0 } })[0].unpriced, 0);
const extra: CostEdits = { [key]: { added: [{ id: "extra-test", label: "Delivery", category: "logistics", quantity: 1, unit: "trip", unitRate: null }] } };
assert.equal(priceConstruction("bungalow", "fct", extra)[5].items[0].rate, null, "A newly added unpriced resource makes the analysis incomplete");
extra[key].resources = { "extra-test": { quantity: 0 } };
assert.equal(priceConstruction("bungalow", "fct", extra)[5].items[0].rate, wall.rate);
const dirty = cleanCostEdits({ [key]: { quantity: -1, rate: Infinity, allowances: { risk: 200, op: -1 }, resources: { [material.id]: { quantity: NaN, unitRate: null } }, added: [{ id: "extra-bad", label: "Invalid", category: "material", quantity: 1, unit: "item", unitRate: -2 }] }, "bad-key": { rate: 100 } });
assert.equal(dirty[key].quantity, undefined); assert.equal(dirty[key].rate, undefined); assert.deepEqual(dirty[key].allowances, {}); assert.equal(dirty[key].added?.length, 0); assert.equal(dirty["bad-key"], undefined);
assert.deepEqual(getCostStages("truss-bridge").at(-1)?.items, [], "The load-path review must not bill the same completed structure again");
console.log(`Construction costs verified: ${items} work items across all six models; published-rate parity, resource editing, margin bases, manual reconciliation, missing prices, zero values and saved-input validation.`);
