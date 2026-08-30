import { NextRequest, NextResponse } from "next/server";

import { SUPPLIER_FORMS } from "@/lib/pricing/supplier-forms";

type FieldMap = {
  businessName?: string;
  phone?: string;
  location?: string;
  supplierStatus?: string;
};

const fieldCache = new Map<string, FieldMap>();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function normalizeLocation(value: string) {
  const text = value.trim();
  const lower = text.toLowerCase();
  if (lower.includes("abuja") || lower.includes("fct")) return "Abuja / FCT";
  if (lower.includes("lagos")) return "Lagos";
  if (lower.includes("port harcourt") || lower.includes("rivers")) return "Port Harcourt / Rivers";
  if (lower.includes("kano")) return "Kano";
  if (lower.includes("kaduna")) return "Kaduna";
  if (lower.includes("ibadan") || lower.includes("oyo")) return "Ibadan / Oyo";
  return text;
}

function findEntryId(source: string, labels: string[]) {
  for (const label of labels) {
    const escaped = escapeRegex(JSON.stringify(label).slice(1, -1));
    const patterns = [
      new RegExp(`\\[\\d+,\\s*\"${escaped}\"[\\s\\S]{0,700}?\\[\\[(\\d+)`, "i"),
      new RegExp(`\"${escaped}\"[\\s\\S]{0,700}?\\[\\[(\\d+)`, "i"),
    ];
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match?.[1]) return match[1];
    }
  }
  return undefined;
}

async function loadFieldMap(formId: string, formUrl: string): Promise<FieldMap> {
  const cached = fieldCache.get(formId);
  if (cached) return cached;

  const response = await fetch(formUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CharismakSupplierPortal/1.0)",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "force-cache",
  });
  if (!response.ok) throw new Error(`Google Form returned ${response.status}`);

  const html = await response.text();
  const map: FieldMap = {
    businessName: findEntryId(html, [
      "Business / Supplier Name",
      "Business / supplier name",
      "Business Name",
    ]),
    phone: findEntryId(html, ["Phone / WhatsApp", "Phone / Whatsapp", "Phone"]),
    location: findEntryId(html, ["Main supply location", "Main Supply Location", "Main price location / destination"]),
    supplierStatus: findEntryId(html, [
      "Are you a new or returning Charismak supplier?",
      "Are you a new or returning supplier?",
    ]),
  };

  fieldCache.set(formId, map);
  return map;
}

function buildPrefilledUrl(
  formUrl: string,
  map: FieldMap,
  values: { businessName: string; phone: string; location: string },
) {
  const url = new URL(formUrl);
  url.searchParams.set("usp", "pp_url");
  if (map.businessName) url.searchParams.set(`entry.${map.businessName}`, values.businessName);
  if (map.phone) url.searchParams.set(`entry.${map.phone}`, values.phone);
  if (map.location) url.searchParams.set(`entry.${map.location}`, normalizeLocation(values.location));
  if (map.supplierStatus) url.searchParams.set(`entry.${map.supplierStatus}`, "Returning supplier");
  return url.toString();
}

export async function GET(request: NextRequest) {
  const formId = request.nextUrl.searchParams.get("formId") || "";
  const form = SUPPLIER_FORMS.find((item) => item.id === formId);
  if (!form) return NextResponse.json({ error: "Unknown supplier form." }, { status: 404 });

  try {
    const fieldMap = await loadFieldMap(form.id, form.formUrl);
    return NextResponse.json({ formId: form.id, fieldMap });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to inspect Google Form." },
      { status: 502 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    formId?: string;
    businessName?: string;
    phone?: string;
    location?: string;
  } | null;

  const form = SUPPLIER_FORMS.find((item) => item.id === body?.formId);
  if (!form) return NextResponse.json({ error: "Unknown supplier form." }, { status: 404 });

  const businessName = String(body?.businessName || "").trim();
  const phone = String(body?.phone || "").trim();
  const location = String(body?.location || "").trim();
  if (!businessName || !phone || !location) {
    return NextResponse.json({ error: "Supplier name, phone and location are required." }, { status: 400 });
  }

  try {
    const fieldMap = await loadFieldMap(form.id, form.formUrl);
    const ready = Boolean(fieldMap.businessName && fieldMap.phone);
    return NextResponse.json({
      url: ready
        ? buildPrefilledUrl(form.formUrl, fieldMap, { businessName, phone, location })
        : form.formUrl,
      prefillReady: ready,
      fieldMap,
    });
  } catch (error) {
    return NextResponse.json({
      url: form.formUrl,
      prefillReady: false,
      warning: error instanceof Error ? error.message : "Profile prefill unavailable.",
    });
  }
}
