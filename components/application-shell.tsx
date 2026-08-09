"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateFenceSectionPhysicalLayout } from "@/lib/fence/physical-layout-calculator";
import { resolveFenceFoundationBasePlacements } from "@/lib/fence/foundation-base-placement-calculator";
import { calculateFenceFoundationBaseGeometry } from "@/lib/fence/foundation-base-geometry-calculator";
import { calculateFenceFoundationComponentLayouts } from "@/lib/fence/foundation-component-layout-calculator";
import { calculateFencePanelFoundationComponentGeometry } from "@/lib/fence/panel-foundation-component-geometry-calculator";
import { calculateFenceFoundationEarthworks } from "@/lib/fence/foundation-earthworks-calculator";
import { calculateFenceFoundationConcreteMaterials } from "@/lib/fence/foundation-concrete-material-calculator";
import { calculateFenceFoundationBlockworkMaterials } from "@/lib/fence/foundation-blockwork-material-calculator";
import { calculateFenceFoundationStructuralMaterials } from "@/lib/fence/foundation-structural-material-calculator";
import type {
  ColumnSpecification,
  FenceFoundationBaseQuantitySpecification,
  FencePanelFoundationSpecification,
  FenceSection,
  ReinforcementCalculationInput,
  FormworkCalculationInput,
  ConcreteMixSpecification,
  BlockSpecification,
  MortarMixSpecification,
} from "@/lib/fence/types";

type PageKey =
  | "dashboard"
  | "fence"
  | "quick"
  | "estimates"
  | "rates"
  | "projects";

type DesignCategory = "Simple" | "Mid-range" | "Heavy" | "Luxury";

type SectionData = {
  id: string;
  name: string;
  length: string;
  height: string;
  spacing: string;
  category: DesignCategory;
  isCustom?: boolean;
};

const navItems: Array<{ key: PageKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "fence", label: "Fence Estimator" },
  { key: "quick", label: "Quick Calculators" },
  { key: "estimates", label: "Estimates" },
  { key: "rates", label: "Rate Library" },
  { key: "projects", label: "Projects" },
];

const statusCards = [
  { label: "Calculation Core", status: "Ready" },
  { label: "Materials & Waste", status: "Ready" },
  { label: "Rates & Costing", status: "Ready" },
  { label: "Mobile & Offline", status: "Planned" },
];

const designCategories: Array<{ label: DesignCategory; description: string }> = [
  { label: "Simple", description: "Basic posts and wire fence for straightforward sites." },
  { label: "Mid-range", description: "Standard columns and panels with strong finish options." },
  { label: "Heavy", description: "Robust concrete and steel structure for exposed conditions." },
  { label: "Luxury", description: "Premium finishes and engineered details for signature projects." },
];

const quickCalculators = [
  { key: "concrete", title: "Concrete", description: "Estimate concrete volumes for footings, columns and pads." },
  { key: "blockwork", title: "Blockwork", description: "Calculate block quantities and masonry preparation." },
  { key: "reinforcement", title: "Reinforcement", description: "Plan rebar, tying and reinforcement layout requirements." },
  { key: "excavation", title: "Excavation & Earthworks", description: "Review earthworks and site preparation variables." },
  { key: "formwork", title: "Formwork", description: "Set up formwork dimensions and temporary support needs." },
];

const STORAGE_KEY = "charismak-estimator-draft";

