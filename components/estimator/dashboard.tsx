"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Blocks,
  Building2,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileSpreadsheet,
  HardHat,
  Home,
  MapPin,
  PackageSearch,
  PenTool,
  Plus,
  Ruler,
  ShieldCheck,
  Sparkles,
  Upload,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { Bill } from "@/lib/billing/models";
import type { ProjectType, UniversalProject } from "@/lib/projects/models";
import {
  loadProjects,
  PROJECTS_UPDATED_EVENT,
} from "@/lib/projects/store";
import type { CalculatorKey } from "./types";

type DashboardProps = {
  displayName?: string | null;
  bill: Bill | null;
  billItemCount: number;
  onNewProject: () => void;
  onContinueProject: (project: UniversalProject) => void;
  onStartFence: () => void;
  onOpenCalculator: (calculator: CalculatorKey) => void;
  onOpenBill: () => void;
  onOpenRates: () => void;
};

const money = (value: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    notation: value >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value || 0);

const projectTypes: Record<ProjectType, { label: string; image: string; icon: LucideIcon }> = {
  "new-building": {
    label: "Building",
    image: "/Images/Projects/hillside/cover.png",
    icon: Building2,
  },
  renovation: {
    label: "Renovation",
    image: "/Images/Projects/Flawless/cover.jpg",
    icon: Wrench,
  },
  "fence-boundary": {
    label: "Fence & boundary",
    image: "/Images/Projects/gate/3.jpg",
    icon: ShieldCheck,
  },
  "external-works": {
    label: "External works",
    image: "/Images/Projects/Jahi/cover.jpg",
    icon: HardHat,
  },
  "civil-infrastructure": {
    label: "Civil infrastructure",
    image: "/Images/Projects/Djibouti/cover.jpg",
    icon: Ruler,
  },
  "structural-steel": {
    label: "Structural steel",
    image: "/Images/Projects/fabrication/cover.jpg",
    icon: Warehouse,
  },
  "mep-services": {
    label: "MEP services",
    image: "/Images/Projects/Office/cover.jpg",
    icon: Wrench,
  },
  "specialist-work": {
    label: "Specialist work",
    image: "/Images/Projects/coco/cover.jpg",
    icon: PenTool,
  },
};

const startOptions: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  action: "project" | "dimensions" | "boq" | "import";
  badge?: string;
}> = [
  {
    title: "Guided Questions",
    description: "Simple setup for homeowners and beginners",
    icon: Sparkles,
    tone: "bg-[#E9F8F1] text-[#087A50]",
    action: "project",
  },
  {
    title: "Enter Dimensions",
    description: "For builders, contractors and measured work",
    icon: Ruler,
    tone: "bg-[#EAF2FF] text-[#175FC4]",
    action: "dimensions",
  },
  {
    title: "Professional BOQ",
    description: "Build measured items, sections and rates",
    icon: ClipboardList,
    tone: "bg-[#F1ECFF] text-[#6B46C1]",
    action: "boq",
  },
  {
    title: "Import / Upload",
    description: "Excel BOQs, PDFs, plan images and sketches",
    icon: Upload,
    tone: "bg-[#FFF4E4] text-[#B45B09]",
    action: "import",
    badge: "Working beta",
  },
];

const quickTools: Array<{
  title: string;
  subtitle: string;
  icon: LucideIcon;
  calculator?: CalculatorKey;
  fence?: boolean;
}> = [
  { title: "Concrete", subtitle: "Volume & materials", icon: Blocks, calculator: "concrete" },
  { title: "Blockwork", subtitle: "Walls & mortar", icon: Home, calculator: "blockwork" },
  { title: "Reinforcement", subtitle: "Bars & BRC mesh", icon: Ruler, calculator: "reinforcement" },
  { title: "Complete Fence", subtitle: "Full specialist estimate", icon: ShieldCheck, fence: true },
];

