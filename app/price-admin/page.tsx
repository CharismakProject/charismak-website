import type { Metadata } from "next";

import MarketPriceAdmin from "@/components/pricing/market-price-admin";

export const metadata: Metadata = {
  title: "Market Price Admin",
  description: "Private Charismak construction market price administration.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MarketPriceAdminPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <MarketPriceAdmin />
      </div>
    </main>
  );
}
