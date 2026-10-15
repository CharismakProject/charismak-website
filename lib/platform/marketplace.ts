import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";
import { DEFAULT_PRICE_ITEMS } from "@/lib/pricing/defaults";
import { SUPPLIER_FORMS } from "@/lib/pricing/supplier-forms";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type MarketplaceProfileType = "supplier" | "artisan";

export type MarketplaceOffer = {
  id: string;
  catalogueItemId: string;
  productName: string;
  specification?: string;
  brand?: string;
  price: number;
  quotedUnit: string;
  location?: string;
  serviceArea?: string;
  availability?: string;
  deliveryIncluded?: boolean | null;
  deliveryFee?: number | null;
  validFrom: string;
  validUntil: string;
};

export type MarketplaceProfile = {
  id: string;
  supplierCode?: string;
  contactPerson?: string;
  type: MarketplaceProfileType;
  businessName: string;
  category: string;
  categories: string[];
  location: string;
  serviceArea: string;
  phone: string;
  whatsapp?: string;
  email: string;
  description: string;
  products: string[];
  offers: MarketplaceOffer[];
  createdAt?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  isDemo?: boolean;
  /** Extra words used only for search (material keywords from the supplier's forms). */
  searchTerms?: string[];
  status: "pending" | "approved";
};

export type NewMarketplaceProfile = Pick<
  MarketplaceProfile,
  "type" | "businessName" | "category" | "location" | "serviceArea" | "phone" | "email" | "description"
>;

const LOCAL_KEY = "charismak-marketplace-profiles-v1";
export const MARKETPLACE_UPDATED_EVENT = "charismak:marketplace-updated";

const readLocal = (): MarketplaceProfile[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(value) ? (value as MarketplaceProfile[]) : [];
  } catch {
    return [];
  }
};

const toProfile = (row: Record<string, unknown>): MarketplaceProfile => ({
  id: String(row.id),
  type: row.profile_type === "artisan" ? "artisan" : "supplier",
  businessName: String(row.business_name ?? ""),
  category: String(row.category ?? ""),
  categories: row.category ? [String(row.category)] : [],
  location: String(row.location ?? ""),
  serviceArea: String(row.service_area ?? ""),
  phone: String(row.phone ?? ""),
  email: String(row.email ?? ""),
  description: String(row.description ?? ""),
  products: Array.isArray(row.products) ? row.products.map(String) : [],
  offers: [],
  rating: 0,
  reviewCount: 0,
  verified: Boolean(row.verified),
  status: row.status === "approved" ? "approved" : "pending",
});

const productNameFor = (catalogueItemId: string) => {
  const marketName = JIJI_MARKET_SNAPSHOT[catalogueItemId]?.marketName;
  if (marketName) return marketName;
  return DEFAULT_PRICE_ITEMS.find((item) => item.id === catalogueItemId)?.description ?? catalogueItemId;
};

