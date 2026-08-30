"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import CatalogueRuntime from "@/components/pricing/catalogue-runtime";
import MarketPriceRuntime from "@/components/pricing/market-price-runtime";
import Footer from "./Footer";
import Navbar from "./Navbar";

function PricingRuntime() {
  return (
    <>
      <MarketPriceRuntime />
      <CatalogueRuntime />
    </>
  );
}

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const estimatorApp = pathname.startsWith("/estimator/app");

  if (estimatorApp) {
    return (
      <>
        <PricingRuntime />
        {children}
      </>
    );
  }

  return (
    <>
      <PricingRuntime />
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
