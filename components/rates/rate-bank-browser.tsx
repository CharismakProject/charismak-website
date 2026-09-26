"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { RATE_BANK_ITEMS, calculateRate } from "@/lib/rates/defaults";

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);

export default function RateBankBrowser() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");

  const sections = useMemo(
    () => ["all", ...Array.from(new Set(RATE_BANK_ITEMS.map((item) => item.section)))],
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RATE_BANK_ITEMS.filter((item) => {
      const matchesSection = section === "all" || item.section === section;
      const haystack = [
        item.code,
        item.title,
        item.shortTitle,
        item.section,
        item.specification,
        item.region,
        item.city,
      ]
        .join(" ")
        .toLowerCase();
      return matchesSection && (!q || haystack.includes(q));
    });
  }, [query, section]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#071E33] px-5 py-9 text-white shadow-[0_25px_70px_rgba(7,30,51,0.18)] md:px-9 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_10%,rgba(200,164,93,0.24),transparent_28rem)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#F2B544]">
            <BadgeCheck className="h-4 w-4" />
            Charismak Construction Rate Bank
          </div>

          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            See the rate. Open the build-up. Make it yours.
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/72 md:text-base">
            Reference execution rates are built from materials, labour, plant and logistics. Charismak&apos;s public rate carries no contractor profit. Open any item to review the calculation, then edit a private copy with your own prices, allowances and O/P.
          </p>

          <div className="mt-7 grid overflow-hidden rounded-2xl bg-white sm:grid-cols-[1fr_230px]">
            <label className="relative border-b border-[#DCE4EC] sm:border-b-0 sm:border-r">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#708093]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search concrete, blockwork, reinforcement..."
                className="min-h-14 w-full border-0 bg-white pl-12 pr-4 text-sm text-[#071E33] outline-none"
              />
            </label>
            <label className="relative">
              <SlidersHorizontal className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#708093]" />
              <select
                value={section}
                onChange={(event) => setSection(event.target.value)}
                className="min-h-14 w-full border-0 bg-white pl-12 pr-4 text-sm font-bold text-[#071E33] outline-none"
              >
                {sections.map((value) => (
                  <option key={value} value={value}>
                    {value === "all" ? "All work sections" : value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white/80">
              Material fluctuation: <strong className="text-white">5%</strong>
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white/80">
              Labour fluctuation: <strong className="text-white">1.5%</strong>
            </span>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-white/80">
              Risk: <strong className="text-white">5%</strong>
            </span>
            <span className="rounded-full border border-[#F2B544]/35 bg-[#F2B544]/10 px-3 py-2 text-[#F7D588]">
              Public O/P: <strong>0%</strong>
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E0E7EE] bg-white p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">
              Pilot methodology
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33]">
              Transparent execution cost — not a copied tender rate
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#617286]">
              These first rates are reconstructed from reviewed Charismak execution models. Physical wastage remains inside the resource build-up, while price fluctuation and risk are shown separately. Profit is left for the user to add.
            </p>
          </div>
          <Link
            href="/prices"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D6E0E9] px-4 text-xs font-black text-[#0D3B66] transition hover:border-[#C8A45D] hover:bg-[#FFF9ED]"
          >
            Check material & labour prices <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#A82B05]">
              Nigeria pilot
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33] md:text-3xl">
              {results.length} rate build-up{results.length === 1 ? "" : "s"}
            </h2>
          </div>
          <span className="hidden text-xs text-[#617286] sm:block">Abuja–Keffi reference market</span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => {
            const calc = calculateRate(item.lines, item.allowances);
            return (
              <article
                key={item.slug}
                className="group flex flex-col rounded-2xl border border-[#DCE4EC] bg-white p-5 shadow-[0_8px_26px_rgba(7,30,51,0.045)] transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(7,30,51,0.11)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#7A8B9E]">
                    {item.code}
                  </span>
                  <span className="rounded-full bg-[#FFF1EA] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#8B1E00]">
                    Pilot
                  </span>
                </div>

                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.15em] text-[#A82B05]">
                  {item.section}
                </p>
                <h3 className="mt-2 text-xl font-black leading-7 text-[#071E33]">{item.shortTitle}</h3>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#617286]">{item.specification}</p>

                <div className="mt-5 rounded-2xl bg-[#F6F8FA] p-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[#617286]">
                    Charismak reference / {item.unit}
                  </span>
                  <strong className="mt-1 block text-2xl text-[#071E33]">{money(calc.total)}</strong>
                  <span className="mt-2 block text-xs font-bold text-[#617286]">
                    Direct cost {money(calc.directCost)} · O/P 0%
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[11px] text-[#617286]">
                  <MapPin className="h-4 w-4 text-[#A82B05]" />
                  {item.city}, {item.country}
                </div>

                <div className="mt-auto pt-5">
                  <Link
                    href={"/rates/" + item.slug}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-4 text-xs font-black text-white transition hover:bg-[#071E33]"
                  >
                    View build-up & edit <Calculator className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {!results.length ? (
          <div className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-10 text-center">
            <Search className="mx-auto h-7 w-7 text-[#8A99A9]" />
            <h3 className="mt-4 font-black text-[#071E33]">No matching rate yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#617286]">
              This is the first pilot set. More work sections and locations will be added as their build-ups are reviewed.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
