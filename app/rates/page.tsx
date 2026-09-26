import RateBankBrowser from "@/components/rates/rate-bank-browser";

export const metadata = {
  title: "Construction Rate Bank Nigeria",
  description:
    "Transparent construction work rates with full material, labour, plant, logistics, fluctuation and risk build-ups. Edit a private copy with your own prices and O/P.",
};

export default function RatesPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <RateBankBrowser />
      </div>
    </main>
  );
}
