import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type MarketPriceOverride = {
  itemId: string;
  marketName: string | null;
  unit: string;
  priceLow: number;
  priceHigh: number;
  referenceRate: number;
  location: string;
  specification: string | null;
  sourceLabel: string;
  sourceUrl: string | null;
  note: string | null;
  checkedAt: string;
  active: boolean;
  updatedAt: string;
};

type MarketPriceOverrideRow = {
  item_id: string;
  market_name: string | null;
  unit: string;
  price_low: number | string;
  price_high: number | string;
  reference_rate: number | string;
  location: string;
  specification: string | null;
  source_label: string;
  source_url: string | null;
  note: string | null;
  checked_at: string;
  active: boolean;
  updated_at: string;
};

const mapRow = (row: MarketPriceOverrideRow): MarketPriceOverride => ({
  itemId: row.item_id,
  marketName: row.market_name,
  unit: row.unit,
  priceLow: Number(row.price_low),
  priceHigh: Number(row.price_high),
  referenceRate: Number(row.reference_rate),
  location: row.location,
  specification: row.specification,
  sourceLabel: row.source_label,
  sourceUrl: row.source_url,
  note: row.note,
  checkedAt: row.checked_at,
  active: row.active,
  updatedAt: row.updated_at,
});

export async function loadMarketPriceOverrides(options?: { includeInactive?: boolean }) {
  const client = getSupabaseBrowserClient();
  if (!client) return {} as Record<string, MarketPriceOverride>;

  let query = client
    .from("market_price_overrides")
    .select("item_id, market_name, unit, price_low, price_high, reference_rate, location, specification, source_label, source_url, note, checked_at, active, updated_at");

  if (!options?.includeInactive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error || !data) return {} as Record<string, MarketPriceOverride>;

  return Object.fromEntries(
    (data as MarketPriceOverrideRow[]).map((row) => {
      const mapped = mapRow(row);
      return [mapped.itemId, mapped];
    }),
  );
}

export async function loadMarketPriceOverride(itemId: string) {
  const all = await loadMarketPriceOverrides();
  return all[itemId] ?? null;
}

export async function saveMarketPriceOverride(input: Omit<MarketPriceOverride, "updatedAt">) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase is not configured.");

  const { data, error } = await client
    .from("market_price_overrides")
    .upsert(
      {
        item_id: input.itemId,
        market_name: input.marketName,
        unit: input.unit,
        price_low: input.priceLow,
        price_high: input.priceHigh,
        reference_rate: input.referenceRate,
        location: input.location,
        specification: input.specification,
        source_label: input.sourceLabel,
        source_url: input.sourceUrl,
        note: input.note,
        checked_at: input.checkedAt,
        active: input.active,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "item_id" },
    )
    .select("item_id, market_name, unit, price_low, price_high, reference_rate, location, specification, source_label, source_url, note, checked_at, active, updated_at")
    .single();

  if (error || !data) throw new Error(error?.message || "Unable to save market price.");
  return mapRow(data as MarketPriceOverrideRow);
}

export type MarketPriceHistoryRow = MarketPriceOverride & {
  id: string;
  changedAt: string;
  changedBy: string | null;
};

export async function loadMarketPriceHistory(itemId: string) {
  const client = getSupabaseBrowserClient();
  if (!client) return [] as MarketPriceHistoryRow[];

  const { data, error } = await client
    .from("market_price_override_history")
    .select("id, item_id, market_name, unit, price_low, price_high, reference_rate, location, specification, source_label, source_url, note, checked_at, active, changed_at, changed_by")
    .eq("item_id", itemId)
    .order("changed_at", { ascending: false });

  if (error || !data) return [] as MarketPriceHistoryRow[];

  return data.map((row: any) => ({
    ...mapRow({
      ...row,
      updated_at: row.changed_at,
    } as MarketPriceOverrideRow),
    id: row.id,
    changedAt: row.changed_at,
    changedBy: row.changed_by,
  }));
}
