"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

/** Shows its children only to a signed-in Charismak administrator. */
export default function AdminGate({ children }: { children: ReactNode }) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<"checking" | "admin" | "denied">("checking");
  useEffect(() => {
    if (!client) { setState("denied"); return; }
    void client.auth.getSession().then(({ data }) => setState(isAdminEmail(data.session?.user.email) ? "admin" : "denied"));
  }, [client]);
  if (state === "admin") return <>{children}</>;
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--cx-void)] px-5 pt-20 text-white">
      {state === "checking" ? <Loader2 className="h-7 w-7 animate-spin text-[var(--cx-gold)]" /> : (
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Administrators only</h1>
          <p className="mt-3 text-sm text-white/75">This tool is for Charismak staff. Sign in on the Admin page with an administrator email, then come back.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/admin" className="rounded-lg bg-[var(--cx-gold)] px-4 py-2 text-sm font-bold text-[#0A1A2F]">Admin sign-in</Link>
            <Link href="/construction-studio/design" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-bold">Space Planner</Link>
          </div>
        </div>
      )}
    </main>
  );
}
