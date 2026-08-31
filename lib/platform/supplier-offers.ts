import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export const DEFAULT_SUPPLIER_PRICE_VALIDITY_DAYS = 30;

export type SupplierMarketplaceOffer = {
  id: string;
  sourceSubmissionId: string | null;
  supplierId: string | null;
  supplierName: string;
  catalogueItemId: string;
  productName: string;
  specification: string | null;
  brand: string | null;
  quotedUnit: string;
  unitPrice: number;
  bulkPrice: number | null;
  minimumQty: number | null;
  deliveryFee: number | null;
  deliveryIncluded: boolean | null;
  location: string;
  serviceArea: string | null;
  availability: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  validUntil: string | null;
  supplierRemarks: string | null;
  submittedAt: string | null;
  publishedAt: string | null;
};

export type SupplierOfferSummary = {
  count: number;
  lowestPrice: number;
  highestPrice: number;
  latestPrice: number;
  quotedUnit: string;
  archivedCount: number;
  latestPublishedAt: string | null;
  locations: string[];
};

export type SupplierOfferHistory = {
  live: SupplierMarketplaceOffer[];
  archived: SupplierMarketplaceOffer[];
  low: number | null;
  high: number | null;
  latest: SupplierMarketplaceOffer | null;
};

const toOffer = (row: Record<string, unknown>): SupplierMarketplaceOffer => ({
  id: String(row.id),
  sourceSubmissionId: row.source_submission_id ? String(row.source_submission_id) : null,
  supplierId: row.supplier_id ? String(row.supplier_id) : null,
  supplierName: String(row.supplier_name ?? "Supplier"),
  catalogueItemId: String(row.catalogue_item_id ?? ""),
  productName: String(row.product_name ?? ""),
  specification: row.specification ? String(row.specification) : null,
  brand: row.brand ? String(row.brand) : null,
  quotedUnit: String(row.quoted_unit ?? "item"),
  unitPrice: Number(row.unit_price ?? 0),
  bulkPrice: row.bulk_price == null ? null : Number(row.bulk_price),
  minimumQty: row.minimum_qty == null ? null : Number(row.minimum_qty),
  deliveryFee: row.delivery_fee == null ? null : Number(row.delivery_fee),
  deliveryIncluded: row.delivery_included == null ? null : Boolean(row.delivery_included),
  location: String(row.location ?? "Nigeria"),
  serviceArea: row.service_area ? String(row.service_area) : null,
  availability: row.availability ? String(row.availability) : null,
  phone: row.phone ? String(row.phone) : null,
  whatsapp: row.whatsapp ? String(row.whatsapp) : null,
  email: row.email ? String(row.email) : null,
  validUntil: row.valid_until ? String(row.valid_until) : null,
  supplierRemarks: row.supplier_remarks ? String(row.supplier_remarks) : null,
  submittedAt: row.submitted_at ? String(row.submitted_at) : null,
  publishedAt: row.published_at ? String(row.published_at) : null,
});

const dateOnly = (value: Date) => value.toISOString().slice(0, 10);

const addDays = (value: string | null, days: number) => {
  const parsed = value ? new Date(value) : new Date();
  const base = Number.isFinite(parsed.getTime()) ? parsed : new Date();
  base.setUTCDate(base.getUTCDate() + days);
  return dateOnly(base);
};

export function getSupplierOfferEffectiveValidUntil(offer: SupplierMarketplaceOffer) {
  if (offer.validUntil) return offer.validUntil.slice(0, 10);
  return addDays(offer.publishedAt || offer.submittedAt, DEFAULT_SUPPLIER_PRICE_VALIDITY_DAYS);
}

export function isSupplierOfferCurrent(
  offer: SupplierMarketplaceOffer,
  now = new Date(),
) {
  return getSupplierOfferEffectiveValidUntil(offer) >= dateOnly(now);
}

