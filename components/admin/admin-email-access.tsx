"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Mail, ShieldCheck } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminEmailAccess() {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("info@charismakproject.com");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!client) return;

    let mounted = true;
    void client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSignedIn(Boolean(data.session && isAdminEmail(data.session.user.email)));
    });

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSignedIn(Boolean(session && isAdminEmail(session.user.email)));
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  const sendLink = async () => {
    if (!client) {
      setError("Admin authentication is unavailable.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setMessage("");
    setError("");

    if (!isAdminEmail(cleanEmail)) {
      setError("Use an authorised Charismak administrator email.");
      return;
    }

    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/admin`;
      const { error: authError } = await client.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: false,
        },
      });

      if (authError) {
        setError(authError.message || "Unable to send the secure sign-in link.");
        return;
      }

      setMessage(`Secure sign-in link sent to ${cleanEmail}. Open that email on this device and use the link to return to the Admin Control Centre.`);
    } finally {
      setBusy(false);
    }
  };

  if (signedIn) return null;

  return (
    <div className="mx-auto max-w-md px-4 pt-8 md:px-8">
      <section className="rounded-[1.5rem] border border-[#CFE0EE] bg-[#F3F8FC] p-5 shadow-[0_12px_36px_rgba(7,30,51,0.05)] sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#0D3B66] text-white">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Password not working?</p>
            <h2 className="mt-1 text-lg font-black text-[#071E33]">Use a secure email sign-in link</h2>
            <p className="mt-2 text-xs leading-5 text-[#617286]">No password is required. We will send a one-time admin access link to an authorised Charismak email.</p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="Authorised admin email"
            className="min-h-12 w-full rounded-xl border border-[#C9D8E5] bg-white px-4 text-base text-[#071E33] outline-none focus:border-[#0D3B66]"
          />

          {message ? (
            <div className="flex items-start gap-2 rounded-xl border border-[#CFE4D7] bg-white px-4 py-3 text-sm leading-6 text-[#197447]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{message}</span>
            </div>
          ) : null}

          {error ? <p className="rounded-xl border border-[#F1C8C0] bg-white px-4 py-3 text-sm text-[#8B1E00]">{error}</p> : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => void sendLink()}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#071E33] px-5 text-sm font-black text-white disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {busy ? "Sending…" : "Send secure sign-in link"}
          </button>
        </div>
      </section>
    </div>
  );
}
