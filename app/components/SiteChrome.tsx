"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import CatalogueRuntime from "@/components/pricing/catalogue-runtime";
import MarketPriceRuntime from "@/components/pricing/market-price-runtime";
import Navbar from "./Navbar";

type Props = {
  children: ReactNode;
  footer: ReactNode;
};

export default function SiteChrome({ children, footer }: Props) {
  const pathname = usePathname();
  const estimatorApp = pathname.startsWith("/estimator/app");
  const executiveProfile = pathname === "/md-profile";
  const needsLivePricing = pathname.startsWith("/prices") || pathname.startsWith("/estimator");
  const needsCatalogueOnly = pathname.startsWith("/price-admin") || pathname.startsWith("/catalogue-admin");

  if (estimatorApp) {
    return (
      <>
        <MarketPriceRuntime />
        {children}
      </>
    );
  }

  if (executiveProfile) {
    return <>{children}</>;
  }

  return (
    <>
      {needsLivePricing ? <MarketPriceRuntime /> : needsCatalogueOnly ? <CatalogueRuntime /> : null}
      <Navbar />
      {children}
      {footer}
    </>
  );
}
