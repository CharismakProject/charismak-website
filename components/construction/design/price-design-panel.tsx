"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useScene } from "@pascal-app/core";
import { Calculator, MapPin, X } from "lucide-react";

import { priceDesign } from "@/lib/construction/design-takeoff";
import { RATE_LOCATIONS, ZONES } from "@/lib/rates/locations";
import { useRateLocation } from "@/lib/rates/use-rate-location";

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

type SceneNodes = Parameters<typeof priceDesign>[0];

/** "Price this design": measures the drawn building and prices it from the Rate Bank. */
export default function PriceDesignButton() {
  const [open, setOpen] = useState(false);
  const [nodes, setNodes] = useState<SceneNodes>({});
  const [location, chooseLocation] = useRateLocation();

  // Read the live scene while the panel is open, so edits re-price immediately.
  useEffect(() => {
    if (!open) return;
    const read = () => setNodes(useScene.getState().nodes as unknown as SceneNodes);
    read();
    return useScene.subscribe(read);
  }, [open]);

  const takeoff = useMemo(() => priceDesign(nodes, location), [nodes, location]);
  const groups = useMemo(() => {
    const map = new Map<string, typeof takeoff.lines>();
    for (const line of takeoff.lines) map.set(line.group, [...(map.get(line.group) ?? []), line]);
    return Array.from(map.entries());
  }, [takeoff]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-[#D9B26A] px-3 py-1.5 text-xs font-bold text-[#0F1923] hover:bg-[#F2C879]"
      >
        <Calculator className="h-3.5 w-3.5" /> Price this design
      </button>

      {open ? (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/40" onClick={() => setOpen(false)}>
          <aside
            role="dialog"
            aria-label="Price this design"
            className="flex h-full w-full max-w-md flex-col overflow-hidden border-l border-white/10 bg-[#1A2A3B] text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9B26A]">Early budget</p>
                <h2 className="mt-1 text-lg font-semibold">Price this design</h2>
                <p className="mt-1 text-xs text-white/55">
                  {takeoff.counts.walls} walls · {takeoff.counts.slabs} slabs · {takeoff.counts.roofs} roofs · {takeoff.counts.doors} doors · {takeoff.counts.windows} windows
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <label className="relative block">
                <span className="sr-only">State for prices</span>
                <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#D9B26A]" />
                <select
                  value={location.id}
                  onChange={(event) => chooseLocation(event.target.value)}
                  className="h-10 w-full rounded-md border border-white/15 bg-white/10 pl-9 pr-3 text-sm text-white outline-none focus:border-[#D9B26A] [&_optgroup]:bg-[#1A2A3B] [&_option]:bg-[#1A2A3B]"
                >
                  {ZONES.map((zone) => (
                    <optgroup key={zone} label={zone}>
                      {RATE_LOCATIONS.filter((loc) => loc.zone === zone).map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          Prices for {loc.name}{loc.status === "provisional" ? " (provisional)" : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              {takeoff.warnings.length ? (
                <ul className="space-y-1 rounded-md bg-[#3A2A0B]/70 p-3 text-xs text-[#F7D58C]">
                  {takeoff.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                </ul>
              ) : null}

              {groups.map(([group, lines]) => (
                <section key={group}>
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">{group}</h3>
                  <div className="mt-2 space-y-2">
                    {lines.map((line, i) => (
                      <div key={`${line.slug}-${i}`} className="rounded-md bg-black/25 p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          {line.provisional ? (
                            <span className="text-sm font-semibold">{line.title} <span className="ml-1 rounded bg-[#3A2A0B] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#F7D58C]">Provisional</span></span>
                          ) : (
                            <Link href={`/rates/${line.slug}${location.id !== "fct" ? `?state=${location.id}` : ""}`} target="_blank" className="text-sm font-semibold hover:text-[#F2C879]">
                              {line.title}
                            </Link>
                          )}
                          <strong className="shrink-0 text-sm">{money(line.amount)}</strong>
                        </div>
                        <p className="mt-0.5 font-mono text-[11px] text-white/60">
                          {line.quantity.toLocaleString("en-NG")} {line.unit} × {money(line.rate)}
                        </p>
                        <p className="text-[11px] text-white/40">{line.basis}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}

              <p className="rounded-md border border-white/10 p-3 text-[11px] leading-5 text-white/50">
                Early budget from Charismak Rate Bank rates ({location.status === "base" ? "Abuja base" : `adjusted for ${location.name}, provisional`}). Foundations and the roof carcass are estimated from your walls and roof. Door and window supply are provisional allowances from starter prices, not supplier quotes. Excludes reinforcement and frame design, electrical, plumbing, sanitary fittings, external works, preliminaries, contractor margin and VAT. Not a quotation.
              </p>
            </div>

            <footer className="border-t border-white/10 p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Measured work</p>
                  <p className="text-2xl font-bold text-[#F2C879]">{money(takeoff.total)}</p>
                  {takeoff.grossFloorArea > 0 ? <p className="text-[11px] text-white/50">≈ {money(takeoff.total / takeoff.grossFloorArea)}/m² over {takeoff.grossFloorArea} m² gross floor area</p> : null}
                </div>
                <Link href="/quote" className="rounded-md bg-[#D9B26A] px-3 py-2 text-xs font-bold text-[#0F1923] hover:bg-[#F2C879]">
                  Get a proper quote
                </Link>
              </div>
            </footer>
          </aside>
        </div>
      ) : null}
    </>
  );
}