const defaultColumnSpecifications: ColumnSpecification[] = [
  {
    id: "regular-column",
    name: "Regular column",
    constructionSystem: "reinforced-concrete",
    widthAlongFenceM: 0.4,
    depthM: 0.4,
    heightM: 2.2,
    concreteMixId: "1-2-4",
    concreteCoverMm: 50,
    mainBarCount: 4,
    mainBarDiameterMm: 12,
    mainBarExtraLengthM: 0.2,
    linkBarDiameterMm: 8,
    linkSpacingM: 0.2,
    linkHookAllowanceM: 0.3,
    formedWidthFaceCount: 2,
    formedDepthFaceCount: 2,
    bindingWirePercentOfReinforcementWeight: 1.5,
    concreteWastagePercent: 5,
    reinforcementWastagePercent: 5,
    formworkWastagePercent: 10,
  },
  {
    id: "corner-column",
    name: "Corner column",
    constructionSystem: "reinforced-concrete",
    widthAlongFenceM: 0.45,
    depthM: 0.45,
    heightM: 2.2,
    concreteMixId: "1-2-4",
    concreteCoverMm: 50,
    mainBarCount: 4,
    mainBarDiameterMm: 12,
    mainBarExtraLengthM: 0.2,
    linkBarDiameterMm: 8,
    linkSpacingM: 0.2,
    linkHookAllowanceM: 0.3,
    formedWidthFaceCount: 2,
    formedDepthFaceCount: 2,
    bindingWirePercentOfReinforcementWeight: 1.5,
    concreteWastagePercent: 5,
    reinforcementWastagePercent: 5,
    formworkWastagePercent: 10,
  },
  {
    id: "pedestrian-gate-post",
    name: "Pedestrian gate post",
    constructionSystem: "reinforced-concrete",
    widthAlongFenceM: 0.35,
    depthM: 0.35,
    heightM: 2.2,
    concreteMixId: "1-2-4",
    concreteCoverMm: 50,
    mainBarCount: 4,
    mainBarDiameterMm: 12,
    mainBarExtraLengthM: 0.2,
    linkBarDiameterMm: 8,
    linkSpacingM: 0.2,
    linkHookAllowanceM: 0.3,
    formedWidthFaceCount: 2,
    formedDepthFaceCount: 2,
    bindingWirePercentOfReinforcementWeight: 1.5,
    concreteWastagePercent: 5,
    reinforcementWastagePercent: 5,
    formworkWastagePercent: 10,
  },
  {
    id: "vehicle-gate-post",
    name: "Vehicle gate post",
    constructionSystem: "reinforced-concrete",
    widthAlongFenceM: 0.5,
    depthM: 0.5,
    heightM: 2.2,
    concreteMixId: "1-2-4",
    concreteCoverMm: 50,
    mainBarCount: 4,
    mainBarDiameterMm: 12,
    mainBarExtraLengthM: 0.2,
    linkBarDiameterMm: 8,
    linkSpacingM: 0.2,
    linkHookAllowanceM: 0.3,
    formedWidthFaceCount: 2,
    formedDepthFaceCount: 2,
    bindingWirePercentOfReinforcementWeight: 1.5,
    concreteWastagePercent: 5,
    reinforcementWastagePercent: 5,
    formworkWastagePercent: 10,
  },
];

const defaultFoundationSpecifications: FenceFoundationBaseQuantitySpecification[] = [
  {
    id: "standard-base",
    name: "Standard foundation base",
    lengthAlongFenceM: 0.6,
    widthAcrossFenceM: 0.6,
    thicknessM: 0.3,
    excavationLengthM: 0.8,
    excavationWidthM: 0.8,
    excavationDepthM: 0.6,
    blindingLengthM: 0.8,
    blindingWidthM: 0.8,
    blindingThicknessM: 0.1,
  },
];

const defaultPanelFoundationSpecification: FencePanelFoundationSpecification = {
  id: "standard-panel-foundation",
  name: "Standard panel foundation",
  excavationWidthM: 0.35,
  excavationDepthM: 0.45,
  blindingWidthM: 0.35,
  blindingThicknessM: 0.1,
  footingWidthM: 0.3,
  footingThicknessM: 0.2,
  foundationBlockworkHeightM: 0.6,
  foundationBlockworkThicknessM: 0.225,
  groundBeamWidthM: 0.25,
  groundBeamDepthM: 0.25,
};

const defaultConcreteMix: ConcreteMixSpecification = {
  id: "1-2-4",
  name: "1:2:4 Concrete",
  materialType: "concrete",
  calculationMethod: "ratio-based",
  cementRatio: 1,
  sandRatio: 2,
  coarseAggregateRatio: 4,
  dryVolumeFactor: 1.54,
  cementBagWeightKg: 50,
  cementBagVolumeM3: 0.0347,
  waterCementRatioByWeight: 0.5,
};

const defaultBlockSpecification: BlockSpecification = {
  lengthMm: 450,
  heightMm: 225,
  thicknessMm: 225,
  blocksPerSquareMetre: 10,
};

const defaultMortarMix: MortarMixSpecification = {
  id: "mortar-1-6",
  name: "Mortar 1:6",
  materialType: "mortar",
  calculationMethod: "coefficient-based",
  cementBagsPerM3: 8,
  cementBagWeightKg: 50,
  sandVolumeM3PerM3: 1.1,
  waterLitresPerM3: 220,
};

const stepLabels = [
  { id: 1, label: "Project" },
  { id: 2, label: "Sections" },
  { id: 3, label: "Structure" },
  { id: 4, label: "Finishes" },
  { id: 5, label: "Gates & Security" },
  { id: 6, label: "Review" },
];

