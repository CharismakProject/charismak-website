import SupplierPricePortal from "@/components/pricing/supplier-price-portal";
import SupplierQuickPricePanel from "@/components/pricing/supplier-quick-price-panel";

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
        <SupplierPricePortal />
      </div>
      <SupplierQuickPricePanel />
    </main>
  );
}
