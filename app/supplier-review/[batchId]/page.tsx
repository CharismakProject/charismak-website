import SupplierReviewCatalogueGate from "@/components/pricing/supplier-review-catalogue-gate";

export const metadata = {
  title: "Supplier Price Review | Charismak Project",
  description: "Private Charismak supplier price review workspace.",
  robots: { index: false, follow: false, nocache: true },
};

export default async function SupplierReviewPage({
  params,
}: {
  params: Promise<{ batchId: string }>;
}) {
  const { batchId } = await params;
  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <SupplierReviewCatalogueGate batchId={batchId} />
      </div>
    </main>
  );
}
