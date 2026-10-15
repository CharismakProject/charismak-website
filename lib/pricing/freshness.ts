/**
 * Price provenance and freshness rules for the public price catalogue.
 * A price is never presented as "current" just because it is displayed:
 * its source kind and the age of its last check decide the label.
 */
export type PriceSourceKind = "purchase" | "supplier" | "review" | "listing" | "benchmark";
export type PriceFreshness = "current" | "ageing" | "stale" | "benchmark";

/** Days after which an observation needs re-checking / is only historical. */
export const FRESH_DAYS = 45;
export const STALE_DAYS = 90;

export function priceSourceKind(sourceLabel: string | null | undefined): PriceSourceKind {
  const label = (sourceLabel ?? "").toLowerCase();
  if (!label) return "benchmark";
  if (label.includes("purchase")) return "purchase";
  if (label.includes("supplier")) return "supplier";
  if (label.includes("review")) return "review";
  return "listing";
}

export const SOURCE_LABELS: Record<PriceSourceKind, string> = {
  purchase: "Charismak purchase record",
  supplier: "Approved supplier quotation",
  review: "Charismak market review",
  listing: "Public listing observation",
  benchmark: "Benchmark estimate (not a live price)",
};

export function ageInDays(checkedAt: string | null | undefined, now = new Date()): number | null {
  if (!checkedAt) return null;
  const time = new Date(checkedAt).getTime();
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((now.getTime() - time) / 86_400_000));
}

export function priceFreshness(kind: PriceSourceKind, checkedAt: string | null | undefined, now = new Date()): PriceFreshness {
  if (kind === "benchmark") return "benchmark";
  const age = ageInDays(checkedAt, now);
  if (age === null) return "stale";
  if (age <= FRESH_DAYS) return "current";
  if (age <= STALE_DAYS) return "ageing";
  return "stale";
}

export const FRESHNESS_LABELS: Record<PriceFreshness, string> = {
  current: "Current",
  ageing: "Check before use",
  stale: "Historical — may be out of date",
  benchmark: "Benchmark",
};

/** Newest observation wins; an older record never replaces a newer one. */
export function isNewerObservation(candidateCheckedAt: string | null | undefined, existingCheckedAt: string | null | undefined): boolean {
  const candidate = new Date(candidateCheckedAt ?? "").getTime();
  const existing = new Date(existingCheckedAt ?? "").getTime();
  if (Number.isNaN(candidate)) return false;
  if (Number.isNaN(existing)) return true;
  return candidate >= existing;
}
