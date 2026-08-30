"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, BarChart3, CalendarRange, CheckCircle2, CircleHelp, ClipboardCheck, Download, Gauge, Landmark, PiggyBank, Scale, Share2, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import type { PriceItem } from "@/lib/pricing/models";
import { loadPriceItems } from "@/lib/pricing/store";
import type { EstimateInput, EstimateResult } from "@/lib/projects/public-estimate-engine-v2";
import {
  buildCashFlow,
  buildComparisons,
  buildContactSummary,
  buildSavingOptions,
  categoryLabels,
  checkBudget,
  estimateDuration,
  inclusionsAndExclusions,
  landFeasibility,
  marketSensitivity,
  sanityChecks,
  savingsPlanForTarget,
  sectionConfidence,
} from "@/lib/projects/public-estimate-decisions";

const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", notation: "compact", maximumFractionDigits: 1 }).format(value);
const fullMoney = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
const qty = (value: number) => value < 10 ? value.toFixed(1).replace(/\.0$/, "") : Math.round(value).toLocaleString();

const referenceIds: Record<EstimateInput["category"], string[]> = {
  "new-building": ["cement-50kg", "block-225", "reinforcement-steel", "longspan-roof-sheet", "floor-tile"],
  renovation: ["floor-tile", "tiling-labour", "emulsion-paint", "painting-labour", "electrical-point-labour"],
  "structural-steel": ["reinforcement-steel", "binding-wire"],
  finishes: ["floor-tile", "tiling-labour", "emulsion-paint", "painting-labour", "plaster-labour"],
  furniture: [],
  "external-works": ["block-225", "sharp-sand", "granite-aggregate", "excavation-labour"],
  "mep-services": ["cable-2-5", "socket-13a", "electrical-point-labour", "ppr-pipe-25", "plumbing-point-labour"],
};

