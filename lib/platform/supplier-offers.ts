import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type SupplierMarketplaceOffer = {
  id: string;
  sourceSubmissionId: string | null;
  supplierId: string | null;
  supplierName: string;
  catalogueItemId: string;
  productName: string;
  specification: string | null;
  brand: string | null;
  quotedUnit: string;
  unitPrice: number;
  bulkPrice: number | null;
  minimumQty: number | null;
  deliveryFee: number | null;
  deliveryIncluded: boolean | null;
  location: string;
  serviceArea: string | null;
  availability: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  validUntil: string | null;
  supplierRemarks: string | null;
  submittedAt: string | null;
  publishedAt: string | null;
};

const toOffer = (row: Record<string, unknown>): SupplierMarketplaceOffer => ({
  id: String(row.id),
  sourceSubmissionId: row.source_submission_id ? String(row.source_submission_id) : null,
  supplierId: row.supplier_id ? String(row.supplier_id) : null,
  supplierName: String(row.supplier_name ?? "Supplier"),
  catalogueItemId: String(row.catalogue_item_id ?? ""),
  productName: String(row.product_name ?? ""),
  specification: row.specification ? String(row.specification) : null,
  brand: row.brand ? String(row.brand) : null,
  quotedUnit: String(row.quoted_unit ?? "item"),
  unitPrice: Number(row.unit_price ?? 0),
  bulkPrice: row.bulk_price == null ? null : Number(row.bulk_price),
  minimumQty: row.minimum_qty == null ? null : Number(row.minimum_qty),
  deliveryFee: row.delivery_fee == null ? null : Number(row.delivery_fee),
  deliveryIncluded: row.delivery_included == null ? null : Boolean(row.delivery_included),
  location: String(row.location ?? "Nigeria"),
  serviceArea: row.service_area ? String(row.service_area) : null,
  availability: row.availability ? String(row.availability) : null,
  phone: row.phone ? String(row.phone) : null,
  whatsapp: row.whatsapp ? String(row.whatsapp) : null,
  email: row.email ? String(row.email) : null,
  validUntil: row.valid_until ? String(row.valid_until) : null,
  supplierRemarks: row.supplier_remarks ? String(row.supplier_remarks) : null,
  submittedAt: row.submitted_at ? String(row.submitted_at) : null,
  publishedAt: row.published_at ? String(row.published_at) : null,
});

export async function loadSupplierOffersForItem(
  catalogueItemId: string,
): Promise<SupplierMarketplaceOffer[]> {
  const client = getSupabaseBrowserClient();
  if (!client || !catalogueItemId) return [];

  const { data, error } = await client
    .from("supplier_marketplace_offers")
    .select("*")
    .eq("catalogue_item_id", catalogueItemId)
    .eq("status", "approved")
    .order("unit_price", { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(toOffer);
}
