import MaterialSupplierDetail from "@/components/pricing/material-supplier-detail";

export const metadata = {
  title: "Material Suppliers & Prices",
  description:
    "Compare approved supplier submissions for a specific Nigerian construction material or equipment item.",
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
        <MaterialSupplierDetail itemId={decodeURIComponent(itemId)} />
      </div>
    </main>
  );
}
