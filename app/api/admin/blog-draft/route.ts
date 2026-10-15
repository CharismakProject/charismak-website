import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { isAdminEmail } from "@/lib/auth/admin";
import { JIJI_MARKET_SNAPSHOT } from "@/lib/pricing/jiji-market-snapshot";

export const runtime = "nodejs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://mxjtxcajzopjahzqwwvf.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  || "sb_publishable_JizsG-ZyFofYCPFCqBTvNQ_Q98ba5Iq";

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "excerpt", "category", "readTime", "sections"],
  properties: {
    title: { type: "string" },
    excerpt: { type: "string" },
    category: { type: "string" },
    readTime: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["heading", "paragraphs", "bullets"],
        properties: {
          heading: { type: "string" },
          paragraphs: { type: "array", items: { type: "string" } },
          bullets: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

type Draft = {
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  sections: Array<{ heading: string; paragraphs: string[]; bullets: string[] }>;
};

const naira = (value: number) => `₦${value.toLocaleString("en-NG")}`;

/** Charismak's own price records, so articles quote real figures instead of invented ones. */
function priceReference() {
  return Object.values(JIJI_MARKET_SNAPSHOT)
    .map((item) => {
      const range = item.priceLow === item.priceHigh ? naira(item.reference) : `${naira(item.priceLow)}–${naira(item.priceHigh)}`;
      const alts = (item.alternatives ?? []).map((alt) => `${alt.label} (${alt.unit}) ${naira(alt.reference)}`).join("; ");
      return `- ${item.marketName}: ${range} per ${item.unit}, ${item.location}, source: ${item.sourceLabel}, checked ${item.checkedAt.slice(0, 10)}${alts ? `. Also: ${alts}` : ""}${item.note ? `. Note: ${item.note}` : ""}`;
    })
    .join("\n");
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user || !isAdminEmail(data.user.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI drafting is not configured: add OPENAI_API_KEY in Vercel." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const topic = String(body?.topic ?? "").trim().slice(0, 300);
  const notes = String(body?.notes ?? "").trim().slice(0, 4000);
  const contentType = body?.contentType === "news" ? "news" : "learning";
  if (!topic) return NextResponse.json({ error: "Enter a topic first." }, { status: 400 });

  const instructions = `You write ${contentType === "news" ? "short news updates" : "practical learning guides"} for the website of Charismak Project Nigeria Limited (CPNL), a construction contractor in Abuja, Nigeria, offering building construction, quantity surveying, cost management, renovation, steel fabrication and project management.

Audience: Nigerian homeowners, developers and site professionals. Use plain British English, Nigerian construction practice and Naira (₦). Be practical: quantities, units people actually buy in (trips, bags, lengths), common mistakes, what to check on site.

Hard rules:
- Never invent prices, statistics, regulations, dates, people, clients or CPNL projects. Only use prices from the CPNL price reference below or the admin's notes, and say when they were checked.
- If a fact is needed but not provided, write it as [CHECK: what needs confirming] so the editor must verify it before publishing.
- Do not claim CPNL certifications, awards or experience that are not in the notes.
- Make quantity examples arithmetically correct and state the assumptions (e.g. density, wastage).
- 600–1,100 words. 4–7 sections. End with a short section inviting readers to use the Charismak estimator or request a quote, without hard selling.

CPNL price reference:
${priceReference()}`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_BLOG_MODEL || process.env.OPENAI_ESTIMATOR_MODEL || "gpt-4.1-mini",
      instructions,
      input: `Topic: ${topic}\n\nAdmin notes (facts you may rely on):\n${notes || "none"}`,
      text: { format: { type: "json_schema", name: "blog_draft", strict: true, schema } },
    }),
  });

  const payload = await response.json();
  if (!response.ok) return NextResponse.json({ error: payload?.error?.message || "The AI service could not draft this article." }, { status: response.status });
  const outputText = payload?.output?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? []).find((item: { type?: string }) => item.type === "output_text")?.text;
  if (!outputText) return NextResponse.json({ error: "The AI response did not contain a draft." }, { status: 502 });

  let draft: Draft;
  try {
    draft = JSON.parse(outputText);
  } catch {
    return NextResponse.json({ error: "The AI draft could not be read." }, { status: 502 });
  }

  // Convert to the editor's body format: "## " headings, paragraphs, "- " bullets.
  const articleBody = draft.sections
    .map((section) => [`## ${section.heading}`, ...section.paragraphs, ...section.bullets.map((bullet) => `- ${bullet}`)].join("\n\n"))
    .join("\n\n");

  return NextResponse.json({
    draft: { title: draft.title, excerpt: draft.excerpt, category: draft.category, readTime: draft.readTime, body: articleBody, contentType },
  });
}
