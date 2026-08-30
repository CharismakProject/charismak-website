"use client";

import { useEffect } from "react";

import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";
import { loadMarketPriceOverrides } from "@/lib/pricing/market-overrides";
import { PRICE_LIBRARY_UPDATED_EVENT } from "@/lib/pricing/store";

export const MARKET_OVERRIDES_UPDATED_EVENT = "charismak:market-overrides-updated";

export default function MarketPriceRuntime() {
  useEffect(() => {
    let cancelled = false;

    void loadMarketPriceOverrides().then((overrides) => {
      if (cancelled) return;

      Object.values(overrides).forEach((override) => {
        const previous = JIJI_MARKET_SNAPSHOT[override.itemId];
        JIJI_MARKET_SNAPSHOT[override.itemId] = {
          itemId: override.itemId,
          marketName: override.marketName || previous?.marketName || override.itemId,
          unit: override.unit,
          priceLow: override.priceLow,
          priceHigh: override.priceHigh,
          reference: override.referenceRate,
          location: override.location,
          specification: override.specification || previous?.specification,
          sourceLabel: override.sourceLabel || "Charismak market review",
          sourceCount: previous?.sourceCount ?? 1,
          checkedAt: override.checkedAt,
          note: override.note || previous?.note,
          primarySourceUrl: override.sourceUrl || previous?.primarySourceUrl || "",
          sourceUrls: override.sourceUrl
            ? [override.sourceUrl]
            : previous?.sourceUrls ?? [],
          alternatives: previous?.alternatives,
        };
      });

      window.dispatchEvent(new CustomEvent(PRICE_LIBRARY_UPDATED_EVENT));
      window.dispatchEvent(new CustomEvent(MARKET_OVERRIDES_UPDATED_EVENT));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
