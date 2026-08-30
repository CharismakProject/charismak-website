"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Newspaper, PackageSearch, Tags } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminPrimaryActions() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!client) return;
    let mounted = true;
    void client.auth.getSession().then(({ data }) => {
      if (mounted) setVisible(Boolean(data.session && isAdminEmail(data.session.user.email)));
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setVisible(Boolean(session && isAdminEmail(session.user.email)));
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  if (!visible) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-8 md:px-8 md:pt-12">
      <div className="rounded-[1.75rem] border border-[#DCE4EC] bg-white p-5 shadow-[0_12px_40px_rgba(7,30,51,0.05)] md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#A82B05]">Management shortcuts</p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33]">What do you want to manage?</h2>
            <p className="mt-2 text-sm leading-6 text-[#617286]">The two main publishing areas are always available here: construction catalogue and website content.</p>
          </div>
          <Link href="/admin" className="text-xs font-black text-[#0D3B66]">Control Centre</Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Link href="/catalogue-admin" className="group rounded-2xl bg-[#0D3B66] p-5 text-white transition hover:-translate-y-0.5 md:p-6">
            <div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#F2B544]"><PackageSearch className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-white/55 transition group-hover:translate-x-1" /></div>
            <h3 className="mt-5 text-xl font-black">Catalogue Management</h3>
            <p className="mt-2 text-sm leading-6 text-white/68">Add and edit materials, equipment, labour and specialist items; upload product photos; manage specifications, units and public visibility.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#F2B544]">Open catalogue manager <ArrowRight className="h-3.5 w-3.5" /></span>
          </Link>

          <Link href="/blog/manage" className="group rounded-2xl bg-[#071E33] p-5 text-white transition hover:-translate-y-0.5 md:p-6">
            <div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#F2B544]"><Newspaper className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-white/55 transition group-hover:translate-x-1" /></div>
            <h3 className="mt-5 text-xl font-black">News & Learning Content</h3>
            <p className="mt-2 text-sm leading-6 text-white/68">Create news, guides and learning articles; edit drafts, publish or unpublish stories, and remove outdated content.</p>
            <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[#F2B544]">Open content manager <ArrowRight className="h-3.5 w-3.5" /></span>
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Link href="/price-admin" className="flex min-h-12 items-center justify-between rounded-xl border border-[#DCE4EC] px-4 text-sm font-black text-[#071E33]"><span className="inline-flex items-center gap-2"><Tags className="h-4 w-4 text-[#A82B05]" />Market Price Management</span><ArrowRight className="h-4 w-4" /></Link>
          <Link href="/blog" target="_blank" className="flex min-h-12 items-center justify-between rounded-xl border border-[#DCE4EC] px-4 text-sm font-black text-[#071E33]"><span className="inline-flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#A82B05]" />View News & Learning</span><ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}
