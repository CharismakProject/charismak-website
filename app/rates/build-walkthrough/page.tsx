import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import BuildingWalkthrough from "@/components/rates/walkthrough/building-walkthrough";

// Test page: kept out of search results until it is approved.
export const metadata: Metadata = {
  title: "Building Construction Walkthrough (Test)",
  description: "Step through how a building is built, element by element, and see how each construction rate is calculated.",
  robots: { index: false, follow: false },
};

export default function WalkthroughPage() {
  return (
    <main className="cx-page min-h-screen pt-20">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        <Link href="/rates" className="inline-flex items-center gap-2 text-xs font-black text-white/60 transition hover:text-[#F2C879]">
          <ArrowLeft className="h-4 w-4" /> Rate Bank
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="cx-eyebrow">Test page · 3D walkthrough</p>
            <h1 className="cx-title mt-3 text-3xl md:text-5xl">From survey to handover: how a building goes up, and what each part costs</h1>
            <p className="cx-lead mt-3 max-w-3xl text-sm md:text-base">
              Follow a two-storey building from the site survey to handing over the keys. Each stage shows what is built, how a quantity surveyor measures it, and how its Rate Bank rate is built up from materials, labour and plant.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <BuildingWalkthrough />
        </div>
      </div>
    </main>
  );
}
