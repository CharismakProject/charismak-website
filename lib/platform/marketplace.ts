import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type MarketplaceProfileType = "supplier" | "artisan";
export type MarketplaceProfile = {
  id: string;
  type: MarketplaceProfileType;
  businessName: string;
  category: string;
  location: string;
  serviceArea: string;
  phone: string;
  email: string;
  description: string;
  products: string[];
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
  { id: "seed-supplier-abuja-1", type: "supplier", businessName: "Example Aggregate Supplier", category: "Cement, blocks & aggregates", location: "Abuja", serviceArea: "FCT", phone: "", email: "", description: "Sample listing showing how building-material suppliers can quote scheduled site delivery in practical purchase units.", products: ["Cement · bag", "Sharp sand · 10 m³ truck", "Granite · 30-tonne truck", "Blocks · 9-inch piece"], rating: 0, reviewCount: 0, verified: false, isDemo: true, status: "approved" },
  { id: "seed-supplier-lagos-1", type: "supplier", businessName: "Example Steel & Mesh Supplier", category: "Reinforcement & BRC mesh", location: "Lagos", serviceArea: "Lagos State", phone: "", email: "", description: "Sample reinforcement listing showing bars by 12 m length and BRC fabric by sheet, type and sheet size.", products: ["Y12 rebar · 12 m length", "Y16 rebar · 12 m length", "A142 BRC · 2.4 × 4.8 m sheet", "Binding wire · 25 kg roll"], rating: 0, reviewCount: 0, verified: false, isDemo: true, status: "approved" },
  { id: "seed-artisan-abuja-1", type: "artisan", businessName: "Example Formwork Team", category: "Carpentry & formwork", location: "Abuja", serviceArea: "FCT", phone: "", email: "", description: "Sample artisan listing for foundations, columns, beams, slabs and concrete staircases.", products: ["Slab formwork · m² labour", "Column formwork · m² labour", "Carpentry crew · day"], rating: 0, reviewCount: 0, verified: false, isDemo: true, status: "approved" },
  { id: "seed-artisan-ph-1", type: "artisan", businessName: "Example Plumbing Team", category: "Plumbing & mechanical", location: "Port Harcourt", serviceArea: "Port Harcourt metropolitan area", phone: "", email: "", description: "Sample artisan listing for domestic water, drainage and sanitary fitting installation.", products: ["First-fix plumbing · point", "Sanitary fitting · item", "Call-out inspection · visit"], rating: 0, reviewCount: 0, verified: false, isDemo: true, status: "approved" },
];

const readLocal = (): MarketplaceProfile[] => {
  if (typeof localStorage === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
    return Array.isArray(value) ? value as MarketplaceProfile[] : [];
  } catch {
    return [];
  }
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
  location: String(row.location ?? ""),
  serviceArea: String(row.service_area ?? ""),
  phone: String(row.phone ?? ""),
  email: String(row.email ?? ""),
  description: String(row.description ?? ""),
  products: Array.isArray(row.products) ? row.products.map(String) : [],
  rating: Number(row.rating ?? 0),
  reviewCount: Number(row.review_count ?? 0),
  verified: Boolean(row.verified),
  status: row.status === "approved" ? "approved" : "pending",
});

export async function loadMarketplaceProfiles(): Promise<MarketplaceProfile[]> {
  const local = readLocal();
  const localReviews = readLocalReviews();
  const client = getSupabaseBrowserClient();
  if (!client) return withReviews([...local, ...starterMarketplaceProfiles], localReviews);
  const { data, error } = await client.from("marketplace_profiles").select("*").eq("status", "approved").order("business_name");
  if (error || !data) return withReviews([...local, ...starterMarketplaceProfiles], localReviews);
  const remote = (data as Record<string, unknown>[]).map(toProfile);
  const { data: reviewRows } = await client.from("marketplace_reviews").select("id,profile_id,author_name,rating,comment,created_at");
  const remoteReviews: MarketplaceReview[] = (reviewRows as Record<string, unknown>[] | null)?.map((row) => ({ id: String(row.id), profileId: String(row.profile_id), authorName: String(row.author_name), rating: Number(row.rating), comment: String(row.comment), createdAt: String(row.created_at) })) ?? [];
  const ids = new Set(remote.map((profile) => profile.id));
  return withReviews([...local.filter((profile) => !ids.has(profile.id)), ...remote, ...starterMarketplaceProfiles.filter((profile) => !ids.has(profile.id))], [...localReviews, ...remoteReviews]);
}

export async function submitMarketplaceProfile(input: NewMarketplaceProfile): Promise<{ profile: MarketplaceProfile; published: boolean }> {
  const base: MarketplaceProfile = { ...input, id: `local-market-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, products: [], rating: 0, reviewCount: 0, verified: false, status: "pending" };
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
