import assert from "node:assert/strict";

import { FRESH_DAYS, STALE_DAYS, ageInDays, isNewerObservation, priceFreshness, priceSourceKind } from "../lib/pricing/freshness";

const now = new Date("2026-10-15T12:00:00Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

// Source classification.
assert.equal(priceSourceKind("Charismak purchase records"), "purchase");
assert.equal(priceSourceKind("Approved supplier prices"), "supplier");
assert.equal(priceSourceKind("Charismak market review"), "review");
assert.equal(priceSourceKind("Jiji Abuja"), "listing");
assert.equal(priceSourceKind(""), "benchmark");
assert.equal(priceSourceKind(undefined), "benchmark");

// Freshness boundaries.
assert.equal(priceFreshness("purchase", daysAgo(0), now), "current");
assert.equal(priceFreshness("purchase", daysAgo(FRESH_DAYS), now), "current");
assert.equal(priceFreshness("purchase", daysAgo(FRESH_DAYS + 1), now), "ageing");
assert.equal(priceFreshness("listing", daysAgo(STALE_DAYS), now), "ageing");
assert.equal(priceFreshness("listing", daysAgo(STALE_DAYS + 1), now), "stale");
assert.equal(priceFreshness("review", "not a date", now), "stale", "unknown dates are never current");
assert.equal(priceFreshness("review", null, now), "stale");
assert.equal(priceFreshness("benchmark", daysAgo(0), now), "benchmark", "benchmarks are never labelled current");
assert.equal(ageInDays(daysAgo(10), now), 10);
assert.equal(ageInDays(new Date(now.getTime() + 86_400_000).toISOString(), now), 0, "future dates clamp to 0");

// Newest observation wins; older admin overrides cannot replace newer records.
assert.equal(isNewerObservation("2026-08-30T08:00:00Z", "2026-10-15T12:00:00Z"), false);
assert.equal(isNewerObservation("2026-10-16T08:00:00Z", "2026-10-15T12:00:00Z"), true);
assert.equal(isNewerObservation("2026-10-15T12:00:00Z", "2026-10-15T12:00:00Z"), true, "same-time review replaces");
assert.equal(isNewerObservation("bad", "2026-10-15T12:00:00Z"), false);
assert.equal(isNewerObservation("2026-10-15T12:00:00Z", undefined), true);

console.log("Price freshness verification passed.");