const initialSections: SectionData[] = [
  { id: "front", name: "Front", length: "12.0", height: "2.2", spacing: "3.0", category: "Simple" },
  { id: "rear", name: "Rear", length: "18.0", height: "2.2", spacing: "3.0", category: "Mid-range" },
  { id: "left", name: "Left", length: "8.5", height: "2.2", spacing: "3.0", category: "Heavy" },
  { id: "right", name: "Right", length: "9.0", height: "2.2", spacing: "3.0", category: "Luxury" },
];

const currencyOptions = ["NGN", "USD", "EUR", "GBP"];
const measurementOptions = ["Metric", "Imperial"];

function statusBadge(status: string) {
  const ready = status === "Ready";
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        ready ? "bg-[#DDEFFE] text-[#0D3B66]" : "bg-[#FCE7D2] text-[#C8521E]"
      }`}
    >
      {status}
    </span>
  );
}

function AppIcon() {
  return (
    <svg viewBox="0 0 42 42" className="h-10 w-10" aria-hidden="true">
      <rect x="4" y="4" width="34" height="34" rx="10" fill="#0D3B66" />
      <path d="M13 20h16" stroke="#E7B34B" strokeWidth="3" strokeLinecap="round" />
      <path d="M13 26h10" stroke="#E7B34B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function StepIndicator({ step, active }: { step: number; active: boolean }) {
  return (
    <div className="group flex items-center gap-3 rounded-3xl border p-3 transition-all duration-200 hover:border-[#0D3B66]/40 hover:bg-white/80 sm:p-4" aria-current={active ? "step" : undefined}>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-2xl border text-sm font-semibold ${
          active
            ? "border-[#0D3B66] bg-[#0D3B66] text-white shadow-[0_12px_24px_rgba(13,59,102,0.18)]"
            : "border-slate-200 bg-white text-[#0B2942]"
        }`}
      >
        {step}
      </div>
      <span className="text-sm font-medium text-[#0B2942]">{stepLabels[step - 1].label}</span>
    </div>
  );
}

function rangeValue(value: string) {
  return value.trim().length > 0 ? value : "—";
}

