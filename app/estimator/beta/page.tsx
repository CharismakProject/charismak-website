import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Estimator Beta Access",
  description:
    "Private beta access to the Charismak Construction Estimator.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

const estimatorUrl =
  process.env.NEXT_PUBLIC_ESTIMATOR_URL ||
  "https://charismak-construction-estimator-beta.charismakprojectnigl.chatgpt.site";

const steps = [
  {
    number: "01",
    title: "Open the beta",
    text: "Use the button below to open the secure Charismak Estimator.",
  },
  {
    number: "02",
    title: "Verify your email",
    text: "Enter your email and use the secure sign-in link sent to your inbox.",
  },
  {
    number: "03",
    title: "Install on your phone",
    text: "Choose Install App or Add to Home Screen from your browser menu.",
  },
];

export default function EstimatorBetaPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#EEF3F8] pt-20 text-[#071E33]">
      <section className="relative px-5 pb-12 pt-10 md:px-8 md:pb-20 md:pt-16">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[#071E33]" />
        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[#0D3B66] opacity-70 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid overflow-hidden border border-white/10 bg-[#0A2945] shadow-[0_30px_100px_rgba(7,30,51,0.28)] lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-7 text-white sm:p-10 lg:p-14">
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-[#A82B05] px-3 py-2 text-[11px] font-black uppercase tracking-[0.22em]">
                  Private beta
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#F2B544]">
                  Invitation access
                </span>
              </div>

              <h1 className="mt-8 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
                Carry a construction estimator in your pocket.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
                Measure work, build rates, prepare material schedules and export
                professional bills of quantities from your phone or computer.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={estimatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-3 bg-[#D8320A] px-7 py-4 text-sm font-black text-white shadow-[0_16px_40px_rgba(216,50,10,0.28)] transition hover:bg-[#F2B544] hover:text-[#071E33]"
                >
                  Open & Install Beta <Download className="h-5 w-5" />
                </Link>
                <Link
                  href="/estimator"
                  className="inline-flex items-center justify-center gap-3 border border-white/20 px-7 py-4 text-sm font-bold text-white transition hover:border-[#F2B544] hover:bg-white/5"
                >
                  Learn about the estimator <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <p className="mt-5 max-w-xl text-xs leading-6 text-white/48">
                This invitation page is not listed in the website menu. Please
                share it only with approved beta testers.
              </p>
            </div>

            <div className="relative flex min-h-[22rem] items-center justify-center overflow-hidden bg-[#124B78] p-8">
              <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="relative w-full max-w-sm border border-white/15 bg-[#071E33]/75 p-7 text-white shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#F2B544]">
                      Beta tester pass
                    </p>
                    <h2 className="mt-2 text-2xl font-bold">Charismak Estimator</h2>
                  </div>
                  <Smartphone className="h-9 w-9 text-[#F2B544]" />
                </div>
                <div className="mt-8 space-y-4 border-t border-white/12 pt-6 text-sm text-white/72">
                  <p className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-[#F2B544]" /> Email-only sign in
                  </p>
                  <p className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-[#F2B544]" /> Secure tester access
                  </p>
                  <p className="flex items-center gap-3">
                    <MessageSquareText className="h-5 w-5 text-[#F2B544]" /> In-app feedback
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="border border-[#0D3B66]/10 bg-white p-6 shadow-[0_14px_40px_rgba(7,30,51,0.06)]"
              >
                <span className="text-xs font-black tracking-[0.2em] text-[#A82B05]">
                  {step.number}
                </span>
                <h2 className="mt-5 text-xl font-bold">{step.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#526171]">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.72fr]">
          <div className="border border-[#0D3B66]/10 bg-white p-7 md:p-9">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#A82B05]">
              Phone installation
            </p>
            <div className="mt-7 grid gap-7 sm:grid-cols-2">
              <div>
                <h2 className="text-lg font-bold">Android</h2>
                <p className="mt-3 text-sm leading-7 text-[#526171]">
                  Open the estimator in Chrome, tap the three-dot menu, then
                  choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-bold">iPhone</h2>
                <p className="mt-3 text-sm leading-7 text-[#526171]">
                  Open the estimator in Safari, tap <strong>Share</strong>, then
                  choose <strong>Add to Home Screen</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#D8320A] p-7 text-white md:p-9">
            <CheckCircle2 className="h-8 w-8 text-[#F2B544]" />
            <h2 className="mt-6 text-2xl font-bold">Ready to test?</h2>
            <p className="mt-3 text-sm leading-7 text-white/75">
              Use a real project or sample quantities, export a BOQ and tell us
              what would make your estimating work faster.
            </p>
            <Link
              href={estimatorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-3 bg-white px-6 py-4 text-sm font-black text-[#071E33]"
            >
              Start beta testing <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
