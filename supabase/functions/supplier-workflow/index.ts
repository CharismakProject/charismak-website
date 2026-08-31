/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("SUPPLIER_WORKFLOW_WEBHOOK_SECRET") || "";
const REVIEW_BASE_URL = "https://www.charismakproject.com/supplier-review";
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supplier-workflow-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json" },
});

const clean = (value: unknown) => String(value ?? "").trim();
const digits = (value: unknown) => clean(value).replace(/\D/g, "");
const money = (value: unknown): number | null => {
  const s = clean(value).replace(/[₦,\s]/g, "");
  const match = s.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
};
const supplierCode = () => `SUP-${crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
const validPin = (pin: string) => /^\d{4,6}$/.test(pin);
const hashPin = async (pin: string) => {
  const data = new TextEncoder().encode(`charismak-supplier-v1:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const safeProfile = (row: Record<string, unknown>) => ({
  id: row.id,
  supplier_code: row.supplier_code,
  business_name: row.business_name,
  contact_person: row.contact_person,
  phone: row.phone,
  whatsapp: row.whatsapp,
  email: row.email,
  location: row.location,
  delivery_areas: row.delivery_areas,
  categories: row.categories,
  access_token: row.access_token,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

function inferItemId(product: string, spec = "", unit = "") {
  const text = `${product} ${spec} ${unit}`.toLowerCase();
  if (text.includes("cement")) return "cement-50kg";
  if (text.includes("sharp sand")) return "sharp-sand";
  if (text.includes("granite") || text.includes("chipping")) return "granite-aggregate";
  if ((text.includes("225mm") || text.includes('9\"') || text.includes("9 inch")) && text.includes("block")) return "block-225";
  if (text.includes("plywood")) return "formwork-sheet";
  if ((text.includes("60×60") || text.includes("60x60")) && text.includes("tile")) return "floor-tile";
  if (text.includes("ppr") && text.includes("25")) return "ppr-pipe-25";
  if (text.includes("longspan") || text.includes("long span")) return "longspan-roof-sheet";
  if (text.includes("concrete mixer")) return "concrete-mixer";
  if (text.includes("reinforcement") || text.includes("rebar") || /\by\s?12\b/.test(text)) return "reinforcement-steel";
  return null;
}

function parseLineList(value: string) {
  return value.split(/\n|;/).map((v) => v.trim()).filter(Boolean);
}

function compactLine(line: string) {
  const parts = line.split(/\s[-:=]\s|\t/).map((v) => v.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const price = money(parts[parts.length - 1]);
  if (price == null) return null;
  return { label: parts.slice(0, -1).join(" - "), price };
}

function normalizeUnit(itemId: string | null, unit: string) {
  const raw = clean(unit);
  if (itemId === "cement-50kg") return "50 kg bag";
  if (itemId === "block-225") return "piece";
  return raw || "item";
}

function parseSubmissionLines(columns: Array<{ header: string; value: string; index?: number }>, location: string) {
  const lines: any[] = [];
  let activeBrand = "";
  for (const column of columns) {
    const header = clean(column.header);
    const value = clean(column.value);
    if (!header || !value) continue;
    const lower = header.toLowerCase();

    if (lower.includes("main brand / manufacturer for this section") || lower.includes("main brands you stock")) {
      activeBrand = value;
      continue;
    }

    const generic = header.match(/^(.+?)\s+[—-]\s+(.+?)\s+[—-]\s+Price\s*\/\s*(.+)$/i);
    if (generic) {
      const unitPrice = money(value);
      if (unitPrice != null) {
        const productName = generic[1].trim();
        const specification = generic[2].trim();
        const itemId = inferItemId(productName, specification, generic[3].trim());
        const quotedUnit = normalizeUnit(itemId, generic[3].trim());
        lines.push({
          catalogue_item_id: itemId,
          product_name: productName,
          specification,
          brand: activeBrand || null,
          quoted_unit: quotedUnit,
          unit_price: unitPrice,
          location,
          match_confidence: itemId ? 0.9 : 0.45,
        });
      }
      continue;
    }

    if (lower.includes("current retail price per 50kg bag")) {
      for (const raw of parseLineList(value)) {
        const parsed = compactLine(raw);
        if (!parsed) continue;
        lines.push({ catalogue_item_id: "cement-50kg", product_name: "Cement", specification: "50 kg bag", brand: parsed.label, quoted_unit: "50 kg bag", unit_price: parsed.price, location, match_confidence: 0.98 });
      }
      continue;
    }

    if (lower.includes("current block prices per piece")) {
      for (const raw of parseLineList(value)) {
        const parsed = compactLine(raw);
        if (!parsed) continue;
        const label = parsed.label;
        const itemId = inferItemId(`Block ${label}`);
        lines.push({ catalogue_item_id: itemId, product_name: `${label} sandcrete block`, specification: label, brand: null, quoted_unit: "piece", unit_price: parsed.price, location, match_confidence: itemId ? 0.9 : 0.55 });
      }
      continue;
    }

    const compactGroups: Array<[string, string, string]> = [
      ["current sand prices", "Sharp sand / sand", "tipper / stated unit"],
      ["current granite / aggregate prices", "Granite aggregate", "tipper / stated unit"],
      ["current reinforcement prices", "Reinforcement steel", "12 m length / stated unit"],
      ["current brc prices", "BRC welded mesh", "sheet"],
      ["current ready-mix price", "Ready-mix concrete", "m³"],
      ["current ppr", "PPR pipe", "length"],
    ];
    const group = compactGroups.find(([needle]) => lower.includes(needle));
    if (group) {
      for (const raw of parseLineList(value)) {
        const parsed = compactLine(raw);
        if (!parsed) continue;
        const productName = `${group[1]} ${parsed.label}`.trim();
        const itemId = inferItemId(productName, parsed.label, group[2]);
        lines.push({ catalogue_item_id: itemId, product_name: productName, specification: parsed.label, brand: activeBrand || null, quoted_unit: normalizeUnit(itemId, group[2]), unit_price: parsed.price, location, match_confidence: itemId ? 0.85 : 0.45 });
      }
    }
  }
  return lines;
}

async function findOrCreateSupplier(payload: any) {
  const businessName = clean(payload.businessName || payload.supplierName);
  const phone = clean(payload.phone);
  const location = clean(payload.location) || "Nigeria";
  const phoneDigits = digits(phone);
  let existing: any = null;
  if (phoneDigits) {
    const { data } = await db.from("supplier_profiles").select("*").limit(500);
    existing = (data || []).find((row: any) => digits(row.phone) === phoneDigits) || null;
  }
  if (existing) return existing;
  if (!businessName || !phone) return null;
  const { data, error } = await db.from("supplier_profiles").insert({
    supplier_code: supplierCode(), business_name: businessName, phone, location,
    contact_person: clean(payload.contactPerson) || null,
    whatsapp: clean(payload.whatsapp) || phone,
    email: clean(payload.email) || null,
    delivery_areas: clean(payload.deliveryAreas) || null,
  }).select("*").single();
  if (error) throw error;
  return data;
}

async function handleProfile(action: string, body: any) {
  if (action === "create_profile") {
    const businessName = clean(body.businessName);
    const phone = clean(body.phone);
    const location = clean(body.location);
    const pin = clean(body.pin);
    if (!businessName || !phone || !location) return json({ error: "Business name, phone and location are required." }, 400);
    if (pin && !validPin(pin)) return json({ error: "Use a 4–6 digit account PIN." }, 400);

    const phoneDigits = digits(phone);
    const { data: rows } = await db.from("supplier_profiles").select("*").limit(1000);
    const existing = (rows || []).find((row: any) => digits(row.phone) === phoneDigits && clean(row.business_name).toLowerCase() === businessName.toLowerCase());
    if (existing) {
      if (existing.account_pin_hash) {
        if (!pin || await hashPin(pin) !== existing.account_pin_hash) return json({ error: "This supplier account already exists. Use Returning Supplier and your PIN." }, 409);
      } else if (pin) {
        const { data: claimed, error } = await db.from("supplier_profiles").update({ account_pin_hash: await hashPin(pin), last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", existing.id).select("*").single();
        if (error) return json({ error: error.message }, 500);
        return json({ profile: safeProfile(claimed), recovered: true });
      }
      return json({ profile: safeProfile(existing), recovered: true });
    }

    const { data, error } = await db.from("supplier_profiles").insert({
      supplier_code: supplierCode(), business_name: businessName, contact_person: clean(body.contactPerson) || null,
      phone, whatsapp: clean(body.whatsapp) || phone, email: clean(body.email) || null,
      location, delivery_areas: clean(body.deliveryAreas) || null,
      categories: Array.isArray(body.categories) ? body.categories : [],
      account_pin_hash: pin ? await hashPin(pin) : null,
      last_login_at: new Date().toISOString(),
    }).select("*").single();
    if (error) return json({ error: error.message }, 500);
    return json({ profile: safeProfile(data) });
  }

  if (action === "get_profile") {
    const token = clean(body.accessToken);
    if (!token) return json({ error: "Account token is required." }, 400);
    const { data, error } = await db.from("supplier_profiles").select("*").eq("access_token", token).eq("status", "active").single();
    if (error || !data) return json({ error: "Supplier account not found." }, 404);
    return json({ profile: safeProfile(data) });
  }

  if (action === "recover_profile") {
    const businessName = clean(body.businessName).toLowerCase();
    const phoneDigits = digits(body.phone);
    const pin = clean(body.pin);
    if (!businessName || !phoneDigits) return json({ error: "Business name and phone are required." }, 400);
    const { data: rows } = await db.from("supplier_profiles").select("*").limit(1000);
    const match = (rows || []).find((row: any) => clean(row.business_name).toLowerCase() === businessName && digits(row.phone) === phoneDigits);
    if (!match) return json({ error: "We could not find that supplier account." }, 404);

    if (match.account_pin_hash) {
      if (!validPin(pin) || await hashPin(pin) !== match.account_pin_hash) return json({ error: "Incorrect supplier account PIN." }, 401);
    } else {
      if (!validPin(pin)) return json({ error: "This older supplier profile needs a 4–6 digit PIN. Enter one now to secure the account." }, 400);
      const { data: secured, error } = await db.from("supplier_profiles").update({ account_pin_hash: await hashPin(pin), last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", match.id).select("*").single();
      if (error) return json({ error: error.message }, 500);
      return json({ profile: safeProfile(secured) });
    }

    const { data: loggedIn, error } = await db.from("supplier_profiles").update({ last_login_at: new Date().toISOString() }).eq("id", match.id).select("*").single();
    if (error) return json({ error: error.message }, 500);
    return json({ profile: safeProfile(loggedIn) });
  }

  if (action === "update_profile") {
    const token = clean(body.accessToken);
    if (!token) return json({ error: "Account token is required." }, 400);
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const [input, column] of Object.entries({ businessName: "business_name", contactPerson: "contact_person", phone: "phone", whatsapp: "whatsapp", email: "email", location: "location", deliveryAreas: "delivery_areas" })) {
      if (body[input] !== undefined) patch[column] = clean(body[input]) || null;
    }
    if (Array.isArray(body.categories)) patch.categories = body.categories;
    if (body.pin !== undefined && clean(body.pin)) {
      if (!validPin(clean(body.pin))) return json({ error: "Use a 4–6 digit account PIN." }, 400);
      patch.account_pin_hash = await hashPin(clean(body.pin));
    }
    const { data, error } = await db.from("supplier_profiles").update(patch).eq("access_token", token).select("*").single();
    if (error || !data) return json({ error: error?.message || "Supplier account not found." }, 404);
    return json({ profile: safeProfile(data) });
  }
  return json({ error: "Unknown account action." }, 400);
}

async function handleWebhook(req: Request, body: any) {
  const suppliedSecret = req.headers.get("x-supplier-workflow-secret") || clean(body.secret);
  if (suppliedSecret !== WEBHOOK_SECRET) return json({ error: "Unauthorized webhook." }, 401);
  const columns = Array.isArray(body.columns) ? body.columns.map((c: any, index: number) => ({ header: clean(c.header), value: clean(c.value), index })) : [];
  const byHeader = (needle: string) => clean(columns.find((c: any) => c.header.toLowerCase().includes(needle.toLowerCase()))?.value);
  const supplierName = clean(body.supplierName) || byHeader("business / supplier name") || byHeader("business name");
  const phone = clean(body.phone) || byHeader("phone / whatsapp") || byHeader("phone");
  const location = clean(body.location) || byHeader("main supply location") || "Nigeria";
  const email = clean(body.email) || byHeader("email");
  const sourceSubmissionId = clean(body.sourceSubmissionId) || `${clean(body.responseSheet)}:${clean(body.sourceRow)}:${clean(body.timestamp)}`;
  const supplier = await findOrCreateSupplier({ businessName: supplierName, phone, location, email });
  if (supplier && Array.isArray(body.categories) && body.categories.length) {
    await db.from("supplier_profiles").update({ categories: body.categories, updated_at: new Date().toISOString() }).eq("id", supplier.id);
  }
  const { data: batch, error: batchError } = await db.from("supplier_review_batches").insert({
    supplier_id: supplier?.id || null,
    supplier_name: supplier?.business_name || supplierName || "Supplier",
    supplier_phone: supplier?.phone || phone || null,
    supplier_email: supplier?.email || email || null,
    supplier_location: supplier?.location || location || null,
    form_id: clean(body.formId) || null,
    form_title: clean(body.formTitle) || null,
    response_sheet: clean(body.responseSheet) || null,
    source_row: Number(body.sourceRow) || null,
    source_submission_id: sourceSubmissionId,
    raw_payload: body,
    submitted_at: body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString(),
  }).select("*").single();
  if (batchError) {
    if (batchError.code === "23505") return json({ duplicate: true, sourceSubmissionId });
    return json({ error: batchError.message }, 500);
  }
  const parsedLines = parseSubmissionLines(columns, supplier?.location || location);
  if (parsedLines.length) {
    const rows = parsedLines.map((line) => ({ ...line, batch_id: batch.id }));
    const { error } = await db.from("supplier_review_lines").insert(rows);
    if (error) return json({ error: error.message, batchId: batch.id }, 500);
  }
  return json({ batchId: batch.id, reviewToken: batch.review_token, lineCount: parsedLines.length, reviewUrl: `${REVIEW_BASE_URL}/${batch.id}` });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST required." }, 405);
  try {
    const body = await req.json();
    const action = clean(body.action);
    if (["create_profile", "get_profile", "recover_profile", "update_profile"].includes(action)) return handleProfile(action, body);
    if (action === "form_submission") return handleWebhook(req, body);
    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});