export default function EstimatorResultExperience({
  input,
  result,
  score,
  onApplyInput,
}: {
  input: EstimateInput;
  result: EstimateResult;
  score: number;
  onApplyInput: (next: EstimateInput) => void;
}) {
  const [budgetText, setBudgetText] = useState("");
  const [savingTarget, setSavingTarget] = useState(10);
  const [shareMessage, setShareMessage] = useState("");
  const [prices, setPrices] = useState<PriceItem[]>([]);

  const comparisons = useMemo(() => buildComparisons(input), [input]);
  const savingOptions = useMemo(() => buildSavingOptions(input, result), [input, result]);
  const savingPlan = useMemo(() => savingsPlanForTarget(savingOptions, result, savingTarget), [savingOptions, result, savingTarget]);
  const duration = useMemo(() => estimateDuration(input, result), [input, result]);
  const cashFlow = useMemo(() => buildCashFlow(input, result), [input, result]);
  const sensitivity = useMemo(() => marketSensitivity(result), [result]);
  const land = useMemo(() => landFeasibility(input, result), [input, result]);
  const checks = useMemo(() => sanityChecks(input, result), [input, result]);
  const confidence = useMemo(() => sectionConfidence(input, result), [input, result]);
  const scope = useMemo(() => inclusionsAndExclusions(input, result), [input, result]);
  const budget = Number(budgetText.replace(/[^0-9.]/g, "")) || 0;
  const budgetCheck = useMemo(() => checkBudget(input, result, budget), [input, result, budget]);
  const contactSummary = useMemo(() => buildContactSummary(input, result, score), [input, result, score]);

  useEffect(() => {
    const ids = new Set(referenceIds[input.category]);
    const all = loadPriceItems().filter((item) => ids.has(item.id) && item.countryCode === "NG" && item.active);
    const location = input.location.toLowerCase();
    const exact = all.filter((item) => item.location.toLowerCase().includes(location) || location.includes(item.location.toLowerCase()));
    setPrices((exact.length ? exact : all).slice(0, 5));
  }, [input.category, input.location]);

  const contactHref = useMemo(() => {
    const params = new URLSearchParams({
      source: "estimator",
      service: categoryLabels[input.category],
      location: input.location,
      estimate: contactSummary,
    });
    return `/contact?${params.toString()}`;
  }, [contactSummary, input.category, input.location]);

  const shareEstimate = async () => {
    const text = `${categoryLabels[input.category]} planning estimate\n${input.location}\n${fullMoney(result.low)} – ${fullMoney(result.high)}\nLikely figure: ${fullMoney(result.midpoint)}\nPrepared with Charismak public feasibility estimator.`;
    try {
      if (navigator.share) await navigator.share({ title: "Charismak preliminary construction estimate", text });
      else {
        await navigator.clipboard.writeText(text);
        setShareMessage("Estimate summary copied to clipboard.");
        window.setTimeout(() => setShareMessage(""), 3000);
      }
    } catch {
      setShareMessage("Sharing was cancelled or unavailable.");
      window.setTimeout(() => setShareMessage(""), 3000);
    }
  };

  const downloadPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const left = 16;
    const width = 178;
    let y = 18;
    const line = (text: string, size = 10, bold = false, gap = 5) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, width) as string[];
      doc.text(lines, left, y);
      y += lines.length * gap;
      if (y > 278) { doc.addPage(); y = 18; }
    };
    doc.setTextColor(7, 30, 51);
    line("CHARISMAK PROJECT NIGERIA LIMITED", 15, true, 6);
    doc.setTextColor(100, 82, 35);
    line("PRELIMINARY CONSTRUCTION FEASIBILITY ESTIMATE", 9, true, 5);
    doc.setTextColor(30, 40, 50);
    line(`Generated: ${new Date().toLocaleDateString("en-NG")}`, 9, false, 5);
    line(`${categoryLabels[input.category]} · ${input.location}`, 12, true, 6);
    line(`Planning range: ${fullMoney(result.low)} – ${fullMoney(result.high)}`, 14, true, 7);
    line(`Likely planning figure: ${fullMoney(result.midpoint)}`, 11, true, 6);
    line(`Detail/completeness: ${score}% · Cost basis: ${qty(result.basisQuantity)} ${result.basisUnit} (${result.basisLabel})`, 9, false, 5);
    y += 2;
    line("COST BREAKDOWN", 10, true, 6);
    result.sections.forEach((item) => line(`${item.label}: ${fullMoney(item.low)} – ${fullMoney(item.high)}. ${item.explanation}`, 8.5, false, 4.5));
    y += 2;
    line("PROGRAMME & CASH FLOW", 10, true, 6);
    line(`Indicative duration: ${duration.lowWeeks}–${duration.highWeeks} weeks.`, 9, false, 5);
    cashFlow.forEach((phase) => line(`${phase.label}: ${(phase.share * 100).toFixed(0)}% · ${fullMoney(phase.low)} – ${fullMoney(phase.high)}`, 8.5, false, 4.5));
    y += 2;
    line("KEY ASSUMPTIONS / LIMITATIONS", 10, true, 6);
    result.assumptions.forEach((item) => line(`• ${item}`, 8.5, false, 4.5));
    scope.excluded.forEach((item) => line(`• Excluded/not specifically allowed: ${item}`, 8.5, false, 4.5));
    y += 2;
    line("This document is a preliminary planning estimate, not a tender, BOQ, quotation or contract price. Contact Charismak for project-specific measurement and specification review.", 8.5, true, 4.5);
    doc.save(`Charismak-${input.category}-preliminary-estimate.pdf`);
  };

  return (
    <div className="mt-8 space-y-7">
      <section className="overflow-hidden border border-[#0D3B66]/10 bg-white">
        <div className="bg-[#071E33] p-6 text-white md:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A45D]">{score >= 92 ? "High-detail" : score >= 80 ? "Detailed" : "Quick"} planning estimate · detail {score}%</p>
              <strong className="mt-3 block text-3xl tracking-[-0.04em] md:text-5xl">{money(result.low)} – {money(result.high)}</strong>
              <p className="mt-3 text-sm text-white/60">Likely planning figure: <strong className="text-white">{fullMoney(result.midpoint)}</strong></p>
            </div>
            <div className="min-w-[180px] border border-white/15 bg-white/5 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/45">Cost basis</p>
              <strong className="mt-2 block text-lg">{qty(result.basisQuantity)} {result.basisUnit}</strong>
              <span className="text-xs text-white/55">{result.basisLabel}</span>
            </div>
          </div>
        </div>
        <div className="p-5 md:p-7">
          <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Where the money is going</p>
              <div className="mt-4 divide-y divide-[#0D3B66]/10 border-y border-[#0D3B66]/10">
                {result.sections.map((item) => (
                  <details key={item.id} className="group py-4">
                    <summary className="grid cursor-pointer list-none gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div><p className="text-sm font-semibold text-[#071E33]">{item.label}</p><p className="mt-1 text-[11px] text-[#3A4653]/55">Open to see how this section was calculated</p></div>
                      <strong className="text-sm text-[#0D3B66]">{money(item.low)} – {money(item.high)}</strong>
                    </summary>
                    <p className="mt-3 border-l-2 border-[#C8A45D] bg-[#F7F8FA] p-3 text-xs leading-6 text-[#3A4653]">{item.explanation}</p>
                  </details>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-[#F7F8FA] p-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Main cost drivers</p><div className="mt-4 space-y-3">{result.costDrivers.map((driver) => <p key={driver} className="flex gap-3 text-xs leading-6 text-[#3A4653]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D3B66]" />{driver}</p>)}</div></div>
              <div className="border border-[#0D3B66]/10 p-5"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0D3B66]"><CircleHelp className="h-4 w-4 text-[#C8A45D]" />Before you rely on this number</p><div className="mt-4 space-y-2">{result.assumptions.map((a) => <p key={a} className="text-[11px] leading-5 text-[#3A4653]/70">• {a}</p>)}</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DecisionCard icon={ClipboardCheck} eyebrow="Scope clarity" title="Included, excluded and assumed">
          <div className="grid gap-5 md:grid-cols-2">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0D3B66]">Included in this result</p><div className="mt-3 space-y-2">{scope.included.map((item) => <p key={item} className="flex gap-2 text-xs leading-5 text-[#3A4653]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0D3B66]" />{item}</p>)}</div></div>
            <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9A6416]">Not specifically included</p><div className="mt-3 space-y-2">{scope.excluded.map((item) => <p key={item} className="flex gap-2 text-xs leading-5 text-[#3A4653]"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8A45D]" />{item}</p>)}</div></div>
          </div>
        </DecisionCard>

        <DecisionCard icon={ShieldCheck} eyebrow="Sanity check" title="Does the information make sense together?">
          <div className="space-y-3">{checks.map((check) => <div key={check.message} className={`flex gap-3 border p-3 text-xs leading-5 ${check.severity === "critical" ? "border-red-200 bg-red-50 text-red-800" : check.severity === "warning" ? "border-[#C8A45D]/35 bg-[#FFF9ED] text-[#74520D]" : "border-[#0D3B66]/10 bg-[#F7F8FA] text-[#3A4653]"}`}><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{check.message}</div>)}</div>
        </DecisionCard>
      </section>

      <DecisionCard icon={Scale} eyebrow="Compare options" title="See the cost impact of specification before deciding">
        <div className="grid gap-4 md:grid-cols-3">
          {comparisons.map((option) => {
            const current = option.id === input.finishLevel || (input.category === "furniture" && option.id === "standard" && input.furnitureLevel === "standard");
            return <article key={option.id} className={`border p-5 ${current ? "border-[#C8A45D] bg-[#FFF9ED]" : "border-[#0D3B66]/10 bg-white"}`}><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#C8A45D]">{current ? "Current basis" : "Alternative"}</p><h4 className="mt-2 text-lg font-semibold text-[#071E33]">{option.label}</h4><p className="mt-2 min-h-10 text-xs leading-5 text-[#3A4653]/70">{option.note}</p><strong className="mt-4 block text-xl text-[#0D3B66]">{money(option.result.low)} – {money(option.result.high)}</strong>{!current ? <button type="button" onClick={() => onApplyInput(option.input)} className="mt-4 text-xs font-bold text-[#0D3B66] hover:text-[#C8A45D]">Use this specification →</button> : null}</article>;
          })}
        </div>
      </DecisionCard>

      <DecisionCard icon={PiggyBank} eyebrow="Value engineering" title="Show me a practical path to reduce the budget">
        <div className="flex flex-wrap gap-2">{[5, 10, 15].map((value) => <button key={value} type="button" onClick={() => setSavingTarget(value)} className={`px-4 py-2 text-xs font-bold ${savingTarget === value ? "bg-[#0D3B66] text-white" : "border border-[#0D3B66]/15 bg-white text-[#0D3B66]"}`}>Target {value}% saving</button>)}</div>
        <div className="mt-5 border-l-2 border-[#C8A45D] bg-[#F7F8FA] p-4"><p className="text-sm font-semibold text-[#071E33]">Target: {fullMoney(savingPlan.target)}</p><p className="mt-1 text-xs text-[#3A4653]/70">Identified options: approximately {fullMoney(savingPlan.cumulative)} {savingPlan.achieved ? "— enough to reach the selected target if every suitable option is accepted." : "— the available sensible options do not fully reach the target without changing more scope."}</p></div>
        <div className="mt-4 space-y-3">{savingPlan.selected.length ? savingPlan.selected.map((option) => <div key={option.id} className="grid gap-3 border border-[#0D3B66]/10 p-4 md:grid-cols-[1fr_auto] md:items-center"><div><p className="text-sm font-semibold text-[#071E33]">{option.label}</p><p className="mt-1 text-xs leading-5 text-[#3A4653]/70">{option.note}</p></div><div className="text-left md:text-right"><strong className="text-sm text-[#0D3B66]">~{fullMoney(option.savingMid)}</strong><button type="button" onClick={() => onApplyInput(option.input)} className="mt-1 block text-xs font-bold text-[#9A6416] md:ml-auto">Apply option →</button></div></div>) : <p className="text-sm text-[#3A4653]">No sensible automatic value-engineering option was identified from the current selections. This is preferable to inventing a saving that changes required scope or safety.</p>}</div>
      </DecisionCard>

      <section className="grid gap-4 lg:grid-cols-2">
        <DecisionCard icon={WalletCards} eyebrow="Budget-first mode" title="I know my budget — what does it support?">
          <label className="text-xs font-semibold text-[#3A4653]">Available construction budget (₦)<input inputMode="numeric" value={budgetText} onChange={(event) => setBudgetText(event.target.value)} placeholder="e.g. 50000000" className="mt-2 min-h-12 w-full border border-[#0D3B66]/15 px-4 text-sm outline-none focus:border-[#0D3B66]" /></label>
          {budgetCheck ? <div className="mt-4 space-y-3"><div className={`border p-4 ${budgetCheck.status === "Below planning range" ? "border-[#C8A45D]/40 bg-[#FFF9ED]" : "border-[#0D3B66]/10 bg-[#F7F8FA]"}`}><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0D3B66]">{budgetCheck.status}</p><p className="mt-2 text-sm text-[#3A4653]">Against the likely figure, your budget is {budgetCheck.gapToMid >= 0 ? `${fullMoney(budgetCheck.gapToMid)} above` : `${fullMoney(Math.abs(budgetCheck.gapToMid))} below`} the current planning midpoint.</p></div>{budgetCheck.indicativeCapacityLow && budgetCheck.indicativeCapacityHigh ? <div><p className="text-sm font-semibold text-[#071E33]">{budgetCheck.capacityLabel}</p><strong className="mt-2 block text-2xl text-[#0D3B66]">{qty(budgetCheck.indicativeCapacityLow)}–{qty(budgetCheck.indicativeCapacityHigh)} {budgetCheck.capacityUnit}</strong><p className="mt-2 text-xs leading-5 text-[#3A4653]/70">This inverse-budget result assumes the same project type and broadly similar specification. Fixed costs and design choices stop cost from scaling perfectly with size.</p></div> : null}</div> : <p className="mt-3 text-xs leading-5 text-[#3A4653]/60">Enter a budget to compare it with the current scope and see an indicative capacity.</p>}
        </DecisionCard>

        <DecisionCard icon={CalendarRange} eyebrow="Programme" title="Likely construction period">
          <strong className="text-3xl text-[#071E33]">{duration.lowWeeks}–{duration.highWeeks} weeks</strong><p className="mt-3 text-xs leading-6 text-[#3A4653]/70">{duration.note}</p><div className="mt-5 border-t border-[#0D3B66]/10 pt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C8A45D]">Suggested initial funding</p><strong className="mt-2 block text-lg text-[#0D3B66]">{money(cashFlow.slice(0, 2).reduce((sum, item) => sum + item.low, 0))} – {money(cashFlow.slice(0, 2).reduce((sum, item) => sum + item.high, 0))}</strong><p className="mt-1 text-xs text-[#3A4653]/65">Approximate first two cash-flow stages, not a payment certificate.</p></div>
        </DecisionCard>
      </section>

      {land ? <DecisionCard icon={Landmark} eyebrow="Land feasibility" title="Can the preliminary footprint sit comfortably on the plot?"><div className="grid gap-4 sm:grid-cols-3"><Metric label="Site coverage" value={`${land.coveragePercent.toFixed(1)}%`} /><Metric label="Open site area" value={`${Math.round(land.openAreaM2)} m²`} /><Metric label="Preliminary status" value={land.status} /></div><div className="mt-4 space-y-2">{land.notes.map((note) => <p key={note} className="text-xs leading-6 text-[#3A4653]/75">• {note}</p>)}</div></DecisionCard> : null}

      <DecisionCard icon={BarChart3} eyebrow="Cash flow" title="A preliminary way to phase the funding">
        <div className="space-y-3">{cashFlow.map((phase, index) => <div key={phase.id} className="grid gap-2 border-b border-[#0D3B66]/10 pb-3 last:border-b-0 md:grid-cols-[38px_1fr_auto] md:items-center"><span className="text-xs font-bold text-[#C8A45D]">{String(index + 1).padStart(2, "0")}</span><div><p className="text-sm font-semibold text-[#071E33]">{phase.label}</p><p className="text-xs text-[#3A4653]/55">{(phase.share * 100).toFixed(0)}% planning allocation</p></div><strong className="text-sm text-[#0D3B66]">{money(phase.low)} – {money(phase.high)}</strong></div>)}</div>
      </DecisionCard>

      <section className="grid gap-4 lg:grid-cols-2">
        <DecisionCard icon={Gauge} eyebrow="Price movement" title="What if market prices move before procurement?">
          <div className="grid gap-3 sm:grid-cols-2">{sensitivity.map((item) => <div key={item.percent} className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C8A45D]">{item.percent === 0 ? "Current model" : `+${item.percent}% movement`}</p><strong className="mt-2 block text-lg text-[#071E33]">{money(item.low)} – {money(item.high)}</strong></div>)}</div>
        </DecisionCard>

        <DecisionCard icon={BadgeCheck} eyebrow="Estimate quality" title="Confidence by cost section">
          <div className="space-y-3">{confidence.map((item) => <div key={item.id} className="grid gap-2 border-b border-[#0D3B66]/10 pb-3 last:border-b-0 sm:grid-cols-[1fr_auto]"><div><p className="text-sm font-semibold text-[#071E33]">{item.label}</p><p className="mt-1 text-xs leading-5 text-[#3A4653]/65">{item.reason}</p></div><span className={`h-fit px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${item.level === "Higher" ? "bg-[#EAF4EF] text-[#225B3D]" : item.level === "Lower" ? "bg-[#FFF4E5] text-[#875B14]" : "bg-[#EEF3F7] text-[#0D3B66]"}`}>{item.level}</span></div>)}</div>
        </DecisionCard>
      </section>

      <DecisionCard icon={Sparkles} eyebrow="Rate context" title="Cross-check the planning model against the price library">
        {prices.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{prices.map((item) => <article key={item.id} className="border border-[#0D3B66]/10 bg-[#F7F8FA] p-4"><p className="text-xs font-semibold text-[#071E33]">{item.description}</p><strong className="mt-2 block text-lg text-[#0D3B66]">{item.rate === null ? "Price required" : `${fullMoney(item.rate)} / ${item.unit}`}</strong><p className="mt-1 text-[10px] leading-4 text-[#3A4653]/60">{item.location} · reference updated {new Date(item.updatedAt).toLocaleDateString("en-NG")}</p></article>)}</div> : <p className="text-sm leading-6 text-[#3A4653]">There is not yet a direct public price-library item for this scope. The estimator therefore relies on its discipline planning rate model and location allowance.</p>}
        <div className="mt-4 flex items-start gap-3 border-l-2 border-[#C8A45D] bg-[#FFF9ED] p-4"><CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#9A6416]" /><p className="text-xs leading-6 text-[#74520D]">The price cards are a cross-check, not a hidden multiplier. We do not automatically distort an estimate with incomplete price-library data. As verified supplier/location coverage improves, the rate model can be calibrated deliberately.</p></div>
        <Link href="/prices" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#0D3B66]">Open price references <ArrowRight className="h-4 w-4" /></Link>
      </DecisionCard>

      <section className="border border-[#0D3B66]/10 bg-[#071E33] p-6 text-white md:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">Keep or continue this estimate</p><h3 className="mt-2 text-2xl font-semibold">Download, share or send the exact scope to Charismak.</h3><p className="mt-3 max-w-2xl text-xs leading-6 text-white/60">The Contact handoff carries this project type, location, cost range, likely figure and scope summary so you do not have to type the estimator information again.</p>{shareMessage ? <p className="mt-2 text-xs text-[#E8C77F]">{shareMessage}</p> : null}</div>
          <div className="flex flex-wrap gap-3"><button type="button" onClick={downloadPdf} className="inline-flex items-center gap-2 border border-white/20 px-4 py-3 text-xs font-bold hover:bg-white/5"><Download className="h-4 w-4" />Download PDF</button><button type="button" onClick={shareEstimate} className="inline-flex items-center gap-2 border border-white/20 px-4 py-3 text-xs font-bold hover:bg-white/5"><Share2 className="h-4 w-4" />Share estimate</button><Link href={contactHref} className="inline-flex items-center gap-2 bg-[#C8A45D] px-5 py-3 text-xs font-bold text-[#071E33]">Contact us for detailed estimate <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>
    </div>
  );
}

function DecisionCard({ icon: Icon, eyebrow, title, children }: { icon: typeof Scale; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="border border-[#0D3B66]/10 bg-white p-5 md:p-6"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center bg-[#F7F8FA] text-[#0D3B66]"><Icon className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8A45D]">{eyebrow}</p><h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#071E33]">{title}</h3></div></div><div className="mt-5">{children}</div></section>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#F7F8FA] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#3A4653]/55">{label}</p><strong className="mt-2 block text-xl text-[#071E33]">{value}</strong></div>;
}
