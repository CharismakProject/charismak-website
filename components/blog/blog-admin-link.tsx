"use client";

import { useEffect, useMemo, useState } from "react";
import { Settings2 } from "lucide-react";
import Link from "next/link";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function BlogAdminLink() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!client) return;
    let active = true;
    void client.auth.getSession().then(({ data }) => {
      if (active) setVisible(isAdminEmail(data.session?.user.email));
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => setVisible(isAdminEmail(session?.user.email)));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  return visible ? <Link href="/blog/manage" className="inline-flex items-center gap-2 rounded-xl border border-[#E7B34B]/60 px-5 py-3 text-sm font-bold text-[#E7B34B]"><Settings2 className="h-4 w-4" />Manage articles</Link> : null;
}
