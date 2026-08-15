"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ProjectAudience,
  ProjectDiscipline,
  ProjectEntryRoute,
  ProjectType,
  UniversalProject,
} from "@/lib/projects/models";
import {
  createProject,
  loadProjects,
  PROJECTS_UPDATED_EVENT,
  removeProject,
} from "@/lib/projects/store";
import ShellButton from "../estimator/ui/button";

type ProjectWorkspaceProps = {
  onContinueProject: (project: UniversalProject) => void;
};

const audienceOptions: Array<{
  id: ProjectAudience;
  title: string;
  label: string;
  description: string;
}> = [
  {
    id: "beginner",
    title: "I am planning my own project",
    label: "Homeowner / Beginner",
    description: "Use plain-language guidance and recommended construction assumptions.",
  },
  {
    id: "builder",
    title: "I build or price construction work",
    label: "Builder / Contractor",
    description: "Enter dimensions, select work items and control materials and rates.",
  },
  {
    id: "professional",
    title: "I prepare measured estimates and BOQs",
    label: "QS / Estimator / Engineer",
    description: "Work directly with quantities, rate build-ups and professional bills.",
  },
  {
    id: "company",
    title: "I am estimating for a company",
    label: "Company Workspace",
    description: "Build company estimates now; team templates and white-label outputs follow.",
  },
];

const routeOptions: Array<{
  id: ProjectEntryRoute;
  title: string;
  description: string;
  audiences: ProjectAudience[];
  available: boolean;
}> = [
  {
    id: "guided-questions",
    title: "Answer simple questions",
    description: "Describe land, spaces and quality in everyday language.",
    audiences: ["beginner"],
    available: false,
  },
  {
    id: "upload-plan",
    title: "Upload my plan",
    description: "AI interprets a simple plan, then you confirm what it found.",
    audiences: ["beginner", "builder"],
    available: false,
  },
  {
    id: "enter-dimensions",
    title: "Enter dimensions myself",
    description: "Use the working specialist and element calculators.",
    audiences: ["beginner", "builder", "professional", "company"],
    available: true,
  },
  {
    id: "measured-quantities",
    title: "Enter measured quantities",
    description: "Build measured items, analyse rates and generate a BOQ.",
    audiences: ["builder", "professional", "company"],
    available: true,
  },
  {
    id: "import-boq",
    title: "Import an existing BOQ",
    description: "Map spreadsheet descriptions, units, quantities, rates and sections.",
    audiences: ["professional", "company"],
    available: false,
  },
  {
    id: "drawing-takeoff",
    title: "Professional drawing take-off",
    description: "Measure lengths, areas, volumes, counts, openings and deductions.",
    audiences: ["professional", "company"],
    available: false,
  },
];

const projectTypeOptions: Array<{
  id: ProjectType;
  title: string;
  description: string;
}> = [
  { id: "new-building", title: "New building", description: "Residential, commercial or institutional building." },
  { id: "renovation", title: "Renovation / fit-out", description: "Alterations, finishes and refurbishment work." },
  { id: "fence-boundary", title: "Fence / boundary works", description: "Use the complete working fence module." },
  { id: "external-works", title: "External works", description: "Drainage, paving, gates, compound and site works." },
  { id: "civil-infrastructure", title: "Civil / infrastructure", description: "Road, drainage, utilities and civil construction." },
  { id: "structural-steel", title: "Structural steel", description: "Fabrication, erection and specialist steel work." },
  { id: "mep-services", title: "MEP services", description: "Electrical, plumbing, mechanical and fire systems." },
  { id: "specialist-work", title: "Specialist / custom work", description: "Cabinets, solar, equipment or another measured trade." },
];

const disciplineOptions: Array<{ id: ProjectDiscipline; label: string }> = [
  { id: "preliminaries", label: "Preliminaries" },
  { id: "building-civil", label: "Building & civil works" },
  { id: "structural", label: "Concrete, reinforcement & structural steel" },
  { id: "architectural-finishes", label: "Architectural finishes" },
  { id: "electrical", label: "Electrical" },
  { id: "mechanical-plumbing", label: "Mechanical & plumbing" },
  { id: "fire-security", label: "Fire, ICT & security" },
  { id: "external-works", label: "External works" },
  { id: "fence-boundary", label: "Fence & boundary works" },
  { id: "furniture-joinery", label: "Furniture, joinery & cabinets" },
];

const recommendedDisciplines: Record<ProjectType, ProjectDiscipline[]> = {
  "new-building": ["preliminaries", "building-civil", "structural", "architectural-finishes", "electrical", "mechanical-plumbing", "external-works"],
  renovation: ["preliminaries", "building-civil", "architectural-finishes", "electrical", "mechanical-plumbing"],
  "fence-boundary": ["fence-boundary", "external-works"],
  "external-works": ["preliminaries", "external-works", "fence-boundary"],
  "civil-infrastructure": ["preliminaries", "building-civil", "structural", "external-works"],
  "structural-steel": ["preliminaries", "structural"],
  "mep-services": ["preliminaries", "electrical", "mechanical-plumbing", "fire-security"],
  "specialist-work": ["preliminaries"],
};

