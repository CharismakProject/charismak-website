import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Gauge,
  Layers3,
  PackageCheck,
  Send,
} from "lucide-react";
import QuickEstimateHome from "@/components/public/quick-estimate-home";

export const metadata: Metadata = {
  title: "Construction Cost & Material Estimator",
  description: "Choose a quick construction cost estimate, detailed estimate or material quantity estimate for buildings, renovation, steel, finishes, MEP, external works and furniture.",
};

export default function EstimatorPage() {
  return (
    <main className="overflow-hidden bg-[#F7F8FA] pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-20 text-white md:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(200,164,93,0.17),transparent_30rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-[#C8A45D]/35 bg-[#C8A45D]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Charismak Cost Planner</span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">No account required</span>
            </div>
            <h1 className="mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">Start with what you need to know.</h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">Get an early project budget, work through a detailed construction estimate, or calculate the actual quantities of materials you need for a specific work item.</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="#quick-estimate" className="inline-flex items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white">Quick cost estimate <ArrowRight className="h-5 w-5" /></a>
              <Link href="/estimator/detailed" className="inline-flex items-center gap-3 border border-white/25 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">Detailed estimate <ClipboardList className="h-5 w-5" /></Link>
              <Link href="/estimator/materials" className="inline-flex items-center gap-3 border border-[#C8A45D]/40 bg-[#C8A45D]/10 px-7 py-4 text-sm font-bold text-[#E8C77F] transition hover:bg-[#C8A45D] hover:text-[#071E33]">Material estimate <PackageCheck className="h-5 w-5" /></Link>
            </div>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden border border-white/12 bg-white/10 shadow-[0_32px_90px_rgba(0,0,0,0.28)] md:grid-cols-3">
            <article className="bg-[#0B2944] p-7 md:p-8">
              <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center bg-[#C8A45D] text-[#071E33]"><Gauge className="h-6 w-6" /></span><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">About 2-3 minutes</span></div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Quick Estimate</p>
              <h2 className="mt-3 text-2xl font-semibold">Fast early project budget.</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">Major cost drivers such as use, rooms, floors, finishing, roof, external works and category-specific quantities.</p>
              <a href="#quick-estimate" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white">Start quick <ArrowRight className="h-4 w-4 text-[#F2B544]" /></a>
            </article>

            <article className="bg-[#071E33] p-7 md:p-8">
              <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center border border-[#C8A45D]/40 bg-[#C8A45D]/10 text-[#F2B544]"><Layers3 className="h-6 w-6" /></span><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">More project detail</span></div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Detailed Estimate</p>
              <h2 className="mt-3 text-2xl font-semibold">A deeper construction cost model.</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">Measured quantities, construction systems, comparisons, savings, budget checks, programme, cash flow and project handoff.</p>
              <Link href="/estimator/detailed" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white">Open detailed estimate <ArrowRight className="h-4 w-4 text-[#F2B544]" /></Link>
            </article>

            <article className="bg-[#0B2944] p-7 md:p-8">
              <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center border border-[#C8A45D]/40 bg-[#C8A45D]/10 text-[#F2B544]"><PackageCheck className="h-6 w-6" /></span><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Quantity / procurement</span></div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Material Estimate</p>
              <h2 className="mt-3 text-2xl font-semibold">How much material do I need?</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">Concrete mix materials, reinforcement, blocks, plaster, partitions, curtain wall, cladding, tiles, paint, roofing and formwork.</p>
              <Link href="/estimator/materials" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white">Estimate materials <ArrowRight className="h-4 w-4 text-[#F2B544]" /></Link>
            </article>
          </div>
        </div>
      </section>

      <QuickEstimateHome />

      <section className="px-5 py-20 md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#C8A45D]">Quick or Detailed?</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[0.62fr_1.38fr] lg:items-end">
            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-[#071E33] md:text-5xl">Use the right level of certainty for the decision you are making.</h2>
            <p className="max-w-md text-sm leading-7 text-[#3A4653] lg:justify-self-end">A quick answer is useful when the project is still an idea. As drawings, quantities and specifications become available, move into the detailed estimator rather than forcing precision too early.</p>
          </div>

          <div className="mt-10 overflow-hidden border border-[#0D3B66]/10 bg-white shadow-[0_16px_50px_rgba(7,30,51,0.06)]">
            <div className="grid border-b border-[#0D3B66]/10 bg-[#F7F8FA] sm:grid-cols-[1.2fr_1fr_1fr]">
              <div className="p-5 text-xs font-bold uppercase tracking-[0.15em] text-[#3A4653]/55">Decision</div>
              <div className="p-5 text-xs font-bold uppercase tracking-[0.15em] text-[#0D3B66]">Quick Estimate</div>
              <div className="p-5 text-xs font-bold uppercase tracking-[0.15em] text-[#0D3B66]">Detailed Estimate</div>
            </div>
            {[
              ["Project is only an early idea", "Best fit", "Optional"],
              ["You know approximate size and location", "Best fit", "Best fit"],
              ["You know room counts / systems / finishes", "Included", "Recommended"],
              ["You have measured quantities or drawings", "Too broad", "Recommended"],
              ["You want option comparisons and savings", "No", "Included"],
              ["You want programme / cash-flow guidance", "No", "Included"],
            ].map(([decision, quick, detailed]) => (
              <div key={decision} className="grid border-b border-[#0D3B66]/10 last:border-b-0 sm:grid-cols-[1.2fr_1fr_1fr]">
                <div className="p-5 text-sm font-semibold text-[#071E33]">{decision}</div>
                <div className="p-5 text-sm text-[#3A4653]">{quick}</div>
                <div className="p-5 text-sm text-[#3A4653]">{detailed}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 border border-[#C8A45D]/30 bg-[#FFF9ED] p-6 md:flex md:items-center md:justify-between md:gap-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9A6416]">Need quantities instead of cost?</p><h3 className="mt-2 text-2xl font-semibold text-[#071E33]">Use the Material Estimate.</h3><p className="mt-2 max-w-3xl text-sm leading-7 text-[#74520D]">For example: cement/sand/granite for concrete, block quantities for walling, reinforcement weight, gypsum partition components, curtain-wall modules or roofing sheets.</p></div><Link href="/estimator/materials" className="mt-5 inline-flex shrink-0 items-center gap-2 bg-[#071E33] px-5 py-3 text-xs font-bold text-white md:mt-0">Open Material Estimate <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 md:grid-cols-3">
          {[
            { icon: Calculator, title: "Same cost logic", text: "Quick and Detailed are built on the same core estimating engine, so moving forward means adding information rather than starting a different calculation." },
            { icon: Clock3, title: "Progressive detail", text: "Start with the information you have, then replace assumptions with actual quantities and specifications as the project develops." },
            { icon: Send, title: "Connected handoff", text: "The detailed result can move directly into Contact Charismak with the project summary, estimate and supporting documents." },
          ].map(({ icon: Icon, title, text }) => <article key={title} className="bg-white p-7 md:p-8"><Icon className="h-6 w-6 text-[#0D3B66]" /><h3 className="mt-6 text-xl font-semibold text-[#071E33]">{title}</h3><p className="mt-3 text-sm leading-7 text-[#3A4653]">{text}</p></article>)}
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-16 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F2B544]">Need More Certainty?</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Move from a planning number to a project-specific figure.</h2>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/68">{["Drawings review", "Measured quantities", "Specification review", "Current rate check"].map((item) => <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F2B544]" />{item}</span>)}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/estimator/detailed" className="inline-flex w-fit items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white">Detailed Estimate <ArrowRight className="h-5 w-5" /></Link>
            <Link href="/contact" className="inline-flex w-fit items-center gap-3 border border-white/20 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">Contact Charismak</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
