import MarketplaceDirectory from "@/components/marketplace/marketplace-directory";
import { MarketplaceSafetyNotice, MarketplaceTransactionGuard } from "@/components/marketplace/transaction-safety";

export const metadata = {
  title: "Construction Suppliers & Artisans",
  description: "Find Nigerian building-material suppliers and skilled artisans by category and service area.",
};

export default function MarketplacePage() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] pt-20">
      <MarketplaceTransactionGuard />
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-20 text-white md:px-8 lg:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(200,164,93,0.15),transparent_30rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#F2B544]">Construction Marketplace</p>
          <h1 className="mt-5 max-w-5xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Find the people and suppliers
            <span className="mt-2 block text-[#E8C77F]">behind the work.</span>
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
            Search construction suppliers and skilled artisans by trade, material and service area, with practical information designed for real project procurement.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 md:px-8 md:py-14">
        <MarketplaceSafetyNotice />
        <MarketplaceDirectory embedded />
      </div>
    </main>
  );
}
