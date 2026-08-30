"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import MarketPriceAdmin from "@/components/pricing/market-price-admin";
import { syncCatalogueFromCloud } from "@/lib/pricing/catalogue-cloud";

export default function MarketPriceAdminCatalogueGate() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void syncCatalogueFromCloud().finally(() => {
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  if (!ready) {
    return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  }

  return <MarketPriceAdmin />;
}
