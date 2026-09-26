import MaterialPriceDetailRuntime from "@/components/pricing/material-price-detail-runtime";
import JsonLd from "@/components/seo/json-ld";
import { DEFAULT_PRICE_ITEMS } from "@/lib/pricing/defaults";
import { breadcrumbJsonLd, createSeoMetadata } from "@/lib/seo";
import { MarketplaceSafetyNotice, MarketplaceTransactionGuard } from "@/components/marketplace/transaction-safety";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const decoded = decodeURIComponent(itemId);
  const item = DEFAULT_PRICE_ITEMS.find((candidate) => candidate.id === decoded);
  const path = "/prices/" + encodeURIComponent(decoded);

  if (!item) {
    return createSeoMetadata({
      title: "Construction Material Price & Suppliers",
      description:
        "Compare construction material prices, supplier references, locations and delivery options in Nigeria.",
      path,
    });
  }

  return createSeoMetadata({
    title: item.description + " Price in " + item.location,
    description:
      "Check the current Charismak market reference for " +
      item.description +
      " in " +
      item.location +
      ", Nigeria, with practical buying units and supplier comparison where available.",
    path,
    keywords: [
      item.description + " price Nigeria",
      item.description + " price " + item.location,
      "building material prices Nigeria",
    ],
  });
}

export default async function MaterialSupplierPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const decodedItemId = decodeURIComponent(itemId);
  const item = DEFAULT_PRICE_ITEMS.find((candidate) => candidate.id === decodedItemId);

  return (
    <main className="min-h-screen bg-[#F5F7FA] pt-20">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Building Material Prices", path: "/prices" },
          {
            name: item?.description || "Material price",
            path: "/prices/" + encodeURIComponent(decodedItemId),
          },
        ])}
      />
      <MarketplaceTransactionGuard />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <div className="mb-6">
          <MarketplaceSafetyNotice compact />
        </div>
        <MaterialPriceDetailRuntime itemId={decodedItemId} />
      </div>
    </main>
  );
}
