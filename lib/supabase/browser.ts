import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const publicSupabaseUrl = "https://mxjtxcajzopjahzqwwvf.supabase.co";
const publicSupabasePublishableKey =
  "sb_publishable_JizsG-ZyFofYCPFCqBTvNQ_Q98ba5Iq";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || publicSupabaseUrl;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  publicSupabasePublishableKey;

let browserClient: SupabaseClient | null = null;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