export default function ApplicationShell() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [activeStage, setActiveStage] = useState(1);
  const [teamMode, setTeamMode] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<DesignCategory>("Simple");
  const [projectInfo, setProjectInfo] = useState({
    projectName: "",
    clientName: "",
    location: "",
    currency: "NGN",
    measurement: "Metric",
    designCategory: "Simple" as DesignCategory,
  });
  const [sections, setSections] = useState<SectionData[]>(initialSections);
  const [selectedCalculator, setSelectedCalculator] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [sectionSummaries, setSectionSummaries] = useState<{
    sectionId: string;
    sectionName: string;
    physicalLayout?: ReturnType<typeof calculateFenceSectionPhysicalLayout>;
    baseGeometry?: ReturnType<typeof calculateFenceFoundationBaseGeometry>;
    panelGeometry?: ReturnType<typeof calculateFencePanelFoundationComponentGeometry>;
    earthworks?: ReturnType<typeof calculateFenceFoundationEarthworks>;
    concreteMaterials?: ReturnType<typeof calculateFenceFoundationConcreteMaterials>;
    blockworkMaterials?: ReturnType<typeof calculateFenceFoundationBlockworkMaterials>;
    structuralMaterials?: ReturnType<typeof calculateFenceFoundationStructuralMaterials>;
    error?: string;
  }[]>([]);

  const activePageLabel = navItems.find((item) => item.key === activePage)?.label ?? "Dashboard";

  const validProject = useMemo(
    () =>
      projectInfo.projectName.trim().length > 0 &&
      projectInfo.clientName.trim().length > 0 &&
      projectInfo.location.trim().length > 0,
    [projectInfo],
  );

  const allSectionsDetailsComplete = useMemo(
    () => sections.every((section) => section.name.trim() && section.length.trim() && section.height.trim() && section.spacing.trim()),
    [sections],
  );

  const handleProjectField = (field: keyof typeof projectInfo, value: string) => {
    setProjectInfo((current) => ({ ...current, [field]: value }));
    if (field === "designCategory") {
      setSelectedCategory(value as DesignCategory);
    }
  };

  const setSectionField = (id: string, field: keyof Omit<SectionData, "id" | "isCustom">, value: string) => {
    setSections((current) => current.map((section) => (section.id === id ? { ...section, [field]: value } : section)));
  };

  const addSection = () => {
    setSections((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        name: "Custom section",
        length: "",
        height: "",
        spacing: "",
        category: "Simple",
        isCustom: true,
      },
    ]);
  };

  const removeSection = (id: string) => {
    setSections((current) => current.filter((section) => section.id !== id));
  };

  const openFenceEstimator = () => {
    setActivePage("fence");
    setActiveStage(1);
  };

  const openQuickCalculator = () => {
    setActivePage("quick");
    setSelectedCalculator(null);
  };

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProjectInfo({
      projectName: "",
      clientName: "",
      location: "",
      currency: "NGN",
      measurement: "Metric",
      designCategory: "Simple",
    });
    setSections(initialSections);
    setActiveStage(1);
    setDraftMessage("Draft cleared");
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        projectInfo: typeof projectInfo;
        sections: SectionData[];
        activeStage: number;
      };
      setProjectInfo(parsed.projectInfo ?? projectInfo);
      setSections(parsed.sections ?? initialSections);
      setActiveStage(parsed.activeStage ?? 1);
      setDraftMessage("Draft restored");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ projectInfo, sections, activeStage });
    localStorage.setItem(STORAGE_KEY, payload);
    setDraftMessage("Draft saved");
    const timeout = window.setTimeout(() => setDraftMessage(null), 2000);
    return () => window.clearTimeout(timeout);
  }, [projectInfo, sections, activeStage]);

  const renderDashboard = () => (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.7fr_1.3fr]">
        <div className="rounded-[32px] border border-[#d6dfe9] bg-white p-8 shadow-[0_24px_70px_rgba(11,41,66,0.08)] sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-[#E7B34B]/15 px-3 py-1 text-sm font-semibold text-[#0D3B66]">Charismak Estimator</span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[#0B2942] sm:text-5xl">Build with certainty.</h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[#4B5B72]">
                A responsive estimator for quantities, materials, labour and project costs with disciplined site planning and practical Nigerian construction workflow.
              </p>
            </div>
            <div className="hidden h-24 w-24 rounded-3xl border border-[#dbe2eb] bg-[#F4F7FA] p-4 text-center sm:flex sm:items-center sm:justify-center">
              <AppIcon />
            </div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={openFenceEstimator}
              className="inline-flex items-center justify-center rounded-full bg-[#0D3B66] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(13,59,102,0.18)] transition hover:bg-[#0b3256]"
            >
              New Fence Estimate
            </button>
            <button
              type="button"
              onClick={openQuickCalculator}
              className="inline-flex items-center justify-center rounded-full border border-[#0D3B66] bg-white px-6 py-3 text-sm font-semibold text-[#0D3B66] transition hover:bg-[#f5f8fc]"
            >
              Open Quick Calculator
            </button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {statusCards.map((status) => (
            <article key={status.label} className="rounded-[28px] border border-[#edf1f6] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#0B2942]">{status.label}</p>
                {statusBadge(status.status)}
              </div>
              <p className="mt-4 text-sm leading-6 text-[#555f71]">
                {status.label} is configured for a serious site-ready estimator workflow.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-col gap-3 rounded-[32px] border border-[#d6dfe9] bg-white px-6 py-5 sm:px-7 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/90">Start a fence estimate</p>
              <h2 className="mt-2 text-xl font-semibold text-[#0B2942]">Choose a design category</h2>
            </div>
            <span className="rounded-full bg-[#E7B34B]/15 px-3 py-1 text-sm font-semibold text-[#0D3B66]">No pricing until scope is confirmed</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {designCategories.map((category) => {
              const active = selectedCategory === category.label;
              return (
                <button
                  key={category.label}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category.label);
                    handleProjectField("designCategory", category.label);
                  }}
                  className={`group rounded-[28px] border p-5 text-left transition ${
                    active ? "border-[#0D3B66] bg-[#0D3B66]/5 shadow-[0_18px_36px_rgba(13,59,102,0.08)]" : "border-[#e6ecf3] bg-white hover:border-[#0D3B66]/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0D3B66]">{category.label}</span>
                    {active ? (
                      <span className="rounded-full bg-[#0D3B66] px-2.5 py-1 text-[11px] font-semibold text-white">Selected</span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#4B5B72]">{category.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {quickCalculators.map((item) => (
            <article key={item.key} className="rounded-[28px] border border-[#d6dfe9] bg-white p-5 shadow-sm">
              <p className="text-base font-semibold text-[#0B2942]">{item.title}</p>
              <p className="mt-3 text-sm leading-6 text-[#4B5B72]">{item.description}</p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={openQuickCalculator}
                  className="inline-flex items-center justify-center rounded-full bg-[#0D3B66] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0b3256]"
                >
                  Open calculator
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="rounded-[32px] border border-[#d6dfe9] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#0B2942]">Recent estimates</h3>
          <p className="mt-3 text-sm leading-7 text-[#556475]">
            No estimates have been saved yet. Start a new fence estimate to capture project details, sections and structure requirements.
          </p>
          <div className="mt-6 rounded-[24px] bg-[#F0F4F9] p-5 text-sm text-[#0B2942]/90">
            There is no calculated estimate until section scope and site details are entered.
          </div>
        </div>
      </section>
    </div>
  );

  const renderFenceEstimator = () => (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[#d6dfe9] bg-white p-6 shadow-[0_24px_70px_rgba(11,41,66,0.08)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">Fence estimator</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0B2942]">Site setup workspace</h2>
          </div>
          <div className="grid gap-3 sm:auto-cols-max sm:grid-flow-col">
            <button
              type="button"
              onClick={() => setActiveStage(1)}
              className="rounded-full bg-[#F4F7FA] px-5 py-3 text-sm font-semibold text-[#0B2942] ring-1 ring-[#d6dfe9] transition hover:bg-white"
            >
              Reset to Project
            </button>
            <button
              type="button"
              onClick={() => setActiveStage((current) => Math.min(current + 1, stepLabels.length))}
              className="rounded-full bg-[#0D3B66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3256]"
            >
              Next milestone
            </button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {stepLabels.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStage(step.id)}
              className={`rounded-3xl border p-4 text-left transition ${
                activeStage === step.id ? "border-[#0D3B66] bg-[#0D3B66]/5 shadow-[0_16px_40px_rgba(13,59,102,0.10)]" : "border-[#e6ecf3] bg-white hover:border-[#0D3B66]/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-[#0D3B66] ring-1 ring-[#d6dfe9]">
                  {step.id}
                </span>
                <span className="text-sm font-semibold text-[#0B2942]">{step.label}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[#556475]">
                {step.id <= 2
                  ? "Complete site scope before moving forward."
                  : "Next milestone setup is planned for future releases."}
              </p>
            </button>
          ))}
        </div>
      </section>

      {activeStage === 1 ? (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-[#d6dfe9] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">Project</p>
                <h3 className="mt-3 text-2xl font-semibold text-[#0B2942]">Define the estimate scope</h3>
              </div>
              <span className="rounded-full bg-[#E7B34B]/15 px-3 py-1 text-sm font-semibold text-[#0D3B66]">Stage 1 of 6</span>
            </div>
            <div className="mt-8 grid gap-5">
              <label className="block text-sm font-medium text-[#0B2942]">
                Project name
                <input
                  value={projectInfo.projectName}
                  onChange={(event) => handleProjectField("projectName", event.target.value)}
                  placeholder="e.g. Victoria perimeter fence"
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B2942] outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
                />
              </label>
              <label className="block text-sm font-medium text-[#0B2942]">
                Client name
                <input
                  value={projectInfo.clientName}
                  onChange={(event) => handleProjectField("clientName", event.target.value)}
                  placeholder="e.g. Amina & Sons"
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B2942] outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
                />
              </label>
              <label className="block text-sm font-medium text-[#0B2942]">
                Location
                <input
                  value={projectInfo.location}
                  onChange={(event) => handleProjectField("location", event.target.value)}
                  placeholder="e.g. Lekki Phase 1"
                  className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B2942] outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[#0B2942]">
                  Currency
                  <select
                    value={projectInfo.currency}
                    onChange={(event) => handleProjectField("currency", event.target.value)}
                    className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B2942] outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
                  >
                    {currencyOptions.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-[#0B2942]">
                  Measurement
                  <select
                    value={projectInfo.measurement}
                    onChange={(event) => handleProjectField("measurement", event.target.value)}
                    className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B2942] outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
                  >
                    {measurementOptions.map((measurement) => (
                      <option key={measurement} value={measurement}>
                        {measurement}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="rounded-[28px] bg-[#F4F7FA] p-4">
                <p className="text-sm font-semibold text-[#0B2942]">Design category</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {designCategories.map((option) => {
                    const active = projectInfo.designCategory === option.label;
                    return (
                      <button
                        key={option.label}
                        type="button"
                        onClick={() => handleProjectField("designCategory", option.label)}
                        className={`rounded-3xl border px-4 py-3 text-left transition ${
                          active
                            ? "border-[#0D3B66] bg-[#0D3B66]/5 text-[#0B2942] shadow-[0_14px_34px_rgba(13,59,102,0.12)]"
                            : "border-[#d6dfe9] bg-white text-[#4B5B72] hover:border-[#0D3B66]/40"
                        }`}
                      >
                        <span className="font-semibold">{option.label}</span>
                        <p className="mt-2 text-sm leading-6 text-[#556475]">{option.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-[#4B5B72]">No estimate is calculated until section details are defined.</p>
              <button
                type="button"
                onClick={() => setActiveStage(2)}
                disabled={!validProject}
                className="inline-flex items-center justify-center rounded-full bg-[#0D3B66] px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Continue to Sections
              </button>
            </div>
          </div>
          <div className="rounded-[32px] border border-[#d6dfe9] bg-[#F4F7FA] p-6 shadow-sm sm:p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">Project summary</p>
            <div className="mt-6 space-y-4 text-sm text-[#4B5B72]">
              <div className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4">
                <span className="font-semibold text-[#0B2942]">Project name</span>
                <span>{projectInfo.projectName || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4">
                <span className="font-semibold text-[#0B2942]">Client</span>
                <span>{projectInfo.clientName || "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-3xl bg-white p-4">
                <span className="font-semibold text-[#0B2942]">Location</span>
                <span>{projectInfo.location || "Not set"}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-4">
                  <span className="block text-sm font-semibold text-[#0B2942]">Currency</span>
                  <span className="mt-2 block text-sm text-[#4B5B72]">{projectInfo.currency}</span>
                </div>
                <div className="rounded-3xl bg-white p-4">
                  <span className="block text-sm font-semibold text-[#0B2942]">Measurement</span>
                  <span className="mt-2 block text-sm text-[#4B5B72]">{projectInfo.measurement}</span>
                </div>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <span className="block text-sm font-semibold text-[#0B2942]">Design category</span>
                <span className="mt-2 block text-sm text-[#4B5B72]">{projectInfo.designCategory}</span>
              </div>
            </div>
          </div>
        </section>
      ) : activeStage === 2 ? (
        <section className="grid gap-6">
          <div className="rounded-[32px] border border-[#d6dfe9] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">Sections</p>
                <h3 className="mt-3 text-2xl font-semibold text-[#0B2942]">Capture section scope</h3>
              </div>
              <span className="rounded-full bg-[#E7B34B]/15 px-3 py-1 text-sm font-semibold text-[#0D3B66]">Stage 2 of 6</span>
            </div>
            <div className="mt-5 rounded-[28px] bg-[#F4F7FA] p-5 text-sm leading-6 text-[#4B5B72]">
              No estimate can be calculated until section lengths, heights, spacing and design category are complete.
            </div>
          </div>

          <div className="grid gap-5">
            {sections.map((section) => (
              <article key={section.id} className="rounded-[32px] border border-[#d6dfe9] bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-[#0B2942]">{section.name}</h4>
                    <p className="mt-1 text-sm leading-6 text-[#556475]">Set the physical parameters and category for this section.</p>
                  </div>
                  {section.isCustom ? (
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="rounded-full border border-[#cfcfcf] bg-[#fff5f1] px-4 py-2 text-sm font-semibold text-[#C8320A] transition hover:bg-[#fee8e2]"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-[1.8fr_1fr]">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-[#0B2942]">
                      Section name
                      <input
                        value={section.name}
                        onChange={(event) => setSectionField(section.id, "name", event.target.value)}
                        className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B2942] outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
                      />
                    </label>
                    <label className="block text-sm font-medium text-[#0B2942]">
                      Gross length (m)
                      <input
                        value={section.length}
                        onChange={(event) => setSectionField(section.id, "length", event.target.value)}
                        placeholder="0.0"
                        className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B2942] outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
                      />
                    </label>
                    <label className="block text-sm font-medium text-[#0B2942]">
                      Fence height (m)
                      <input
                        value={section.height}
                        onChange={(event) => setSectionField(section.id, "height", event.target.value)}
                        placeholder="0.0"
                        className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B2942] outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
                      />
                    </label>
                    <label className="block text-sm font-medium text-[#0B2942]">
                      Column spacing (m)
                      <input
                        value={section.spacing}
                        onChange={(event) => setSectionField(section.id, "spacing", event.target.value)}
                        placeholder="0.0"
                        className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B2942] outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
                      />
                    </label>
                  </div>
                  <label className="block text-sm font-medium text-[#0B2942]">
                    Design category
                    <select
                      value={section.category}
                      onChange={(event) => setSectionField(section.id, "category", event.target.value as DesignCategory)}
                      className="mt-2 w-full rounded-3xl border border-[#d6dfe9] bg-[#F8FAFC] px-4 py-3 text-sm text-[#0B2942] outline-none transition focus:border-[#0D3B66] focus:ring-4 focus:ring-[#0D3B66]/10"
                    >
                      {designCategories.map((option) => (
                        <option key={option.label} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </article>
            ))}
            <button
              type="button"
              onClick={addSection}
              className="inline-flex items-center justify-center rounded-full border border-[#0D3B66] bg-white px-5 py-3 text-sm font-semibold text-[#0D3B66] transition hover:bg-[#f5f8fc]"
            >
              Add custom section
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-[32px] border border-[#d6dfe9] bg-[#F4F7FA] p-6 text-sm text-[#4B5B72] shadow-sm sm:p-8">
            <h3 className="text-base font-semibold text-[#0B2942]">Section completeness</h3>
            <p>Sections must include name, length, height, spacing and a design category before structural estimate work can start.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white p-4">
                <span className="block text-sm font-semibold text-[#0B2942]">Required sections</span>
                <span className="mt-2 block text-sm text-[#4B5B72]">{sections.length} defined</span>
              </div>
              <div className="rounded-3xl bg-white p-4">
                <span className="block text-sm font-semibold text-[#0B2942]">Status</span>
                <span className="mt-2 block text-sm text-[#4B5B72]">{allSectionsDetailsComplete ? "Ready for structure" : "Awaiting details"}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setActiveStage(1)}
                className="inline-flex items-center justify-center rounded-full border border-[#c8d4e4] bg-white px-5 py-3 text-sm font-semibold text-[#0B2942] transition hover:bg-[#f5f8fc]"
              >
                Return to Project
              </button>
              <button
                type="button"
                onClick={() => setActiveStage(3)}
                className="inline-flex items-center justify-center rounded-full bg-[#0D3B66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3256]"
              >
                Continue to Structure
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-[32px] border border-[#d6dfe9] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">{stepLabels[activeStage - 1].label}</p>
              <h3 className="mt-3 text-2xl font-semibold text-[#0B2942]">Next milestone panel</h3>
            </div>
            <span className="rounded-full bg-[#E7B34B]/15 px-3 py-1 text-sm font-semibold text-[#0D3B66]">Planned</span>
          </div>
          <p className="mt-6 text-sm leading-7 text-[#556475]">
            {activeStage === 3 &&
              "Structural detail review and material selection will be built next. For now, save the core project and section definitions before advancing."}
            {activeStage === 4 &&
              "Finish specifications are being prepared with premium surface and site-ready options soon."}
            {activeStage === 5 &&
              "Gate and security planning will arrive in the next milestone with access, hardware and opening layouts."}
            {activeStage === 6 &&
              "Review and summary output is the final milestone — this will arrive after the estimator core is fully scoped."}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[#e6ecf3] bg-[#F4F7FA] p-5">
              <p className="text-sm font-semibold text-[#0B2942]">No quantities yet</p>
              <p className="mt-2 text-sm leading-6 text-[#556475]">Estimated quantities are not generated until required section details are complete.</p>
            </div>
            <div className="rounded-3xl border border-[#e6ecf3] bg-[#F4F7FA] p-5">
              <p className="text-sm font-semibold text-[#0B2942]">Next release</p>
              <p className="mt-2 text-sm leading-6 text-[#556475]">Future modules will connect section scope with structural, finishes and gates planning.</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );

  const renderQuickCalculators = () => (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[#d6dfe9] bg-white p-6 shadow-[0_24px_70px_rgba(11,41,66,0.08)] sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">Quick calculators</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0B2942]">Practical design support for site setup</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[#4B5B72]">
          Access a set of focused calculation tools for the most common fence foundation and wall tasks. Calculator integration is the next milestone.
        </p>
      </section>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {quickCalculators.map((item) => (
          <article key={item.key} className="rounded-[32px] border border-[#d6dfe9] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-[#0B2942]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#556475]">{item.description}</p>
              </div>
              <div className="rounded-2xl bg-[#F4F7FA] px-3 py-2 text-xs font-semibold text-[#0D3B66]">Calculator</div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCalculator(item.key)}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0D3B66] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3256]"
            >
              Open calculator
            </button>
          </article>
        ))}
      </div>
      {selectedCalculator ? (
        <section className="rounded-[32px] border border-[#d6dfe9] bg-[#F4F7FA] p-6 text-[#4B5B72] shadow-sm">
          <h3 className="text-lg font-semibold text-[#0B2942]">Calculator interface connection</h3>
          <p className="mt-3 text-sm leading-7">
            The {quickCalculators.find((item) => item.key === selectedCalculator)?.title} calculator interface connection is the next milestone. No results are shown until the calculator module is integrated.
          </p>
        </section>
      ) : null}
    </div>
  );

  const renderEstimates = () => (
    <div className="rounded-[32px] border border-[#d6dfe9] bg-white p-8 shadow-sm">
      <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">Estimates</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0B2942]">Saved estimates</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4B5B72]">
        No estimates have been saved yet. Your completed fence estimates will appear here for review and later export.
      </p>
    </div>
  );

  const renderRates = () => (
    <div className="rounded-[32px] border border-[#d6dfe9] bg-white p-8 shadow-sm">
      <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">Rate Library</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0B2942]">Nigerian project rates</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4B5B72]">
        Project-specific Nigerian rates will be added in a future release. This library will include location, source and effective date for every rate set.
      </p>
    </div>
  );

  const renderProjects = () => (
    <div className="rounded-[32px] border border-[#d6dfe9] bg-white p-8 shadow-sm">
      <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">Projects</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#0B2942]">Project workspace</h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4B5B72]">
        Future updates will let you manage project portfolios, assign teams, and compare estimates across sites.
      </p>
    </div>
  );

  const pageContent = useMemo(() => {
    switch (activePage) {
      case "dashboard":
        return renderDashboard();
      case "fence":
        return renderFenceEstimator();
      case "quick":
        return renderQuickCalculators();
      case "estimates":
        return renderEstimates();
      case "rates":
        return renderRates();
      case "projects":
        return renderProjects();
      default:
        return renderDashboard();
    }
  }, [activePage, selectedCategory, activeStage, projectInfo, sections, selectedCalculator, validProject, allSectionsDetailsComplete]);

  return (
    <div className="min-h-screen bg-[#F4F7FA] text-[#0B2942]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] overflow-hidden lg:gap-8">
        <aside className="hidden w-[280px] shrink-0 flex-col border-r border-[#d6dfe9] bg-[#F4F7FA] px-5 py-6 lg:flex">
          <div className="flex items-center gap-3 rounded-3xl bg-white px-4 py-4 shadow-[0_16px_40px_rgba(11,41,66,0.06)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[#0D3B66] text-white">
              <AppIcon />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0B2942]">Charismak</p>
              <p className="text-xs text-[#556475]">Construction Estimator</p>
            </div>
          </div>
          <nav className="mt-8 flex flex-1 flex-col gap-2">
            {navItems.map((item) => {
              const isActive = activePage === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActivePage(item.key);
                    if (item.key === "fence") {
                      setActiveStage(1);
                    }
                  }}
                  className={`group flex items-center justify-between rounded-3xl px-4 py-4 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#0D3B66] text-white shadow-[0_18px_32px_rgba(13,59,102,0.16)]"
                      : "text-[#334155] hover:bg-white hover:text-[#0B2942]"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-[#94a3b8] group-hover:text-[#0B2942]">{item.key === "dashboard" ? "" : ""}</span>
                </button>
              );
            })}
          </nav>
          <div className="mt-6 rounded-[28px] border border-[#d6dfe9] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#0B2942]">Abiodun Akinola</p>
            <p className="mt-2 text-sm text-[#4B5B72]">Team Mode active</p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-[#d6dfe9] bg-white px-4 py-4 shadow-sm lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#0D3B66]/80">Estimator</p>
                <h1 className="text-lg font-semibold text-[#0B2942]">{activePageLabel}</h1>
              </div>
              <button
                type="button"
                onClick={() => setTeamMode((current) => !current)}
                className="rounded-full border border-[#d6dfe9] bg-[#F4F7FA] px-4 py-2 text-sm font-semibold text-[#0D3B66]"
              >
                {teamMode ? "Team Mode" : "Client Mode"}
              </button>
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                const isActive = activePage === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setActivePage(item.key);
                      if (item.key === "fence") {
                        setActiveStage(1);
                      }
                    }}
                    className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                      isActive ? "bg-[#0D3B66] text-white" : "bg-[#F4F7FA] text-[#0B2942] hover:bg-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1400px] flex-col gap-6 pb-6">
                <div className="hidden items-center justify-between gap-4 rounded-[32px] border border-[#d6dfe9] bg-white px-6 py-5 shadow-sm lg:flex">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-[#0D3B66]/80">{activePageLabel}</p>
                    <h1 className="mt-2 text-3xl font-semibold text-[#0B2942]">Charismak Construction Estimator</h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={openFenceEstimator}
                      className="rounded-full bg-[#0D3B66] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3256]"
                    >
                      New Fence Estimate
                    </button>
                    <button
                      type="button"
                      onClick={openQuickCalculator}
                      className="rounded-full border border-[#0D3B66] bg-white px-5 py-3 text-sm font-semibold text-[#0D3B66] transition hover:bg-[#f5f8fc]"
                    >
                      Open Quick Calculator
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeamMode((current) => !current)}
                      className="rounded-full bg-[#F4F7FA] px-5 py-3 text-sm font-semibold text-[#0D3B66] transition hover:bg-white"
                    >
                      {teamMode ? "Team Mode" : "Client Mode"}
                    </button>
                  </div>
                </div>
                {pageContent}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
