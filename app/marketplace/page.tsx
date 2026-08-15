import MarketplaceDirectory from "@/components/marketplace/marketplace-directory";

export const metadata = {
  title: "Construction Suppliers & Artisans",
  description: "Find Nigerian building-material suppliers and skilled artisans by category and service area.",
};

export default function MarketplacePage() {
  return <main className="min-h-screen bg-[#F5F7FA] pt-20"><div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14"><MarketplaceDirectory /></div></main>;
}