const audienceLabel = (audience: ProjectAudience) =>
  audienceOptions.find((item) => item.id === audience)?.label ?? audience;

const routeLabel = (route: ProjectEntryRoute) =>
  routeOptions.find((item) => item.id === route)?.title ?? route;

const projectTypeLabel = (type: ProjectType) =>
  projectTypeOptions.find((item) => item.id === type)?.title ?? type;

export default function ProjectWorkspace({ onContinueProject }: ProjectWorkspaceProps) {
  const [projects, setProjects] = useState<UniversalProject[]>([]);
  const [audience, setAudience] = useState<ProjectAudience>("beginner");
  const [entryRoute, setEntryRoute] = useState<ProjectEntryRoute>("enter-dimensions");
  const [projectType, setProjectType] = useState<ProjectType>("new-building");
  const [disciplines, setDisciplines] = useState<ProjectDiscipline[]>(recommendedDisciplines["new-building"]);
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setProjects(loadProjects());
    sync();
    window.addEventListener(PROJECTS_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROJECTS_UPDATED_EVENT, sync);
  }, []);

  const visibleRoutes = useMemo(
    () => routeOptions.filter((route) => route.audiences.includes(audience)),
    [audience],
  );

  const chooseAudience = (nextAudience: ProjectAudience) => {
    setAudience(nextAudience);
    const firstWorkingRoute = routeOptions.find(
      (route) => route.available && route.audiences.includes(nextAudience),
    );
    if (firstWorkingRoute) setEntryRoute(firstWorkingRoute.id);
  };

  const chooseProjectType = (nextType: ProjectType) => {
    setProjectType(nextType);
    setDisciplines(recommendedDisciplines[nextType]);
    if (nextType === "fence-boundary") setEntryRoute("enter-dimensions");
  };

  const toggleDiscipline = (discipline: ProjectDiscipline) => {
    setDisciplines((current) =>
      current.includes(discipline)
        ? current.filter((item) => item !== discipline)
        : [...current, discipline],
    );
  };

  const startProject = () => {
    if (!name.trim() || !location.trim()) {
      setNotice("Add a project name and location before continuing.");
      return;
    }
    const selectedRoute = routeOptions.find((route) => route.id === entryRoute);
    if (!selectedRoute?.available) {
      setNotice("That starting route is planned for a later controlled phase. Choose an available route for this release.");
      return;
    }
    const project = createProject({
      name: name.trim(),
      clientName: clientName.trim(),
      location: location.trim(),
      currency: "NGN",
      measurementSystem: "metric",
      audience,
      entryRoute,
      projectType,
      disciplines,
      linkedEstimateId: null,
      linkedBillId: null,
    });
    setNotice(null);
    onContinueProject(project);
  };

  const deleteProject = (project: UniversalProject) => {
    if (!window.confirm(`Remove “${project.name}” from this device? Existing linked bills are not deleted.`)) return;
    setProjects(removeProject(project.id));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C8320A]">New project</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#081B36] md:text-3xl">What are you planning to build?</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">Choose the level of guidance you need. Professional estimating structure stays underneath every route.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F4F7FA] p-2 sm:min-w-[360px]">
            {["Your role", "Start method", "Project setup"].map((label, index) => (
              <div key={label} className="rounded-lg bg-white px-2.5 py-2.5 text-center shadow-sm">
                <span className="mx-auto grid h-5 w-5 place-items-center rounded-full bg-[#081B36] text-[9px] font-bold text-white">{index + 1}</span>
                <p className="mt-1.5 text-[10px] font-semibold text-[#617286]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0D3B66] text-sm font-bold text-white">1</span>
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8320A]">Choose your workspace</p><h2 className="mt-1 text-2xl font-bold text-[#071E33]">Which description fits you?</h2></div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {audienceOptions.map((option) => {
            const selected = audience === option.id;
            return <button key={option.id} type="button" onClick={() => chooseAudience(option.id)} className={`rounded-[24px] border p-5 text-left transition ${selected ? "border-[#0D3B66] bg-[#EEF5FB] shadow-[0_12px_30px_rgba(13,59,102,0.1)]" : "border-[#d6dfe9] bg-white hover:border-[#0D3B66]/50"}`}><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${selected ? "bg-[#0D3B66] text-white" : "bg-[#F1F4F7] text-[#526579]"}`}>{option.label}</span><h3 className="mt-4 text-base font-bold text-[#071E33]">{option.title}</h3><p className="mt-2 text-sm leading-6 text-[#526579]">{option.description}</p></button>;
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0D3B66] text-sm font-bold text-white">2</span>
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8320A]">Choose how to begin</p><h2 className="mt-1 text-2xl font-bold text-[#071E33]">How do you want to provide the project information?</h2></div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleRoutes.map((route) => {
            const selected = entryRoute === route.id;
            return <button key={route.id} type="button" disabled={!route.available} onClick={() => setEntryRoute(route.id)} className={`relative rounded-[24px] border p-5 text-left transition ${selected ? "border-[#C8320A] bg-[#FFF4EF]" : route.available ? "border-[#d6dfe9] hover:border-[#0D3B66]/50" : "cursor-not-allowed border-[#e5e9ee] bg-[#F7F9FB] opacity-70"}`}><span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${route.available ? "bg-[#E7F6EE] text-[#16704A]" : "bg-[#E8EDF2] text-[#667586]"}`}>{route.available ? "Available now" : "Planned phase"}</span><h3 className="mt-4 text-base font-bold text-[#071E33]">{route.title}</h3><p className="mt-2 text-sm leading-6 text-[#526579]">{route.description}</p></button>;
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0D3B66] text-sm font-bold text-white">3</span>
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#C8320A]">Set up the project</p><h2 className="mt-1 text-2xl font-bold text-[#071E33]">Project type, location and work coverage</h2></div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {projectTypeOptions.map((option) => <button key={option.id} type="button" onClick={() => chooseProjectType(option.id)} className={`rounded-[22px] border p-4 text-left transition ${projectType === option.id ? "border-[#0D3B66] bg-[#0D3B66] text-white" : "border-[#d6dfe9] bg-[#F8FAFC] text-[#071E33] hover:border-[#0D3B66]/50"}`}><span className="font-bold">{option.title}</span><span className={`mt-2 block text-xs leading-5 ${projectType === option.id ? "text-white/68" : "text-[#526579]"}`}>{option.description}</span></button>)}
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          <label className="text-sm font-semibold text-[#071E33]">Project name *<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Maitama residential project" className="mt-2 w-full rounded-2xl border border-[#CCD7E3] bg-[#F8FAFC] px-4 py-3 font-normal" /></label>
          <label className="text-sm font-semibold text-[#071E33]">Client name <span className="font-normal text-[#7A8998]">(optional)</span><input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Client or organisation" className="mt-2 w-full rounded-2xl border border-[#CCD7E3] bg-[#F8FAFC] px-4 py-3 font-normal" /></label>
          <label className="text-sm font-semibold text-[#071E33]">Project location *<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, state or locality" className="mt-2 w-full rounded-2xl border border-[#CCD7E3] bg-[#F8FAFC] px-4 py-3 font-normal" /></label>
        </div>

        <details className="mt-6 rounded-[22px] border border-[#D7E0E9] bg-[#F8FAFC] p-5">
          <summary className="cursor-pointer font-bold text-[#0D3B66]">Review relevant construction disciplines ({disciplines.length} selected)</summary>
          <p className="mt-2 text-xs leading-5 text-[#526579]">Recommended sections are selected from the project type. Remove any that are outside your scope.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {disciplineOptions.map((discipline) => <label key={discipline.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-medium"><input type="checkbox" checked={disciplines.includes(discipline.id)} onChange={() => toggleDiscipline(discipline.id)} className="h-4 w-4 accent-[#0D3B66]" />{discipline.label}</label>)}
          </div>
        </details>

        {notice ? <p className="mt-5 rounded-2xl border border-[#F4C9BC] bg-[#FFF1EC] p-4 text-sm font-medium text-[#A82A09]">{notice}</p> : null}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <ShellButton onClick={startProject}>Create Project & Continue</ShellButton>
          <p className="text-xs leading-5 text-[#6C7D8D]">{audienceLabel(audience)} · {routeLabel(entryRoute)} · {projectTypeLabel(projectType)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0D3B66]/60">Saved on this device</p><h2 className="mt-1 text-2xl font-bold text-[#071E33]">Recent projects</h2></div><span className="text-sm text-[#526579]">{projects.length} project{projects.length === 1 ? "" : "s"}</span></div>
        {projects.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{projects.map((project) => <article key={project.id} className="rounded-[24px] border border-[#d6dfe9] bg-[#F8FAFC] p-5"><div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C8320A]">{projectTypeLabel(project.projectType)}</span><h3 className="mt-2 text-lg font-bold text-[#071E33]">{project.name}</h3><p className="mt-1 text-sm text-[#526579]">{project.location}{project.clientName ? ` · ${project.clientName}` : ""}</p></div><span className="rounded-full bg-[#E7F6EE] px-3 py-1 text-[10px] font-bold uppercase text-[#16704A]">{project.status}</span></div><div className="mt-4 flex flex-wrap gap-2 text-xs text-[#526579]"><span className="rounded-full bg-white px-3 py-2">{audienceLabel(project.audience)}</span><span className="rounded-full bg-white px-3 py-2">{routeLabel(project.entryRoute)}</span><span className="rounded-full bg-white px-3 py-2">{project.disciplines.length} disciplines</span></div><div className="mt-5 flex gap-3"><ShellButton onClick={() => onContinueProject(project)}>Continue</ShellButton><button type="button" onClick={() => deleteProject(project)} className="rounded-full px-4 py-3 text-xs font-semibold text-[#C8320A]">Remove</button></div></article>)}</div> : <div className="mt-5 rounded-[24px] border border-dashed border-[#C9D5E1] bg-[#F8FAFC] p-8 text-center"><p className="font-semibold text-[#071E33]">No universal projects yet.</p><p className="mt-2 text-sm text-[#526579]">Your existing bills and estimates remain available in their current workspaces.</p></div>}
      </section>
    </div>
  );
}
