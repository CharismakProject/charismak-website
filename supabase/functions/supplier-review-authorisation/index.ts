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
const randomCode = () => {
  const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(value).padStart(6, "0");
};
const hashCode = async (code: string, salt: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${code}:${salt}`));
  return bytesToHex(new Uint8Array(digest));
};

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

async function list(profile: any) {
  const [{ data: offers, error: offersError }, { data: requests, error: requestsError }] = await Promise.all([
    db.from("supplier_marketplace_offers")
      .select("id,product_name,specification,brand,quoted_unit,unit_price,location,status,valid_until,updated_at")
      .eq("supplier_id", String(profile.id))
      .in("status", ["approved", "expired"])
      .order("updated_at", { ascending: false })
      .limit(150),
    db.from("supplier_price_review_requests")
      .select("id,offer_id,requested_by,reason,status,authorization_channel,otp_expires_at,verified_at,authorization_expires_at,created_at,updated_at")
      .eq("supplier_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  if (offersError) throw offersError;
  if (requestsError) throw requestsError;

  const offerMap = new Map((offers || []).map((offer: any) => [String(offer.id), offer]));
  return {
    offers: offers || [],
    requests: (requests || []).map((request: any) => ({
      ...request,
      offer: offerMap.get(String(request.offer_id)) || null,
    })),
  };
}

async function startAuthorization(profile: any, body: any) {
  const offerId = clean(body.offerId);
  const channel = clean(body.channel).toLowerCase();
  const reason = clean(body.reason);
  if (!offerId) return { error: "Choose the price you want Charismak to review.", status: 400 };
  if (!['whatsapp', 'email'].includes(channel)) return { error: "Choose WhatsApp or email confirmation.", status: 400 };
  if (channel === 'email' && !clean(profile.email)) return { error: "Add an email address to your supplier profile before using email confirmation.", status: 400 };
  if (channel === 'whatsapp' && !clean(profile.whatsapp || profile.phone)) return { error: "Add a WhatsApp or phone number to your supplier profile first.", status: 400 };

  const { data: offer, error: offerError } = await db
    .from("supplier_marketplace_offers")
    .select("id,supplier_id,product_name,quoted_unit,unit_price,status")
    .eq("id", offerId)
    .eq("supplier_id", String(profile.id))
    .maybeSingle();
  if (offerError) throw offerError;
  if (!offer) return { error: "That price does not belong to this supplier profile.", status: 403 };

  const { data: openRequests } = await db
    .from("supplier_price_review_requests")
    .select("*")
    .eq("offer_id", offer.id)
    .in("status", ["awaiting_supplier", "awaiting_code", "admin_authorized", "supplier_updating"])
    .order("created_at", { ascending: false })
    .limit(1);

  const code = randomCode();
  const salt = randomHex();
  const codeHash = await hashCode(code, salt);
  const now = new Date();
  const otpExpiresAt = new Date(now.getTime() + 10 * 60_000).toISOString();

  let request: any = openRequests?.[0] || null;
  if (request) {
    const { data, error } = await db.from("supplier_price_review_requests").update({
      requested_by: request.requested_by === "admin" ? "admin" : "supplier",
      reason: reason || request.reason || null,
      status: "awaiting_code",
      authorization_channel: channel,
      otp_salt: salt,
      otp_hash: codeHash,
      otp_expires_at: otpExpiresAt,
      otp_attempts: 0,
      verified_at: null,
      authorization_expires_at: null,
      consumed_at: null,
      updated_at: now.toISOString(),
    }).eq("id", request.id).select("*").single();
    if (error) throw error;
    request = data;
  } else {
    const { data, error } = await db.from("supplier_price_review_requests").insert({
      offer_id: offer.id,
      supplier_id: profile.id,
      requested_by: "supplier",
      reason: reason || "Supplier requested Charismak assistance with this price.",
      status: "awaiting_code",
      authorization_channel: channel,
      otp_salt: salt,
      otp_hash: codeHash,
      otp_expires_at: otpExpiresAt,
      otp_attempts: 0,
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
    otp_hash: null,
    otp_salt: null,
    otp_attempts: 0,
    updated_at: verifiedAt.toISOString(),
  }).eq("id", request.id);
  if (updateError) throw updateError;

  return { requestId: request.id, status: "admin_authorized", authorizationExpiresAt };
}

async function markSupplierUpdating(profile: any, body: any) {
  const requestId = clean(body.requestId);
  const { data, error } = await db.from("supplier_price_review_requests")
    .update({ status: "supplier_updating", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("supplier_id", profile.id)
    .in("status", ["awaiting_supplier", "awaiting_code"])
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
