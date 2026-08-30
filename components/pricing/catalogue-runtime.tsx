"use client";

import { useEffect } from "react";
import { syncCatalogueFromCloud } from "@/lib/pricing/catalogue-cloud";

const MARKET_OVERRIDES_UPDATED_EVENT = "charismak:market-overrides-updated";

export default function CatalogueRuntime() {
  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      if (cancelled) return;
      await syncCatalogueFromCloud();
    };
    void sync();
    window.addEventListener(MARKET_OVERRIDES_UPDATED_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(MARKET_OVERRIDES_UPDATED_EVENT, sync);
    };
  }, []);
  return null;
}
