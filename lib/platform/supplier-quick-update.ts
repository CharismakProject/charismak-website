import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type SupplierOwnPriceItem = {
  catalogueItemId: string | null;
  catalogueCode: string | null;
  productName: string;
  specification: string | null;
  brand: string | null;
  quotedUnit: string;
  currentPrice: number | null;
  location: string | null;
  source: "listed" | "approved" | "previous";
  updatedAt: string | null;
};

export type SupplierSinglePriceInput = {
  accessToken: string;
  catalogueItemId?: string | null;
  catalogueCode?: string | null;
  productName: string;
  specification?: string;
  brand?: string;
  quotedUnit: string;
  unitPrice: number;
  previousPrice?: number | null;
  location?: string;
  remarks?: string;
};

async function invokeQuickUpdate(body: Record<string, unknown>) {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Supplier price service is unavailable.");
  const { data, error } = await client.functions.invoke("supplier-quick-update", { body });
  if (error) throw new Error(error.message || "Supplier price request failed.");
  if (data?.error) throw new Error(String(data.error));
  return data as Record<string, unknown>;
}

export async function getSupplierOwnPriceItems(accessToken: string) {
  const data = await invokeQuickUpdate({ action: "list_items", accessToken });
  return Array.isArray(data.items) ? (data.items as SupplierOwnPriceItem[]) : [];
}

export async function submitSupplierSinglePrice(input: SupplierSinglePriceInput) {
  const response = await fetch("/api/supplier-price-update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok || data?.error) {
    throw new Error(String(data?.error || "Unable to submit price update."));
  }
  return data as {
    batchId: string;
    reviewUrl: string;
    productName: string;
    unitPrice: number;
    quotedUnit: string;
  };
}
