"use client";

import { useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Bot, CheckCircle2, FileImage, LoaderCircle, Upload } from "lucide-react";

import type { ProjectSpace, UniversalProject } from "@/lib/projects/models";
import { saveProject } from "@/lib/projects/store";

type RoomResult = { name: string; count: number; lengthM: number | null; widthM: number | null; confidence: "high" | "medium" | "low" };
type Interpretation = {
  suitable: boolean;
  drawingType: "architectural-plan" | "hand-sketch" | "other" | "unreadable";
  summary: string;
  projectType: string;
  floorCount: number | null;
  floorAreaM2: number | null;
  buildingLengthM: number | null;
  buildingWidthM: number | null;
  doors: number | null;
  windows: number | null;
  rooms: RoomResult[];
  confidence: "high" | "medium" | "low";
  warnings: string[];
  requiresKnownDimension: boolean;
};

const categoryForRoom = (name: string): ProjectSpace["category"] => {
  const value = name.toLowerCase();
  if (value.includes("bed")) return "bedroom";
  if (value.includes("kitchen")) return "kitchen";
  if (value.includes("toilet") || value.includes("bath")) return "bathroom";
  if (value.includes("living") || value.includes("lounge") || value.includes("dining")) return "living";
  if (value.includes("office") || value.includes("shop") || value.includes("work")) return "work";
  if (value.includes("corridor") || value.includes("stair") || value.includes("lobby")) return "circulation";
  return "other";
};

