"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Box } from "lucide-react";

import type { RateBankItem } from "@/lib/rates/defaults";

// three.js is only downloaded when the visitor asks for the 3D view.
const RateExplodedViewer = dynamic(() => import("./rate-exploded-viewer"), {
  ssr: false,
  loading: () => <div className="grid h-[360px] place-items-center rounded-2xl bg-[#F6F8FA] text-sm text-[#617286]">Loading 3D model…</div>,
});

export default function Rate3DLauncher({ item }: { item: RateBankItem }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border border-[#DCE4EC] bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">3D build-up</p>
          <h2 className="mt-1 text-lg font-black text-[#071E33]">See what goes into this rate</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#071E33] px-5 text-sm font-black text-white transition hover:bg-[#0D3B66]"
        >
          <Box className="h-4 w-4 text-[#F2B544]" />
          {open ? "Hide 3D view" : "View in 3D"}
        </button>
      </div>
      {open ? (
        <div className="mt-5">
          <RateExplodedViewer item={item} />
        </div>
      ) : null}
    </section>
  );
}
