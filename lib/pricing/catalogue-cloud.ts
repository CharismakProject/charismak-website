import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { PriceItem, PriceCategory, PriceMarketMode } from "./models";
import { loadPriceItems, savePriceItems } from "./store";
import { JIJI_MARKET_SNAPSHOT } from "./jiji-market-snapshot";

export type CatalogueRecord = PriceItem & {
  isCustom: boolean;
  archivedAt?: string | null;
  updatedBy?: string | null;
};

type CatalogueRow = {
  item_id: string;
  code: string;
  description: string;
  category: PriceCategory;
  unit: string;
  rate: number | string | null;
  default_rate: number | string | null;
  currency: string;
  country_code: string;
  region: string | null;
  location: string;
  source: string;
  source_url: string | null;
  confidence: PriceItem["confidence"] | null;
  active: boolean;
  image_url: string | null;
  image_alt: string | null;
  brand: string | null;
  specification: string | null;
  price_low: number | string | null;
  price_high: number | string | null;
  source_count: number | null;
  delivery_included: boolean | null;
  market_unit: string | null;
  market_unit_options: string[] | null;
  market_mode: PriceMarketMode | null;
  market_note: string | null;
  is_custom: boolean;
  archived_at: string | null;
  updated_at: string;
  updated_by: string | null;
};

const asNumber = (value: number | string | null | undefined) =>
  value === null || value === undefined || value === "" ? null : Number(value);

const mapRow = (row: CatalogueRow): CatalogueRecord => ({
  id: row.item_id,
  code: row.code,
  description: row.description,
  category: row.category,
  unit: row.unit,
  rate: asNumber(row.rate),
  defaultRate: asNumber(row.default_rate),
  currency: row.currency,
  countryCode: row.country_code,
  region: row.region ?? undefined,
  location: row.location,
  source: row.source,
  sourceUrl: row.source_url,
  confidence: row.confidence ?? "manual",
  updatedAt: row.updated_at,
  active: row.active,
  imageUrl: row.image_url,
  imageAlt: row.image_alt,
  brand: row.brand,
  specification: row.specification,
  priceLow: asNumber(row.price_low),
  priceHigh: asNumber(row.price_high),
  sourceCount: row.source_count,
  deliveryIncluded: row.delivery_included,
  marketUnit: row.market_unit,
  marketUnitOptions: Array.isArray(row.market_unit_options) ? row.market_unit_options : [],
  marketMode: row.market_mode ?? undefined,
  marketNote: row.market_note,
  isCustom: row.is_custom,
  archivedAt: row.archived_at,
  updatedBy: row.updated_by,
});

const toRow = (item: PriceItem, isCustom: boolean, updatedBy?: string | null) => ({
  item_id: item.id,
  code: item.code.trim(),
  description: item.description.trim(),
  category: item.category,
  unit: item.unit.trim() || "item",
  rate: item.rate,
  default_rate: item.defaultRate ?? item.rate,
  currency: item.currency || "NGN",
  country_code: item.countryCode || "NG",
  region: item.region || null,
  location: item.location.trim() || "Abuja",
  source: item.source.trim() || "Charismak catalogue",
  source_url: item.sourceUrl || null,
  confidence: item.confidence || "manual",
  active: item.active,
  image_url: item.imageUrl || null,
  image_alt: item.imageAlt || null,
  brand: item.brand || null,
  specification: item.specification || null,
  price_low: item.priceLow ?? null,
  price_high: item.priceHigh ?? null,
  source_count: item.sourceCount ?? null,
  delivery_included: item.deliveryIncluded ?? null,
  market_unit: item.marketUnit || null,
  market_unit_options: item.marketUnitOptions ?? [],
  market_mode: item.marketMode || null,
  market_note: item.marketNote || null,
  is_custom: isCustom,
  archived_at: item.active ? null : new Date().toISOString(),
  updated_at: new Date().toISOString(),
  updated_by: updatedBy || null,
});

export async function loadCatalogueRecords(): Promise<CatalogueRecord[]> {
  const client = getSupabaseBrowserClient();
  if (!client) return [];
  const { data, error } = await client
    .from("price_catalogue_items")
    .select("item_id,code,description,category,unit,rate,default_rate,currency,country_code,region,location,source,source_url,confidence,active,image_url,image_alt,brand,specification,price_low,price_high,source_count,delivery_included,market_unit,market_unit_options,market_mode,market_note,is_custom,archived_at,updated_at,updated_by")
    .order("description", { ascending: true });
  if (error || !data) return [];
  return (data as CatalogueRow[]).map(mapRow);
}

export function mergeCatalogueRecords(baseItems: PriceItem[], cloudRecords: CatalogueRecord[]) {
  const byId = new Map(baseItems.map((item) => [item.id, { ...item }]));
  cloudRecords.forEach((record) => {
    const previous = byId.get(record.id);
    byId.set(record.id, { ...previous, ...record });
  });
  return Array.from(byId.values());
}

function applyPublicDisplayMetadata(records: CatalogueRecord[]) {
  records.forEach((record) => {
    const market = JIJI_MARKET_SNAPSHOT[record.id];
    if (!market) return;
    JIJI_MARKET_SNAPSHOT[record.id] = {
      ...market,
      marketName: record.description || market.marketName,
      specification: record.specification || market.specification,
      location: record.location || market.location,
      unit: record.marketUnit || market.unit,
    };
  });
}

export async function syncCatalogueFromCloud() {
  const records = await loadCatalogueRecords();
  if (!records.length) return loadPriceItems();
  applyPublicDisplayMetadata(records);
  const merged = mergeCatalogueRecords(loadPriceItems(), records);
  savePriceItems(merged);
  return merged;
}

export async function saveCatalogueRecord(item: PriceItem, isCustom: boolean) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data: sessionData } = await client.auth.getSession();
  const updatedBy = sessionData.session?.user.email || null;
  const { data, error } = await client
    .from("price_catalogue_items")
    .upsert(toRow(item, isCustom, updatedBy), { onConflict: "item_id" })
    .select("item_id,code,description,category,unit,rate,default_rate,currency,country_code,region,location,source,source_url,confidence,active,image_url,image_alt,brand,specification,price_low,price_high,source_count,delivery_included,market_unit,market_unit_options,market_mode,market_note,is_custom,archived_at,updated_at,updated_by")
    .single();
  if (error || !data) throw new Error(error?.message || "Unable to save catalogue item.");
  await syncCatalogueFromCloud();
  return mapRow(data as CatalogueRow);
}

export async function uploadCatalogueImage(itemId: string, file: File, folder = "catalogue") {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supabase is not configured.");
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be 5 MB or smaller.");

  const safeExt = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const safeId = itemId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const path = `${folder}/${safeId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;
  const { error } = await client.storage.from("catalogue-media").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = client.storage.from("catalogue-media").getPublicUrl(path);
  return data.publicUrl;
}

export function createCustomCatalogueItem(): PriceItem {
  const now = new Date().toISOString();
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : `${Date.now()}`;
  return {
    id: `custom-${suffix}`,
    code: `NEW-${suffix.toUpperCase()}`,
    description: "New catalogue item",
    category: "material",
    unit: "item",
    rate: null,
    defaultRate: null,
    currency: "NGN",
    countryCode: "NG",
    region: "FCT",
    location: "Abuja (FCT)",
    source: "Charismak catalogue",
    sourceUrl: null,
    confidence: "manual",
    updatedAt: now,
    active: true,
    imageUrl: null,
    imageAlt: null,
    brand: null,
    specification: null,
    marketUnit: "item",
    marketUnitOptions: [],
    marketMode: "buy",
    marketNote: null,
  };
}
