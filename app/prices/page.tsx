import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import MarketPriceBrowser from "@/components/pricing/market-price-browser";
import MarketplaceDirectory from "@/components/marketplace/marketplace-directory";
import { SupplierCaveat } from "@/components/pricing/material-suppliers";
import { MarketplaceSafetyNotice } from "@/components/marketplace/transaction-safety";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Building Material Prices in Nigeria",
  description:
    "Check Nigerian building material prices, construction labour rates, equipment references and supplier market guides in practical buying units for estimating and procurement.",
  path: "/prices",
  keywords: ["building material prices Nigeria", "construction material prices Abuja", "cement price Nigeria", "construction labour rates Nigeria"],
});

export default function PricesPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <MarketPriceBrowser />
        <div className="mt-6 space-y-4">
          <MarketplaceSafetyNotice slim />
        <section id="suppliers" className="scroll-mt-28 rounded-2xl border border-[#DCE4EC] bg-white p-5 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#0D3B66] text-[#F2B544]"><Store className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Supplier register</p>
                <h2 className="mt-1 text-lg font-black text-[#071E33] md:text-xl">Suppliers and artisans for these materials</h2>
                <p className="mt-1 text-xs leading-5 text-[#617286]">Registered suppliers, the materials they quote for, their prices and service areas. Each material page also lists its own suppliers.</p>
              </div>
            </div>
            <Link href="/supplier-prices" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071E33] px-5 text-sm font-black text-white transition hover:bg-[#0D3B66]">
              Register as a supplier <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5"><SupplierCaveat /></div>
          <div className="mt-5 rounded-2xl bg-[#04121F] p-3 md:p-5"><MarketplaceDirectory /></div>
        </section>
        </div>
      </div>
    </main>
  );
}
