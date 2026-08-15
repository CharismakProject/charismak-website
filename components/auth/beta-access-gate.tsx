"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Ruler,
} from "lucide-react";

import EstimatorLogo from "@/components/estimator/ui/logo";
import { isAdminEmail } from "@/lib/auth/admin";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/browser";
import { BetaSessionContext } from "./beta-session";

export default function BetaAccessGate({ children }: { children: ReactNode }) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [email, setEmail] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [contactConsent, setContactConsent] = useState(true);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!client) return;
    let active = true;

    void client.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = client.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (!client || !session?.user) return;
    const consent = Boolean(session.user.user_metadata?.contact_consent);
    void client.from("beta_profiles").upsert(
      {
        user_id: session.user.id,
        email: session.user.email,
        contact_consent: consent,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }, [client, session]);

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!client || !privacyAccepted || !email.trim()) return;
    setSubmitting(true);
    setMessage("");

    const { error } = await client.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/estimator/app`,
        shouldCreateUser: true,
        data: {
          contact_consent: contactConsent,
          access_source: "estimator-beta",
        },
      },
    });

    setSubmitting(false);
    setMessage(
      error
        ? error.message
        : "Check your email and tap the secure sign-in link to open the estimator.",
    );
  };

  const signOut = async () => {
    await client?.auth.signOut();
  };

  const userEmail = session?.user.email?.toLowerCase() ?? null;
  const value = {
    user: session?.user ?? null,
    email: userEmail,
    isAdmin: isAdminEmail(userEmail),
    signOut,
  };

  if (!client) {
    return (
      <BetaSessionContext.Provider value={value}>
        {children}
      </BetaSessionContext.Provider>
    );
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#071E33] p-6 text-white">
        <p className="text-sm font-semibold tracking-wide">
          Opening Charismak Estimator…
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#F3F6F9] p-3 text-[#081B36] sm:p-6 lg:p-8">
        <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1180px] overflow-hidden rounded-3xl border border-[#DCE4EC] bg-white shadow-[0_24px_80px_rgba(8,27,54,0.13)] sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="relative flex flex-col overflow-hidden bg-[#081B36] p-5 text-white sm:p-8 lg:p-11">
            <div className="absolute -right-28 -top-28 h-72 w-72 rounded-full border-[48px] border-white/[0.035]" />
            <div className="relative max-w-[260px] rounded-2xl bg-white p-2.5">
              <EstimatorLogo />
            </div>

            <div className="relative py-8 sm:py-10 lg:py-14">
              <span className="inline-flex rounded-full bg-[#E7B34B]/14 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#E7B34B]">Construction estimating platform</span>
              <h1 className="mt-5 max-w-xl text-3xl font-bold leading-tight sm:text-4xl lg:text-[44px]">Build estimates with confidence.</h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#B8C9D9] sm:text-base sm:leading-7">A guided workspace for homeowners, builders and professionals—from first dimensions to a structured BOQ.</p>

              <div className="mt-6 grid grid-cols-3 gap-2.5">
                {[
                  { icon: FolderKanban, label: "Projects" },
                  { icon: Ruler, label: "Measurements" },
                  { icon: ClipboardList, label: "BOQ output" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
                    <Icon className="h-4 w-4 text-[#E7B34B]" />
                    <p className="mt-3 text-[10px] font-semibold text-[#D4E0EB] sm:text-xs">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 hidden rounded-2xl border border-white/10 bg-[#102E4E] p-4 sm:block">
                <div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#8FA6BE]">Inside your workspace</p><p className="mt-1 text-sm font-bold">A dashboard built around real projects</p></div><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E7B34B] text-[#081B36]"><CheckCircle2 className="h-4 w-4" /></span></div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full w-2/3 rounded-full bg-[#45C78B]" /></div>
              </div>
            </div>

            <p className="relative mt-auto text-[10px] leading-5 text-[#8FA6BE]">Secure beta access · Editable local rates · Mobile-ready workspace</p>
          </section>

          <section className="flex items-center p-5 sm:p-8 lg:p-12">
            <form onSubmit={submitEmail} className="mx-auto w-full max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8320A]">Secure beta access</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Open your estimator</h2>
              <p className="mt-2 text-sm leading-6 text-[#617286]">Enter your email and we will send a secure one-tap sign-in link. No password is required.</p>

              <label className="mt-7 block text-sm font-semibold" htmlFor="beta-email">
                Email address
              </label>
              <input
                id="beta-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-4 py-3.5 outline-none transition focus:border-[#175FC4] focus:ring-4 focus:ring-[#175FC4]/10"
              />

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[#DCE4EC] bg-[#F8FAFC] p-3.5 text-xs leading-5 text-[#526579] transition hover:border-[#9BB1C7]">
                <input
                  type="checkbox"
                  required
                  checked={privacyAccepted}
                  onChange={(event) => setPrivacyAccepted(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#175FC4]"
                />
                <span>
                  <strong className="block text-[#071E33]">Required for access</strong>
                  I agree to the use of my email for estimator access, security
                  and essential service communication.
                </span>
              </label>
              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-[#DCE4EC] bg-white p-3.5 text-xs leading-5 text-[#526579] transition hover:border-[#9BB1C7]">
                <input
                  type="checkbox"
                  checked={contactConsent}
                  onChange={(event) => setContactConsent(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#175FC4]"
                />
                <span>
                  <strong className="block text-[#071E33]">Optional beta follow-up</strong>
                  Charismak may contact me for beta feedback, review and product
                  improvement.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting || !privacyAccepted}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#081B36] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(8,27,54,0.18)] transition hover:bg-[#173B62] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Sending secure link…" : <>Email my sign-in link <ArrowRight className="h-4 w-4" /></>}
              </button>
              {!privacyAccepted ? (
                <p className="mt-3 text-center text-xs text-[#6B7D8F]">
                  Tick “Required for access” above to enable the sign-in button.
                </p>
              ) : null}
              {message ? (
                <p role="status" className="mt-4 rounded-xl bg-[#EEF3F8] p-4 text-sm leading-6 text-[#0D3B66]">
                  {message}
                </p>
              ) : null}
            </form>
          </section>
        </div>
      </main>
    );
  }

  return (
    <BetaSessionContext.Provider value={value}>
      {children}
    </BetaSessionContext.Provider>
  );
}
