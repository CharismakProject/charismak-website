import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type SupplierReviewOffer = {
  id: string;
  product_name: string;
  specification: string | null;
  brand: string | null;
  quoted_unit: string;
  unit_price: number;
  location: string;
  status: string;
  valid_until: string | null;
  updated_at: string;
};

export type SupplierPriceReviewRequest = {
  id: string;
  offer_id: string;
  requested_by: "admin" | "supplier";
  reason: string | null;
  status: "awaiting_supplier" | "awaiting_code" | "admin_authorized" | "supplier_updating" | "completed" | "cancelled" | "expired";
  authorization_channel: "whatsapp" | "email" | null;
  otp_expires_at: string | null;
  verified_at: string | null;
  authorization_expires_at: string | null;
  created_at: string;
  updated_at: string;
  offer: SupplierReviewOffer | null;
};

async function invokeList(accessToken: string) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supplier review service is unavailable.");
  const { data, error } = await client.functions.invoke("supplier-review-authorisation", {
    body: { action: "list", accessToken },
  });
  if (error) throw new Error(error.message || "Supplier review requests could not be loaded.");
  if (data?.error) throw new Error(String(data.error));
  return data as { offers?: SupplierReviewOffer[]; requests?: SupplierPriceReviewRequest[] };
}

export async function getSupplierReviewWorkspace(accessToken: string) {
  const data = await invokeList(accessToken);
  return {
    offers: Array.isArray(data.offers) ? data.offers : [],
    requests: Array.isArray(data.requests) ? data.requests : [],
  };
}

async function post(body: Record<string, unknown>) {
  const response = await fetch("/api/supplier-price-authorisation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || data?.error) throw new Error(String(data?.error || "Authorization request failed."));
  return data as Record<string, unknown>;
}

export async function startSupplierAdminAuthorization(input: {
  accessToken: string;
  offerId: string;
  channel: "whatsapp" | "email";
  reason?: string;
}) {
  return post({ action: "start", ...input });
}

export async function verifySupplierAdminAuthorization(input: {
  accessToken: string;
  requestId: string;
  code: string;
}) {
  return post({ action: "verify", ...input });
}

export async function markSupplierUpdating(accessToken: string, requestId: string) {
  return post({ action: "mark_supplier_updating", accessToken, requestId });
}
