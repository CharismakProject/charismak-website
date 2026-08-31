import SupplierPriceExperience from "@/components/pricing/supplier-price-experience";

export const metadata = {
  title: "Supplier Network | Charismak Project",
  description: "Create a Charismak supplier profile, list what you supply and keep your current construction prices up to date.",
  robots: { index: false, follow: false, nocache: true },
};

export default function SupplierPricesPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <SupplierPriceExperience />
      </div>
    </main>
  );
}
