import { getConstructionMarket } from "@/lib/pricing/markets";

export async function GET(request: Request) {
  const countryCode = new URL(request.url).searchParams.get("country") ?? "NG";
  const market = getConstructionMarket(countryCode);
  return Response.json({
    checkedAt: new Date().toISOString(),
    market,
    status: market.exactSupplierFeed ? "exact-feed-available" : "official-index-available",
    message: market.exactSupplierFeed
      ? "A verified item-price feed is available."
      : "Official index source registered. Exact supplier prices still require a verified feed, quotation or approved import.",
  });
}
