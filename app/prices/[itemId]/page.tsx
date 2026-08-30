import MaterialPriceDetailRuntime from "@/components/pricing/material-price-detail-runtime";

export const metadata = {
  title: "Material Prices & Suppliers",
  description:
    "Compare current construction material prices, available suppliers, locations and delivery options in Nigeria.",
};

export default async function MaterialSupplierPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;

  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <MaterialPriceDetailRuntime itemId={decodeURIComponent(itemId)} />
      </div>
    </main>
  );
}
