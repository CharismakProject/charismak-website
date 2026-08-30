import { DEFAULT_PRICE_ITEMS, DEFAULT_RATE_TEMPLATES } from "./defaults";
import { applyLivePriceState, DEFAULT_PRICE_VALIDITY_DAYS, withRecordedPrice } from "./price-history";
import type { PriceItem, RateEstimate, RateTemplate } from "./models";

const PRICE_KEY = "charismak-price-library-v1";
const ESTIMATE_KEY = "charismak-rate-estimates-v1";

export const PRICE_LIBRARY_UPDATED_EVENT = "charismak:price-library-updated";
export const RATE_ESTIMATE_UPDATED_EVENT = "charismak:rate-estimate-updated";

const canUseStorage = () => typeof localStorage !== "undefined";
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const notify = (name: string) => {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(name));
};

function mergeStoredPrices(): PriceItem[] {
  if (!canUseStorage()) return clone(DEFAULT_PRICE_ITEMS);
  try {
    const raw = localStorage.getItem(PRICE_KEY);
    if (!raw) return clone(DEFAULT_PRICE_ITEMS);
    const stored = JSON.parse(raw) as PriceItem[];
    const merged = DEFAULT_PRICE_ITEMS.map((defaultItem) => ({
      ...clone(defaultItem),
      ...(stored.find((item) => item.id === defaultItem.id) ?? {}),
    }));
    for (const item of stored) {
      if (!merged.some((candidate) => candidate.id === item.id)) merged.push(item);
    }
    return merged;
  } catch {
    return clone(DEFAULT_PRICE_ITEMS);
  }
}

export function loadPriceItems(): PriceItem[] {
  return mergeStoredPrices().map((item) => applyLivePriceState(item));
}

export function savePriceItems(items: PriceItem[]): PriceItem[] {
  if (canUseStorage()) localStorage.setItem(PRICE_KEY, JSON.stringify(items));
  notify(PRICE_LIBRARY_UPDATED_EVENT);
  return items.map((item) => applyLivePriceState(item));
}

export function recordPriceUpdate(
  id: string,
  rate: number,
  options?: {
    validityDays?: number;
    source?: string;
    sourceUrl?: string | null;
    confidence?: PriceItem["confidence"];
    location?: string;
    recordedAt?: string;
  },
): PriceItem[] {
  const items = loadPriceItems().map((item) =>
    item.id === id ? withRecordedPrice(item, rate, options) : item,
  );
  return savePriceItems(items);
}

export function updatePriceItem(id: string, patch: Partial<PriceItem>): PriceItem[] {
  const current = loadPriceItems().find((item) => item.id === id);
  if (current && patch.rate !== undefined && patch.rate !== null && patch.rate !== current.rate) {
    const { rate, ...rest } = patch;
    const preUpdated = loadPriceItems().map((item) => item.id === id ? { ...item, ...rest } : item);
    const target = preUpdated.find((item) => item.id === id)!;
    const recorded = withRecordedPrice(target, rate, {
      validityDays: target.validityDays ?? DEFAULT_PRICE_VALIDITY_DAYS,
      source: target.source,
      sourceUrl: target.sourceUrl,
      confidence: target.confidence ?? "manual",
      location: target.location,
    });
    return savePriceItems(preUpdated.map((item) => item.id === id ? recorded : item));
  }

  const now = new Date().toISOString();
  const items = loadPriceItems().map((item) =>
    item.id === id ? { ...item, ...patch, updatedAt: now } : item,
  );
  return savePriceItems(items);
}