const offerTimestamp = (offer: SupplierMarketplaceOffer) => {
  const parsed = new Date(offer.publishedAt || offer.submittedAt || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Normalise common buying-unit wording so approved prices compare like-for-like. */
export function normalizeSupplierQuotedUnit(value: string) {
  const unit = normalize(value);
  if (["50kgbag", "50kg", "bag", "1bag", "cementbag"].includes(unit)) return "50kgbag";
  if (["piece", "pc", "pcs", "nr", "number", "unit", "1piece", "1block"].includes(unit)) return "piece";
  if (["12mlength", "12m", "length", "bar", "rod"].includes(unit)) return "12mlength";
  if (["tonne", "ton", "metrictonne", "1tonne"].includes(unit)) return "tonne";
  if (["m3", "cubicmetre", "cubicmeter"].includes(unit)) return "m3";
  if (["m2", "sqm", "squaremetre", "squaremeter"].includes(unit)) return "m2";
  if (["carton", "box"].includes(unit)) return "carton";
  if (["sheet", "fullsheet"].includes(unit)) return "sheet";
  if (["coil", "roll", "coilroll"].includes(unit)) return "coilroll";
  if (["hireday", "day", "perday", "dailyhire"].includes(unit)) return "hireday";
  return unit;
}

export function supplierOfferMatchesMarket(
  offer: SupplierMarketplaceOffer,
  options?: { location?: string | null; quotedUnit?: string | null },
) {
  const location = options?.location?.trim();
  const quotedUnit = options?.quotedUnit?.trim();

  if (location) {
    const left = normalize(offer.location);
    const right = normalize(location);
    if (left && right && left !== right && !left.includes(right) && !right.includes(left)) return false;
  }

  if (quotedUnit) {
    const left = normalizeSupplierQuotedUnit(offer.quotedUnit);
    const right = normalizeSupplierQuotedUnit(quotedUnit);
    if (left && right && left !== right && !left.includes(right) && !right.includes(left)) return false;
  }

  return true;
}

export function summarizeSupplierOfferHistory(
  offers: SupplierMarketplaceOffer[],
  options?: { location?: string | null; quotedUnit?: string | null; now?: Date },
): SupplierOfferHistory {
  const relevant = offers.filter((offer) => supplierOfferMatchesMarket(offer, options));
  const now = options?.now ?? new Date();
  const live = relevant
    .filter((offer) => isSupplierOfferCurrent(offer, now))
    .sort((left, right) => left.unitPrice - right.unitPrice);
  const archived = relevant
    .filter((offer) => !isSupplierOfferCurrent(offer, now))
    .sort((left, right) => offerTimestamp(right) - offerTimestamp(left));
  const byRecency = live.slice().sort((left, right) => offerTimestamp(right) - offerTimestamp(left));

  return {
    live,
    archived,
    low: live.length ? Math.min(...live.map((offer) => offer.unitPrice)) : null,
    high: live.length ? Math.max(...live.map((offer) => offer.unitPrice)) : null,
    latest: byRecency[0] ?? null,
  };
}

async function loadApprovedOffers(catalogueItemId?: string) {
  const client = getSupabaseBrowserClient();
  if (!client) return [] as SupplierMarketplaceOffer[];

  let query = client
    .from("supplier_marketplace_offers")
    .select("*")
    .eq("status", "approved");

  if (catalogueItemId) query = query.eq("catalogue_item_id", catalogueItemId);

  const { data, error } = await query.order("published_at", { ascending: false, nullsFirst: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(toOffer);
}

export async function loadSupplierOfferHistoryForItem(
  catalogueItemId: string,
): Promise<SupplierMarketplaceOffer[]> {
  if (!catalogueItemId) return [];
  return loadApprovedOffers(catalogueItemId);
}

export async function loadSupplierOffersForItem(
  catalogueItemId: string,
): Promise<SupplierMarketplaceOffer[]> {
  const rows = await loadSupplierOfferHistoryForItem(catalogueItemId);
  return summarizeSupplierOfferHistory(rows).live;
}

export async function loadArchivedSupplierOffersForItem(
  catalogueItemId: string,
): Promise<SupplierMarketplaceOffer[]> {
  const rows = await loadSupplierOfferHistoryForItem(catalogueItemId);
  return summarizeSupplierOfferHistory(rows).archived;
}

function pickComparableUnitGroup(offers: SupplierMarketplaceOffer[]) {
  const groups = new Map<string, SupplierMarketplaceOffer[]>();
  for (const offer of offers.filter((row) => isSupplierOfferCurrent(row))) {
    const key = normalizeSupplierQuotedUnit(offer.quotedUnit) || "item";
    const group = groups.get(key) ?? [];
    group.push(offer);
    groups.set(key, group);
  }

  return [...groups.values()].sort((left, right) => {
    if (right.length !== left.length) return right.length - left.length;
    const leftLatest = Math.max(...left.map(offerTimestamp));
    const rightLatest = Math.max(...right.map(offerTimestamp));
    return rightLatest - leftLatest;
  })[0] ?? [];
}

export async function loadSupplierOfferSummaries(): Promise<Record<string, SupplierOfferSummary>> {
  const rows = await loadApprovedOffers();
  const byItem = new Map<string, SupplierMarketplaceOffer[]>();
  for (const offer of rows) {
    if (!offer.catalogueItemId) continue;
    const current = byItem.get(offer.catalogueItemId) ?? [];
    current.push(offer);
    byItem.set(offer.catalogueItemId, current);
  }

  const summaries: Record<string, SupplierOfferSummary> = {};
  for (const [itemId, allOffers] of byItem) {
    const offers = pickComparableUnitGroup(allOffers);
    if (!offers.length) continue;
    const history = summarizeSupplierOfferHistory(offers);
    if (!history.live.length || history.low === null || history.high === null || !history.latest) continue;
    summaries[itemId] = {
      count: history.live.length,
      lowestPrice: history.low,
      highestPrice: history.high,
      latestPrice: history.latest.unitPrice,
      quotedUnit: history.latest.quotedUnit,
      archivedCount: Math.max(0, allOffers.length - history.live.length),
      latestPublishedAt: history.latest.publishedAt || history.latest.submittedAt,
      locations: Array.from(new Set(history.live.map((offer) => offer.location).filter(Boolean))),
    };
  }
  return summaries;
}
