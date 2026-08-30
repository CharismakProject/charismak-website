import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import MaterialEstimator from "@/components/public/material-estimator";
import SpecialistMaterialEstimator from "@/components/public/specialist-material-estimator";

export const metadata: Metadata = {
  title: "Construction Material Estimate",
  description:
    "Estimate practical construction material quantities for concrete, reinforcement, masonry, partitions, curtain wall, facade, finishes, roofing, formwork, electrical, plumbing, ceilings, paving, waterproofing, structural steel, doors, windows and glass partitions.",
};

export default function MaterialEstimatePage() {
  return (
    <main className="bg-[#F7F8FA] pt-20">
      <section className="bg-[#071E33] px-5 py-12 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C8A45D]">Charismak Cost Planner</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Material Quantity Estimate</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
              Calculate practical procurement quantities across structural, architectural, finishing, MEP and specialist construction work. Every result states its basis, waste allowance and design limitations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/estimator" className="inline-flex items-center gap-2 border border-white/20 px-4 py-3 text-xs font-bold text-white"><ArrowLeft className="h-4 w-4" />Estimator home</Link>
            <Link href="/estimator/detailed" className="inline-flex items-center gap-2 bg-[#C8A45D] px-4 py-3 text-xs font-bold text-[#071E33]"><ClipboardList className="h-4 w-4" />Detailed cost estimate</Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[#0D3B66]/10 bg-white px-5 py-5 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 text-xs font-bold">
          <a href="#structural-architectural-materials" className="border border-[#0D3B66]/15 px-4 py-2 text-[#0D3B66]">Structure, facade & finishes</a>
          <a href="#services-specialist-materials" className="border border-[#0D3B66]/15 px-4 py-2 text-[#0D3B66]">MEP, steel, openings & external works</a>
        </div>
      </section>

      <div id="structural-architectural-materials" className="scroll-mt-24"><MaterialEstimator /></div>
      <div id="services-specialist-materials" className="scroll-mt-24"><SpecialistMaterialEstimator /></div>
    </main>
  );
}
