"use client";

import { useEffect, useMemo, useState } from "react";

import { useBetaSession } from "@/components/auth/beta-session";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ReviewRow = {
  id: string;
  email: string | null;
  rating: number;
  category: string;
  message: string;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  email: string | null;
  contact_consent: boolean;
  first_seen_at: string;
  last_seen_at: string;
};

export default function BetaInsights() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const { isAdmin } = useBetaSession();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [status, setStatus] = useState("Loading beta activity…");

  const load = async () => {
    if (!client || !isAdmin) return;
    setStatus("Loading beta activity…");
    const [profileResult, reviewResult] = await Promise.all([
      client.from("beta_profiles").select("user_id,email,contact_consent,first_seen_at,last_seen_at").order("last_seen_at", { ascending: false }),
      client.from("beta_reviews").select("id,email,rating,category,message,created_at").order("created_at", { ascending: false }),
    ]);

    if (profileResult.error || reviewResult.error) {
      setStatus("The beta database is not ready yet.");
      return;
    }

    setProfiles((profileResult.data ?? []) as ProfileRow[]);
    setReviews((reviewResult.data ?? []) as ReviewRow[]);
    setStatus("");
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
    // load is intentionally tied to the authenticated administrator state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, isAdmin]);

  if (!isAdmin) {
    return <section className="rounded-[30px] border border-[#d6dfe9] bg-white p-8"><h2 className="text-2xl font-bold">Administrator access only</h2><p className="mt-3 text-sm text-[#526579]">This area is reserved for Charismak estimator administrators.</p></section>;
  }

  const consented = profiles.filter((profile) => profile.contact_consent).length;
  const average = reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-6">
      <section className="rounded-[34px] bg-[#071E33] p-7 text-white md:p-9">
        <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E7B34B]">Private beta insights</p><h1 className="mt-3 text-3xl font-bold">Visitors and product reviews</h1></div><button type="button" onClick={() => void load()} className="rounded-full border border-white/25 px-5 py-3 text-sm font-bold hover:bg-white/10">Refresh</button></div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-5"><span className="text-xs text-white/60">Visitors</span><strong className="mt-2 block text-3xl">{profiles.length}</strong></div><div className="rounded-2xl bg-white/10 p-5"><span className="text-xs text-white/60">Contact consent</span><strong className="mt-2 block text-3xl">{consented}</strong></div><div className="rounded-2xl bg-[#C8320A] p-5"><span className="text-xs text-white/70">Average rating</span><strong className="mt-2 block text-3xl">{average.toFixed(1)} / 5</strong></div></div>
      </section>
      {status ? <p className="rounded-2xl bg-[#FFF4DA] p-4 text-sm text-[#765A13]">{status}</p> : null}
      <section className="rounded-[30px] border border-[#d6dfe9] bg-white p-6"><h2 className="text-xl font-bold">Recent reviews</h2><div className="mt-5 space-y-3">{reviews.length ? reviews.map((review) => <article key={review.id} className="rounded-2xl bg-[#F4F7FA] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><strong>{review.rating}/5 · {review.category}</strong><span className="text-xs text-[#6C7D8D]">{new Date(review.created_at).toLocaleDateString("en-NG")}</span></div><p className="mt-3 text-sm leading-6 text-[#34485C]">{review.message}</p><p className="mt-3 text-xs text-[#6C7D8D]">{review.email ?? "Email unavailable"}</p></article>) : <p className="text-sm text-[#6C7D8D]">No reviews submitted yet.</p>}</div></section>
    </div>
  );
}
