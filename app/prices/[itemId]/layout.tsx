import type { ReactNode } from "react";

import { DEFAULT_PRICE_ITEMS } from "@/lib/pricing/defaults";

export const revalidate = 300;

export function generateStaticParams() {
  return DEFAULT_PRICE_ITEMS
    .filter((item) => item.countryCode === "NG" && item.active)
    .map((item) => ({ itemId: item.id }));
}

export default function MaterialPriceLayout({ children }: { children: ReactNode }) {
  return children;
}