export default function PlanUploadWorkspace({ project, professional = false, onBack, onContinue }: { project: UniversalProject; professional?: boolean; onBack: () => void; onContinue: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [knownDimension, setKnownDimension] = useState("");
  const [result, setResult] = useState<Interpretation | null>(null);
  const [manualReview, setManualReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const interpret = async () => {
    if (!file) { setMessage("Choose a PDF, plan image or hand-drawn sketch first."); return; }
    setLoading(true); setMessage(null); setResult(null); setManualReview(false);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("knownDimension", knownDimension);
      const response = await fetch("/api/estimator/interpret-plan", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to interpret the plan.");
      setResult(payload.interpretation as Interpretation);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to interpret the plan.");
    } finally { setLoading(false); }
  };

  const startManualReview = () => {
    setManualReview(true); setMessage(null);
    setResult({ suitable: true, drawingType: "other", summary: "Manual drawing review. Enter only the dimensions and spaces you can confirm from the uploaded file.", projectType: project.projectType, floorCount: project.scope?.floors ?? 1, floorAreaM2: project.scope?.floorAreaM2 ?? null, buildingLengthM: project.scope?.buildingLengthM ?? null, buildingWidthM: project.scope?.buildingWidthM ?? null, doors: null, windows: null, rooms: project.scope?.spaces?.map((space) => ({ name: space.name, count: space.count, lengthM: space.lengthM ?? null, widthM: space.widthM ?? null, confidence: "high" })) ?? [], confidence: "low", warnings: ["AI interpretation was not used. Confirm every value manually before continuing."], requiresKnownDimension: true });
  };

  const updateRoom = (index: number, patch: Partial<RoomResult>) => setResult((current) => current ? { ...current, rooms: current.rooms.map((room, roomIndex) => roomIndex === index ? { ...room, ...patch } : room) } : current);
  const addRoom = () => setResult((current) => current ? { ...current, rooms: [...current.rooms, { name: "New room / space", count: 1, lengthM: null, widthM: null, confidence: "low" }] } : current);
  const removeRoom = (index: number) => setResult((current) => current ? { ...current, rooms: current.rooms.filter((_, roomIndex) => roomIndex !== index) } : current);
  const updateNumber = (field: "floorCount" | "floorAreaM2" | "buildingLengthM" | "buildingWidthM", value: string) => setResult((current) => current ? { ...current, [field]: value ? Number(value) : null } : current);

  const confirm = () => {
    if (!result) return;
    const spaces: ProjectSpace[] = result.rooms.map((room, index) => ({ id: `${project.id}-drawing-room-${index}`, name: room.name, category: categoryForRoom(room.name), count: Math.max(1, room.count), lengthM: room.lengthM, widthM: room.widthM, heightM: null }));
    saveProject({ ...project, scope: { ...(project.scope ?? {}), buildingLengthM: result.buildingLengthM, buildingWidthM: result.buildingWidthM, floorAreaM2: result.floorAreaM2, floors: result.floorCount ?? 1, spaces, source: "drawing", confidence: manualReview || result.drawingType === "hand-sketch" || result.confidence === "low" ? "rough" : "detailed", assumptions: [...(project.scope?.assumptions ?? []), `${manualReview ? "Manual review" : "AI interpretation reviewed"} from ${file?.name ?? "uploaded drawing"}.`, ...result.warnings] } });
    onContinue();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-[#617286]"><ArrowLeft className="h-4 w-4" />Projects</button>
        <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B46C1]">{professional ? "Drawing review workspace" : "AI-assisted project setup"}</p><h1 className="mt-1 text-2xl font-bold text-[#081B36]">Upload a plan or sketch</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#617286]">{professional ? "This release performs an AI pre-check and structured review. It does not replace full professional measurement take-off." : "AI reads the drawing; you confirm or correct what it found; the controlled estimating engine performs the calculation."}</p></div>
      </section>

      {!result ? (
        <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6">
          <label className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#B8C7D6] bg-[#F8FAFC] p-6 text-center"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F1ECFF] text-[#6B46C1]"><Upload className="h-6 w-6" /></span><strong className="mt-4 text-[#081B36]">{file ? file.name : "Choose PDF, plan image or sketch"}</strong><span className="mt-2 text-xs text-[#617286]">PDF, PNG, JPG or WEBP · maximum 20 MB</span><input type="file" accept="application/pdf,image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="sr-only" /></label>
          <label className="mt-4 block text-xs font-semibold text-[#526579]">One known dimension (optional but helpful)<input value={knownDimension} onChange={(event) => setKnownDimension(event.target.value)} placeholder="e.g. overall building width is 12.4 m" className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-4 py-3 text-sm" /></label>
          <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" disabled={loading || !file} onClick={interpret} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}{loading ? "Reading drawing…" : "Interpret drawing"}</button><button type="button" onClick={startManualReview} className="min-h-11 rounded-xl border border-[#CAD5E0] px-4 py-3 text-xs font-bold text-[#617286]">Enter drawing details manually</button><p className="text-[11px] leading-5 text-[#617286]">Nothing enters the estimate until you approve the review.</p></div>
          {message ? <div className="mt-4 rounded-xl border border-[#F4C9BC] bg-[#FFF1EC] p-4"><p className="text-sm text-[#A82A09]">{message}</p><button type="button" onClick={startManualReview} className="mt-3 text-xs font-bold text-[#175FC4]">Continue with a manual drawing review →</button></div> : null}
        </section>
      ) : null}

      {result ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_0.38fr]">
          <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#087A50]">{manualReview ? "Manual review" : "Interpretation ready for review"}</p><h2 className="mt-1 text-xl font-bold text-[#081B36]">{manualReview ? "Enter what you can confirm" : "This is what the app understood"}</h2></div><span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase ${result.confidence === "high" ? "bg-[#E9F8F1] text-[#087A50]" : result.confidence === "medium" ? "bg-[#FFF4E4] text-[#B45B09]" : "bg-[#FFF0EB] text-[#C8320A]"}`}>{result.confidence} confidence</span></div>
            <p className="mt-3 rounded-xl bg-[#F8FAFC] p-4 text-sm leading-6 text-[#617286]">{result.summary}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{([["Floors", "floorCount"], ["Floor area (m²)", "floorAreaM2"], ["Building length (m)", "buildingLengthM"], ["Building width (m)", "buildingWidthM"]] as const).map(([label, field]) => <label key={field} className="text-[10px] font-semibold text-[#617286]">{label}<input type="number" min="0" value={result[field] ?? ""} onChange={(event) => updateNumber(field, event.target.value)} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-3 py-3 text-sm text-[#081B36]" /></label>)}</div>
            <div className="mt-6"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-[#081B36]">Rooms and spaces</h3><button type="button" onClick={addRoom} className="text-xs font-bold text-[#175FC4]">+ Add room / space</button></div><div className="mt-3 overflow-x-auto rounded-xl border border-[#DCE4EC]">{result.rooms.map((room, index) => <div key={`${room.name}-${index}`} className="grid min-w-[520px] grid-cols-[1fr_64px_72px_72px_auto] gap-2 border-b border-[#E5EBF1] p-3 last:border-0"><input value={room.name} onChange={(event) => updateRoom(index, { name: event.target.value })} className="min-w-0 bg-transparent text-sm font-semibold text-[#081B36]" /><input aria-label={`${room.name} count`} type="number" min="1" value={room.count} onChange={(event) => updateRoom(index, { count: Number(event.target.value) })} className="rounded-lg border border-[#CAD5E0] px-2 py-2 text-xs" /><input aria-label={`${room.name} length`} type="number" step="0.1" value={room.lengthM ?? ""} onChange={(event) => updateRoom(index, { lengthM: event.target.value ? Number(event.target.value) : null })} placeholder="L m" className="rounded-lg border border-[#CAD5E0] px-2 py-2 text-xs" /><input aria-label={`${room.name} width`} type="number" step="0.1" value={room.widthM ?? ""} onChange={(event) => updateRoom(index, { widthM: event.target.value ? Number(event.target.value) : null })} placeholder="W m" className="rounded-lg border border-[#CAD5E0] px-2 py-2 text-xs" /><button type="button" onClick={() => removeRoom(index)} className="px-2 text-[10px] font-bold text-[#C8320A]">Remove</button></div>)}{!result.rooms.length ? <p className="p-4 text-xs text-[#617286]">No rooms detected. Add spaces manually before confirming.</p> : null}</div></div>
          </section>
          <aside className="space-y-4"><section className="rounded-2xl border border-[#DCE4EC] bg-white p-5"><FileImage className="h-5 w-5 text-[#6B46C1]" /><h3 className="mt-3 font-bold text-[#081B36]">Drawing checks</h3><p className="mt-2 text-xs text-[#617286]">{result.drawingType.replace(/-/g, " ")} · {result.doors ?? "?"} doors · {result.windows ?? "?"} windows</p>{result.warnings.length ? <div className="mt-4 space-y-2">{result.warnings.map((warning) => <p key={warning} className="flex gap-2 text-[11px] leading-5 text-[#8A4A0A]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{warning}</p>)}</div> : <p className="mt-4 flex gap-2 text-xs text-[#087A50]"><CheckCircle2 className="h-4 w-4" />No additional warning returned.</p>}</section><button type="button" onClick={confirm} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#081B36] px-4 py-3 text-sm font-bold text-white">Confirm and continue <ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => setResult(null)} className="w-full rounded-xl border border-[#CAD5E0] px-4 py-3 text-sm font-bold text-[#617286]">Choose another drawing</button></aside>
        </div>
      ) : null}
    </div>
  );
}