const relativeDate = (value: string) => {
  const elapsed = Date.now() - new Date(value).getTime();
  const days = Math.max(0, Math.floor(elapsed / 86_400_000));
  if (days === 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  return `Updated ${days} days ago`;
};

const projectProgress = (project: UniversalProject) => {
  if (project.status === "active") return 65;
  if (project.status === "estimating") return 35;
  if (project.status === "archived") return 100;
  return 15;
};

export default function EstimatorDashboard({
  displayName,
  bill,
  billItemCount,
  onNewProject,
  onContinueProject,
  onStartFence,
  onOpenCalculator,
  onOpenBill,
  onOpenRates,
}: DashboardProps) {
  const [projects, setProjects] = useState<UniversalProject[]>([]);

  useEffect(() => {
    const sync = () => setProjects(loadProjects());
    sync();
    window.addEventListener(PROJECTS_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PROJECTS_UPDATED_EVENT, sync);
  }, []);

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === "active" || project.status === "estimating").length,
    [projects],
  );
  const recentProjects = projects.slice(0, 4);
  const estimateValue = bill?.totals?.grandTotal ?? 0;
  const firstName = displayName?.trim().split(/\s+/)[0];

  const runStartAction = (action: (typeof startOptions)[number]["action"]) => {
    if (["project", "dimensions", "boq", "import"].includes(action)) onNewProject();
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7D90]">Project overview</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#081B36] md:text-3xl">
              {firstName ? `Welcome, ${firstName}` : "Welcome to your estimator"} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-2 text-sm text-[#617286]">Start a project, continue measured work or open the current BOQ.</p>
          </div>
          <button type="button" onClick={onNewProject} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_25px_rgba(8,27,54,0.16)] transition hover:bg-[#123F69]">
            <Plus className="h-4 w-4" /> New Project
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: "Total Projects", value: projects.length, icon: Building2, tone: "text-[#175FC4] bg-[#EAF2FF]" },
            { label: "In Progress", value: activeProjects, icon: HardHat, tone: "text-[#B45B09] bg-[#FFF4E4]" },
            { label: "BOQ Items", value: billItemCount, icon: FileSpreadsheet, tone: "text-[#6B46C1] bg-[#F1ECFF]" },
            { label: "Current Estimate", value: money(estimateValue, bill?.currency), icon: CircleDollarSign, tone: "text-[#087A50] bg-[#E9F8F1]" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <article key={label} className="rounded-xl border border-[#E2E8EF] bg-[#FBFCFE] p-3.5 md:p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[11px] font-medium text-[#6B7D90]">{label}</p><strong className="mt-2 block text-xl font-bold text-[#081B36] md:text-2xl">{value}</strong></div>
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7D90]">Workspace</p><h2 className="mt-1 text-lg font-bold text-[#081B36] md:text-xl">Recent projects</h2></div>
          <button type="button" onClick={onNewProject} className="inline-flex items-center gap-1 text-xs font-bold text-[#175FC4]">View all <ChevronRight className="h-4 w-4" /></button>
        </div>

        {recentProjects.length ? (
          <div className="mt-4 grid auto-cols-[82%] grid-flow-col gap-3 overflow-x-auto pb-2 snap-x snap-mandatory sm:auto-cols-[46%] xl:grid-flow-row xl:grid-cols-4 xl:overflow-visible">
            {recentProjects.map((project) => {
              const details = projectTypes[project.projectType];
              const progress = projectProgress(project);
              return (
                <button key={project.id} type="button" onClick={() => onContinueProject(project)} className="group snap-start overflow-hidden rounded-xl border border-[#DCE4EC] bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="relative h-28 overflow-hidden bg-[#EAF0F6]">
                    <img src={details.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#081B36]/55 to-transparent" />
                    <span className="absolute right-2 top-2 rounded-full bg-white/92 px-2.5 py-1 text-[9px] font-bold uppercase text-[#087A50]">{project.status}</span>
                  </div>
                  <div className="p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7D90]">{details.label}</p>
                    <h3 className="mt-1 truncate text-sm font-bold text-[#081B36]">{project.name}</h3>
                    <p className="mt-2 flex items-center gap-1 truncate text-[11px] text-[#6B7D90]"><MapPin className="h-3 w-3" />{project.location}</p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#E7EDF3]"><span className="block h-full rounded-full bg-[#16A36A]" style={{ width: `${progress}%` }} /></div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#6B7D90]"><span>{relativeDate(project.updatedAt)}</span><strong className="text-[#081B36]">{progress}%</strong></div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 grid overflow-hidden rounded-xl border border-dashed border-[#C9D5E1] bg-[#F8FAFD] md:grid-cols-[1fr_0.55fr]">
            <div className="p-5 md:p-7"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#EAF2FF] text-[#175FC4]"><Building2 className="h-5 w-5" /></span><h3 className="mt-4 text-lg font-bold text-[#081B36]">Your first project will appear here.</h3><p className="mt-2 max-w-lg text-sm leading-6 text-[#617286]">Choose your experience level and project type. The platform will guide you into the right estimating workspace.</p><button type="button" onClick={onNewProject} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#C8320A]">Create first project <ArrowRight className="h-4 w-4" /></button></div>
            <div className="relative hidden min-h-44 md:block"><img src="/Images/Projects/hillside/cover.png" alt="Charismak building project" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-[#F8FAFD] to-transparent" /></div>
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7D90]">Start a new estimate</p><h2 className="mt-1 text-lg font-bold text-[#081B36] md:text-xl">Choose how you want to begin</h2></div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {startOptions.map(({ title, description, icon: Icon, tone, action, badge }) => (
              <button key={title} type="button" onClick={() => runStartAction(action)} className="relative min-h-36 rounded-xl border border-[#E0E7EE] bg-[#FBFCFE] p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[#9BB1C7]">
                {badge ? <span className="absolute right-2 top-2 rounded-full bg-[#EEF2F6] px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-[#6B7D90]">{badge}</span> : null}
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 text-sm font-bold text-[#081B36]">{title}</h3>
                <p className="mt-1 text-[11px] leading-5 text-[#6B7D90]">{description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl bg-[#081B36] p-5 text-white shadow-[0_12px_34px_rgba(8,27,54,0.18)] md:p-6">
          <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full border-[28px] border-white/5" />
          <PackageSearch className="h-7 w-7 text-[#E7B34B]" />
          <h2 className="mt-4 text-xl font-bold">Estimate smarter.</h2>
          <div className="mt-4 space-y-2.5 text-xs text-white/72">
            {["Use editable local rates", "Compare practical purchase units", "Carry quantities into the BOQ", "Export professional reports"].map((item) => <p key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#45C78B]" />{item}</p>)}
          </div>
          <button type="button" onClick={onOpenRates} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#E7B34B]">Open price library <ArrowRight className="h-4 w-4" /></button>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 shadow-[0_8px_28px_rgba(7,30,51,0.04)] md:p-6">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7D90]">Quick tools</p><h2 className="mt-1 text-lg font-bold text-[#081B36]">Common calculations</h2></div><Calculator className="h-5 w-5 text-[#6B7D90]" /></div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {quickTools.map(({ title, subtitle, icon: Icon, calculator, fence }) => (
              <button key={title} type="button" onClick={() => fence ? onStartFence() : calculator && onOpenCalculator(calculator)} className="rounded-xl border border-[#E0E7EE] bg-[#FBFCFE] p-3.5 text-left transition hover:border-[#9BB1C7] hover:bg-white">
                <Icon className="h-5 w-5 text-[#175FC4]" /><h3 className="mt-3 text-sm font-bold text-[#081B36]">{title}</h3><p className="mt-1 text-[10px] leading-4 text-[#6B7D90]">{subtitle}</p>
              </button>
            ))}
          </div>
        </section>

        <button type="button" onClick={onOpenBill} className="rounded-2xl border border-[#DCE4EC] bg-white p-5 text-left shadow-[0_8px_28px_rgba(7,30,51,0.04)] transition hover:border-[#9BB1C7] md:p-6">
          <div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFF0EB] text-[#C8320A]"><FileSpreadsheet className="h-5 w-5" /></span><ArrowRight className="h-5 w-5 text-[#6B7D90]" /></div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7D90]">Current BOQ</p>
          <div className="mt-2 flex items-end justify-between gap-3"><div><strong className="block text-3xl font-bold text-[#081B36]">{billItemCount}</strong><span className="text-xs text-[#6B7D90]">measured item{billItemCount === 1 ? "" : "s"}</span></div><strong className="text-base text-[#081B36]">{money(estimateValue, bill?.currency)}</strong></div>
        </button>
      </div>
    </div>
  );
}
