import { DEFAULT_PRICE_ITEMS } from "./defaults";
import { getConstructionMarket, type PriceUpdateMode } from "./markets";
import type { PriceItem } from "./models";

const MARKET_KEY = "charismak-price-market-v1";

export type PriceMarketSettings = {
  countryCode: string;
  city: string;
  currency: string;
  updateMode: PriceUpdateMode;
  lastCheckedAt: string | null;
};

const initial: PriceMarketSettings = {
  countryCode: "NG",
  city: "Abuja",
  currency: "NGN",
  updateMode: "review",
  lastCheckedAt: null,
};

const canUseStorage = () => typeof localStorage !== "undefined";

export function loadMarketSettings(): PriceMarketSettings {
  if (!canUseStorage()) return initial;
  try {
    const raw = localStorage.getItem(MARKET_KEY);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch {
    return initial;
  }
}

export function saveMarketSettings(settings: PriceMarketSettings): PriceMarketSettings {
  if (canUseStorage()) localStorage.setItem(MARKET_KEY, JSON.stringify(settings));
  return settings;
}

export function createMarketPriceList(
  currentItems: PriceItem[],
  settings: PriceMarketSettings,
): PriceItem[] {
  const market = getConstructionMarket(settings.countryCode);
  const defaults = new Map(DEFAULT_PRICE_ITEMS.map((item) => [item.id, item]));
  return currentItems.map((item) => {
    const reference = defaults.get(item.id) ?? item;
    const isNigeria = market.countryCode === "NG";
    return {
      ...item,
      countryCode: market.countryCode,
      currency: market.currency,
      location: settings.city,
      rate: isNigeria ? reference.defaultRate ?? reference.rate ?? null : null,
      source: isNigeria
        ? "Charismak Nigeria starter reference - verify before commercial use"
        : `Awaiting verified ${market.country} supplier or rate-book feed`,
      sourceUrl: market.providerUrl,
      confidence: "starter",
      updatedAt: new Date().toISOString(),
    };
  });
}
