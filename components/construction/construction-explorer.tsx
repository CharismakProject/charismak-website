"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, BookOpen, Box, Building2, Check, ChevronLeft, ChevronRight, Droplets, ExternalLink, Focus, GraduationCap, Layers3, LoaderCircle, Maximize2, MousePointer2, Pause, Play, RotateCcw, Route, ScanLine, Wrench, X, Zap } from "lucide-react";
import { LEARNING_MODELS, LEARNING_REFERENCES, LEARNING_TRACKS, LESSON_COUNT, getLearningModel, type LearningModel, type ModelId } from "@/lib/construction/learning";
import type { TeachingSceneHandle, TeachingSceneState, ViewMode } from "./teaching-scene";
import styles from "./construction-explorer.module.css";
import ConstructionCostPanel, { ConstructionCostSummary } from "./construction-cost-panel";
import { useConstructionCosts } from "./use-construction-costs";

type ViewerHandle = Pick<TeachingSceneHandle, "view" | "focus">;
type ViewerProps = { model: LearningModel; state: TeachingSceneState; onPart: (id: string) => void; onStage: (step: number) => void; onControllerReady: (handle: ViewerHandle | null) => void };
const TRACK_ICONS = [Building2, Layers3, Wrench, Droplets, Zap];
const MODEL_SHORT_NAMES: Partial<Record<ModelId, string>> = { bungalow: "Bungalow", "storey-building": "Two-storey house", "concrete-frame": "Concrete frame", "truss-bridge": "Truss bridge" };

function ModelViewport({ model, state, onPart, onStage, onControllerReady }: ViewerProps) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<{ update: (state: TeachingSceneState) => void; dispose: () => void } | null>(null);
  const latest = useRef({ state, onPart, onStage });
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => { latest.current = { state, onPart, onStage }; scene.current?.update(state); }, [state, onPart, onStage]);
  useEffect(() => {
    let cancelled = false;
    const target = host.current!;
    async function start() {
      if (model.id === "storey-building") {
        // Two-storey survey-to-handover model (WebGPU with WebGL 2 fallback).
        const canvas = document.createElement("canvas");
        canvas.style.display = "block"; canvas.style.width = "100%"; canvas.style.height = "100%"; canvas.style.touchAction = "none";
        canvas.setAttribute("aria-label", "3D model of a two-storey house under construction. Drag to rotate, pinch or scroll to zoom.");
        target.appendChild(canvas);
        const { createWalkthroughScene } = await import("@/components/rates/walkthrough/walkthrough-scene");
        if (cancelled) { canvas.remove(); return; }
        const handle = await createWalkthroughScene(canvas);
        if (cancelled) { handle.dispose(); canvas.remove(); return; }
        const update = (value: TeachingSceneState) => { handle.setStep(value.step); handle.setSection(value.section); };
        scene.current = { update, dispose: () => { handle.dispose(); canvas.remove(); } };
        onControllerReady({ view: handle.view, focus: () => handle.view("iso") });
        update(latest.current.state); setStatus("ready");
      } else if (model.id === "bungalow") {
        const { createConstructionScene } = await import("./construction-scene");
        if (cancelled) return;
        const handle = await createConstructionScene(target, { onSelect: step => latest.current.onStage(step), onReady: () => { if (!cancelled) setStatus("ready"); }, onError: () => { if (!cancelled) setStatus("error"); } });
        if (cancelled) { handle.dispose(); return; }
        const update = (value: TeachingSceneState) => { handle.update(value.step, value.section); handle.explode(value.exploded); };
        scene.current = { update, dispose: handle.dispose };
        onControllerReady({ view: handle.view, focus: () => handle.view("iso") });
        update(latest.current.state);
      } else {
        const { createTeachingScene } = await import("./teaching-scene");
        if (cancelled) return;
        const handle = await createTeachingScene(target, model.id, id => latest.current.onPart(id));
        if (cancelled) { handle.dispose(); return; }
        scene.current = handle; onControllerReady(handle); handle.update(latest.current.state); setStatus("ready");
      }
    }
    start().catch(error => { console.error("Construction explorer:", error); if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; scene.current?.dispose(); scene.current = null; onControllerReady(null); };
  }, [model.id, onControllerReady]);
  return <><div ref={host} className={styles.canvas} data-model={model.id} data-step={state.step} />{status !== "ready" && <div className={styles.loading} role="status">{status === "loading" ? <><LoaderCircle className={styles.spinner} size={24} /><span>Preparing your model…</span></> : <><Box size={26} /><span>The model could not load.</span><button onClick={() => window.location.reload()}>Reload page</button><small>You can still explore the lessons and components.</small></>}</div>}</>;
}

