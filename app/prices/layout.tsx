import type { ReactNode } from "react";

import MarketPriceRuntime from "@/components/pricing/market-price-runtime";

export default function PricesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketPriceRuntime />
      {children}
    </>
  );
}
