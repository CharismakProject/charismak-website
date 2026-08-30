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
  Send,
} from "lucide-react";
import QuickEstimateHome from "@/components/public/quick-estimate-home";

export const metadata: Metadata = {
  title: "Construction Cost Estimator",
  description: "Choose a quick construction cost estimate or continue into Charismak's detailed public estimator for buildings, renovation, steel, finishes, MEP, external works and furniture.",
};

export default function EstimatorPage() {
  return (
    <main className="overflow-hidden bg-[#F7F8FA] pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-20 text-white md:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(200,164,93,0.17),transparent_30rem)]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-[#C8A45D]/35 bg-[#C8A45D]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Charismak Cost Planner</span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">No account required</span>
            </div>
            <h1 className="mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Start with the level of
              <span className="mt-2 block text-[#E8C77F]">detail you have.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-white/72 md:text-lg">Need a number quickly? Start with a few project facts. Have more information? Use the detailed estimator to work through the construction decisions that materially change cost.</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="#quick-estimate" className="inline-flex items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white">Get a quick estimate <ArrowRight className="h-5 w-5" /></a>
              <Link href="/estimator/detailed" className="inline-flex items-center gap-3 border border-white/25 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]">Open detailed estimate <ClipboardList className="h-5 w-5" /></Link>
            </div>
            <p className="mt-5 text-xs leading-6 text-white/48">Both use the same underlying Charismak planning logic. The difference is how much project information you provide.</p>
          </div>

          <div className="grid gap-px overflow-hidden border border-white/12 bg-white/10 shadow-[0_32px_90px_rgba(0,0,0,0.28)] md:grid-cols-2">
            <article className="bg-[#0B2944] p-7 md:p-8">
              <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center bg-[#C8A45D] text-[#071E33]"><Gauge className="h-6 w-6" /></span><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">About 1 minute</span></div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Quick Estimate</p>
              <h2 className="mt-3 text-2xl font-semibold">Fast early budget range.</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">Project type, location, approximate size and specification. Best when you only need to know whether an idea is broadly affordable.</p>
              <a href="#quick-estimate" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white">Start quick <ArrowRight className="h-4 w-4 text-[#F2B544]" /></a>
            </article>

            <article className="bg-[#071E33] p-7 md:p-8">
              <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center border border-[#C8A45D]/40 bg-[#C8A45D]/10 text-[#F2B544]"><Layers3 className="h-6 w-6" /></span><span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">More project detail</span></div>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Detailed Estimate</p>
              <h2 className="mt-3 text-2xl font-semibold">The full estimator you already know.</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">Measured quantities, construction details, systems, comparisons, savings, budget checks, programme, cash flow and project handoff to Charismak.</p>
              <Link href="/estimator/detailed" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white">Open detailed estimate <ArrowRight className="h-4 w-4 text-[#F2B544]" /></Link>
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
              ["You know room counts / systems / finishes", "Possible", "Recommended"],
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
        </div>
      </section>

      <section className="bg-white px-5 py-20 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden border border-[#0D3B66]/10 bg-[#0D3B66]/10 md:grid-cols-3">
          {[
            { icon: Calculator, title: "Same cost logic", text: "Quick and Detailed are built on the same core estimating engine, so moving forward means adding information rather than starting a different calculation." },
            { icon: Clock3, title: "Progressive detail", text: "Start in seconds, then continue into the detailed questionnaire when the project is ready for more assumptions to be replaced by actual project facts." },
            { icon: Send, title: "Connected handoff", text: "The detailed result can still move directly into Contact Charismak with the project summary, estimate and supporting documents." },
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
