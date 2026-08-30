import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, PackageSearch, Tags } from "lucide-react";

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
        <section className="mb-5 flex flex-col gap-4 rounded-2xl border border-[#DCE4EC] bg-white p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-[#617286]"><ArrowLeft className="h-3.5 w-3.5" />Admin Control Centre</Link>
            <div className="mt-2 flex items-center gap-2"><Tags className="h-5 w-5 text-[#A82B05]" /><h1 className="text-lg font-black text-[#071E33]">Price & Catalogue Administration</h1></div>
            <p className="mt-1 text-xs leading-5 text-[#617286]">Use Catalogue Management for item names, images, specifications and visibility. Use this page for current market rates and price history.</p>
          </div>
          <Link href="/catalogue-admin" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#071E33] px-4 text-xs font-black text-white"><PackageSearch className="h-4 w-4" />Catalogue Management</Link>
        </section>
        <MarketPriceAdmin />
      </div>
    </main>
  );
}
