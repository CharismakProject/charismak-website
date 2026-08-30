"use client";

import { useEffect, useState } from "react";

import MaterialPriceDetail from "@/components/pricing/material-price-detail";
import { MARKET_OVERRIDES_UPDATED_EVENT } from "@/components/pricing/market-price-runtime";
import { PRICE_LIBRARY_UPDATED_EVENT } from "@/lib/pricing/store";

export default function MaterialPriceDetailRuntime({ itemId }: { itemId: string }) {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((current) => current + 1);
    window.addEventListener(MARKET_OVERRIDES_UPDATED_EVENT, refresh);
    window.addEventListener(PRICE_LIBRARY_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(MARKET_OVERRIDES_UPDATED_EVENT, refresh);
      window.removeEventListener(PRICE_LIBRARY_UPDATED_EVENT, refresh);
    };
  }, []);

  return <MaterialPriceDetail key={`${itemId}-${version}`} itemId={itemId} />;
}
