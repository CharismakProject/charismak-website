import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type SupplierProfile = {
  id: string;
  supplierCode: string;
  businessName: string;
  contactPerson: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  location: string;
  deliveryAreas: string | null;
  categories: string[];
  accessToken: string;
  status: "active" | "inactive" | "blocked";
  createdAt: string;
  updatedAt: string;
};

type ProfileInput = {
  businessName: string;
  contactPerson?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  location: string;
  deliveryAreas?: string;
  categories?: string[];
};

const toProfile = (row: Record<string, unknown>): SupplierProfile => ({
  id: String(row.id ?? ""),
  supplierCode: String(row.supplier_code ?? ""),
  businessName: String(row.business_name ?? ""),
  contactPerson: row.contact_person ? String(row.contact_person) : null,
  phone: String(row.phone ?? ""),
  whatsapp: row.whatsapp ? String(row.whatsapp) : null,
  email: row.email ? String(row.email) : null,
  location: String(row.location ?? "Nigeria"),
  deliveryAreas: row.delivery_areas ? String(row.delivery_areas) : null,
  categories: Array.isArray(row.categories) ? row.categories.map(String) : [],
  accessToken: String(row.access_token ?? ""),
  status: String(row.status ?? "active") as SupplierProfile["status"],
  createdAt: String(row.created_at ?? ""),
  updatedAt: String(row.updated_at ?? ""),
});

async function invoke(body: Record<string, unknown>) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supplier profile service is unavailable.");
  const { data, error } = await client.functions.invoke("supplier-workflow", { body });
  if (error) throw new Error(error.message || "Supplier profile request failed.");
  if (data?.error) throw new Error(String(data.error));
  return data as { profile?: Record<string, unknown>; recovered?: boolean };
}

export async function createSupplierProfile(input: ProfileInput) {
  const data = await invoke({ action: "create_profile", ...input });
  if (!data.profile) throw new Error("Supplier profile was not returned.");
  return { profile: toProfile(data.profile), recovered: Boolean(data.recovered) };
}

export async function getSupplierProfile(accessToken: string) {
  const data = await invoke({ action: "get_profile", accessToken });
  if (!data.profile) throw new Error("Supplier profile was not returned.");
  return toProfile(data.profile);
}

export async function recoverSupplierProfile(businessName: string, phone: string) {
  const data = await invoke({ action: "recover_profile", businessName, phone });
  if (!data.profile) throw new Error("Supplier profile was not returned.");
  return toProfile(data.profile);
}

export async function updateSupplierProfile(
  accessToken: string,
  patch: Partial<ProfileInput>,
) {
  const data = await invoke({ action: "update_profile", accessToken, ...patch });
  if (!data.profile) throw new Error("Supplier profile was not returned.");
  return toProfile(data.profile);
}
