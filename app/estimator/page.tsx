import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, Calculator, CheckCircle2, FileSpreadsheet, HardHat, MessageSquareText, Smartphone } from "lucide-react";
import QuickCostEstimator from "@/components/public/quick-cost-estimator";

export const metadata: Metadata = {
  title: "Construction Estimator",
  description: "Calculate construction quantities, analyse unit rates and generate professional bills of quantities with the Charismak Construction Estimator.",
};

const estimatorUrl = "/estimator/app";
const modules = ["Complete project estimate", "Specialist fence estimate", "Concrete and blockwork", "Reinforcement and formwork", "Excavation and earthworks", "Electrical and mechanical work", "Price and rate library", "Professional BOQ export"];

export default function EstimatorPage() {
  return (
    <main className="overflow-hidden bg-[#F7F8FA] pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-20 text-white md:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(200,164,93,0.16),transparent_30rem)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-[#C8A45D]/35 bg-[#C8A45D]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Public beta</span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Charismak Digital Tools</span>
            </div>
            <h1 className="mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Construction estimating
              <span className="mt-2 block text-[#E8C77F]">without the spreadsheet maze.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/72 md:text-lg">Measure construction work, adjust rate assumptions, consolidate material requirements and generate professional priced bills from one connected workspace.</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href={estimatorUrl} className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33]">Launch Estimator <ArrowRight className="h-5 w-5" /></Link>
              <a href="#how-it-works" className="inline-flex items-center gap-3 border border-white/25 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">See how it works</a>
            </div>
            <p className="mt-5 text-xs leading-6 text-white/48">Enter your email to receive a secure sign-in link. No password is required.</p>
          </div>

          <div className="border border-white/12 bg-white/[0.055] p-6 shadow-[0_32px_90px_rgba(0,0,0,0.28)] backdrop-blur md:p-8">
            <div className="flex items-center justify-between border-b border-white/12 pb-5">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F2B544]">Estimator workspace</p><h2 className="mt-2 text-2xl font-semibold">Measure · Price · Export</h2></div>
              <HardHat className="h-8 w-8 text-[#F2B544]" />
            </div>
            <div className="mt-6 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
              {[{ icon: Calculator, label: "Measured work", value: "51 templates" }, { icon: BarChart3, label: "Rate analysis", value: "Editable" }, { icon: FileSpreadsheet, label: "BOQ output", value: "Excel & PDF" }, { icon: Smartphone, label: "Phone access", value: "Installable" }].map(({ icon: Icon, label, value }) => (
                <article key={label} className="bg-[#071E33]/55 p-5"><Icon className="h-5 w-5 text-[#F2B544]" /><p className="mt-5 text-xs text-white/50">{label}</p><strong className="mt-1 block text-lg font-semibold">{value}</strong></article>
              ))}
            </div>
            <div className="mt-5 border-l border-[#C8A45D] bg-[#C8A45D]/10 p-4 text-sm leading-6 text-white/72">Built for Nigerian and African construction workflows, with editable rates and project assumptions.</div>
          </div>
        </div>
      </section>

      <QuickCostEstimator />

      <section id="how-it-works" className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">One Connected Workflow</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">Everything needed to turn site information into an editable estimate.</h2>
            <p className="max-w-md text-sm leading-7 text-[#3A4653] lg:justify-self-end">Start with a full project, specialist fence, or a single construction calculation.</p>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module, index) => <div key={module} className="bg-white p-6"><span className="text-xs font-bold tracking-[0.18em] text-[#C8A45D]">{String(index + 1).padStart(2, "0")}</span><p className="mt-6 font-semibold text-[#071E33]">{module}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 lg:grid-cols-2">
          <div className="bg-white p-8 md:p-10"><Smartphone className="h-7 w-7 text-[#0D3B66]" /><h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-[#071E33]">Install it on your phone</h2><p className="mt-4 leading-8 text-[#3A4653]">The estimator works as an installable web app. On Android, use Install App or Add to Home Screen. On iPhone, open it in Safari, tap Share and select Add to Home Screen.</p></div>
          <div className="bg-[#F7F8FA] p-8 md:p-10"><MessageSquareText className="h-7 w-7 text-[#0D3B66]" /><h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-[#071E33]">Shape the beta with us</h2><p className="mt-4 leading-8 text-[#3A4653]">Submit a review inside the estimator. Tell us what is missing, what is confusing and what would help you estimate construction work faster.</p></div>
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2B544]">Start Beta Testing</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Build your first estimate.</h2><div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/68">{["Email-only access", "Editable assumptions", "Phone install", "Review form"].map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F2B544]" />{item}</span>)}</div></div>
          <Link href={estimatorUrl} className="inline-flex w-fit items-center gap-3 bg-[#C8A45D] px-8 py-5 font-bold text-[#071E33] transition hover:bg-white">Open Construction Estimator <ArrowRight className="h-5 w-5" /></Link>
        </div>
      </section>
    </main>
  );
}
