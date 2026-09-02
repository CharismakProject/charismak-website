"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";

import { isAdminEmail } from "@/lib/auth/admin";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import SupplierReviewOwnershipRouter from "@/components/pricing/supplier-review-ownership-router";

type Mode = "signin" | "setup";

export default function SupplierReviewAccessGate({ batchId }: { batchId: string }) {
  const client = getSupabaseBrowserClient();
  const [checking, setChecking] = useState(true);
  const [authorised, setAuthorised] = useState(false);
  const [mode, setMode] = useState<Mode>("setup");
  const [email, setEmail] = useState("md@charismakproject.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!client) {
      setChecking(false);
      return;
    }
    let mounted = true;
    void client.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const currentEmail = data.session?.user.email || "";
      if (data.session && isAdminEmail(currentEmail)) setAuthorised(true);
      setChecking(false);
    });
    return () => { mounted = false; };
  }, [client]);

  const validate = (confirm: boolean) => {
    setError("");
    setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (!isAdminEmail(cleanEmail)) {
      setError("Use an authorised Charismak reviewer email.");
      return null;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return null;
    }
    if (confirm && password !== confirmPassword) {
      setError("The two passwords do not match.");
      return null;
    }
    return cleanEmail;
  };

  const redirectUrl = () => typeof window === "undefined" ? undefined : `${window.location.origin}/supplier-review/${encodeURIComponent(batchId)}`;

  const setup = async () => {
    if (!client) return;
    const cleanEmail = validate(true);
    if (!cleanEmail) return;
    setBusy(true);
    try {
      const { data, error: signupError } = await client.auth.signUp({ email: cleanEmail, password, options: { emailRedirectTo: redirectUrl() } });
      if (signupError) {
        if (/already|registered|exists/i.test(signupError.message || "")) {
          setMode("signin");
          setError("A reviewer account already exists for this email. Sign in instead.");
        } else setError(signupError.message);
        return;
      }
      if (data.session && data.user && isAdminEmail(data.user.email)) {
        setAuthorised(true);
        return;
      }
      setMessage("Reviewer account created. Confirm the email once, then return here and sign in.");
      setMode("signin");
      setConfirmPassword("");
    } finally {
      setBusy(false);
    }
  };

  const signIn = async () => {
    if (!client) return;
    const cleanEmail = validate(false);
    if (!cleanEmail) return;
    setBusy(true);
    try {
      const { data, error: signinError } = await client.auth.signInWithPassword({ email: cleanEmail, password });
      if (signinError || !data.user) {
        setError(signinError?.message || "Unable to sign in.");
        return;
      }
      if (!isAdminEmail(data.user.email)) {
        await client.auth.signOut();
        setError("This account is not authorised for Charismak supplier reviews.");
        return;
      }
      setAuthorised(true);
    } finally {
      setBusy(false);
    }
  };

  if (checking) return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-[#0D3B66]" /></div>;
  if (authorised) return <SupplierReviewOwnershipRouter batchId={batchId} />;

  return (
    <section className="mx-auto max-w-lg rounded-[1.5rem] border border-[#DCE4EC] bg-white p-5 shadow-[0_20px_60px_rgba(7,30,51,0.08)] sm:rounded-[2rem] sm:p-7 md:p-8">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#071E33] text-white">{mode === "setup" ? <ShieldCheck className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}</div>
      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">Private Charismak workspace</p>
      <h1 className="mt-2 text-2xl font-black text-[#071E33]">{mode === "setup" ? "Set up reviewer access" : "Sign in to review"}</h1>
      <p className="mt-2 text-sm leading-6 text-[#617286]">Supplier-linked submissions are owner-controlled. Reviewer access lets Charismak approve, reject, map materials and request corrections without silently rewriting seller values.</p>

      <div className="mt-6 space-y-4">
        <label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">Reviewer email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
        <label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">{mode === "setup" ? "Create password" : "Password"}</span><input type="password" autoComplete={mode === "setup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
        {mode === "setup" ? <label className="block"><span className="mb-2 block text-xs font-black text-[#071E33]">Confirm password</span><input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="min-h-12 w-full rounded-xl border border-[#DCE4EC] px-4 text-sm outline-none focus:border-[#0D3B66]" /></label> : null}
        {message ? <div className="flex items-start gap-2 rounded-xl border border-[#CFE4D7] bg-[#F3FBF6] px-4 py-3 text-sm text-[#197447]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{message}</div> : null}
        {error ? <p className="rounded-xl border border-[#F1C8C0] bg-[#FFF4F1] px-4 py-3 text-sm text-[#8B1E00]">{error}</p> : null}
        <button type="button" disabled={busy} onClick={() => void (mode === "setup" ? setup() : signIn())} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-5 text-sm font-black text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "setup" ? <KeyRound className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}{busy ? "Please wait…" : mode === "setup" ? "Create reviewer access" : "Sign in & review"}</button>
        <button type="button" onClick={() => { setMode((current) => current === "setup" ? "signin" : "setup"); setError(""); setMessage(""); setPassword(""); setConfirmPassword(""); }} className="min-h-11 w-full text-sm font-bold text-[#0D3B66] underline underline-offset-4">{mode === "setup" ? "I already created reviewer access" : "First time? Create reviewer access"}</button>
      </div>
    </section>
  );
}
