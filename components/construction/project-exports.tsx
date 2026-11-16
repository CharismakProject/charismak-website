"use client";
import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, X } from "lucide-react";
import { proposeSchedule, type ConstructionProject } from "@/lib/construction/project";
import styles from "./construction-studio.module.css";

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export default function ProjectExports({ project }: { project: ConstructionProject }) {
  const [seconds, setSeconds] = useState(60), [detailed, setDetailed] = useState(true), [status, setStatus] = useState(""), [error, setError] = useState(""), [running, setRunning] = useState(false);
  const job = useRef<AbortController | null>(null);
  useEffect(() => () => job.current?.abort(), []);
  const exportProject = async (kind: "pdf" | "video") => {
    if (job.current) return;
    const abort = new AbortController(); job.current = abort; setRunning(true); setError(""); setStatus("Preparing export…");
    // Edits during an export cannot mix two project versions into one document.
    const snapshot = structuredClone(project);
    try {
      const { createProjectExportRenderer, createVideoPresentation, exportFilename } = await import("@/lib/construction/project-export-renderer");
      abort.signal.throwIfAborted();
      const canvas = document.createElement("canvas"); canvas.width = kind === "pdf" ? 1000 : 1280; canvas.height = kind === "pdf" ? 566 : 720;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("This browser could not create an export canvas.");
      if (kind === "pdf") {
        const schedule = proposeSchedule(snapshot), end = Math.max(1, ...schedule.map(stage => stage.finish));
        const render = createProjectExportRenderer(snapshot, canvas.width, canvas.height), image = ctx.createImageData(canvas.width, canvas.height);
        const views = [{ day: end, section: false }, ...schedule.map(stage => ({ day: stage.finish, section: false })), ...(snapshot.parts.some(part => part.cutaway) ? [{ day: end, section: true }] : [])];
        const images: { day: number; section: boolean; data: string }[] = [];
        for (const [index, view] of views.entries()) {
          abort.signal.throwIfAborted(); setStatus(`Preparing PDF illustrations ${index + 1} / ${views.length}…`);
          await new Promise<void>(resolve => window.setTimeout(resolve, 0)); image.data.set(render(view.day, view.section)); ctx.putImageData(image, 0, 0);
          images.push({ ...view, data: canvas.toDataURL("image/png") });
        }
        const { buildProjectPdf } = await import("@/lib/construction/project-pdf"); abort.signal.throwIfAborted();
        const pdf = buildProjectPdf(snapshot, images, detailed); saveBlob(pdf.output("blob"), `${exportFilename(snapshot.name)}_Construction_Report.pdf`);
        setStatus("PDF downloaded with the current quantities, rates and programme.");
      } else {
        if (!canvas.captureStream || typeof MediaRecorder === "undefined") throw new Error("Video recording is unavailable in this browser. Try a current desktop Chrome or Edge browser; PDF export is still available.");
        const mimeType = ["video/mp4;codecs=avc1.42E01E", "video/mp4", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(type => MediaRecorder.isTypeSupported(type));
        if (!mimeType) throw new Error("This browser has no supported video encoder. PDF export is available.");
        const draw = createVideoPresentation(snapshot, ctx); draw(0);
        const stream = canvas.captureStream(25), chunks: Blob[] = [];
        try {
          const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4500000 });
          const result = new Promise<Blob>((resolve, reject) => {
            recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
            recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType }));
            recorder.onerror = () => reject(new Error("The browser could not encode this video. Try a shorter export or PDF."));
          });
          let frame = 0, start = 0, renderingError: unknown;
          const cancel = () => { cancelAnimationFrame(frame); if (recorder.state !== "inactive") recorder.stop(); };
          abort.signal.addEventListener("abort", cancel, { once: true });
          recorder.start(1000); start = performance.now();
          const tick = () => {
            if (abort.signal.aborted || recorder.state === "inactive") return;
            const progress = Math.min(1, (performance.now() - start) / (seconds * 1000));
            try { draw(progress); } catch (cause) { renderingError = cause; recorder.stop(); return; }
            setStatus(`Recording ${Math.round(progress * 100)}% · keep this tab open · ${mimeType.startsWith("video/mp4") ? "MP4" : "WebM"}`);
            if (progress >= 1) recorder.stop(); else frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
          try {
            const blob = await result; abort.signal.throwIfAborted();
            if (renderingError) throw renderingError;
            if (!blob.size) throw new Error("The browser returned an empty recording. Please try again.");
            const extension = blob.type.startsWith("video/mp4") ? "mp4" : "webm";
            saveBlob(blob, `${exportFilename(snapshot.name)}_Walkthrough.${extension}`);
            setStatus(`${extension.toUpperCase()} downloaded. The video includes the construction sequence, proposed dates and running cost.`);
          } finally { cancelAnimationFrame(frame); abort.signal.removeEventListener("abort", cancel); cancel(); }
        } finally { stream.getTracks().forEach(track => track.stop()); }
      }
    } catch (cause) {
      if (abort.signal.aborted) setStatus("Export cancelled."); else { setStatus(""); setError(cause instanceof Error ? cause.message : "Export failed. Please try again."); }
    } finally { job.current = null; setRunning(false); }
  };
  return <section className={styles.exports} aria-label="Download project presentation"><div><h3>Take the project with you</h3><p>Download a construction video or illustrated PDF using your latest model, rates and programme.</p></div><div className={styles.exportOptions}><label>Video length<select aria-label="Export video length" value={seconds} disabled={running} onChange={event => setSeconds(Number(event.target.value))}><option value={30}>30 seconds</option><option value={60}>60 seconds</option><option value={90}>90 seconds</option></select></label><label><input type="checkbox" checked={detailed} disabled={running} onChange={event => setDetailed(event.target.checked)} /> Include BOQ and rate build-ups in PDF</label><button type="button" disabled={running || !project.parts.length} onClick={() => void exportProject("video")}><Download size={15} /> Download video</button><button type="button" disabled={running} onClick={() => void exportProject("pdf")}><Download size={15} /> Download PDF</button>{running && <button type="button" onClick={() => job.current?.abort()}><X size={15} /> Cancel export</button>}</div>{status && <p role="status">{running && <LoaderCircle size={15} />} {status}</p>}{error && <p role="alert" className={styles.error}>{error}</p>}<small>Video: MP4 when supported, otherwise WebM. Projects save automatically in this browser; downloads are optional.</small></section>;
}
