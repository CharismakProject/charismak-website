import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Calculator, CheckCircle2, ClipboardList, ContactRound, HardHat, Layers3 } from "lucide-react";
import PublicFeasibilityEstimatorV3 from "@/components/public/public-feasibility-estimator-v3";

export const metadata: Metadata = {
  title: "Construction Cost Estimator",
  description: "Get a preliminary construction cost range for buildings, renovations, steel fabrication, finishes, MEP, external works and furniture with Charismak Project Nigeria Limited.",
};

const modules = [
  "New building cost planning",
  "Renovation & remodelling",
  "Structural steel & fabrication",
  "Finishes & fitted elements",
  "Furniture & joinery",
  "External works",
  "MEP services",
  "Detailed estimate by Charismak",
];

export default function EstimatorPage() {
  return (
    <main className="overflow-hidden bg-[#F7F8FA] pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-20 text-white md:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(200,164,93,0.16),transparent_30rem)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-[#C8A45D]/35 bg-[#C8A45D]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Public cost planner</span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">Charismak Digital Tools</span>
            </div>
            <h1 className="mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Understand your likely
              <span className="mt-2 block text-[#E8C77F]">construction budget early.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/72 md:text-lg">Answer the questions you know and get a preliminary cost range based on project type, size, accommodation, specification, location and other major construction cost drivers.</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="#quick-building-cost" className="inline-flex items-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#C8A45D] hover:text-[#071E33]">Start cost estimate <ArrowRight className="h-5 w-5" /></a>
              <Link href="/contact" className="inline-flex items-center gap-3 border border-white/25 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">Contact Charismak</Link>
            </div>
            <p className="mt-5 text-xs leading-6 text-white/48">No account is required. For drawings, measured quantities or a formal project estimate, contact our team after reviewing the preliminary result.</p>
          </div>

          <div className="border border-white/12 bg-white/[0.055] p-6 shadow-[0_32px_90px_rgba(0,0,0,0.28)] backdrop-blur md:p-8">
            <div className="flex items-center justify-between border-b border-white/12 pb-5">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#F2B544]">Planning estimate</p><h2 className="mt-2 text-2xl font-semibold">Describe · Refine · Budget</h2></div>
              <Calculator className="h-8 w-8 text-[#F2B544]" />
            </div>
            <div className="mt-6 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
              {[
                { icon: Building2, label: "Project type", value: "Multiple scopes" },
                { icon: ClipboardList, label: "Questions", value: "Core + optional detail" },
                { icon: Layers3, label: "Cost output", value: "Element breakdown" },
                { icon: ContactRound, label: "Next step", value: "Contact our team" },
              ].map(({ icon: Icon, label, value }) => (
                <article key={label} className="bg-[#071E33]/55 p-5"><Icon className="h-5 w-5 text-[#F2B544]" /><p className="mt-5 text-xs text-white/50">{label}</p><strong className="mt-1 block text-lg font-semibold">{value}</strong></article>
              ))}
            </div>
            <div className="mt-5 border-l border-[#C8A45D] bg-[#C8A45D]/10 p-4 text-sm leading-6 text-white/72">Use the estimate for early budget planning. A project-specific estimate still requires drawings, quantities, specification review and current quotations.</div>
          </div>
        </div>
      </section>

      <PublicFeasibilityEstimatorV3 />

      <section id="how-it-works" className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">What You Can Estimate</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">One public tool for early construction budget decisions.</h2>
            <p className="max-w-md text-sm leading-7 text-[#3A4653] lg:justify-self-end">Choose the work you are planning, answer the relevant questions, then add more detail whenever you want a tighter range.</p>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module, index) => <div key={module} className="bg-white p-6"><span className="text-xs font-bold tracking-[0.18em] text-[#C8A45D]">{String(index + 1).padStart(2, "0")}</span><p className="mt-6 font-semibold text-[#071E33]">{module}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 lg:grid-cols-2">
          <div className="bg-white p-8 md:p-10"><HardHat className="h-7 w-7 text-[#0D3B66]" /><h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-[#071E33]">Use it for feasibility</h2><p className="mt-4 leading-8 text-[#3A4653]">Test a building idea, compare specification levels, understand the likely cost impact of major choices and establish a sensible early-stage budget before design is complete.</p></div>
          <div className="bg-[#F7F8FA] p-8 md:p-10"><ContactRound className="h-7 w-7 text-[#0D3B66]" /><h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-[#071E33]">Then involve the project team</h2><p className="mt-4 leading-8 text-[#3A4653]">When you need a more defensible figure, send us the project information, drawings or BOQ. Charismak can review the scope and prepare a project-specific estimate or quotation.</p></div>
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2B544]">Need More Certainty?</p><h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Let us review your project properly.</h2><div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/68">{["Drawings review", "Measured quantities", "Specification review", "Current rate check"].map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F2B544]" />{item}</span>)}</div></div>
          <Link href="/contact" className="inline-flex w-fit items-center gap-3 bg-[#C8A45D] px-8 py-5 font-bold text-[#071E33] transition hover:bg-white">Contact us for a detailed estimate <ArrowRight className="h-5 w-5" /></Link>
        </div>
      </section>
    </main>
  );
}
