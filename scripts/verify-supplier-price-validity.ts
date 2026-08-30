import assert from "node:assert/strict";

import {
  getSupplierOfferEffectiveValidUntil,
  isSupplierOfferCurrent,
  summarizeSupplierOfferHistory,
  type SupplierMarketplaceOffer,
} from "../lib/platform/supplier-offers";

const offer = (overrides: Partial<SupplierMarketplaceOffer>): SupplierMarketplaceOffer => ({
  id: overrides.id ?? crypto.randomUUID(),
  sourceSubmissionId: null,
  supplierId: overrides.supplierId ?? "supplier-1",
  supplierName: overrides.supplierName ?? "Test Supplier",
  catalogueItemId: overrides.catalogueItemId ?? "cement-50kg",
  productName: overrides.productName ?? "Cement",
  specification: overrides.specification ?? "50kg bag",
  brand: overrides.brand ?? "Dangote",
  quotedUnit: overrides.quotedUnit ?? "50kg bag",
  unitPrice: overrides.unitPrice ?? 0,
  bulkPrice: null,
  minimumQty: null,
  deliveryFee: null,
  deliveryIncluded: null,
  location: overrides.location ?? "Abuja",
  serviceArea: null,
  availability: "In stock",
  phone: null,
  whatsapp: null,
  email: null,
  validUntil: overrides.validUntil ?? null,
  supplierRemarks: null,
  submittedAt: overrides.submittedAt ?? "2026-08-01T10:00:00.000Z",
  publishedAt: overrides.publishedAt ?? "2026-08-01T12:00:00.000Z",
});

const now = new Date("2026-08-20T12:00:00.000Z");
const oldValid = offer({ id: "old", unitPrice: 2000, validUntil: "2026-08-25", publishedAt: "2026-08-01T12:00:00Z" });
const newValid = offer({ id: "new", unitPrice: 3500, validUntil: "2026-09-15", publishedAt: "2026-08-18T12:00:00Z" });

{
  const summary = summarizeSupplierOfferHistory([oldValid, newValid], { location: "Abuja (FCT)", quotedUnit: "50 kg bag", now });
  assert.equal(summary.low, 2000, "Old price must remain in the live range while still valid.");
  assert.equal(summary.high, 3500, "New valid price must form the high end of the live range.");
  assert.equal(summary.live.length, 2, "Both valid observations must remain live.");
  assert.equal(summary.archived.length, 0, "No valid observation should be archived early.");
  assert.equal(summary.latest?.unitPrice, 3500, "Latest valid price should be identifiable separately from the market range.");
}

{
  const afterExpiry = new Date("2026-08-26T12:00:00.000Z");
  const summary = summarizeSupplierOfferHistory([oldValid, newValid], { location: "Abuja", quotedUnit: "50kg bag", now: afterExpiry });
  assert.equal(summary.low, 3500, "Expired old price must leave the live range.");
  assert.equal(summary.high, 3500, "Only the recent valid price should remain after expiry.");
  assert.equal(summary.live.length, 1, "Only one valid observation should remain.");
  assert.equal(summary.archived.length, 1, "Expired price must be retained in archive.");
  assert.equal(summary.archived[0].unitPrice, 2000, "Archive must preserve the expired historical price.");
}

{
  const legacy = offer({ id: "legacy", unitPrice: 15000, validUntil: null, publishedAt: "2026-08-30T07:43:00Z", submittedAt: "2026-08-30T07:17:00Z" });
  assert.equal(getSupplierOfferEffectiveValidUntil(legacy), "2026-09-29", "Legacy prices without validity must receive the 30-day compatibility window.");
  assert.equal(isSupplierOfferCurrent(legacy, new Date("2026-09-20T12:00:00Z")), true, "Legacy price should remain live within its compatibility window.");
  assert.equal(isSupplierOfferCurrent(legacy, new Date("2026-09-30T12:00:00Z")), false, "Legacy price must expire after the compatibility window.");
}

{
  const lagos = offer({ id: "lagos", unitPrice: 1800, location: "Lagos", validUntil: "2026-09-30" });
  const wrongUnit = offer({ id: "tonne", unitPrice: 50000, location: "Abuja", quotedUnit: "tonne", validUntil: "2026-09-30" });
  const summary = summarizeSupplierOfferHistory([oldValid, newValid, lagos, wrongUnit], { location: "Abuja", quotedUnit: "50kg bag", now });
  assert.equal(summary.live.length, 2, "Different locations and units must not contaminate a live price range.");
  assert.equal(summary.low, 2000);
  assert.equal(summary.high, 3500);
}

console.log("Supplier price validity verification passed: overlap range, expiry/archive, legacy validity and market isolation.");
