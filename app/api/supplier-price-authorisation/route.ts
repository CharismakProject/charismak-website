import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://mxjtxcajzopjahzqwwvf.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "sb_publishable_JizsG-ZyFofYCPFCqBTvNQ_Q98ba5Iq";
const ADMIN_WHATSAPP = (process.env.NEXT_PUBLIC_COMPANY_WHATSAPP || "+2347066619598").trim();

async function invoke(body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/supplier-review-authorisation`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok || data?.error) throw new Error(String(data?.error || "Supplier authorization request failed."));
  return data as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.accessToken) return NextResponse.json({ error: "Supplier account access is required." }, { status: 401 });

    if (body.action === "start") {
      const channel = String(body.channel || "").toLowerCase();
      const result = await invoke({
        action: "start_authorization",
        accessToken: body.accessToken,
        offerId: body.offerId,
        channel,
        reason: body.reason || "",
        proposedPatch: body.proposedPatch || null,
      });

      const requestId = String(result.requestId || "");
      const code = String(result.code || "");
      const productName = String(result.productName || "Supplier price");
      const expiresAt = String(result.expiresAt || "");
      const proposalSummary = String(result.proposalSummary || "Exact proposed change recorded in your Charismak supplier account.");

      if (channel === "email") {
        const destination = String(result.destination || "");
        if (!destination) return NextResponse.json({ error: "No supplier email is available for confirmation." }, { status: 400 });
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
          return NextResponse.json({ error: "Email confirmation is temporarily unavailable. Use WhatsApp confirmation instead." }, { status: 503 });
        }

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: Number(process.env.SMTP_PORT || 465) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: `"Charismak Supplier Security" <${process.env.SMTP_USER}>`,
          to: destination,
          subject: `Confirm exact Charismak price change — ${productName}`,
          text: [
            "You are being asked to authorise Charismak Project to apply one exact supplier-price change on your behalf.",
            "",
            proposalSummary,
            "",
            `Confirmation code: ${code}`,
            "",
            "Enter this code only on the Charismak supplier page. The code expires in 10 minutes. After confirmation, Charismak can apply only the exact change shown above, within 30 minutes. If any value changes, a new authorisation is required.",
            "",
            "If you did not request or agree to this exact change, do not enter the code.",
          ].join("\n"),
        });

        return NextResponse.json({ requestId, productName, channel, expiresAt, proposalSummary, emailSent: true });
      }

      return NextResponse.json({ requestId, productName, channel: "whatsapp", expiresAt, code, proposalSummary, adminWhatsApp: ADMIN_WHATSAPP });
    }

    if (body.action === "verify") {
      const result = await invoke({ action: "verify_code", accessToken: body.accessToken, requestId: body.requestId, code: body.code });
      return NextResponse.json(result);
    }

    if (body.action === "mark_supplier_updating") {
      const result = await invoke({ action: "mark_supplier_updating", accessToken: body.accessToken, requestId: body.requestId });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Unknown authorization action." }, { status: 400 });
  } catch (error) {
    console.error("Supplier price authorisation error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 500 });
  }
}