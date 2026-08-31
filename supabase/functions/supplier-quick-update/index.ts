/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.2";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});
const clean = (value: unknown) => String(value ?? "").trim();
const num = (value: unknown) => {
  const parsed = Number(String(value ?? "").replace(/[₦,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

async function getProfile(accessToken: string) {
  if (!accessToken) return null;
  const { data } = await db
    .from("supplier_profiles")
    .select("*")
    .eq("access_token", accessToken)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

const itemKey = (item: any) => [
  clean(item.catalogue_item_id || item.catalogue_code),
  clean(item.product_name).toLowerCase(),
  clean(item.specification).toLowerCase(),
  clean(item.brand).toLowerCase(),
  clean(item.quoted_unit).toLowerCase(),
].join("|");

async function listItems(profile: any) {
  const combined = new Map<string, any>();

  const { data: offers } = await db
    .from("supplier_marketplace_offers")
    .select("catalogue_item_id,product_name,specification,brand,quoted_unit,unit_price,location,status,updated_at")
    .eq("supplier_id", String(profile.id))
    .order("updated_at", { ascending: false })
    .limit(250);

  for (const offer of offers || []) {
    const key = itemKey(offer);
    if (!combined.has(key)) {
      combined.set(key, {
        catalogueItemId: offer.catalogue_item_id,
        catalogueCode: null,
        productName: offer.product_name,
        specification: offer.specification,
        brand: offer.brand,
        quotedUnit: offer.quoted_unit,
        currentPrice: offer.unit_price == null ? null : Number(offer.unit_price),
        location: offer.location || profile.location,
        source: "listed",
        updatedAt: offer.updated_at,
      });
    }
  }

  const { data: batches } = await db
    .from("supplier_review_batches")
    .select("id,submitted_at")
    .eq("supplier_id", profile.id)
    .order("submitted_at", { ascending: false })
    .limit(60);

  const batchIds = (batches || []).map((row: any) => row.id);
  if (batchIds.length) {
    const { data: lines } = await db
      .from("supplier_review_lines")
      .select("batch_id,catalogue_item_id,catalogue_code,product_name,specification,brand,quoted_unit,unit_price,location,status,updated_at")
      .in("batch_id", batchIds)
      .order("updated_at", { ascending: false })
      .limit(500);

    for (const line of lines || []) {
      const key = itemKey(line);
      if (!combined.has(key)) {
        combined.set(key, {
          catalogueItemId: line.catalogue_item_id,
          catalogueCode: line.catalogue_code,
          productName: line.product_name,
          specification: line.specification,
          brand: line.brand,
          quotedUnit: line.quoted_unit,
          currentPrice: line.unit_price == null ? null : Number(line.unit_price),
          location: line.location || profile.location,
          source: line.status === "approved" ? "approved" : "previous",
          updatedAt: line.updated_at,
        });
      }
    }
  }

  return [...combined.values()].sort((a, b) => a.productName.localeCompare(b.productName));
}

async function submitPrice(profile: any, body: any) {
  const productName = clean(body.productName);
  const quotedUnit = clean(body.quotedUnit);
  const unitPrice = num(body.unitPrice);
  if (!productName || !quotedUnit || unitPrice == null || unitPrice <= 0) {
    return { error: "Product, unit and a valid price are required.", status: 400 };
  }

  const now = new Date().toISOString();
  const payload = {
    source: "supplier_quick_update",
    productName,
    specification: clean(body.specification) || null,
    brand: clean(body.brand) || null,
    quotedUnit,
    unitPrice,
    previousPrice: num(body.previousPrice),
    location: clean(body.location) || profile.location,
    remarks: clean(body.remarks) || null,
  };

  const { data: batch, error: batchError } = await db
    .from("supplier_review_batches")
    .insert({
      supplier_id: profile.id,
      supplier_name: profile.business_name,
      supplier_phone: profile.phone,
      supplier_email: profile.email,
      supplier_location: payload.location,
      form_id: "QUICK",
      form_title: "Quick single-item price update",
      source_submission_id: `quick:${profile.id}:${crypto.randomUUID()}`,
      raw_payload: payload,
      status: "pending",
      submitted_at: now,
    })
    .select("id,review_token")
    .single();

  if (batchError || !batch) {
    return { error: batchError?.message || "Unable to create review.", status: 500 };
  }

  const { error: lineError } = await db.from("supplier_review_lines").insert({
    batch_id: batch.id,
    catalogue_item_id: clean(body.catalogueItemId) || null,
    catalogue_code: clean(body.catalogueCode) || null,
    product_name: productName,
    specification: clean(body.specification) || null,
    brand: clean(body.brand) || null,
    quoted_unit: quotedUnit,
    unit_price: unitPrice,
    location: payload.location,
    supplier_remarks: clean(body.remarks) || null,
    match_confidence: clean(body.catalogueItemId) || clean(body.catalogueCode) ? 0.99 : 0.5,
    status: "pending",
  });

  if (lineError) {
    await db.from("supplier_review_batches").delete().eq("id", batch.id);
    return { error: lineError.message, status: 500 };
  }

  return {
    batchId: batch.id,
    reviewToken: batch.review_token,
    reviewPath: `/supplier-review/${batch.id}`,
    supplierName: profile.business_name,
    productName,
    unitPrice,
    quotedUnit,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST required." }, 405);

  try {
    const body = await req.json();
    const accessToken = clean(body.accessToken);
    const profile = await getProfile(accessToken);
    if (!profile) return json({ error: "Supplier profile not found. Open your supplier profile again." }, 401);

    if (body.action === "list_items") {
      return json({ items: await listItems(profile) });
    }
    if (body.action === "submit_price") {
      const result: any = await submitPrice(profile, body);
      if (result.error) return json({ error: result.error }, result.status || 400);
      return json(result);
    }
    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});
