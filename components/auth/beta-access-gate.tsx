"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";

import EstimatorLogo from "@/components/estimator/ui/logo";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/browser";
import { BetaSessionContext } from "./beta-session";

const adminEmails = (
  process.env.NEXT_PUBLIC_ESTIMATOR_ADMIN_EMAILS ??
  "md@charismakproject.com,info@charismakproject.com"
)
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

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
    isAdmin: Boolean(userEmail && adminEmails.includes(userEmail)),
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
      <main className="min-h-screen bg-[#071E33] px-5 py-8 text-[#071E33] sm:px-8">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[34px] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-between bg-[#0D3B66] p-7 text-white sm:p-10 lg:p-14">
            <div className="max-w-xs rounded-[26px] bg-white p-3">
              <EstimatorLogo />
            </div>
            <div className="py-12">
              <span className="rounded-full bg-[#E7B34B]/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#E7B34B]">
                Public beta access
              </span>
              <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
                Measure. Price. Export.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
                Create editable construction rate analyses, consolidate material
                requirements and export professional bills of quantities.
              </p>
            </div>
            <p className="text-xs leading-5 text-white/60">
              Your email is used for secure access, beta usage records and—only
              with your permission—product review follow-up.
            </p>
          </section>

          <section className="flex items-center p-7 sm:p-10 lg:p-14">
            <form onSubmit={submitEmail} className="w-full">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8320A]">
                Welcome to the beta
              </p>
              <h2 className="mt-3 text-3xl font-bold">Continue with your email</h2>
              <p className="mt-3 text-sm leading-6 text-[#526579]">
                No password is required. We will email you a secure one-tap
                sign-in link.
              </p>

              <label className="mt-8 block text-sm font-semibold" htmlFor="beta-email">
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
                className="mt-2 w-full rounded-2xl border border-[#C7D5E3] bg-[#F7F9FB] px-4 py-4 outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
              />

              <label className="mt-6 flex cursor-pointer items-start gap-4 rounded-2xl border border-[#D6E0EA] bg-[#F7F9FB] p-4 text-sm leading-6 text-[#34485C] transition hover:border-[#0D3B66]/40">
                <input
                  type="checkbox"
                  required
                  checked={privacyAccepted}
                  onChange={(event) => setPrivacyAccepted(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#C8320A]"
                />
                <span>
                  <strong className="block text-[#071E33]">Required for access</strong>
                  I agree to the use of my email for estimator access, security
                  and essential service communication.
                </span>
              </label>
              <label className="mt-3 flex cursor-pointer items-start gap-4 rounded-2xl border border-[#D6E0EA] bg-white p-4 text-sm leading-6 text-[#34485C] transition hover:border-[#0D3B66]/40">
                <input
                  type="checkbox"
                  checked={contactConsent}
                  onChange={(event) => setContactConsent(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#C8320A]"
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
                className="mt-7 w-full rounded-2xl bg-[#C8320A] px-5 py-4 text-sm font-bold text-white shadow-[0_16px_35px_rgba(200,50,10,0.22)] transition hover:bg-[#AE2B08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Sending secure link…" : "Email my sign-in link"}
              </button>
              {!privacyAccepted ? (
                <p className="mt-3 text-center text-xs text-[#6B7D8F]">
                  Tick “Required for access” above to enable the sign-in button.
                </p>
              ) : null}
              {message ? (
                <p role="status" className="mt-4 rounded-2xl bg-[#EEF3F8] p-4 text-sm leading-6 text-[#0D3B66]">
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
