import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import MarketPriceBrowser from "@/components/pricing/market-price-browser";

export const metadata = {
  title: "Nigeria Construction Material & Equipment Prices",
  description:
    "Current Nigerian construction material, equipment and labour market references using practical buying units such as bags, tonnes, tippers, lengths, cartons and sheets.",
};

export default function PricesPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <section className="mb-6 flex flex-col gap-5 rounded-2xl border border-[#DCE4EC] bg-white p-5 shadow-[0_8px_28px_rgba(7,30,51,0.04)] sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#0D3B66] text-[#F2B544]"><Store className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Need the people behind the prices?</p>
              <h2 className="mt-1 text-lg font-black text-[#071E33] md:text-xl">Find active suppliers and skilled artisans</h2>
              <p className="mt-1 text-xs leading-5 text-[#617286]">Browse Charismak supplier profiles by material, trade and service area after checking the market price references.</p>
            </div>
          </div>
          <Link href="/marketplace" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071E33] px-5 text-sm font-black text-white transition hover:bg-[#0D3B66]">
            Supplier directory <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
        <MarketPriceBrowser />
      </div>
    </main>
  );
}
