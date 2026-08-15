import PublicPriceList from "@/components/pricing/public-price-list";

export const metadata = {
  title: "Nigeria Building Material & Labour Price List",
  description: "Construction planning prices with practical buying units including bags, tonnes, trucks, BRC sheets and bar lengths.",
};

export default function PricesPage() {
  return <main className="min-h-screen bg-[#F5F7FA] pt-20"><div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14"><PublicPriceList /></div></main>;
}
