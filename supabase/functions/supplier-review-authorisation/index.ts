/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});
const clean = (value: unknown) => String(value ?? "").trim();
const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (bytes = 16) => bytesToHex(crypto.getRandomValues(new Uint8Array(bytes)));
const randomCode = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
const hashCode = async (code: string, salt: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${code}:${salt}`));
  return bytesToHex(new Uint8Array(digest));
};
const numeric = (value: unknown, fallback: number | null = null) => {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(String(value).replace(/[₦,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
};
const nullableString = (value: unknown) => clean(value) || null;
const has = (obj: any, key: string) => obj && Object.prototype.hasOwnProperty.call(obj, key);

async function getProfile(accessToken: string) {
  if (!accessToken) return null;
  const { data } = await db
    .from("supplier_profiles")
    .select("id,supplier_code,business_name,phone,whatsapp,email,location,status")
    .eq("access_token", accessToken)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

const offerColumns = "id,supplier_id,product_name,specification,brand,quoted_unit,unit_price,bulk_price,minimum_qty,delivery_fee,delivery_included,location,service_area,availability,valid_until,supplier_remarks,status,updated_at";

function snapshot(offer: any) {
  return {
    product_name: clean(offer.product_name),
    specification: nullableString(offer.specification),
    brand: nullableString(offer.brand),
    quoted_unit: clean(offer.quoted_unit),
    unit_price: numeric(offer.unit_price, 0),
    bulk_price: numeric(offer.bulk_price),
    minimum_qty: numeric(offer.minimum_qty),
    delivery_fee: numeric(offer.delivery_fee),
    delivery_included: offer.delivery_included == null ? null : Boolean(offer.delivery_included),
    location: clean(offer.location),
    service_area: nullableString(offer.service_area),
    availability: nullableString(offer.availability),
    valid_until: nullableString(offer.valid_until),
    supplier_remarks: nullableString(offer.supplier_remarks),
  };
}

function exactProposal(offer: any, raw: any) {
  const current = snapshot(offer);
  const proposal = {
    product_name: has(raw, "product_name") ? clean(raw.product_name) : current.product_name,
    specification: has(raw, "specification") ? nullableString(raw.specification) : current.specification,
    brand: has(raw, "brand") ? nullableString(raw.brand) : current.brand,
    quoted_unit: has(raw, "quoted_unit") ? clean(raw.quoted_unit) : current.quoted_unit,
    unit_price: has(raw, "unit_price") ? numeric(raw.unit_price) : current.unit_price,
    bulk_price: has(raw, "bulk_price") ? numeric(raw.bulk_price) : current.bulk_price,
    minimum_qty: has(raw, "minimum_qty") ? numeric(raw.minimum_qty) : current.minimum_qty,
    delivery_fee: has(raw, "delivery_fee") ? numeric(raw.delivery_fee) : current.delivery_fee,
    delivery_included: has(raw, "delivery_included") ? (raw.delivery_included == null || raw.delivery_included === "" ? null : Boolean(raw.delivery_included)) : current.delivery_included,
    location: has(raw, "location") ? clean(raw.location) : current.location,
    service_area: has(raw, "service_area") ? nullableString(raw.service_area) : current.service_area,
    availability: has(raw, "availability") ? nullableString(raw.availability) : current.availability,
    valid_until: has(raw, "valid_until") ? nullableString(raw.valid_until) : current.valid_until,
    supplier_remarks: has(raw, "supplier_remarks") ? nullableString(raw.supplier_remarks) : current.supplier_remarks,
  };

  if (!proposal.product_name) throw new Error("Product name is required.");
  if (!proposal.quoted_unit) throw new Error("Quoted unit is required.");
  if (!proposal.location) throw new Error("Location is required.");
  if (proposal.unit_price == null || proposal.unit_price <= 0) throw new Error("Unit price must be greater than zero.");
  if (proposal.bulk_price != null && proposal.bulk_price < 0) throw new Error("Bulk price cannot be negative.");
  if (proposal.minimum_qty != null && proposal.minimum_qty < 0) throw new Error("Minimum quantity cannot be negative.");
  if (proposal.delivery_fee != null && proposal.delivery_fee < 0) throw new Error("Delivery fee cannot be negative.");
  return proposal;
}

const proposalSummary = (offer: any, proposal: any) => {
  const parts = [
    `${clean(offer.product_name)}: ₦${Number(offer.unit_price).toLocaleString("en-NG")} / ${clean(offer.quoted_unit)}`,
    `→ ₦${Number(proposal.unit_price).toLocaleString("en-NG")} / ${proposal.quoted_unit}`,
  ];
  if (proposal.specification !== nullableString(offer.specification)) parts.push(`Specification: ${nullableString(offer.specification) || "—"} → ${proposal.specification || "—"}`);
  if (proposal.brand !== nullableString(offer.brand)) parts.push(`Brand: ${nullableString(offer.brand) || "—"} → ${proposal.brand || "—"}`);
  if (proposal.location !== clean(offer.location)) parts.push(`Location: ${clean(offer.location)} → ${proposal.location}`);
  if (proposal.valid_until !== nullableString(offer.valid_until)) parts.push(`Valid until: ${nullableString(offer.valid_until) || "—"} → ${proposal.valid_until || "—"}`);
  return parts.join("\n");
};

async function list(profile: any) {
  const [{ data: offers, error: offersError }, { data: requests, error: requestsError }] = await Promise.all([
    db.from("supplier_marketplace_offers")
      .select(offerColumns)
      .eq("supplier_id", String(profile.id))
      .in("status", ["approved", "expired"])
      .order("updated_at", { ascending: false })
      .limit(150),
    db.from("supplier_price_review_requests")
      .select("id,offer_id,requested_by,reason,status,authorization_channel,otp_expires_at,verified_at,authorization_expires_at,created_at,updated_at,proposed_patch,proposed_patch_hash,proposed_by,proposed_at,authorized_patch_hash,before_snapshot")
      .eq("supplier_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (offersError) throw offersError;
  if (requestsError) throw requestsError;

  const offerMap = new Map((offers || []).map((offer: any) => [String(offer.id), offer]));
  return {
    offers: offers || [],
    requests: (requests || []).map((request: any) => ({ ...request, offer: offerMap.get(String(request.offer_id)) || null })),
  };
}

async function startAuthorization(profile: any, body: any) {
  const offerId = clean(body.offerId);
  const channel = clean(body.channel).toLowerCase();
  const reason = clean(body.reason);
  if (!offerId) return { error: "Choose the price you want Charismak to review.", status: 400 };
  if (!["whatsapp", "email"].includes(channel)) return { error: "Choose WhatsApp or email confirmation.", status: 400 };
  if (channel === "email" && !clean(profile.email)) return { error: "Add an email address to your supplier profile before using email confirmation.", status: 400 };
  if (channel === "whatsapp" && !clean(profile.whatsapp || profile.phone)) return { error: "Add a WhatsApp or phone number to your supplier profile first.", status: 400 };

  const { data: offer, error: offerError } = await db
    .from("supplier_marketplace_offers")
    .select(offerColumns)
    .eq("id", offerId)
    .eq("supplier_id", String(profile.id))
    .maybeSingle();
  if (offerError) throw offerError;
  if (!offer) return { error: "That price does not belong to this supplier profile.", status: 403 };
  if (offer.status !== "approved") return { error: "Only a current approved price can be authorised for change.", status: 409 };

  const { data: openRequests } = await db
    .from("supplier_price_review_requests")
    .select("*")
    .eq("offer_id", offer.id)
    .in("status", ["awaiting_supplier", "awaiting_code", "admin_authorized", "supplier_updating"])
    .order("created_at", { ascending: false })
    .limit(1);

  let request: any = openRequests?.[0] || null;
  const suppliedProposal = body.proposedPatch && typeof body.proposedPatch === "object" ? exactProposal(offer, body.proposedPatch) : null;
  const proposal = suppliedProposal || request?.proposed_patch || null;
  if (!proposal) {
    return { error: "Enter the exact proposed price change before authorising Charismak.", status: 400 };
  }
  const before = snapshot(offer);
  if (JSON.stringify(proposal) === JSON.stringify(before)) {
    return { error: "The proposed values are the same as the current supplier price.", status: 400 };
  }

  const code = randomCode();
  const salt = randomHex();
  const codeHash = await hashCode(code, salt);
  const now = new Date();
  const otpExpiresAt = new Date(now.getTime() + 10 * 60_000).toISOString();

  const updatePayload = {
    reason: reason || request?.reason || null,
    status: "awaiting_code",
    authorization_channel: channel,
    otp_salt: salt,
    otp_hash: codeHash,
    otp_expires_at: otpExpiresAt,
    otp_attempts: 0,
    verified_at: null,
    authorization_expires_at: null,
    authorized_patch_hash: null,
    consumed_at: null,
    completed_at: null,
    proposed_patch: proposal,
    proposed_by: suppliedProposal ? "supplier" : (request?.proposed_by || "supplier"),
    proposed_at: suppliedProposal ? now.toISOString() : (request?.proposed_at || now.toISOString()),
    before_snapshot: suppliedProposal ? before : (request?.before_snapshot || before),
    updated_at: now.toISOString(),
  };

  if (request) {
    const { data, error } = await db.from("supplier_price_review_requests").update(updatePayload).eq("id", request.id).select("*").single();
    if (error) throw error;
    request = data;
  } else {
    const { data, error } = await db.from("supplier_price_review_requests").insert({
      offer_id: offer.id,
      supplier_id: profile.id,
      requested_by: "supplier",
      requested_by_email: clean(profile.email) || null,
      ...updatePayload,
    }).select("*").single();
    if (error) throw error;
    request = data;
  }

  return {
    requestId: request.id,
    offerId: offer.id,
    productName: offer.product_name,
    channel,
    code,
    expiresAt: otpExpiresAt,
    destination: channel === "email" ? profile.email : (profile.whatsapp || profile.phone),
    proposal: request.proposed_patch,
    proposalHash: request.proposed_patch_hash,
    proposalSummary: proposalSummary(offer, request.proposed_patch),
  };
}

async function verifySupplierCode(profile: any, body: any) {
  const requestId = clean(body.requestId);
  const code = clean(body.code);
  if (!requestId || !/^\d{6}$/.test(code)) return { error: "Enter the 6-digit confirmation code.", status: 400 };

  const { data: request, error } = await db
    .from("supplier_price_review_requests")
    .select("*")
    .eq("id", requestId)
    .eq("supplier_id", profile.id)
    .maybeSingle();
  if (error) throw error;
  if (!request) return { error: "Authorization request not found.", status: 404 };
  if (request.status !== "awaiting_code") return { error: "This authorization is no longer awaiting a code.", status: 409 };
  if (!request.proposed_patch || !request.proposed_patch_hash) return { error: "No exact proposed change is attached to this authorization.", status: 409 };
  if (!request.otp_expires_at || new Date(request.otp_expires_at).getTime() <= Date.now()) {
    await db.from("supplier_price_review_requests").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", request.id);
    return { error: "The confirmation code has expired. Request a new one.", status: 410 };
  }
  if (Number(request.otp_attempts || 0) >= 5) return { error: "Too many incorrect code attempts. Request a new code.", status: 429 };

  const candidate = await hashCode(code, clean(request.otp_salt));
  if (candidate !== clean(request.otp_hash)) {
    const attempts = Number(request.otp_attempts || 0) + 1;
    await db.from("supplier_price_review_requests").update({
      otp_attempts: attempts,
      status: attempts >= 5 ? "expired" : "awaiting_code",
      updated_at: new Date().toISOString(),
    }).eq("id", request.id);
    return { error: attempts >= 5 ? "Too many incorrect attempts. Request a new code." : "Incorrect confirmation code.", status: attempts >= 5 ? 429 : 401 };
  }

  const verifiedAt = new Date();
  const authorizationExpiresAt = new Date(verifiedAt.getTime() + 30 * 60_000).toISOString();
  const { error: updateError } = await db.from("supplier_price_review_requests").update({
    status: "admin_authorized",
    verified_at: verifiedAt.toISOString(),
    authorization_expires_at: authorizationExpiresAt,
    authorized_patch_hash: request.proposed_patch_hash,
    otp_hash: null,
    otp_salt: null,
    otp_attempts: 0,
    updated_at: verifiedAt.toISOString(),
  }).eq("id", request.id);
  if (updateError) throw updateError;

  return {
    requestId: request.id,
    status: "admin_authorized",
    authorizationExpiresAt,
    authorizedPatchHash: request.proposed_patch_hash,
  };
}

async function markSupplierUpdating(profile: any, body: any) {
  const requestId = clean(body.requestId);
  const { data, error } = await db.from("supplier_price_review_requests")
    .update({
      status: "supplier_updating",
      authorization_channel: null,
      otp_hash: null,
      otp_salt: null,
      otp_expires_at: null,
      authorized_patch_hash: null,
      verified_at: null,
      authorization_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("supplier_id", profile.id)
    .in("status", ["awaiting_supplier", "awaiting_code", "admin_authorized"])
    .select("id,status")
    .maybeSingle();
  if (error) throw error;
  if (!data) return { error: "Review request could not be updated.", status: 409 };
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST required." }, 405);

  try {
    const body = await req.json();
    const accessToken = clean(body.accessToken);
    const profile = await getProfile(accessToken);
    if (!profile) return json({ error: "Supplier account not found. Sign in again." }, 401);

    if (body.action === "list") return json(await list(profile));
    if (body.action === "start_authorization") {
      const result: any = await startAuthorization(profile, body);
      return result.error ? json({ error: result.error }, result.status || 400) : json(result);
    }
    if (body.action === "verify_code") {
      const result: any = await verifySupplierCode(profile, body);
      return result.error ? json({ error: result.error }, result.status || 400) : json(result);
    }
    if (body.action === "mark_supplier_updating") {
      const result: any = await markSupplierUpdating(profile, body);
      return result.error ? json({ error: result.error }, result.status || 400) : json(result);
    }

    return json({ error: "Unknown action." }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error." }, 500);
  }
});