import assert from "node:assert/strict";

import { RATE_BANK_ITEMS, calculateRate, getRateBankItem } from "../lib/rates/defaults";

const close = (a: number, b: number, label: string) => assert.ok(Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b)), `${label}: ${a} != ${b}`);
const slugs = new Set<string>();

for (const item of RATE_BANK_ITEMS) {
  const where = `${item.slug}`;
  assert.ok(!slugs.has(item.slug), `${where}: duplicate slug`);
  slugs.add(item.slug);
  assert.ok(item.unit.trim(), `${where}: unit missing`);
  assert.ok(item.city.trim() && item.country.trim(), `${where}: geography missing`);
  assert.ok(!Number.isNaN(new Date(item.lastReviewed).getTime()), `${where}: rate date invalid`);
  assert.ok(item.lines.length > 0, `${where}: no build-up lines`);
  assert.equal(getRateBankItem(item.slug), item, `${where}: lookup mismatch`);

  // A rate may only be published as verified once a qualified review is recorded.
  // No such review records exist yet, so every rate must remain under validation.
  assert.notEqual(item.status, "verified", `${where}: marked verified without a recorded qualified review`);

  const ids = new Set<string>();
  for (const line of item.lines) {
    assert.ok(!ids.has(line.id), `${where}: duplicate line id ${line.id}`);
    ids.add(line.id);
    assert.ok(Number.isFinite(line.quantity) && line.quantity > 0, `${where}/${line.id}: quantity must be > 0`);
    assert.ok(Number.isFinite(line.unitRate) && line.unitRate >= 0, `${where}/${line.id}: unit rate must be >= 0`);
    assert.ok(line.unit.trim(), `${where}/${line.id}: unit missing`);
  }

  for (const [key, value] of Object.entries(item.allowances)) {
    assert.ok(Number.isFinite(value) && value >= 0 && value < 1, `${where}: allowance ${key} out of range (${value})`);
  }

  // Totals reconcile with the displayed components.
  const calc = calculateRate(item.lines, item.allowances);
  const sumLines = item.lines.reduce((sum, line) => sum + line.quantity * line.unitRate, 0);
  close(calc.directCost, sumLines, `${where} direct cost`);
  close(calc.directCost, calc.materialCost + calc.labourCost + calc.plantCost + calc.logisticsCost, `${where} cost split`);
  close(calc.total, calc.baseBeforeOp + calc.op, `${where} total`);
  close(calc.baseBeforeOp, calc.directCost + calc.materialFluctuation + calc.labourFluctuation + calc.plantFluctuation + calc.risk, `${where} base`);
  assert.ok(calc.total > 0 && Number.isFinite(calc.total), `${where}: total must be positive`);
}

// Known build-up regression: 230 mm blockwork = 10.5 blocks + mortar + labour.
const block = getRateBankItem("230mm-hollow-sandcrete-blockwork")!;
const blockLines = Object.fromEntries(block.lines.map((line) => [line.id, line]));
close(blockLines.block225.quantity, 10.5, "blocks per m²");
close(blockLines.block225.quantity * blockLines.block225.unitRate, 9450, "block cost per m² at ₦900");

// Zero allowances: total equals direct cost.
const zero = calculateRate(block.lines, { materialFluctuation: 0, labourFluctuation: 0, plantFluctuation: 0, risk: 0, op: 0 });
close(zero.total, zero.directCost, "zero allowances");
// Empty build-up is zero, not NaN.
assert.equal(calculateRate([], block.allowances).total, 0);

console.log(`Rate bank verification passed for ${RATE_BANK_ITEMS.length} rates.`);
