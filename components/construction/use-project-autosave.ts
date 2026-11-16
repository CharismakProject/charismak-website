"use client";
import { useEffect, useRef, useState } from "react";
import { lastConstructionProject, listConstructionProjects, loadConstructionProject, rememberConstructionProject, saveConstructionProject } from "@/lib/construction/project-store";
import type { ConstructionProject } from "@/lib/construction/project";

export function useProjectAutosave(project: ConstructionProject, restore: (project: ConstructionProject) => void, hasInitialProject: boolean) {
  const [ready, setReady] = useState(false), [status, setStatus] = useState("Opening browser storage…"), [projects, setProjects] = useState<{ id: string; name: string; updatedAt: string }[]>([]);
  const current = useRef(project);
  useEffect(() => { current.current = project; }, [project]);
  const saved = useRef<ConstructionProject | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const summaries = await listConstructionProjects(); if (cancelled) return; setProjects(summaries);
        const id = lastConstructionProject();
        if (!hasInitialProject && id && summaries.some(item => item.id === id)) {
          const loaded = await loadConstructionProject(id); if (cancelled) return; saved.current = loaded; restore(loaded); setStatus("Saved automatically in this browser");
        } else setStatus("Saves automatically in this browser");
      } catch { if (!cancelled) setStatus("Browser storage unavailable — use an optional backup to keep your work"); }
      finally { if (!cancelled) setReady(true); }
    })();
    return () => { cancelled = true; };
  }, [hasInitialProject, restore]);
  useEffect(() => {
    if (!ready || (!project.parts.length && !project.boq.length && !project.planDraft && !project.drawingSheets?.length) || saved.current === project) return;
    setStatus("Saving changes…");
    const timer = window.setTimeout(() => {
      void saveConstructionProject(project).then(async () => {
        if (current.current === project) { saved.current = project; rememberConstructionProject(project.id); setStatus("Saved automatically in this browser"); }
        setProjects(await listConstructionProjects());
      }).catch(cause => { if (current.current === project) setStatus(cause instanceof Error ? cause.message : "Could not save. Download a backup to keep your work."); });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [project, ready]);
  useEffect(() => {
    if (!ready) return;
    const flush = () => {
      const latest = current.current;
      if (latest !== saved.current && (latest.parts.length || latest.boq.length || latest.planDraft || latest.drawingSheets?.length)) void saveConstructionProject(latest).then(() => { if (current.current === latest) rememberConstructionProject(latest.id); }).catch(() => {});
    };
    const hidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush); document.addEventListener("visibilitychange", hidden);
    return () => { window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", hidden); flush(); };
  }, [ready]);
  return { ready, status, projects };
}
