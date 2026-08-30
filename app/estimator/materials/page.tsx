import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import MaterialEstimator from "@/components/public/material-estimator";

export const metadata: Metadata = {
  title: "Construction Material Estimate",
  description: "Estimate construction material quantities and practical procurement allowances for concrete, reinforcement, blockwork, partitions, curtain wall, cladding, screed, tiles, painting, roofing and formwork.",
};

export default function MaterialEstimatePage() {
  return (
    <main className="bg-[#F7F8FA] pt-20">
      <section className="bg-[#071E33] px-5 py-12 text-white md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#C8A45D]">Charismak Cost Planner</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">Material Quantity Estimate</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-white/65">Calculate practical procurement quantities from measurable construction inputs.</p></div>
          <div className="flex flex-wrap gap-3"><Link href="/estimator" className="inline-flex items-center gap-2 border border-white/20 px-4 py-3 text-xs font-bold text-white"><ArrowLeft className="h-4 w-4" />Estimator home</Link><Link href="/estimator/detailed" className="inline-flex items-center gap-2 bg-[#C8A45D] px-4 py-3 text-xs font-bold text-[#071E33]"><ClipboardList className="h-4 w-4" />Detailed cost estimate</Link></div>
        </div>
      </section>
      <MaterialEstimator />
    </main>
  );
}
