import { revalidatePath, revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { isAdminEmail } from "@/lib/auth/admin";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "https://mxjtxcajzopjahzqwwvf.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  || "sb_publishable_JizsG-ZyFofYCPFCqBTvNQ_Q98ba5Iq";

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user || !isAdminEmail(data.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({} as { slug?: string }));
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";

  revalidateTag("website-projects", { expire: 0 });
  revalidateTag("website-project-updates", { expire: 0 });
  revalidatePath("/");
  revalidatePath("/projects");
  if (slug) revalidatePath(`/projects/${slug}`);

  return NextResponse.json({ ok: true });
}
