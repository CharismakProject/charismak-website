import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";
import { DEFAULT_PRICE_ITEMS } from "@/lib/pricing/defaults";
import { SUPPLIER_FORMS } from "@/lib/pricing/supplier-forms";
import { RATE_LOCATIONS } from "@/lib/rates/locations";
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
  /** True for an approved offer whose validity date has passed (shown as "last quoted", never as current). */
  expired?: boolean;
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
  /** Approved offers that have expired recently — history only. */
  pastOffers: MarketplaceOffer[];
  /** RATE_LOCATIONS id inferred from the free-text location, when recognisable. */
  stateId?: string;
  createdAt?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  isDemo?: boolean;
  /** Extra words used only for search (material keywords from the supplier's forms). */
  searchTerms?: string[];
  status: "pending" | "approved";
};

const productNameFor = (catalogueItemId: string) => {
  const marketName = JIJI_MARKET_SNAPSHOT[catalogueItemId]?.marketName;
  if (marketName) return marketName;
  return DEFAULT_PRICE_ITEMS.find((item) => item.id === catalogueItemId)?.description ?? catalogueItemId;
};

const mapOffers = (row: Record<string, unknown>, value: unknown, expired: boolean): MarketplaceOffer[] =>
  (Array.isArray(value) ? (value as Record<string, unknown>[]) : [])
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
        expired,
      };
    })
    .filter((offer) => offer.catalogueItemId && Number.isFinite(offer.price) && offer.price > 0);

const STATE_ALIASES: Record<string, string[]> = {
  fct: ["fct", "abuja", "garki", "wuse", "maitama", "asokoro", "gwarimpa", "kubwa", "lugbe", "kado", "jabi", "utako", "life camp", "die-die", "dei-dei", "nyanya", "bwari", "gwagwalada", "kuje"],
  lagos: ["lagos", "ikeja", "lekki", "ikoyi", "victoria island", "ajah", "surulere", "yaba"],
  rivers: ["rivers", "port harcourt", "port-harcourt"],
  "akwa-ibom": ["akwa ibom", "akwa-ibom", "uyo"],
  "cross-river": ["cross river", "cross-river", "calabar"],
  nassarawa: ["nasarawa", "nassarawa", "lafia", "keffi", "mararaba", "masaka"],
};

/** Best-effort match of free-text supplier location to a state id (first match wins). */
export function stateIdFromText(text: string): string | undefined {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z\s-]/g, " ")} `;
  for (const [id, words] of Object.entries(STATE_ALIASES)) {
    if (words.some((word) => haystack.includes(` ${word} `))) return id;
  }
  const hit = RATE_LOCATIONS.find((loc) => {
    const names = [loc.name.toLowerCase(), loc.capital.toLowerCase(), loc.id.replace(/-/g, " ")];
    return names.some((name) => haystack.includes(` ${name} `));
  });
  return hit?.id;
}

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

  const offers = mapOffers(row, row.offers, false);
  const pastOffers = mapOffers(row, row.expired_offers, true);

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
    pastOffers,
    stateId: stateIdFromText(`${location} ${serviceArea}`),
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
