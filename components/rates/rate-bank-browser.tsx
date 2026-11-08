"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpDown, Layers, Search, ShieldCheck, Sparkles } from "lucide-react";

import LocationPicker from "@/components/rates/location-picker";
import AnimatedNaira from "@/components/ui/animated-naira";
import { RATE_BANK_ITEMS, calculateRate } from "@/lib/rates/defaults";
import { RATE_LOCATIONS, localiseLines } from "@/lib/rates/locations";
import { useRateLocation } from "@/lib/rates/use-rate-location";

const PAGE = 18;
type Sort = "section" | "low" | "high" | "name";

export default function RateBankBrowser() {
  const [location, setLocation] = useRateLocation();
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const [sort, setSort] = useState<Sort>("section");
  const [visible, setVisible] = useState(PAGE);
  const reduce = useReducedMotion();

  const sections = useMemo(() => {
    const counts = new Map<string, number>();
    RATE_BANK_ITEMS.forEach((item) => counts.set(item.section, (counts.get(item.section) ?? 0) + 1));
    return Array.from(counts.entries());
  }, []);

  // Every rate priced for the chosen state, with its cost split.
  const priced = useMemo(
    () =>
      RATE_BANK_ITEMS.map((item) => {
        const calc = calculateRate(localiseLines(item.lines, location), item.allowances);
        const direct = calc.directCost || 1;
        return {
          item,
          total: calc.total,
          split: {
            material: calc.materialCost / direct,
            labour: calc.labourCost / direct,
            plant: (calc.plantCost + calc.logisticsCost) / direct,
          },
        };
      }),
    [location],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = priced.filter(({ item }) => {
      const text = [item.code, item.title, item.shortTitle, item.section, item.specification].join(" ").toLowerCase();
      return (section === "all" || item.section === section) && (!q || text.includes(q));
    });
    if (sort === "low") list.sort((a, b) => a.total - b.total);
    else if (sort === "high") list.sort((a, b) => b.total - a.total);
    else if (sort === "name") list.sort((a, b) => a.item.shortTitle.localeCompare(b.item.shortTitle));
    return list;
  }, [priced, query, section, sort]);

  const resetPaging = () => setVisible(PAGE);

  return (
    <div className="space-y-6" data-theme="dark">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_85%_0%,rgba(242,181,68,0.18),transparent_32rem),radial-gradient(circle_at_0%_100%,rgba(56,189,168,0.12),transparent_28rem),linear-gradient(160deg,#071E33,#04121F)] p-5 md:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#F2B544]/30 bg-[#F2B544]/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#F2B544]">
              <Sparkles className="h-3.5 w-3.5" /> Charismak Rate Bank
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-[1.05] text-white md:text-6xl">
              Live construction rates for <span className="text-[#F2B544]">{location.name}</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
              {RATE_BANK_ITEMS.length} transparent build-ups — materials, labour, plant and allowances, no contractor profit. Pick a state on the map and every rate re-prices instantly. Open any rate to see it in 3D, edit it, save it and download a PDF.
            </p>

            <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
              {[
                ["Build-ups", String(RATE_BANK_ITEMS.length)],
                ["States", String(RATE_LOCATIONS.length)],
                ["3D", "on every rate"],
                ["Public O/P", "0%"],
              ].map(([label, value]) => (
                <span key={label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/60">
                  <strong className="mr-1 text-base text-white">{value}</strong> {label}
                </span>
              ))}
            </div>

            <label className="relative mt-6 block">
              <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/60" />
              <input
                value={query}
                onChange={(event) => { setQuery(event.target.value); resetPaging(); }}
                placeholder="Search concrete, blockwork, formwork, tiling…"
                aria-label="Search rates"
                className="min-h-14 w-full rounded-2xl border border-white/15 bg-white/10 pl-12 pr-4 text-sm text-white outline-none backdrop-blur placeholder:text-white/40 focus:border-[#F2B544] bg-white/10! text-white! border-white/15! placeholder:text-white/40! focus:border-[#F2B544]! [&_option]:bg-[#071E33] [&_optgroup]:bg-[#071E33]"
              />
            </label>
          </div>

          <LocationPicker location={location} onChange={setLocation} />
        </div>
      </section>

      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <div className="flex w-max gap-2">
            {[["all", RATE_BANK_ITEMS.length] as [string, number], ...sections].map(([value, count]) => (
              <button
                key={value}
                type="button"
                aria-pressed={section === value}
                onClick={() => { setSection(value); resetPaging(); }}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition ${section === value ? "border-[#F2B544] bg-[#F2B544] text-[#071E33]" : "border-white/15 bg-white/5 text-white/75 hover:border-white/40"}`}
              >
                {value === "all" ? "All" : value} <span className="opacity-60">{count}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-white/60">
          <ArrowUpDown className="h-4 w-4" />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            aria-label="Sort rates"
            className="min-h-10 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold text-white [&>option]:text-[#071E33] bg-white/10! text-white! border-white/15! placeholder:text-white/40! focus:border-[#F2B544]! [&_option]:bg-[#071E33] [&_optgroup]:bg-[#071E33]"
          >
            <option value="section">By work section</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </section>

      <section aria-live="polite">
        <p className="mb-3 text-xs text-white/50">
          {results.length} rate{results.length === 1 ? "" : "s"} · priced for {location.name}
          {location.status === "provisional" ? " (provisional regional adjustment)" : " (Abuja base)"}
        </p>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {results.slice(0, visible).map(({ item, total, split }, index) => (
            <motion.li
              key={item.slug}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: reduce ? 0 : Math.min(index, 12) * 0.03 }}
            >
              <Link
                href={`/rates/${item.slug}${location.id === "fct" ? "" : `?state=${location.id}`}`}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:-translate-y-0.5 hover:border-[#F2B544]/50 hover:bg-white/[0.07]"
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.12em]">
                  <span className="text-[#F2B544]">{item.section}</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 ${item.status === "verified" ? "bg-[#9BE7C4]/15 text-[#9BE7C4]" : "bg-white/10 text-white/55"}`}>
                      {item.status === "verified" ? "Verified" : "Validating"}
                    </span>
                  </span>
                </div>
                <h3 className="mt-3 font-black leading-6 text-white group-hover:text-[#F2B544]">{item.shortTitle}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/50">{item.specification}</p>

                <div className="mt-auto pt-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <AnimatedNaira value={total} className="text-2xl font-black text-white" />
                      <span className="ml-1 text-xs text-white/50">/ {item.unit}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/30 transition group-hover:translate-x-1 group-hover:text-[#F2B544]" />
                  </div>
                  <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/10" aria-label={`Materials ${Math.round(split.material * 100)}%, labour ${Math.round(split.labour * 100)}%, plant ${Math.round(split.plant * 100)}%`}>
                    <span className="bg-[#F2B544] transition-all duration-500" style={{ width: `${split.material * 100}%` }} />
                    <span className="bg-[#38BDA8] transition-all duration-500" style={{ width: `${split.labour * 100}%` }} />
                    <span className="bg-[#7C9CFF] transition-all duration-500" style={{ width: `${split.plant * 100}%` }} />
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>

        {!results.length ? (
          <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center text-white/60">
            <Search className="mx-auto h-7 w-7" />
            <p className="mt-3 font-bold text-white">No matching rate yet</p>
            <p className="mt-1 text-sm">Try a broader word, or <Link href="/contact" className="text-[#F2B544] underline">ask Charismak to price it</Link>.</p>
          </div>
        ) : null}

        {results.length > visible ? (
          <button
            type="button"
            onClick={() => setVisible((count) => count + PAGE)}
            className="mx-auto mt-5 flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 text-sm font-bold text-white hover:border-[#F2B544]"
          >
            Show more ({results.length - visible} remaining)
          </button>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-white/50">
          <span className="flex items-center gap-1.5"><i className="h-2 w-4 rounded bg-[#F2B544]" /> Materials</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-4 rounded bg-[#38BDA8]" /> Labour</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-4 rounded bg-[#7C9CFF]" /> Plant &amp; logistics</span>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#9BE7C4]" />
          <div>
            <h2 className="font-black text-white">How these rates are built</h2>
            <p className="mt-1 max-w-3xl text-xs leading-6 text-white/60">
              Abuja rates are built from current market prices, standard material consumption and labour outputs, and checked against recent priced bills; every rate stays marked <em>validating</em> until it passes quantity, material, labour and market checks. Other states apply provisional material, labour and plant adjustments to the Abuja build-up until local quotations confirm them. Allowances: material fluctuation 5%, labour fluctuation 1.5%, risk 5%, public O/P 0%.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/prices" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 px-4 text-xs font-black text-white hover:border-[#F2B544]"><Layers className="h-4 w-4" /> Material prices</Link>
          <Link href="/estimator" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#F2B544] px-4 text-xs font-black text-[#071E33]">Estimate a project <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}
