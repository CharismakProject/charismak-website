import SupplierPriceExperience from "@/components/pricing/supplier-price-experience";

export const metadata = {
  title: "Supplier Price Update | Charismak Project",
  description:
    "Suppliers can update current Nigerian construction material, equipment and specialist rates through one simple Charismak portal.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function SupplierPricesPage() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <section className="mb-5 rounded-2xl border border-[#D7E3EE] bg-[#F7FBFF] px-4 py-4 text-xs leading-6 text-[#526579] sm:px-5">
          <strong className="text-[#071E33]">Marketplace visibility:</strong> active profiles created here are listed in the Charismak supplier & artisan directory. Your business name, public contact details, location/service areas and selected supply or trade categories may be shown so visitors can contact you for enquiries and quotations.
        </section>
        <SupplierPriceExperience />
      </div>
    </main>
  );
}
