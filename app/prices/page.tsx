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
        <MarketPriceBrowser />
      </div>
    </main>
  );
}
