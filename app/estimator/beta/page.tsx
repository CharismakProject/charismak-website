import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Download, Mail, MessageSquareText, ShieldCheck, Smartphone } from "lucide-react";

export const metadata: Metadata = {
  title: "Estimator Beta Access",
  description: "Private beta access to the Charismak Construction Estimator.",
  robots: { index: false, follow: false, nocache: true },
};

const estimatorUrl = "/estimator/app";
const steps = [
  { number: "01", title: "Open the beta", text: "Use the button below to open the secure Charismak Estimator." },
  { number: "02", title: "Verify your email", text: "Enter your email and use the secure sign-in link sent to your inbox." },
  { number: "03", title: "Install on your phone", text: "Tap the permanent Install App button. If needed, it will show the exact step for your phone." },
];

export default function EstimatorBetaPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F8FA] pt-20 text-[#071E33]">
      <section className="relative bg-[#071E33] px-5 py-16 text-white md:px-8 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(200,164,93,0.16),transparent_28rem)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-[#C8A45D]/35 bg-[#C8A45D]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#F2B544]">Private beta</span>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">Invitation access</span>
            </div>
            <h1 className="mt-8 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl">Carry a construction estimator in your pocket.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">Measure work, build rates, prepare material schedules and export professional bills of quantities from your phone or computer.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={estimatorUrl} className="inline-flex items-center justify-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white">Open Beta & Install <Download className="h-5 w-5" /></Link>
              <Link href="/estimator" className="inline-flex items-center justify-center gap-3 border border-white/20 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">Learn about the estimator <ArrowRight className="h-5 w-5" /></Link>
            </div>
            <p className="mt-5 max-w-xl text-xs leading-6 text-white/45">This invitation page is not listed in the website menu. Please share it only with approved beta testers.</p>
          </div>

          <div className="border border-white/12 bg-white/[0.055] p-7 text-white shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#F2B544]">Beta tester pass</p><h2 className="mt-2 text-2xl font-semibold">Charismak Estimator</h2></div>
              <Smartphone className="h-9 w-9 text-[#F2B544]" />
            </div>
            <div className="mt-8 space-y-4 border-t border-white/12 pt-6 text-sm text-white/70">
              <p className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#F2B544]" />Email-only sign in</p>
              <p className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#F2B544]" />Secure tester access</p>
              <p className="flex items-center gap-3"><MessageSquareText className="h-5 w-5 text-[#F2B544]" />In-app feedback</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="bg-white p-7">
                <span className="text-xs font-bold tracking-[0.2em] text-[#C8A45D]">{step.number}</span>
                <h2 className="mt-5 text-xl font-semibold">{step.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[#3A4653]">{step.text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 lg:grid-cols-[1fr_0.72fr]">
            <div className="bg-white p-7 md:p-9">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C8A45D]">Phone Installation</p>
              <div className="mt-7 grid gap-7 sm:grid-cols-2">
                <div><h2 className="text-lg font-semibold">Android</h2><p className="mt-3 text-sm leading-7 text-[#3A4653]">Open the estimator, then tap the visible <strong>Install App</strong> button. Chrome will open its native prompt or show the exact menu step.</p></div>
                <div><h2 className="text-lg font-semibold">iPhone</h2><p className="mt-3 text-sm leading-7 text-[#3A4653]">Open the estimator in Safari and tap the visible <strong>Install App</strong> button for the Share → Add to Home Screen instruction.</p></div>
              </div>
            </div>
            <div className="bg-[#0D3B66] p-7 text-white md:p-9">
              <CheckCircle2 className="h-8 w-8 text-[#F2B544]" />
              <h2 className="mt-6 text-2xl font-semibold">Ready to test?</h2>
              <p className="mt-3 text-sm leading-7 text-white/72">Use a real project or sample quantities, export a BOQ and tell us what would make your estimating work faster.</p>
              <Link href={estimatorUrl} className="mt-7 inline-flex items-center gap-3 bg-[#C8A45D] px-6 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white">Start beta testing <ArrowRight className="h-5 w-5" /></Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
