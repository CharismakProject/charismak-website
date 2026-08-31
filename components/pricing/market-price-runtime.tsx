"use client";

import { useEffect } from "react";

import { loadSupplierOfferSummaries } from "@/lib/platform/supplier-offers";
import { syncCatalogueFromCloud } from "@/lib/pricing/catalogue-cloud";
import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";
import { loadMarketPriceOverrides } from "@/lib/pricing/market-overrides";
import { loadPriceItems, savePriceItems } from "@/lib/pricing/store";

export const MARKET_OVERRIDES_UPDATED_EVENT = "charismak:market-overrides-updated";

export default function MarketPriceRuntime() {
  useEffect(() => {
    let cancelled = false;
    let refreshing = false;

    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        await syncCatalogueFromCloud();
        const [overrides, supplierSummaries] = await Promise.all([
          loadMarketPriceOverrides(),
          loadSupplierOfferSummaries(),
        ]);
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
            sourceUrls: override.sourceUrl ? [override.sourceUrl] : previous?.sourceUrls ?? [],
            alternatives: previous?.alternatives,
          };
        });

        const now = new Date().toISOString();
        const connected = loadPriceItems().map((item) => {
          const summary = supplierSummaries[item.id];
          if (!summary) return item;

          const previousMarket = JIJI_MARKET_SNAPSHOT[item.id];
          JIJI_MARKET_SNAPSHOT[item.id] = {
            itemId: item.id,
            marketName: previousMarket?.marketName || item.description,
            unit: summary.quotedUnit || item.marketUnit || previousMarket?.unit || item.unit,
            priceLow: summary.lowestPrice,
            priceHigh: summary.highestPrice,
            reference: summary.latestPrice,
            location:
              summary.locations.length === 1
                ? summary.locations[0]
                : previousMarket?.location || item.location,
            specification: item.specification || previousMarket?.specification,
            sourceLabel: "Approved supplier prices",
            sourceCount: summary.count,
            checkedAt: summary.latestPublishedAt || now,
            note: `${summary.count} currently valid approved supplier price${summary.count === 1 ? "" : "s"}.`,
            primarySourceUrl: "",
            sourceUrls: [],
            alternatives: previousMarket?.alternatives,
          };

          return {
            ...item,
            priceLow: summary.lowestPrice,
            priceHigh: summary.highestPrice,
            sourceCount: summary.count,
            marketUnit: summary.quotedUnit || item.marketUnit,
            source: "Approved supplier prices",
            confidence: "verified" as const,
            updatedAt: summary.latestPublishedAt || now,
          };
        });

        savePriceItems(connected);
        window.dispatchEvent(new CustomEvent(MARKET_OVERRIDES_UPDATED_EVENT));
      } finally {
        refreshing = false;
      }
    };

    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
