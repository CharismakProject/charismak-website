import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    ...cors,
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
  },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET" && req.method !== "POST") return json({ error: "GET or POST required." }, 405);

  try {
    const today = new Date().toISOString().slice(0, 10);

    const [{ data: profiles, error: profileError }, { data: offers, error: offerError }] = await Promise.all([
      db
        .from("supplier_profiles")
        .select("id,supplier_code,business_name,contact_person,phone,whatsapp,email,location,delivery_areas,categories,status,created_at,updated_at")
        .eq("status", "active")
        .order("updated_at", { ascending: false }),
      db
        .from("supplier_marketplace_offers")
        .select("id,supplier_id,catalogue_item_id,product_name,specification,brand,unit_price,quoted_unit,location,service_area,availability,delivery_included,delivery_fee,valid_until,status,submitted_at,published_at,created_at")
        .eq("status", "approved")
        .gte("valid_until", today)
        .order("created_at", { ascending: false }),
    ]);

    if (profileError) return json({ error: profileError.message }, 500);
    if (offerError) return json({ error: offerError.message }, 500);

    const offersBySupplier = new Map<string, unknown[]>();
    for (const offer of offers ?? []) {
      const supplierId = String(offer.supplier_id ?? "");
      if (!supplierId) continue;
      const current = offersBySupplier.get(supplierId) ?? [];
      current.push(offer);
      offersBySupplier.set(supplierId, current);
    }

    const directory = (profiles ?? []).map((profile) => ({
      ...profile,
      offers: offersBySupplier.get(String(profile.id)) ?? [],
    }));

    return json({ profiles: directory });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Unable to load supplier directory." }, 500);
  }
});
