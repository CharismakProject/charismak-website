"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Cpu, MapPin, Pause, Play, RotateCcw } from "lucide-react";

import AnimatedNaira from "@/components/ui/animated-naira";
import { RATE_LOCATIONS, ZONES } from "@/lib/rates/locations";
import { useRateLocation } from "@/lib/rates/use-rate-location";
import { MODEL, PHASES, WALKTHROUGH_STEPS, priceWalkthrough } from "@/lib/rates/walkthrough";

import type { WalkthroughScene } from "./walkthrough-scene";

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const num = (value: number) => value.toLocaleString("en-NG", { maximumFractionDigits: 3 });
const pct = (value: number) => `${Math.round(value * 1000) / 10}%`;

const CATEGORY_LABEL: Record<string, string> = {
  material: "Material",
  consumable: "Consumable",
  labour: "Labour",
  plant: "Plant",
  logistics: "Logistics",
};

export default function BuildingWalkthrough() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<WalkthroughScene | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [backend, setBackend] = useState<string>("");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [forceWebGL, setForceWebGL] = useState(false);
  const [location, chooseLocation] = useRateLocation();

  const priced = useMemo(() => priceWalkthrough(location), [location]);
  const current = priced[index];
  const last = WALKTHROUGH_STEPS.length - 1;

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("renderer") === "webgl") setForceWebGL(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let created: WalkthroughScene | null = null;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setStatus("loading");
    setBackend("");
    import("./walkthrough-scene")
      .then(({ createWalkthroughScene }) =>
        createWalkthroughScene(canvas, { forceWebGL, onDeviceLost: () => setForceWebGL(true) }),
      )
      .then((scene) => {
        created = scene;
        if (cancelled) {
          scene.dispose();
          return;
        }
        sceneRef.current = scene;
        setBackend(scene.backend);
        setStatus("ready");
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
      created?.dispose();
      sceneRef.current = null;
    };
  }, [forceWebGL]);

  useEffect(() => {
    sceneRef.current?.setStep(index);
  }, [index, status]);

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setIndex((value) => Math.min(value + 1, last)), 6500);
    return () => window.clearTimeout(timer);
  }, [playing, index, last]);

  const go = (next: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(last, next)));
  };

  const build = current.primaryBuildUp;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      {/* 3D view */}
      <section className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <div className="relative h-[52vh] min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-[#02080F] lg:h-[calc(100vh-11rem)]">
          <canvas
            key={forceWebGL ? "webgl" : "webgpu"}
            ref={canvasRef}
            className="block h-full w-full touch-none"
            aria-label={`3D model of a two-storey building at the "${current.step.title}" stage. Drag to rotate, pinch or scroll to zoom.`}
          />
          {status === "loading" ? (
            <div className="absolute inset-0 grid place-items-center text-sm text-white/60" role="status">Loading 3D model…</div>
          ) : null}
          {status === "error" ? (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white/70" role="alert">
              3D could not start on this device. The step-by-step explanation and prices still work below.
            </div>
          ) : null}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#F2C879] backdrop-blur">
              {current.step.stage}
            </span>
            {backend ? (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] backdrop-blur ${backend === "WebGPU" ? "bg-[#0E3B2E]/80 text-[#9BE7C4]" : "bg-black/55 text-white/70"}`}>
                <Cpu className="h-3 w-3" /> {backend === "WebGPU" ? "WebGPU" : forceWebGL ? "WebGL 2" : "WebGL 2 fallback"}
              </span>
            ) : null}
            {backend === "WebGPU" || forceWebGL ? (
              <button
                type="button"
                onClick={() => setForceWebGL((value) => !value)}
                className="rounded-full bg-black/55 px-3 py-1.5 text-[10px] font-bold text-white/70 backdrop-blur hover:text-white"
              >
                {forceWebGL ? "Try WebGPU" : "Blank? Use WebGL"}
              </button>
            ) : null}
          </div>
          <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/45 px-3 py-1 text-[10px] text-white/55 backdrop-blur">
            Drag to rotate · pinch / scroll to zoom
          </p>
        </div>

        {/* Step controls */}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous step" className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 text-white disabled:opacity-30">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => (index >= last ? (setIndex(0), setPlaying(true)) : setPlaying((value) => !value))}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#D9B26A] px-4 text-xs font-black uppercase tracking-[0.12em] text-[#02080F]"
          >
            {index >= last ? <RotateCcw className="h-4 w-4" /> : playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {index >= last ? "Replay" : playing ? "Pause" : "Play build"}
          </button>
          <button type="button" onClick={() => go(index + 1)} disabled={index === last} aria-label="Next step" className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 text-white disabled:opacity-30">
            <ChevronRight className="h-5 w-5" />
          </button>
          <span className="ml-auto text-xs text-white/50">
            Step <strong className="text-white">{index + 1}</strong> / {last + 1}
          </span>
        </div>
        <div className="mt-3 flex gap-2" role="list" aria-label="Construction stages">
          {PHASES.map((phase) => {
            const steps = WALKTHROUGH_STEPS.map((step, i) => ({ step, i })).filter(({ step }) => step.phase === phase);
            const active = current.step.phase === phase;
            return (
              <div key={phase} role="listitem" className="min-w-0" style={{ flex: steps.length }}>
                <div className="flex gap-0.5">
                  {steps.map(({ step, i }) => (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => go(i)}
                      aria-label={`Step ${i + 1}: ${step.title}`}
                      aria-current={i === index ? "step" : undefined}
                      className={`block h-2 flex-1 rounded-full transition ${i === index ? "bg-[#D9B26A]" : i < index ? "bg-[#D9B26A]/45" : "bg-white/12 hover:bg-white/25"}`}
                    />
                  ))}
                </div>
                <p className={`mt-1.5 truncate text-[9px] font-bold uppercase tracking-[0.1em] ${active ? "text-[#F2C879]" : "text-white/35"}`}>{phase}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Explanation + pricing */}
      <section className="space-y-4" aria-live="polite">
        <label className="relative block">
          <span className="sr-only">State for prices</span>
          <MapPin className="pointer-events-none absolute left-3 top-4 h-4 w-4 text-[#D9B26A]" />
          <select
            value={location.id}
            onChange={(event) => chooseLocation(event.target.value)}
            className="min-h-12 w-full rounded-xl border pl-9 pr-4 text-sm font-semibold outline-none bg-white/10! text-white! border-white/15! focus:border-[#D9B26A]! [&_option]:bg-[#071A2E] [&_optgroup]:bg-[#071A2E]"
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

        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="cx-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D9B26A]">{current.step.stage}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{current.step.title}</h2>
          <p className="mt-3 text-sm leading-7 text-white/80">{current.step.summary}</p>
          <p className="mt-2 text-sm leading-7 text-white/60">{current.step.detail}</p>
          <p className="mt-3 rounded-xl bg-[#3A2A0B]/70 px-3 py-2 text-xs leading-6 text-[#F7D58C]">
            <strong>How a QS measures it:</strong> {current.step.qsNote}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="text-sm font-black text-white">Quantity × rate = cost (this model)</h3>
          {current.step.notPriced ? (
            <p className="mt-3 rounded-xl border border-dashed border-white/15 px-3 py-3 text-xs leading-6 text-white/60">{current.step.notPriced}</p>
          ) : null}
          <div className="mt-3 space-y-3">
            {current.items.map((item, i) => (
              <div key={`${item.slug}-${i}`} className="rounded-xl bg-black/25 p-3">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/rates/${item.slug}${location.id !== "fct" ? `?state=${location.id}` : ""}`} className="text-sm font-bold text-white hover:text-[#F2C879]">
                    {item.title} →
                  </Link>
                  <strong className="shrink-0 text-sm text-white">{money(item.amount)}</strong>
                </div>
                <p className="cx-mono mt-1 text-[11px] text-white/60">
                  {num(item.quantity)} {item.unit} × {money(item.rate)}/{item.unit}
                </p>
                <p className="mt-0.5 text-[11px] text-white/40">{item.basis}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">This stage</p>
              <p className="mt-1 text-lg font-black text-white"><AnimatedNaira value={current.subtotal} /></p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Building so far</p>
              <p className="mt-1 text-lg font-black text-[#F2C879]"><AnimatedNaira value={current.cumulative} /></p>
              {index === last ? (
                <p className="text-[11px] text-white/50">≈ {money(current.cumulative / MODEL.grossFloorArea)}/m² over {MODEL.grossFloorArea} m²</p>
              ) : null}
            </div>
          </div>
        </article>

        {index === last ? (
          <article className="rounded-2xl border border-[#D9B26A]/40 bg-[#D9B26A]/[0.07] p-5">
            <h3 className="text-sm font-black text-[#F2C879]">Handover summary</h3>
            <p className="mt-2 text-xs leading-6 text-white/70">
              Measured work priced from the Rate Bank: <strong className="text-white">{money(current.cumulative)}</strong> for a {MODEL.grossFloorArea} m² two-storey building in {location.name}.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-6 text-white/60">
              {priced.filter((p) => p.step.notPriced).map((p) => (
                <li key={p.step.id}><strong className="text-white/80">{p.step.title}:</strong> not priced here</li>
              ))}
              <li>Supply of windows, doors and sanitary fittings (only their installation is priced)</li>
              <li>Contractor overheads & profit, VAT, contingency and professional fees</li>
            </ul>
            <p className="mt-2 text-[11px] leading-5 text-white/45">A real tender adds these, so the final contract sum will be higher than the measured-work figure.</p>
          </article>
        ) : null}

        {build ? (
          <details className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5" open>
            <summary className="cursor-pointer list-none text-sm font-black text-white">
              How the rate is built: {build.title} <span className="text-white/50">(per {build.unit})</span>
              <span className="float-right text-xs font-bold text-[#D9B26A] group-open:hidden">Show</span>
            </summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <thead className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                  <tr>
                    <th className="py-2 font-bold">Resource</th>
                    <th className="py-2 pl-3 text-right font-bold">Qty</th>
                    <th className="py-2 pl-3 text-right font-bold">Rate</th>
                    <th className="py-2 pl-3 text-right font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/75">
                  {build.lines.map((line, i) => (
                    <tr key={`${line.label}-${i}`}>
                      <td className="py-2 pr-2">
                        {line.label}
                        <span className="ml-1 text-[10px] text-white/35">{CATEGORY_LABEL[line.category] ?? line.category}</span>
                      </td>
                      <td className="cx-mono whitespace-nowrap py-2 pl-3 text-right">{num(line.quantity)} {line.unit}</td>
                      <td className="cx-mono whitespace-nowrap py-2 pl-3 text-right">{money(line.unitRate)}</td>
                      <td className="cx-mono whitespace-nowrap py-2 pl-3 text-right text-white">{money(line.value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="text-white/70">
                  <tr className="border-t border-white/15"><td className="py-2" colSpan={3}>Direct cost</td><td className="cx-mono py-2 text-right text-white">{money(build.calc.directCost)}</td></tr>
                  {build.calc.materialFluctuation ? <tr><td className="py-1" colSpan={3}>Material price fluctuation ({pct(build.allowances.materialFluctuation)})</td><td className="cx-mono py-1 text-right">{money(build.calc.materialFluctuation)}</td></tr> : null}
                  {build.calc.labourFluctuation ? <tr><td className="py-1" colSpan={3}>Labour fluctuation ({pct(build.allowances.labourFluctuation)})</td><td className="cx-mono py-1 text-right">{money(build.calc.labourFluctuation)}</td></tr> : null}
                  {build.calc.plantFluctuation ? <tr><td className="py-1" colSpan={3}>Plant & logistics fluctuation ({pct(build.allowances.plantFluctuation)})</td><td className="cx-mono py-1 text-right">{money(build.calc.plantFluctuation)}</td></tr> : null}
                  {build.calc.risk ? <tr><td className="py-1" colSpan={3}>Risk allowance ({pct(build.allowances.risk)})</td><td className="cx-mono py-1 text-right">{money(build.calc.risk)}</td></tr> : null}
                  <tr className="border-t border-white/15 font-black text-[#F2C879]"><td className="py-2" colSpan={3}>Rate per {build.unit} (before overheads & profit)</td><td className="cx-mono py-2 text-right">{money(build.calc.total)}</td></tr>
                </tfoot>
              </table>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-white/45">
              Resource quantities per {build.unit} include normal waste. {location.status === "provisional" ? `Prices adjusted from Abuja for ${location.name} (provisional).` : "Abuja base prices."} Contractor overheads, profit, VAT and preliminaries are not included.
            </p>
          </details>
        ) : null}

        <p className="rounded-xl border border-white/10 px-4 py-3 text-[11px] leading-5 text-white/45">
          Illustrative model only: a simple {MODEL.length} m × {MODEL.width} m two-storey frame with simplified quantities. Stages without Rate Bank rates are explained but not priced, so this is not a project estimate.
          Use the <Link href="/estimator" className="text-[#F2C879] underline">estimator</Link> for a full building budget.
        </p>
      </section>
    </div>
  );
}
