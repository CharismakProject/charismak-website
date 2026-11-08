"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import LocationPicker from "@/components/rates/location-picker";
import Rate3DLauncher from "@/components/rates/rate-3d/rate-3d-launcher";
import RateCalculator from "@/components/rates/rate-calculator";
import AnimatedNaira from "@/components/ui/animated-naira";
import { calculateRate, type RateBankItem } from "@/lib/rates/defaults";
import { BASE_LOCATION_ID, RATE_LOCATIONS, ZONES, localiseLines } from "@/lib/rates/locations";
import { useRateLocation } from "@/lib/rates/use-rate-location";

const naira = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);

/** State-aware rate: live total, cost split, zone comparison, 3D and calculator. */
export default function RateDetailInteractive({ item }: { item: RateBankItem }) {
  const [location, setLocation] = useRateLocation();
  const reduce = useReducedMotion();

  const localItem = useMemo<RateBankItem>(
    () => ({ ...item, lines: localiseLines(item.lines, location), city: location.id === BASE_LOCATION_ID ? item.city : `${location.capital} (provisional, from ${item.city})` }),
    [item, location],
  );
  const calc = useMemo(() => calculateRate(localItem.lines, item.allowances), [localItem, item.allowances]);
  const base = useMemo(() => calculateRate(item.lines, item.allowances).total, [item]);

  const allowances = calc.total - calc.directCost;
  const parts = [
    { label: "Materials", value: calc.materialCost, colour: "#F2B544" },
    { label: "Labour", value: calc.labourCost, colour: "#38BDA8" },
    { label: "Plant & logistics", value: calc.plantCost + calc.logisticsCost, colour: "#7C9CFF" },
    { label: "Fluctuation & risk", value: allowances, colour: "#C084FC" },
  ].filter((part) => part.value > 0.5);

  // Average rate per zone (mean of its states), for the comparison chart.
  const zones = useMemo(() => {
    const rows = ZONES.map((zone) => {
      const states = RATE_LOCATIONS.filter((state) => state.zone === zone);
      const totals = states.map((state) => calculateRate(localiseLines(item.lines, state), item.allowances).total);
      return { zone, total: totals.reduce((sum, value) => sum + value, 0) / totals.length, low: Math.min(...totals), high: Math.max(...totals) };
    });
    const max = Math.max(...rows.map((row) => row.high), calc.total);
    return { rows, max };
  }, [item, calc.total]);

  const diff = base ? calc.total / base - 1 : 0;

  return (
    <div className="space-y-6">
      <section data-theme="dark" className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_90%_0%,rgba(242,181,68,0.16),transparent_30rem),linear-gradient(160deg,#071E33,#04121F)] p-5 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#F2B544]">Rate in {location.name}</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <AnimatedNaira value={calc.total} className="text-5xl font-black text-white md:text-6xl" />
              <span className="pb-2 text-sm text-white/60">per {item.unit} · O/P 0%</span>
            </div>
            <p className="mt-2 text-sm text-white/60">
              {location.id === BASE_LOCATION_ID
                ? "Abuja base rate."
                : `${diff >= 0 ? "+" : ""}${(diff * 100).toFixed(1)}% vs Abuja (${naira(base)}) · provisional regional adjustment.`}
            </p>

            <div className="mt-6">
              <div className="flex h-4 overflow-hidden rounded-full bg-white/10" role="img" aria-label={parts.map((part) => `${part.label} ${Math.round((part.value / calc.total) * 100)}%`).join(", ")}>
                {parts.map((part) => (
                  <motion.span
                    key={part.label}
                    initial={false}
                    animate={{ width: `${(part.value / calc.total) * 100}%` }}
                    transition={{ duration: reduce ? 0 : 0.5 }}
                    style={{ background: part.colour }}
                  />
                ))}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {parts.map((part) => (
                  <div key={part.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/55">
                      <i className="h-2 w-2 rounded-full" style={{ background: part.colour }} /> {part.label}
                    </dt>
                    <dd className="mt-1 font-black text-white"><AnimatedNaira value={part.value} /></dd>
                    <dd className="text-[11px] text-white/45">{Math.round((part.value / calc.total) * 100)}%</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-7">
              <h2 className="text-sm font-black text-white">Same rate across Nigeria</h2>
              <p className="text-[11px] text-white/45">Zone average with state range. Abuja is the verified base; other zones are provisional.</p>
              <ul className="mt-3 space-y-2">
                {zones.rows.map((row) => {
                  const mine = row.zone === location.zone;
                  return (
                    <li key={row.zone} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-xs">
                      <span className={mine ? "font-black text-[#F2B544]" : "text-white/70"}>{row.zone}</span>
                      <span className="relative h-2.5 rounded-full bg-white/10">
                        <span className="absolute inset-y-0 rounded-full bg-white/15" style={{ left: `${(row.low / zones.max) * 100}%`, width: `${Math.max(1, ((row.high - row.low) / zones.max) * 100)}%` }} />
                        <motion.span
                          initial={false}
                          animate={{ width: `${(row.total / zones.max) * 100}%` }}
                          transition={{ duration: reduce ? 0 : 0.5 }}
                          className={`absolute inset-y-0 left-0 rounded-full ${mine ? "bg-[#F2B544]" : row.zone === "FCT" ? "bg-[#9BE7C4]" : "bg-[#38BDA8]/70"}`}
                        />
                      </span>
                      <span className={mine ? "font-black text-white" : "text-white/70"}>{naira(row.total)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <LocationPicker location={location} onChange={setLocation} />
        </div>
      </section>

      <Rate3DLauncher key={`3d-${location.id}`} item={localItem} />
      <RateCalculator key={`calc-${location.id}`} item={localItem} storageKey={location.id === BASE_LOCATION_ID ? item.slug : `${item.slug}@${location.id}`} />
    </div>
  );
}
