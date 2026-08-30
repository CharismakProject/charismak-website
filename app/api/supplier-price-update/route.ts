import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  "https://mxjtxcajzopjahzqwwvf.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  "sb_publishable_JizsG-ZyFofYCPFCqBTvNQ_Q98ba5Iq";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.accessToken || !body?.productName || !body?.quotedUnit || !body?.unitPrice) {
      return NextResponse.json(
        { error: "Product, unit and price are required." },
        { status: 400 },
      );
    }

    const upstream = await fetch(`${SUPABASE_URL}/functions/v1/supplier-quick-update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ action: "submit_price", ...body }),
      cache: "no-store",
    });
    const result = await upstream.json();
    if (!upstream.ok || result?.error) {
      return NextResponse.json(
        { error: result?.error || "Unable to create the supplier price review." },
        { status: upstream.status || 500 },
      );
    }

    let emailSent = false;
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 465),
          secure: Number(process.env.SMTP_PORT || 465) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Charismak Supplier Prices" <${process.env.SMTP_USER}>`,
          to: "md@charismakproject.com, info@charismakproject.com",
          subject: `Supplier price update — ${result.supplierName} — ${result.productName}`,
          text: [
            "A returning supplier submitted a single-item price update.",
            "",
            `Supplier: ${result.supplierName}`,
            `Item: ${result.productName}`,
            `New price: ₦${Number(result.unitPrice).toLocaleString("en-NG")} / ${result.quotedUnit}`,
            body.previousPrice ? `Previous price: ₦${Number(body.previousPrice).toLocaleString("en-NG")}` : "Previous price: Not recorded",
            body.brand ? `Brand / make: ${body.brand}` : "",
            body.specification ? `Specification: ${body.specification}` : "",
            body.location ? `Location: ${body.location}` : "",
            "",
            `Review and publish: ${result.reviewUrl}`,
          ].filter(Boolean).join("\n"),
        });
        emailSent = true;
      }
    } catch (emailError) {
      console.error("Supplier price review email error:", emailError);
    }

    return NextResponse.json({ ...result, emailSent });
  } catch (error) {
    console.error("Supplier quick price update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: 500 },
    );
  }
}
