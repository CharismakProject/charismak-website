"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Download, Expand, Layers3, MapPin, MousePointer2, Pause, Play, RotateCcw, ShieldCheck } from "lucide-react";
import { BUILD_STAGES, SAMPLE_BUILDING, compactMoney, csvCell, money, priceStages, type Overrides } from "../../lib/construction/walkthrough";
import { RATE_LOCATIONS, getLocation } from "../../lib/rates/locations";
import type { SceneHandle } from "./construction-scene";
import styles from "./construction-walkthrough.module.css";

const STORAGE = "charismak-walkthrough-v1";
const finite = (value: number) => Number.isFinite(value) && value >= 0 && value <= 1e10;
type Props = { siteOrigin?: string };

export default function ConstructionWalkthrough({ siteOrigin = "" }: Props) {
  const [stage, setStage] = useState(5);
  const [locationId, setLocationId] = useState("fct");
  const [cutaway, setCutaway] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [overrides, setOverrides] = useState<Overrides>({});
  const [restored, setRestored] = useState(false);
  const [saved, setSaved] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const timelineRef = useRef<HTMLElement>(null);
  const selectStage = useCallback((next: number) => {
    const safe = Math.max(0, Math.min(BUILD_STAGES.length - 1, next));
    setStage(safe); setCutaway(safe >= 8 && safe <= 10);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    import("./construction-scene").then(({ createConstructionScene }) => createConstructionScene(host, {
      onSelect: (next) => { if (!cancelled) { setPlaying(false); selectStage(next); } },
      onReady: () => { if (!cancelled) setReady(true); },
      onError: () => { if (!cancelled) setFailed(true); },
    })).then((handle) => { if (cancelled) handle.dispose(); else { sceneRef.current = handle; handle.update(5, false); } }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; sceneRef.current?.dispose(); sceneRef.current = null; };
  }, [selectStage]);

  useEffect(() => { sceneRef.current?.update(stage, cutaway); }, [stage, cutaway, ready]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => { if (stage === BUILD_STAGES.length - 1) setPlaying(false); else selectStage(stage + 1); }, 4500);
    return () => window.clearTimeout(timer);
  }, [playing, stage, selectStage]);
  useEffect(() => {
    try {
      const raw = JSON.parse(window.localStorage.getItem(STORAGE) ?? "null");
      if (raw && typeof raw === "object") {
        const valid: Overrides = {};
        if (raw.overrides && typeof raw.overrides === "object") for (const [key, value] of Object.entries(raw.overrides)) {
          if (!value || typeof value !== "object" || !/^[a-z-]+:[a-z-]+$/.test(key)) continue;
          const entry = value as { quantity?: unknown; rate?: unknown };
          valid[key] = { ...(typeof entry.quantity === "number" && finite(entry.quantity) ? { quantity: entry.quantity } : {}), ...(typeof entry.rate === "number" && finite(entry.rate) ? { rate: entry.rate } : {}) };
        }
        setOverrides(valid);
        if (RATE_LOCATIONS.some((item) => item.id === raw.locationId)) setLocationId(raw.locationId);
      }
    } catch { /* Local storage is optional. */ }
    const hash = window.location.hash.slice(1);
    const match = BUILD_STAGES.findIndex((item) => item.id === hash);
    if (match >= 0) selectStage(match);
    setRestored(true);
  }, [selectStage]);
  useEffect(() => {
    if (!restored) return;
    try { window.localStorage.setItem(STORAGE, JSON.stringify({ locationId, overrides })); setSaved(true); } catch { setSaved(false); }
  }, [overrides, locationId, restored]);
  useEffect(() => {
    if (!restored) return;
    window.history.replaceState(null, "", `#${BUILD_STAGES[stage].id}`);
    const selected = timelineRef.current?.querySelector<HTMLElement>('[aria-current="step"]');
    if (selected && timelineRef.current) {
      const nav = timelineRef.current;
      if (selected.offsetLeft < nav.scrollLeft || selected.offsetLeft + selected.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollTo({ left: selected.offsetLeft - nav.clientWidth / 2 + selected.offsetWidth / 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  }, [stage, restored]);

  const priced = useMemo(() => priceStages(locationId, overrides), [locationId, overrides]);
  const current = priced[stage];
  const full = priced.reduce((sum, item) => sum + item.total, 0);
  const pending = priced.reduce((sum, item) => sum + item.unpriced, 0);
  const cumulative = priced.slice(0, stage + 1).reduce((sum, item) => sum + item.total, 0);
  const location = getLocation(locationId);
  const displayed = showAll ? priced : [current];
  const manualCount = Object.keys(overrides).filter((key) => key.startsWith(`${locationId}:`)).length;
  const edit = (id: string, field: "quantity" | "rate", raw: string) => {
    const value = Number(raw);
    if (raw !== "" && !finite(value)) return;
    const key = `${locationId}:${id}`;
    setOverrides((old) => {
      const entry = { ...old[key] };
      if (raw === "") delete entry[field]; else entry[field] = value;
      const next = { ...old };
      if (entry.quantity === undefined && entry.rate === undefined) delete next[key]; else next[key] = entry;
      return next;
    });
  };
  const reset = () => setOverrides((old) => Object.fromEntries(Object.entries(old).filter(([key]) => !key.startsWith(`${locationId}:`))));
  const download = () => {
    const rows: (string | number)[][] = [
      ["CHARISMAK — ILLUSTRATIVE CONSTRUCTION WALKTHROUGH"],
      ["Model", "Two-bedroom bungalow; 12 m x 10 m; sample quantities, not measured project quantities"],
      ["Location", location.name, location.status === "provisional" ? "Provisional regional adjustment" : "Abuja base references"],
      ["Basis", "Bank rates include their existing allowances; no additional O/P or VAT added. Unpriced work is excluded from the subtotal."],
      ["Stage", "Description", "Quantity", "Unit", "Rate NGN", "Amount NGN", "Source", "Reviewed", "Status", "Quantity / scope basis"],
      ...priced.flatMap((phase) => phase.items.map((item) => [phase.title, item.title, item.quantity, item.unit, item.rate ?? "UNPRICED", item.rate === null ? "EXCLUDED" : Math.round(item.amount * 100) / 100, item.custom ? "User rate" : item.reference?.code ?? "Rate required", item.custom ? "User entry" : item.reference?.lastReviewed ?? "", item.custom ? "User supplied" : item.reference?.status ?? "Unpriced", item.basis])),
      ["PRICED WORK SUBTOTAL", "", "", "", "", Math.round(full * 100) / 100], ["UNPRICED ITEMS", pending],
      ["Exclusions", "Land, boundary fencing, additional O/P and VAT. Unpriced items must be costed for a complete project budget."],
    ];
    const blob = new Blob(["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Charismak_Building_Walkthrough_${locationId}.csv`; a.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <main className={styles.walkthrough}>
    <div className={styles.container}>
      <header className={styles.intro}>
        <div><a className={styles.back} href={`${siteOrigin}/construction-explorer`}><ArrowLeft size={14} /> Construction Explorer</a><p className={styles.eyebrow}>THE BUILDING JOURNEY <span> / </span> AN INTERACTIVE GUIDE</p><h1>From bare ground.<br /><span>To your front door.</span></h1><p className={styles.lead}>Watch a home take shape. Explore the work, understand the checks,<br className={styles.desktopBreak} /> and see how the costs come together — one stage at a time.</p></div>
        <div className={styles.introAside}><span className={styles.tag}><span /> Design · Cost · Build</span><p>One building.<br /><strong>Every step explained.</strong></p><a href="#work-costs">Explore the quantities <ArrowDown size={15} /></a></div>
      </header>

      <section className={styles.projectBar} aria-label="Example building and rate location">
        <div className={styles.projectName}><span className={styles.modelIcon}><Layers3 size={20} /></span><div><small>THE EXAMPLE</small><strong>{SAMPLE_BUILDING.title}</strong></div></div>
        <div className={styles.projectStat}><strong>120<span> m²</span></strong><small>Sample floor area</small></div><div className={styles.projectStat}><strong>14<span> stages</span></strong><small>Planning to handover</small></div>
        <label className={styles.location}><MapPin size={16} /><span><small>RATE LOCATION</small><select value={locationId} onChange={(event) => setLocationId(event.target.value)} aria-label="Rate location">{RATE_LOCATIONS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></span></label>
      </section>

      <section className={styles.explorer} aria-label="Interactive construction process">
        <div className={styles.viewer} ref={viewerRef}>
          <div className={styles.viewerHeading}><span><span className={styles.liveDot} /> LIVE 3D MODEL</span><span>12.0 × 10.0 m <span className={styles.subtle}> / illustrative</span></span></div>
          <div ref={hostRef} className={styles.canvas} />
          {!ready && !failed && <div className={styles.loading}><Layers3 size={28} /><span>Preparing your building…</span></div>}
          {failed && <div className={styles.loading}><Layers3 size={32} /><strong>3D is unavailable on this device.</strong><span>You can still explore every stage and its costs below.</span></div>}
          <div className={styles.modelCaption}><span>{String(stage + 1).padStart(2, "0")} / 14</span><strong>{current.title}</strong><small>{cutaway ? "Section view · roof and two outer walls hidden" : "Exterior view · select a building part to explore"}</small></div>
          <div className={styles.viewerTools}><button type="button" aria-pressed={cutaway} onClick={() => setCutaway((value) => !value)} title="Toggle section view"><Layers3 size={16} /> <span>{cutaway ? "Show exterior" : "See inside"}</span></button><button type="button" onClick={() => sceneRef.current?.reset()} aria-label="Reset camera" title="Reset camera"><RotateCcw size={16} /></button><button type="button" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void viewerRef.current?.requestFullscreen().catch(() => {}); }} aria-label="Expand 3D viewer" title="Expand viewer"><Expand size={16} /></button><span className={styles.dragHint}><MousePointer2 size={13} /> Drag to orbit · scroll to zoom</span></div>
        </div>
        <aside className={styles.stageCard} aria-live="polite">
          <div className={styles.stageEyebrow}><span>{current.group}</span><span>{String(stage + 1).padStart(2, "0")} <em>/ 14</em></span></div>
          <h2>{current.title}</h2><p className={styles.description}>{current.description}</p>
          <div className={styles.checkTitle}><ShieldCheck size={16} /> BEFORE YOU MOVE ON</div><ul className={styles.checks}>{current.checks.map((item) => <li key={item}><CheckCircle2 size={16} /><span>{item}</span></li>)}</ul>
          <div className={styles.stageCost}><div><small>PRICED WORK AT THIS STAGE</small><strong>{current.items.every((item) => item.rate === null) ? "Rate required" : compactMoney(current.total)}</strong></div><a href="#work-costs">See breakdown <ArrowDown size={14} /></a></div>
          {current.unpriced > 0 && <p className={styles.unpriced}>{current.unpriced} item{current.unpriced > 1 ? "s" : ""} still need{current.unpriced === 1 ? "s" : ""} a rate. Subtotal excludes these.</p>}
          <div className={styles.stepControls}><button type="button" onClick={() => { setPlaying(false); selectStage(stage - 1); }} disabled={stage === 0} aria-label="Previous stage"><ChevronLeft size={18} /></button><button type="button" className={styles.playButton} onClick={() => { if (playing) setPlaying(false); else { selectStage(0); setPlaying(true); } }}>{playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}{playing ? "Pause walkthrough" : "Play from the start"}</button><button type="button" onClick={() => { setPlaying(false); selectStage(stage + 1); }} disabled={stage === 13} aria-label="Next stage"><ChevronRight size={18} /></button></div>
        </aside>
      </section>

      <nav className={styles.timeline} ref={timelineRef} aria-label="Building stages">{BUILD_STAGES.map((item, index) => <button type="button" key={item.id} onClick={() => { setPlaying(false); selectStage(index); }} aria-current={stage === index ? "step" : undefined}><span className={styles.stageNumber}>{index < stage ? <Check size={13} /> : String(index + 1).padStart(2, "0")}</span><span>{item.short}</span><i /></button>)}</nav>

      <section className={styles.summary} aria-label="Cost summary"><div><small>PRICED THROUGH STAGE {String(stage + 1).padStart(2, "0")}</small><strong>{compactMoney(cumulative)}</strong><span>Based on the items entered so far</span></div><div><small>ALL-STAGE PRICED WORK SUBTOTAL</small><strong>{compactMoney(full)}</strong><span>{pending} unpriced items excluded · not a complete budget</span></div><div className={styles.rateBasis}><span className={styles.referenceBadge}>REFERENCE RATES · UNDER REVIEW</span><p>{location.name}{location.status === "provisional" ? " uses provisional regional adjustments." : " uses the existing Abuja rate-bank build-ups."} Quantities are illustrative. Edit them against your project.</p></div></section>

      <section id="work-costs" className={styles.costSection}>
        <header className={styles.costHeading}><div><p className={styles.eyebrow}>UNDERSTAND THE NUMBERS</p><h2>The work behind the cost.</h2><p>Quantity × unit rate. Open a reference to inspect its build-up.</p></div><button type="button" className={styles.export} onClick={download}><Download size={16} /> Export all stages</button></header>
        <div className={styles.tableTools}><div className={styles.tabs}><button type="button" aria-pressed={!showAll} onClick={() => setShowAll(false)}>This stage</button><button type="button" aria-pressed={showAll} onClick={() => setShowAll(true)}>All 14 stages</button></div><div className={styles.saveInfo}><span>{saved ? <><Check size={13} /> Saved on this device</> : "Edits apply on this device"}</span>{manualCount > 0 && <button type="button" onClick={reset}><RotateCcw size={12} /> Reset {location.name} edits</button>}</div></div>
        {displayed.map((phase) => <div className={styles.phaseTable} key={phase.id}><div className={styles.phaseTitle}><h3>{phase.title}</h3><span>{phase.unpriced ? `${phase.unpriced} unpriced · ` : ""}{money(phase.total)}</span></div><div className={styles.tableScroll}><table><thead><tr><th>Work description</th><th>Quantity</th><th>Unit</th><th>Rate (₦)</th><th>Amount (₦)</th></tr></thead><tbody>{phase.items.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><div className={styles.source}>{item.custom ? <span className={styles.custom}>Your rate</span> : item.reference ? <a href={`${siteOrigin}/rates/${item.reference.slug}${locationId === "fct" ? "" : `?state=${locationId}`}`} target="_blank" rel="noopener noreferrer">{item.reference.code} · {item.reference.lastReviewed} · under review ↗</a> : <span className={styles.needsRate}>Rate required</span>}</div><details><summary>Quantity and scope basis</summary><p>{item.basis}</p>{item.reference && <p>{item.reference.specification}</p>}</details></td><td><input type="number" min="0" max="10000000000" step="any" aria-label={`${item.title} quantity`} value={item.quantity} onChange={(event) => edit(item.id, "quantity", event.target.value)} /></td><td>{item.unit}</td><td><input type="number" min="0" max="10000000000" step="any" placeholder="Enter rate" aria-label={`${item.title} rate`} value={item.rate === null ? "" : Math.round(item.rate * 100) / 100} onChange={(event) => edit(item.id, "rate", event.target.value)} /></td><td className={styles.amount}>{item.rate === null ? <span>Unpriced</span> : money(item.amount).replace("₦", "")}</td></tr>)}</tbody></table></div></div>)}
        <div className={styles.basisNote}><ShieldCheck size={19} /><div><strong>A clear basis for a better conversation.</strong><p>This is an educational 120 m² example, not a measured quotation or structural design. Rates come from the existing Charismak bank and retain its review dates and allowances. Supply costs are separate where the bank only prices installation. No additional contractor overhead/profit or VAT has been added. Land and boundary fencing are excluded. Price all outstanding items and confirm the drawings, site conditions and specifications for a project budget.</p></div></div>
      </section>
      <section className={styles.cta}><div><p className={styles.eyebrow}>YOUR BUILDING, YOUR NUMBERS</p><h2>Let’s put a proper plan<br />behind your project.</h2><p>Bring your drawings. We’ll help you understand the scope,<br className={styles.desktopBreak} /> measure the work and build a practical budget.</p></div><a href={`${siteOrigin}/quote`}>Discuss your project <ArrowRight size={19} /></a></section>
      <footer className={styles.miniFooter}><strong>CHARISMAK <span>PROJECT NIGERIA LIMITED</span></strong><span>Design · Cost · Build</span><a href={`${siteOrigin}/rates`}>Back to rate bank <ArrowRight size={13} /></a></footer>
    </div>
  </main>;
}
