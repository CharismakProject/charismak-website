import type { PriceItem, PriceObservation } from "./models";

export const DEFAULT_PRICE_VALIDITY_DAYS = 30;

const toMs = (value: string | null | undefined) => {
  if (!value) return Number.NaN;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export const addDaysIso = (dateIso: string, days: number) => {
  const base = Number.isFinite(toMs(dateIso)) ? new Date(dateIso) : new Date();
  base.setUTCDate(base.getUTCDate() + Math.max(1, Math.round(days || DEFAULT_PRICE_VALIDITY_DAYS)));
  return base.toISOString();
};

const sameMarket = (item: PriceItem, observation: PriceObservation) =>
  observation.currency === item.currency &&
  observation.location.trim().toLowerCase() === item.location.trim().toLowerCase() &&
  observation.unit.trim().toLowerCase() === item.unit.trim().toLowerCase();

export type PriceHistorySummary = {
  valid: PriceObservation[];
  archived: PriceObservation[];
  currentCount: number;
  archivedCount: number;
  low: number | null;
  high: number | null;
  latestValid: PriceObservation | null;
  latestRecorded: PriceObservation | null;
};

export function getPriceHistorySummary(item: PriceItem, now = new Date()): PriceHistorySummary {
  const nowMs = now.getTime();
  const history = (item.priceHistory ?? [])
    .filter((observation) => Number.isFinite(observation.rate) && observation.rate >= 0)
    .slice()
    .sort((a, b) => toMs(b.recordedAt) - toMs(a.recordedAt));

  if (!history.length) {
    if (item.rate === null || !Number.isFinite(item.rate)) {
      return { valid: [], archived: [], currentCount: 0, archivedCount: 0, low: null, high: null, latestValid: null, latestRecorded: null };
    }
    const fallback: PriceObservation = {
      id: `${item.id}-legacy-current`,
      rate: item.rate,
      currency: item.currency,
      location: item.location,
      unit: item.unit,
      source: item.source,
      sourceUrl: item.sourceUrl ?? null,
      confidence: item.confidence,
      recordedAt: item.updatedAt,
      validUntil: item.validUntil ?? "9999-12-31T23:59:59.999Z",
    };
    const fallbackValid = toMs(fallback.validUntil) >= nowMs;
    return fallbackValid
      ? { valid: [fallback], archived: [], currentCount: 1, archivedCount: 0, low: fallback.rate, high: fallback.rate, latestValid: fallback, latestRecorded: fallback }
      : { valid: [], archived: [fallback], currentCount: 0, archivedCount: 1, low: null, high: null, latestValid: null, latestRecorded: fallback };
  }

  const comparable = history.filter((observation) => sameMarket(item, observation));
  const valid = comparable.filter((observation) => toMs(observation.validUntil) >= nowMs);
  const archived = history.filter((observation) => !sameMarket(item, observation) || toMs(observation.validUntil) < nowMs);
  const rates = valid.map((observation) => observation.rate);

  return {
    valid,
    archived,
    currentCount: valid.length,
    archivedCount: archived.length,
    low: rates.length ? Math.min(...rates) : null,
    high: rates.length ? Math.max(...rates) : null,
    latestValid: valid[0] ?? null,
    latestRecorded: history[0] ?? null,
  };
}

export function withRecordedPrice(
  item: PriceItem,
  rate: number,
  options?: {
    validityDays?: number;
    recordedAt?: string;
    source?: string;
    sourceUrl?: string | null;
    confidence?: PriceItem["confidence"];
    location?: string;
  },
): PriceItem {
  const recordedAt = options?.recordedAt ?? new Date().toISOString();
  const validityDays = Math.max(1, Math.round(options?.validityDays ?? item.validityDays ?? DEFAULT_PRICE_VALIDITY_DAYS));
  const existing = (item.priceHistory ?? []).slice();

  if (!existing.length && item.rate !== null && Number.isFinite(item.rate)) {
    const previousDays = Math.max(1, Math.round(item.validityDays ?? validityDays));
    existing.push({
      id: `${item.id}-price-${toMs(item.updatedAt) || Date.now()}-previous`,
      rate: item.rate,
      currency: item.currency,
      location: item.location,
      unit: item.unit,
      source: item.source,
      sourceUrl: item.sourceUrl ?? null,
      confidence: item.confidence,
      recordedAt: item.updatedAt,
      validUntil: item.validUntil ?? addDaysIso(item.updatedAt, previousDays),
    });
  }

  const observation: PriceObservation = {
    id: `${item.id}-price-${Date.parse(recordedAt) || Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    rate: Math.max(0, rate),
    currency: item.currency,
    location: options?.location ?? item.location,
    unit: item.unit,
    source: options?.source ?? item.source,
    sourceUrl: options?.sourceUrl ?? item.sourceUrl ?? null,
    confidence: options?.confidence ?? item.confidence ?? "manual",
    recordedAt,
    validUntil: addDaysIso(recordedAt, validityDays),
  };

  const history = [...existing, observation]
    .sort((a, b) => toMs(b.recordedAt) - toMs(a.recordedAt));

  return {
    ...item,
    rate: observation.rate,
    location: observation.location,
    source: observation.source,
    sourceUrl: observation.sourceUrl ?? null,
    confidence: observation.confidence,
    updatedAt: recordedAt,
    validityDays,
    validUntil: observation.validUntil,
    priceHistory: history,
  };
}

export function applyLivePriceState(item: PriceItem, now = new Date()): PriceItem {
  const summary = getPriceHistorySummary(item, now);
  if (!(item.priceHistory?.length)) return item;
  return {
    ...item,
    rate: summary.latestValid?.rate ?? null,
    validUntil: summary.latestValid?.validUntil ?? null,
    confidence: summary.latestValid?.confidence ?? item.confidence,
    source: summary.latestValid?.source ?? item.source,
    sourceUrl: summary.latestValid?.sourceUrl ?? item.sourceUrl ?? null,
  };
}

export function formatPriceRange(item: PriceItem, now = new Date()) {
  const summary = getPriceHistorySummary(item, now);
  if (summary.low === null || summary.high === null) return null;
  const formatter = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: item.currency,
    maximumFractionDigits: 0,
  });
  if (Math.abs(summary.high - summary.low) < 0.0001) return formatter.format(summary.low);
  return `${formatter.format(summary.low)} – ${formatter.format(summary.high)}`;
}