export function addPriceItem(input?: Partial<PriceItem>): PriceItem {
  const now = new Date().toISOString();
  const item: PriceItem = {
    id: `price-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    code: input?.code ?? "CUSTOM",
    description: input?.description ?? "New price item",
    category: input?.category ?? "material",
    unit: input?.unit ?? "item",
    rate: input?.rate ?? null,
    defaultRate: input?.defaultRate ?? null,
    currency: input?.currency ?? "NGN",
    countryCode: input?.countryCode ?? "NG",
    region: input?.region ?? "FCT",
    location: input?.location ?? "Abuja",
    source: input?.source ?? "Manual entry",
    sourceUrl: input?.sourceUrl ?? null,
    confidence: input?.confidence ?? "manual",
    updatedAt: now,
    active: input?.active ?? true,
    validityDays: input?.validityDays ?? DEFAULT_PRICE_VALIDITY_DAYS,
    validUntil: input?.validUntil ?? null,
    priceHistory: input?.priceHistory ?? [],
  };
  savePriceItems([...loadPriceItems(), item]);
  return item;
}

export function resetPriceLibrary(): PriceItem[] {
  return savePriceItems(clone(DEFAULT_PRICE_ITEMS));
}

export function loadRateTemplates(): RateTemplate[] {
  return clone(DEFAULT_RATE_TEMPLATES);
}

type EstimatePayload = { activeEstimateId: string | null; estimates: RateEstimate[] };

function loadEstimatePayload(): EstimatePayload {
  if (!canUseStorage()) return { activeEstimateId: null, estimates: [] };
  try {
    const raw = localStorage.getItem(ESTIMATE_KEY);
    if (!raw) return { activeEstimateId: null, estimates: [] };
    const payload = JSON.parse(raw) as EstimatePayload;
    return {
      activeEstimateId: payload.activeEstimateId ?? null,
      estimates: Array.isArray(payload.estimates) ? payload.estimates : [],
    };
  } catch {
    return { activeEstimateId: null, estimates: [] };
  }
}

function saveEstimatePayload(payload: EstimatePayload) {
  if (canUseStorage()) localStorage.setItem(ESTIMATE_KEY, JSON.stringify(payload));
  notify(RATE_ESTIMATE_UPDATED_EVENT);
}

export function loadRateEstimates(): RateEstimate[] {
  return loadEstimatePayload().estimates
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function loadRateEstimate(): RateEstimate | null {
  const payload = loadEstimatePayload();
  return payload.estimates.find((item) => item.id === payload.activeEstimateId) ?? null;
}

export function createRateEstimate(overrides?: Partial<RateEstimate>): RateEstimate {
  const now = new Date().toISOString();
  const estimate: RateEstimate = {
    id: `estimate-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: overrides?.title ?? "New Construction Estimate",
    projectName: overrides?.projectName ?? "",
    clientName: overrides?.clientName ?? "",
    location: overrides?.location ?? "Abuja",
    currency: overrides?.currency ?? "NGN",
    createdAt: now,
    updatedAt: now,
    lines: overrides?.lines ?? [],
  };
  const payload = loadEstimatePayload();
  payload.estimates.push(estimate);
  payload.activeEstimateId = estimate.id;
  saveEstimatePayload(payload);
  return estimate;
}

export function saveRateEstimate(estimate: RateEstimate): RateEstimate {
  const payload = loadEstimatePayload();
  const updated = { ...estimate, updatedAt: new Date().toISOString() };
  payload.estimates = payload.estimates.some((item) => item.id === updated.id)
    ? payload.estimates.map((item) => item.id === updated.id ? updated : item)
    : [...payload.estimates, updated];
  payload.activeEstimateId = updated.id;
  saveEstimatePayload(payload);
  return updated;
}

export function selectRateEstimate(id: string): RateEstimate {
  const payload = loadEstimatePayload();
  const estimate = payload.estimates.find((item) => item.id === id);
  if (!estimate) throw new Error("The selected estimate could not be found.");
  payload.activeEstimateId = id;
  saveEstimatePayload(payload);
  return estimate;
}

export function deleteRateEstimate(id: string): RateEstimate | null {
  const payload = loadEstimatePayload();
  payload.estimates = payload.estimates.filter((item) => item.id !== id);
  if (payload.activeEstimateId === id) {
    payload.activeEstimateId = payload.estimates[0]?.id ?? null;
  }
  saveEstimatePayload(payload);
  return payload.estimates.find((item) => item.id === payload.activeEstimateId) ?? null;
}