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
  status: "pending" | "approved";
};

export type NewMarketplaceProfile = Pick<MarketplaceProfile, "type" | "businessName" | "category" | "location" | "serviceArea" | "phone" | "email" | "description">;
export type MarketplaceReview = { id: string; profileId: string; authorName: string; rating: number; comment: string; createdAt: string };

const LOCAL_KEY = "charismak-marketplace-profiles-v1";
const LOCAL_REVIEW_KEY = "charismak-marketplace-reviews-v1";
export const MARKETPLACE_UPDATED_EVENT = "charismak:marketplace-updated";

export const starterMarketplaceProfiles: MarketplaceProfile[] = [
  { id: "seed-supplier-abuja-1", type: "supplier", businessName: "Example Aggregate Supplier", category: "Cement, blocks & aggregates", categories: ["Cement, blocks & aggregates"], location: "Abuja", serviceArea: "FCT", phone: "", email: "", description: "", products: ["Cement · bag", "Sharp sand · 10 m³ truck", "Granite · 30-tonne truck", "Blocks · 9-inch piece"], offers: [], rating: 0, reviewCount: 0, verified: false, isDemo: true, status: "approved" },
  { id: "seed-supplier-lagos-1", type: "supplier", businessName: "Example Steel & Mesh Supplier", category: "Reinforcement & BRC mesh", categories: ["Reinforcement & BRC mesh"], location: "Lagos", serviceArea: "Lagos State", phone: "", email: "", description: "", products: ["Y12 rebar · 12 m length", "Y16 rebar · 12 m length", "A142 BRC · 2.4 × 4.8 m sheet", "Binding wire · 25 kg roll"], offers: [], rating: 0, reviewCount: 0, verified: false, isDemo: true, status: "approved" },
  { id: "seed-artisan-abuja-1", type: "artisan", businessName: "Example Formwork Team", category: "Carpentry & formwork", categories: ["Carpentry & formwork"], location: "Abuja", serviceArea: "FCT", phone: "", email: "", description: "", products: ["Slab formwork · m² labour", "Column formwork · m² labour", "Carpentry crew · day"], offers: [], rating: 0, reviewCount: 0, verified: false, isDemo: true, status: "approved" },
  { id: "seed-artisan-ph-1", type: "artisan", businessName: "Example Plumbing Team", category: "Plumbing & mechanical", categories: ["Plumbing & mechanical"], location: "Port Harcourt", serviceArea: "Port Harcourt metropolitan area", phone: "", email: "", description: "", products: ["First-fix plumbing · point", "Sanitary fitting · item", "Call-out inspection · visit"], offers: [], rating: 0, reviewCount: 0, verified: false, isDemo: true, status: "approved" },
];

const readLocal = (): MarketplaceProfile[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(value) ? value as MarketplaceProfile[] : [];
  } catch { return []; }
};

const readLocalReviews = (): MarketplaceReview[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_REVIEW_KEY) ?? "[]");
    return Array.isArray(value) ? value as MarketplaceReview[] : [];
  } catch { return []; }
};

const withReviews = (profiles: MarketplaceProfile[], reviews: MarketplaceReview[]) => profiles.map((profile) => {
  const matches = reviews.filter((review) => review.profileId === profile.id);
  if (!matches.length) return profile;
  return { ...profile, rating: matches.reduce((sum, review) => sum + review.rating, 0) / matches.length, reviewCount: matches.length };
});

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
  rating: Number(row.rating ?? 0),
  reviewCount: Number(row.review_count ?? 0),
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
  const definitions = categoryIds.map((id) => SUPPLIER_FORMS.find((form) => form.id === id)).filter((form): form is (typeof SUPPLIER_FORMS)[number] => Boolean(form));
  const artisan = definitions.length > 0 && definitions.every((form) => form.group === "Labour & specialists");
  const categoryNames = definitions.map((form) => form.shortTitle);
  const type: MarketplaceProfileType = artisan ? "artisan" : "supplier";
  const location = String(row.location ?? "Nigeria");
  const serviceArea = String(row.delivery_areas ?? "").trim() || location;

  const rawOffers = Array.isArray(row.offers) ? row.offers as Record<string, unknown>[] : [];
  const offers: MarketplaceOffer[] = rawOffers.map((offer) => {
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
  }).filter((offer) => offer.catalogueItemId && Number.isFinite(offer.price));

  const productNames = Array.from(new Set(offers.map((offer) => offer.productName)));

  return {
    id: String(row.id),
    supplierCode: String(row.supplier_code ?? ""),
    contactPerson: String(row.contact_person ?? ""),
    type,
    businessName: String(row.business_name ?? "Supplier"),
    category: categoryNames.length ? categoryNames.slice(0, 2).join(" · ") : artisan ? "Construction services" : "Construction supplier",
    categories: categoryNames,
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

export async function loadMarketplaceProfiles(): Promise<MarketplaceProfile[]> {
  const localReviews = readLocalReviews();
  const client = getSupabaseBrowserClient();
  if (!client) return withReviews(starterMarketplaceProfiles, localReviews);
  const { data, error } = await client.functions.invoke("public-supplier-directory", { body: {} });
  if (error || !Array.isArray(data?.profiles)) return withReviews(starterMarketplaceProfiles, localReviews);
  const remote = (data.profiles as Record<string, unknown>[]).map(toSupplierDirectoryProfile);
  return withReviews(remote.length ? remote : starterMarketplaceProfiles, localReviews);
}

export async function submitMarketplaceProfile(input: NewMarketplaceProfile): Promise<{ profile: MarketplaceProfile; published: boolean }> {
  const base: MarketplaceProfile = { ...input, id: `local-market-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, categories: input.category ? [input.category] : [], products: [], offers: [], rating: 0, reviewCount: 0, verified: false, status: "pending" };
  const client = getSupabaseBrowserClient();
  if (client) {
    const { data, error } = await client.from("marketplace_profiles").insert({ profile_type: input.type, business_name: input.businessName, category: input.category, location: input.location, service_area: input.serviceArea, phone: input.phone, email: input.email, description: input.description, products: [], status: "pending" }).select("*").single();
    if (!error && data) return { profile: toProfile(data as Record<string, unknown>), published: true };
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LOCAL_KEY, JSON.stringify([base, ...readLocal()]));
    window.dispatchEvent(new CustomEvent(MARKETPLACE_UPDATED_EVENT));
  }
  return { profile: base, published: false };
}

export async function submitMarketplaceReview(profileId: string, authorName: string, rating: number, comment: string): Promise<{ submitted: boolean }> {
  const review: MarketplaceReview = { id: `local-review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, profileId, authorName, rating, comment, createdAt: new Date().toISOString() };
  const client = getSupabaseBrowserClient();
  if (client) {
    const { error } = await client.from("marketplace_reviews").insert({ profile_id: profileId, author_name: authorName, rating, comment });
    if (!error) return { submitted: true };
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(LOCAL_REVIEW_KEY, JSON.stringify([review, ...readLocalReviews()]));
    window.dispatchEvent(new CustomEvent(MARKETPLACE_UPDATED_EVENT));
  }
  return { submitted: false };
}
