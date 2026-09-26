import RateBankBrowser from "@/components/rates/rate-bank-browser";
import { createSeoMetadata } from "@/lib/seo";

export const metadata = createSeoMetadata({
  title: "Construction Rates Nigeria – Rate Bank",
  description:
    "Nigeria construction rates with transparent material quantities, labour, plant, logistics, fluctuation and risk build-ups. Review each rate and calculate with your own prices.",
  path: "/rates",
  keywords: ["construction rates Nigeria", "building rates Nigeria", "rate analysis Nigeria", "construction rate build up", "BOQ rates Nigeria"],
});

export default function RatesPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <RateBankBrowser />
      </div>
    </main>
  );
}
