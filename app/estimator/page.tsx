import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Layers3,
  PackageCheck,
} from "lucide-react";
import QuickEstimateHome from "@/components/public/quick-estimate-home";

export const metadata: Metadata = {
  title: "Construction Cost & Material Estimator",
  description:
    "Choose a quick construction cost estimate, detailed estimate or material quantity estimate for buildings, renovation, steel, finishes, MEP, external works and furniture.",
};

export default function EstimatorPage() {
  return (
    <main className="overflow-hidden bg-[#F7F8FA] pt-20">
      <section className="relative overflow-hidden bg-[#071E33] px-5 py-20 text-white md:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(200,164,93,0.17),transparent_30rem)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-[#C8A45D]/35 bg-[#C8A45D]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">
                Charismak Cost Planner
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">No account required</span>
            </div>
            <h1 className="mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Estimate a project before you commit.
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
              Start with a quick budget, build a more detailed cost estimate, or calculate material quantities for a specific work item.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#quick-estimate"
                className="inline-flex items-center gap-3 bg-[#C8A45D] px-7 py-4 text-sm font-bold text-[#071E33] transition hover:bg-white"
              >
                Quick cost estimate <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                href="/estimator/detailed"
                className="inline-flex items-center gap-3 border border-white/25 bg-white/5 px-7 py-4 text-sm font-bold text-white transition hover:bg-white hover:text-[#071E33]"
              >
                Detailed estimate <ClipboardList className="h-5 w-5" />
              </Link>
              <Link
                href="/estimator/materials"
                className="inline-flex items-center gap-3 border border-[#C8A45D]/40 bg-[#C8A45D]/10 px-7 py-4 text-sm font-bold text-[#E8C77F] transition hover:bg-[#C8A45D] hover:text-[#071E33]"
              >
                Material estimate <PackageCheck className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden border border-white/12 bg-white/10 shadow-[0_32px_90px_rgba(0,0,0,0.28)] md:grid-cols-3">
            <article className="bg-[#0B2944] p-7 md:p-8">
              <span className="grid h-12 w-12 place-items-center bg-[#C8A45D] text-[#071E33]">
                <Gauge className="h-6 w-6" />
              </span>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Quick Estimate</p>
              <h2 className="mt-3 text-2xl font-semibold">Early project budget</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">
                Use the main project details you already know and get a planning cost range.
              </p>
              <a href="#quick-estimate" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white">
                Start quick <ArrowRight className="h-4 w-4 text-[#F2B544]" />
              </a>
            </article>

            <article className="bg-[#071E33] p-7 md:p-8">
              <span className="grid h-12 w-12 place-items-center border border-[#C8A45D]/40 bg-[#C8A45D]/10 text-[#F2B544]">
                <Layers3 className="h-6 w-6" />
              </span>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Detailed Estimate</p>
              <h2 className="mt-3 text-2xl font-semibold">More project detail</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">
                Use measured quantities, specifications and construction systems when you need a stronger cost plan.
              </p>
              <Link href="/estimator/detailed" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white">
                Open detailed estimate <ArrowRight className="h-4 w-4 text-[#F2B544]" />
              </Link>
            </article>

            <article className="bg-[#0B2944] p-7 md:p-8">
              <span className="grid h-12 w-12 place-items-center border border-[#C8A45D]/40 bg-[#C8A45D]/10 text-[#F2B544]">
                <PackageCheck className="h-6 w-6" />
              </span>
              <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-[#F2B544]">Material Estimate</p>
              <h2 className="mt-3 text-2xl font-semibold">Material quantities</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">
                Calculate materials for concrete, blocks, reinforcement, finishes, roofing and other common work items.
              </p>
              <Link href="/estimator/materials" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-white">
                Estimate materials <ArrowRight className="h-4 w-4 text-[#F2B544]" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <QuickEstimateHome />

      <section className="bg-white px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C8A45D]">Before You Rely On The Figure</p>
            <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-[-0.03em] text-[#071E33] md:text-5xl">
              Use more project information when you need more certainty.
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-[#3A4653]">
              Quick estimates are for early planning. Drawings, measured quantities, site conditions and specifications should be reviewed before a construction budget is treated as final.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#3A4653]">
              {["Drawings review", "Measured quantities", "Specification check", "Current rate check"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#0D3B66]" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:flex-col">
            <Link
              href="/estimator/detailed"
              className="inline-flex items-center justify-center gap-3 bg-[#0D3B66] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#071E33]"
            >
              Detailed Estimate <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 border border-[#0D3B66]/20 bg-white px-7 py-4 text-sm font-bold text-[#071E33]"
            >
              Contact Charismak
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#071E33] px-5 py-12 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center bg-[#C8A45D] text-[#071E33]">
              <Calculator className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Need current material prices too?</h2>
              <p className="mt-1 text-sm text-white/65">Check the public price catalogue and supplier listings.</p>
            </div>
          </div>
          <Link href="/prices" className="inline-flex items-center gap-2 text-sm font-bold text-[#F2B544]">
            View prices <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