const toSupplierDirectoryProfile = (row: Record<string, unknown>): MarketplaceProfile => {
  const categoryIds = Array.isArray(row.categories) ? row.categories.map(String) : [];
  const definitions = categoryIds
    .map((id) => SUPPLIER_FORMS.find((form) => form.id === id))
    .filter((form): form is (typeof SUPPLIER_FORMS)[number] => Boolean(form));
  const artisan = definitions.length > 0 && definitions.every((form) => form.group === "Labour & specialists");
  const categoryNames = definitions.map((form) => form.shortTitle);
  const type: MarketplaceProfileType = artisan ? "artisan" : "supplier";
  const location = String(row.location ?? "Nigeria");
  const serviceArea = String(row.delivery_areas ?? "").trim() || location;

  const rawOffers = Array.isArray(row.offers) ? (row.offers as Record<string, unknown>[]) : [];
  const offers: MarketplaceOffer[] = rawOffers
    .map((offer) => {
      const catalogueItemId = String(offer.catalogue_item_id ?? "");
      return {
        id: String(offer.id ?? `${row.id}-${catalogueItemId}`),
        catalogueItemId,
        productName: String(offer.product_name ?? "").trim() || productNameFor(catalogueItemId),
        specification: String(offer.specification ?? "").trim() || undefined,
        brand: String(offer.brand ?? "").trim() || undefined,
        price: Number(offer.unit_price ?? 0),
        quotedUnit: String(offer.quoted_unit ?? "unit"),
        location: String(offer.location ?? "").trim() || undefined,
        serviceArea: String(offer.service_area ?? "").trim() || undefined,
        availability: String(offer.availability ?? "").trim() || undefined,
        deliveryIncluded: offer.delivery_included == null ? null : Boolean(offer.delivery_included),
        deliveryFee: offer.delivery_fee == null ? null : Number(offer.delivery_fee),
        validFrom: String(offer.published_at ?? offer.submitted_at ?? offer.created_at ?? ""),
        validUntil: String(offer.valid_until ?? ""),
      };
    })
    .filter((offer) => offer.catalogueItemId && Number.isFinite(offer.price));

  const productNames = Array.from(new Set(offers.map((offer) => offer.productName)));

  return {
    id: String(row.id),
    supplierCode: String(row.supplier_code ?? ""),
    contactPerson: String(row.contact_person ?? ""),
    type,
    businessName: String(row.business_name ?? "Supplier"),
    category: categoryNames.length
      ? categoryNames.slice(0, 2).join(" · ")
      : artisan
        ? "Construction services"
        : "Construction supplier",
    categories: categoryNames,
    searchTerms: definitions.flatMap((form) => [form.title, ...form.keywords]),
    location,
    serviceArea,
    phone: String(row.phone ?? row.whatsapp ?? ""),
    whatsapp: String(row.whatsapp ?? row.phone ?? ""),
    email: String(row.email ?? ""),
    description: "",
    products: productNames,
    offers,
    createdAt: String(row.created_at ?? ""),
    rating: 0,
    reviewCount: 0,
    verified: false,
    status: "approved",
  };
};

export type MarketplaceDirectoryResult =
  | { status: "ok"; profiles: MarketplaceProfile[] }
  | { status: "error"; profiles: []; message: string };

/**
 * Loads the live supplier & artisan directory. Never substitutes sample or
 * example profiles: a failure is reported as an error so the page can say so.
 */
export async function loadMarketplaceDirectory(): Promise<MarketplaceDirectoryResult> {
  const client = getSupabaseBrowserClient();
  if (!client) return { status: "error", profiles: [], message: "The supplier directory is not configured on this deployment." };
  try {
    const { data, error } = await client.functions.invoke("public-supplier-directory", { body: {} });
    if (error || !Array.isArray(data?.profiles)) {
      return { status: "error", profiles: [], message: "The supplier directory could not be loaded right now." };
    }
    return { status: "ok", profiles: (data.profiles as Record<string, unknown>[]).map(toSupplierDirectoryProfile) };
  } catch {
    return { status: "error", profiles: [], message: "The supplier directory could not be loaded right now." };
  }
}

/** Live profiles only (empty when unavailable). */
export async function loadMarketplaceProfiles(): Promise<MarketplaceProfile[]> {
  return (await loadMarketplaceDirectory()).profiles;
}

export async function submitMarketplaceProfile(
  input: NewMarketplaceProfile,
): Promise<{ profile: MarketplaceProfile; published: boolean }> {
  const base: MarketplaceProfile = {
    ...input,
    id: `local-market-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    categories: input.category ? [input.category] : [],
    products: [],
    offers: [],
    rating: 0,
    reviewCount: 0,
    verified: false,
    status: "pending",
  };

  const client = getSupabaseBrowserClient();
  if (client) {
    const { data, error } = await client
      .from("marketplace_profiles")
      .insert({
        profile_type: input.type,
        business_name: input.businessName,
        category: input.category,
        location: input.location,
        service_area: input.serviceArea,
        phone: input.phone,
        email: input.email,
        description: input.description,
        products: [],
        status: "pending",
      })
      .select("*")
      .single();

    if (!error && data) return { profile: toProfile(data as Record<string, unknown>), published: true };
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([base, ...readLocal()]));
    window.dispatchEvent(new CustomEvent(MARKETPLACE_UPDATED_EVENT));
  }

  return { profile: base, published: false };
}