function initialSection(id: ModelId, step: number) { return id === "plumbing" || id === "electrical" || (id === "bungalow" && step >= 8 && step <= 11); }

export default function ConstructionExplorer() {
  const [modelId, setModelId] = useState<ModelId>("bungalow");
  const [step, setStep] = useState(13), [section, setSection] = useState(false), [exploded, setExploded] = useState(false), [paths, setPaths] = useState(false);
  const [selected, setSelected] = useState<string | null>(null), [tab, setTab] = useState<"lesson" | "parts" | "costs">("costs"), [playing, setPlaying] = useState(false), [linked, setLinked] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("iso");
  const controller = useRef<ViewerHandle | null>(null), viewer = useRef<HTMLDivElement>(null);
  const onControllerReady = useCallback((handle: ViewerHandle | null) => { controller.current = handle; }, []);
  const model = getLearningModel(modelId), lesson = model.lessons[step], part = model.parts.find(item => item.id === selected);
  const changeModel = useCallback((id: ModelId, targetStep?: number) => {
    const next = getLearningModel(id), nextStep = Math.min(next.lessons.length - 1, Math.max(0, targetStep ?? next.defaultStep));
    setModelId(next.id); setStep(nextStep); setSection(initialSection(next.id, nextStep)); setExploded(false); setPaths(false); setSelected(null); setPlaying(false); setViewMode("iso"); setTab("costs");
  }, []);
  useEffect(() => {
    const read = () => {
      const query = new URLSearchParams(window.location.search);
      const [id, index] = window.location.hash ? window.location.hash.slice(1).split("/") : [query.get("model") ?? "", query.get("step") ?? undefined];
      const match = LEARNING_MODELS.find(item => item.id === id);
      if (match) changeModel(match.id, index !== undefined && /^\d+$/.test(index) ? Number(index) : undefined);
    };
    read(); setLinked(true); window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [changeModel]);
  useEffect(() => { if (linked) window.history.replaceState(null, "", `#${modelId}/${step}`); }, [linked, modelId, step]);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(step + 1, model.lessons.length - 1);
      setStep(next);
      if (model.id === "bungalow") setSection(initialSection(model.id, next));
      if (next === model.lessons.length - 1) setPlaying(false);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [playing, step, model]);
  const chooseStep = useCallback((index: number) => {
    setPlaying(false); setSelected(null); setStep(Math.max(0, Math.min(model.lessons.length - 1, index)));
    if (model.id === "bungalow") setSection(initialSection(model.id, index));
  }, [model]);
  const choosePart = useCallback((id: string) => {
    const item = model.parts.find(entry => entry.id === id); if (!item) return;
    setPlaying(false); setSelected(id); setStep(current => model.id === "bungalow" ? item.step : Math.max(current, item.step));
    if (model.id === "bungalow") setSection(initialSection(model.id, item.step));
    if (id === "rc-stairs" || id === "plumb-traps" || id === "plumb-heaters") setSection(true);
  }, [model]);
  const changeView = (mode: ViewMode) => { setViewMode(mode); controller.current?.view(mode); };
  const reset = () => { setSection(initialSection(modelId, step)); setExploded(false); setPaths(false); setSelected(null); changeView("iso"); };
  const fullScreen = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void viewer.current?.requestFullscreen?.().catch(() => {}); };
  const relatedModels = LEARNING_MODELS.filter(item => item.track === model.track);
  const costs = useConstructionCosts(modelId);
  const pauseForCosts = useCallback(() => setPlaying(false), []);
  const sceneState: TeachingSceneState = { step, section, exploded, paths, selected };

  return <main className={styles.page}>
    <div className={styles.container}>
      <header className={styles.intro}>
        <div><p className={styles.eyebrow}><GraduationCap size={16} /> CHARISMAK LEARNING SPACE</p><h1>See how <span>it’s built.</span></h1><p className={styles.lead}>Explore construction in 3D. Peel back the layers, follow the systems,<br className={styles.desktopBreak} /> and understand what makes a building work.</p></div>
        <div className={styles.introAside}><span><strong>{String(LEARNING_MODELS.length).padStart(2, "0")}</strong> interactive models</span><span><strong>{LESSON_COUNT}</strong> guided lessons</span><Link href="/construction-studio">Build your own project <ArrowRight size={15} /></Link></div>
      </header>

      <Link className={styles.studioEntry} href="/construction-studio"><span><strong>Bring your own drawing and BOQ.</strong> Upload a model or trace a plan, review the stages and play a proposed construction programme with cost.</span><ArrowRight size={19} /></Link>
      <nav className={styles.tracks} aria-label="Construction topics">{LEARNING_TRACKS.map((track, index) => {
        const Icon = TRACK_ICONS[index]; return <button type="button" key={track.id} aria-pressed={model.track === track.id} onClick={() => changeModel(LEARNING_MODELS.find(item => item.track === track.id)!.id)}><Icon size={22} style={{ color: track.color }} /><span><strong>{track.title}</strong><small>{track.description}</small></span>{model.track === track.id && <span className={styles.activeDot} />}</button>;
      })}</nav>

      <section className={`${styles.explorer} ${tab === "costs" ? styles.costLayout : ""}`} aria-label="Interactive construction explorer">
        <div className={styles.modelBar}><div><span className={styles.miniLabel}>EXPLORE THE MODEL</span><h2>{model.title}</h2></div>{relatedModels.length > 1 ? <div className={styles.modelChoices} aria-label="Structure model">{relatedModels.map(item => <button key={item.id} type="button" aria-pressed={modelId === item.id} onClick={() => changeModel(item.id)}>{MODEL_SHORT_NAMES[item.id] ?? item.title}</button>)}</div> : <span className={styles.modelSubtitle}>{model.subtitle}</span>}</div>
        <div className={styles.viewer} ref={viewer}>
          <ModelViewport key={modelId} model={model} state={sceneState} onPart={choosePart} onStage={chooseStep} onControllerReady={onControllerReady} />
          <div className={styles.viewerTop}><span className={styles.liveBadge}><i /> INTERACTIVE MODEL</span><div className={styles.views} aria-label="Camera view">{(["iso", "plan", "front"] as ViewMode[]).map(mode => <button type="button" aria-pressed={viewMode === mode} key={mode} onClick={() => changeView(mode)}>{mode === "iso" ? "3D" : mode === "plan" ? "Plan" : "Front"}</button>)}</div></div>
          <div className={styles.viewerHint}><MousePointer2 size={13} /> Drag to rotate · Scroll / pinch to zoom · Select a part</div>
          <div className={styles.legend}>{model.legend.map(item => <span key={item.label}><i style={{ backgroundColor: item.color }} />{item.label}</span>)}</div>
          {exploded && <div className={styles.explodedBadge}>Exploded view · layers separated for learning</div>}
          {paths && <div className={styles.explodedBadge}>{modelId === "electrical" ? "Circuit groups · colours identify routes, not conductors" : model.track === "structures" || model.track === "steel" ? "Conceptual paths · no forces or capacities calculated" : "Illustrative routes · no pipe sizing or flow calculation"}</div>}
          <div className={styles.viewerTools}><button type="button" aria-pressed={section} onClick={() => setSection(value => !value)}><ScanLine size={16} />{section ? "Section view" : "Show section"}</button>{model.explodable && <button type="button" aria-pressed={exploded} onClick={() => { setExploded(value => !value); setPaths(false); }}><Layers3 size={16} />Explode</button>}{model.pathsLabel && <button type="button" aria-pressed={paths} onClick={() => { setPaths(value => !value); setExploded(false); }}><Route size={16} />{modelId === "plumbing" ? "Water routes" : modelId === "electrical" ? "Circuit routes" : "Load paths"}</button>}<span className={styles.toolSpacer} /><button type="button" className={styles.iconButton} onClick={reset} aria-label="Reset model view" title="Reset view"><RotateCcw size={17} /></button><button type="button" className={styles.iconButton} onClick={fullScreen} aria-label="Fullscreen model" title="Fullscreen"><Maximize2 size={17} /></button></div>
        </div>

        <aside className={styles.guide}>
          <div className={styles.guideTabs}><button type="button" aria-pressed={tab === "lesson"} onClick={() => setTab("lesson")}><BookOpen size={15} /> Lesson</button><button type="button" aria-pressed={tab === "parts"} onClick={() => setTab("parts")}><Box size={15} /> Parts <span>{model.parts.length}</span></button><button type="button" aria-pressed={tab === "costs"} onClick={() => setTab("costs")}><Layers3 size={15} /> Rate build-up</button></div>
          <ConstructionCostSummary costs={costs} step={step} onOpen={tab !== "costs" ? () => setTab("costs") : undefined} />
          <div className={styles.guideBody}>
            {tab === "costs" ? <ConstructionCostPanel costs={costs} model={modelId} step={step} onInteract={pauseForCosts} /> : tab === "lesson" ? <div aria-live="polite" aria-atomic="true"><p className={styles.stepLabel}>STEP {String(step + 1).padStart(2, "0")} <span>/ {String(model.lessons.length).padStart(2, "0")}</span></p><h3>{lesson.title}</h3><p className={styles.lessonSee}>{lesson.see}</p><div className={styles.teachingPoint}><span><BookOpen size={15} /> WHY IT MATTERS</span><p>{lesson.why}</p></div><div className={styles.teachingPoint}><span><Check size={15} /> LOOK CLOSER</span><p>{lesson.check}</p></div></div> : <><p className={styles.partsIntro}>Select a component here or in the model to learn what it does.</p><div className={styles.parts}>{model.parts.map(item => <button key={item.id} type="button" aria-pressed={selected === item.id} onClick={() => choosePart(item.id)}><span className={styles.partNumber}>{String(item.step + 1).padStart(2, "0")}</span><span>{item.title}</span>{selected === item.id ? <Check size={15} /> : <ChevronRight size={15} />}</button>)}</div></>}
            {part && <div className={styles.inspector} aria-live="polite"><div><span className={styles.miniLabel}>SELECTED COMPONENT</span><button type="button" onClick={() => setSelected(null)} aria-label="Clear selected component"><X size={15} /></button></div><h4>{part.title}</h4><p>{part.detail}</p><button type="button" className={styles.focusButton} onClick={() => { setExploded(false); controller.current?.focus(part.id); }}><Focus size={15} />{modelId === "bungalow" ? "Show overall view" : "Focus on this part"}</button></div>}
          </div>
          <div className={styles.playback}><button type="button" onClick={() => chooseStep(step - 1)} disabled={step === 0} aria-label="Previous lesson"><ChevronLeft size={19} /></button><button type="button" className={styles.play} onClick={() => { setSelected(null); if (!playing && step === model.lessons.length - 1) setStep(0); setPlaying(value => !value); }}>{playing ? <Pause size={15} /> : <Play size={15} />}{playing ? "Pause tour" : "Play guided tour"}</button><button type="button" onClick={() => chooseStep(step + 1)} disabled={step === model.lessons.length - 1} aria-label="Next lesson"><ChevronRight size={19} /></button></div>
        </aside>
        <div className={styles.timeline}><div className={styles.timelineHeading}><span><span className={styles.miniLabel}>CONSTRUCTION SEQUENCE</span><small>{step + 1} of {model.lessons.length}</small></span><button type="button" onClick={() => { chooseStep(model.lessons.length - 1); setSection(modelId === "plumbing" || modelId === "electrical"); setExploded(false); }}>Explore complete model <ArrowRight size={14} /></button></div><div className={styles.steps}>{model.lessons.map((item, index) => <button type="button" key={item.title} aria-current={step === index ? "step" : undefined} onClick={() => chooseStep(index)}><span>{index < step ? <Check size={14} /> : String(index + 1).padStart(2, "0")}</span><small>{item.short}</small></button>)}</div><label className={styles.srOnly} htmlFor="construction-step">Construction stage</label><input id="construction-step" className={styles.stageRange} type="range" min={0} max={model.lessons.length - 1} value={step} onChange={event => chooseStep(Number(event.target.value))} aria-valuetext={lesson.title} /></div>
      </section>

      <div className={styles.below}><div className={styles.learningNote}><GraduationCap size={23} /><div><strong>Learn the system. Understand the sequence.</strong><p>{model.note}</p>{model.id === "electrical" && <p>Route colours identify circuit groups; this is not a conductor-colour key or an installation wiring diagram.</p>}<details><summary>Further reading <ArrowDown size={13} /></summary><ul>{model.references.map(key => { const ref = LEARNING_REFERENCES[key]; return <li key={key}><a href={ref.url} target="_blank" rel="noreferrer">{ref.title} <ExternalLink size={12} /></a><small>{ref.source}</small></li>; })}</ul><p>These references explain general principles. Apply the requirements and professional approvals relevant to the actual project in Nigeria.</p></details></div></div><div className={styles.rateCard}><Layers3 size={21} /><div><strong>From the model to the numbers</strong><p>Every stage links to its Rate Bank build-up. Open the Rate Bank to see all rates and edit your own copy.</p><Link href="/rates">Open the Rate Bank <ArrowRight size={15} /></Link></div></div></div>
      <div className={styles.bottomLine}><span>Built to explore. Designed to explain.</span><Link href="/contact">Discuss your project <ArrowRight size={14} /></Link></div>
    </div>
  </main>;
}
