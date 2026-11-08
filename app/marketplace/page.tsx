import MarketplaceDirectory from "@/components/marketplace/marketplace-directory";
import { MarketplaceSafetyNotice, MarketplaceTransactionGuard } from "@/components/marketplace/transaction-safety";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Construction Suppliers & Artisans in Nigeria",
  description:
    "Find building-material suppliers, construction vendors and skilled artisans in Nigeria by trade, material and state, and compare current supplier prices.",
  path: "/marketplace",
  keywords: ["building material suppliers Nigeria", "construction suppliers Abuja", "artisans Abuja", "construction marketplace Nigeria"],
});

export default function MarketplacePage() {
  return (
    <main className="min-h-screen bg-[#04121F] pt-20">
      <MarketplaceTransactionGuard />
      <section className="relative overflow-hidden px-4 pb-6 pt-10 text-white md:px-8 md:pt-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(242,181,68,0.16),transparent_32rem),radial-gradient(circle_at_0%_100%,rgba(56,189,168,0.10),transparent_28rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#F2B544]">Construction Marketplace</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight md:text-5xl">
            Suppliers and trade teams, <span className="text-[#E8C77F]">with real prices.</span>
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65 md:text-base">
            Search by material, trade or state. Compare current supplier quotes and contact the business directly on WhatsApp.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-5 px-4 pb-14 md:px-8">
        <MarketplaceSafetyNotice slim />
        <MarketplaceDirectory />
      </div>
    </main>
  );
}
