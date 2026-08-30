import assert from "node:assert/strict";
import type { PriceItem } from "../lib/pricing/models";
import { applyLivePriceState, getPriceHistorySummary, withRecordedPrice } from "../lib/pricing/price-history";

const base: PriceItem = {
  id: "cement-50kg",
  code: "MAT-CEM-50",
  description: "Cement 50kg Bag",
  category: "material",
  unit: "bag",
  rate: 2000,
  defaultRate: 2000,
  currency: "NGN",
  countryCode: "NG",
  region: "FCT",
  location: "Abuja",
  source: "Supplier A",
  confidence: "verified",
  updatedAt: "2026-08-01T10:00:00.000Z",
  active: true,
  validityDays: 45,
  validUntil: "2026-09-15T10:00:00.000Z",
  priceHistory: [],
};

{
  const updated = withRecordedPrice(base, 3500, {
    recordedAt: "2026-08-15T10:00:00.000Z",
    validityDays: 90,
    source: "Supplier B",
  });
  const live = getPriceHistorySummary(updated, new Date("2026-08-20T00:00:00.000Z"));
  assert.equal(live.currentCount, 2);
  assert.equal(live.low, 2000);
  assert.equal(live.high, 3500);
  assert.equal(live.archivedCount, 0);

  const afterOldExpiry = getPriceHistorySummary(updated, new Date("2026-09-20T00:00:00.000Z"));
  assert.equal(afterOldExpiry.currentCount, 1);
  assert.equal(afterOldExpiry.low, 3500);
  assert.equal(afterOldExpiry.high, 3500);
  assert.equal(afterOldExpiry.archivedCount, 1);

  const effective = applyLivePriceState(updated, new Date("2026-09-20T00:00:00.000Z"));
  assert.equal(effective.rate, 3500);
}

{
  const firstKeystroke = withRecordedPrice(base, 3, {
    recordedAt: "2026-08-30T10:00:00.000Z",
    validityDays: 30,
    source: "Manual entry",
  });
  const secondKeystroke = withRecordedPrice(firstKeystroke, 35, {
    recordedAt: "2026-08-30T10:00:01.000Z",
    validityDays: 30,
    source: "Manual entry",
  });
  const finalKeystroke = withRecordedPrice(secondKeystroke, 3500, {
    recordedAt: "2026-08-30T10:00:02.000Z",
    validityDays: 30,
    source: "Manual entry",
  });
  assert.equal(finalKeystroke.priceHistory?.length, 2, "Rapid typing must remain one new price observation plus the previous price.");
  assert.equal(finalKeystroke.priceHistory?.[0]?.rate, 3500);
}

{
  const lagosUpdate = withRecordedPrice(base, 4000, {
    recordedAt: "2026-08-20T10:00:00.000Z",
    validityDays: 60,
    source: "Lagos supplier",
    location: "Lagos",
  });
  const summary = getPriceHistorySummary(lagosUpdate, new Date("2026-08-25T00:00:00.000Z"));
  assert.equal(summary.currentCount, 1, "Prices from another market must not be mixed into the live range.");
  assert.equal(summary.low, 4000);
  assert.equal(summary.high, 4000);
  assert.equal(summary.archivedCount, 1);
}

console.log("Price history verification passed: valid ranges, expiry archive, latest-rate selection, rapid-entry coalescing and location separation.");