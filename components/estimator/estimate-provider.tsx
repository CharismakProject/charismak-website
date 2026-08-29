"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { persistWorkspaceCloud } from "@/lib/estimator/cloud";
import { calculateFenceSectionPhysicalLayout } from "@/lib/fence/physical-layout-calculator";
import type {
  FenceSection,
  ColumnSpecification,
  Gate,
  FencePanelComposition,
} from "@/lib/fence/types";

const STORAGE_KEY = "charismak-estimator-draft";

type ProjectInfo = {
  projectId: string | null;
  projectName: string;
  clientName: string;
  location: string;
  currency: string;
  measurement: string;
  designCategory: string;
};

type StartEstimateProject = Partial<ProjectInfo> & {
  estimateBillId?: string | null;
};

type SectionState = FenceSection & { grossLengthM: number };

type EstimateState = {
  activeStage: number;
  teamMode: boolean;
  projectInfo: ProjectInfo;
  sections: SectionState[];
  estimateBillId: string | null;
  setEstimateBillId: (id: string | null) => void;
  setProjectField: (field: Exclude<keyof ProjectInfo, "projectId">, value: string) => void;
  setActiveStage: (n: number) => void;
  startNewEstimate: (project?: StartEstimateProject) => boolean;
  clearDraft: () => void;
  addSection: (
    section?: Partial<SectionState>,
    position?: FenceSection["position"],
    name?: string,
  ) => string | null;
  updateSection: (id: string, patch: Partial<SectionState>) => void;
  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  addGateToSection: (sectionId: string, gate: Gate) => void;
  removeGateFromSection: (sectionId: string, gateId: string) => void;
  calculateSectionLayout: (sectionId: string) => any | null;
  totals: { perimeter: number; totalGateWidth: number };
};

const EstimateContext = createContext<EstimateState | null>(null);

const defaultProject: ProjectInfo = {
  projectId: null,
  projectName: "",
  clientName: "",
  location: "",
  currency: "NGN",
  measurement: "Metric",
  designCategory: "Simple",
};

const defaultColumnSpecifications: ColumnSpecification[] = [
  { id: "regular-column", name: "Regular column", constructionSystem: "reinforced-concrete", widthAlongFenceM: 0.4, depthM: 0.4, heightM: 2.2, concreteMixId: "1-2-4", concreteCoverMm: 50, mainBarCount: 4, mainBarDiameterMm: 12, mainBarExtraLengthM: 0.2, linkBarDiameterMm: 8, linkSpacingM: 0.2, linkHookAllowanceM: 0.3, formedWidthFaceCount: 2, formedDepthFaceCount: 2, bindingWirePercentOfReinforcementWeight: 1.5, concreteWastagePercent: 5, reinforcementWastagePercent: 5, formworkWastagePercent: 10  },
  { id: "corner-column", name: "Corner column", constructionSystem: "reinforced-concrete", widthAlongFenceM: 0.45, depthM: 0.45, heightM: 2.2, concreteMixId: "1-2-4", concreteCoverMm: 50, mainBarCount: 4, mainBarDiameterMm: 12, mainBarExtraLengthM: 0.2, linkBarDiameterMm: 8, linkSpacingM: 0.2, linkHookAllowanceM: 0.3, formedWidthFaceCount: 2, formedDepthFaceCount: 2, bindingWirePercentOfReinforcementWeight: 1.5, concreteWastagePercent: 5, reinforcementWastagePercent: 5, formworkWastagePercent: 10 },
  { id: "pedestrian-gate-post", name: "Pedestrian gate post", constructionSystem: "reinforced-concrete", widthAlongFenceM: 0.35, depthM: 0.35, heightM: 2.2, concreteMixId: "1-2-4", concreteCoverMm: 50, mainBarCount: 4, mainBarDiameterMm: 12, mainBarExtraLengthM: 0.2, linkBarDiameterMm: 8, linkSpacingM: 0.2, linkHookAllowanceM: 0.3, formedWidthFaceCount: 2, formedDepthFaceCount: 2, bindingWirePercentOfReinforcementWeight: 1.5, concreteWastagePercent: 5, reinforcementWastagePercent: 5, formworkWastagePercent: 10 },
  { id: "vehicle-gate-post", name: "Vehicle gate post", constructionSystem: "reinforced-concrete", widthAlongFenceM: 0.5, depthM: 0.5, heightM: 2.2, concreteMixId: "1-2-4", concreteCoverMm: 50, mainBarCount: 4, mainBarDiameterMm: 12, mainBarExtraLengthM: 0.2, linkBarDiameterMm: 8, linkSpacingM: 0.2, linkHookAllowanceM: 0.3, formedWidthFaceCount: 2, formedDepthFaceCount: 2, bindingWirePercentOfReinforcementWeight: 1.5, concreteWastagePercent: 5, reinforcementWastagePercent: 5, formworkWastagePercent: 10 },
];

function makeEmptySection(idSuffix = "", opts?: { position?: any; name?: string }): SectionState {
  const id = `section-${Date.now()}${idSuffix}`;
  const section: SectionState = {
    id,
    name: opts?.name ?? "New section",
    position: opts?.position ?? "custom",
    grossLengthM: 0,
    columnBodyHeightM: 2.2,
    defaultPanelComposition: { blockWallHeightM: 2.2, upperInfillType: "none", upperInfillHeightM: 0, upperInfillSpecificationId: null },
    designCategory: "simple",
    groundCondition: "normal",
    maximumColumnSpacingM: 3,
    regularColumnSpecificationId: "regular-column",
    cornerColumnSpecificationId: "corner-column",
    pedestrianGatePostSpecificationId: "pedestrian-gate-post",
    vehicleGatePostSpecificationId: "vehicle-gate-post",
    gates: [],
    externalFinish: { standardFinish: "none", featureFinish: "none", featureCoveragePercent: 0 },
    internalFinish: { standardFinish: "none", featureFinish: "none", featureCoveragePercent: 0 },
    wallCopingType: "none",
    regularColumnCapType: "none",
    cornerColumnCapType: "none",
    gatePostCapType: "none",
    securityTopping: "none",
    notes: "",
    panelCompositionOverrides: [],
  };

  return section;
}

export function EstimateProvider({ children }: { children: React.ReactNode }) {
  const [activeStage, setActiveStageState] = useState<number>(0);
  const [teamMode] = useState(true);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>(defaultProject);
  const [sections, setSections] = useState<SectionState[]>([]);
  const [estimateBillId, setEstimateBillId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      if (parsed.projectInfo) setProjectInfo({ ...defaultProject, ...parsed.projectInfo });
      if (parsed.sections) setSections(parsed.sections);
      if (typeof parsed.activeStage === "number") setActiveStageState(parsed.activeStage);
      if (typeof parsed.estimateBillId === "string") setEstimateBillId(parsed.estimateBillId);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    let current: Record<string, unknown> = {};
    try {
      current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    } catch {
      current = {};
    }
    const workspaceUpdatedAt = new Date().toISOString();
    const workspace = {
      projectInfo,
      sections,
      activeStage,
      estimateBillId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...current,
      ...workspace,
      workspaceUpdatedAt,
    }));
    persistWorkspaceCloud(workspace, workspaceUpdatedAt);
  }, [projectInfo, sections, activeStage, estimateBillId, hydrated]);

  const setProjectField = (
    field: Exclude<keyof ProjectInfo, "projectId">,
    value: string,
  ) => setProjectInfo((p) => ({ ...p, [field]: value }));

  const startNewEstimate = (project?: StartEstimateProject) => {
    if (
      project?.projectId &&
      projectInfo.projectId === project.projectId &&
      (projectInfo.projectName.trim().length > 0 || sections.length > 0)
    ) {
      if (project.estimateBillId !== undefined) setEstimateBillId(project.estimateBillId);
      if (activeStage < 1) setActiveStageState(1);
      return true;
    }

    const hasDraft =
      projectInfo.projectName.trim().length > 0 || sections.length > 0;
    if (hasDraft) {
      const ok = window.confirm("A draft estimate exists. Start a new estimate and discard the existing draft?");
      if (!ok) return false;
      const raw = localStorage.getItem(STORAGE_KEY);
      let current: Record<string, unknown> = {};
      try {
        current = raw ? JSON.parse(raw) : {};
      } catch {
        current = {};
      }
      delete current.projectInfo;
      delete current.sections;
      delete current.activeStage;
      delete current.estimateBillId;
      delete current.workspaceUpdatedAt;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }

    const { estimateBillId: nextBillId = null, ...projectPatch } = project ?? {};
    setProjectInfo({ ...defaultProject, ...projectPatch });
    setSections([]);
    setEstimateBillId(nextBillId);
    setActiveStageState(1);
    return true;
  };

  const clearDraft = () => {
    const ok = window.confirm("Clear the saved draft? This cannot be undone.");
    if (!ok) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    let current: Record<string, unknown> = {};
    try {
      current = raw ? JSON.parse(raw) : {};
    } catch {
      current = {};
    }
    delete current.projectInfo;
    delete current.sections;
    delete current.activeStage;
    delete current.estimateBillId;
    delete current.workspaceUpdatedAt;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    setProjectInfo(defaultProject);
    setSections([]);
    setEstimateBillId(null);
    setActiveStageState(0);
  };

  const addSection = (section?: Partial<SectionState>, position?: FenceSection["position"], name?: string) => {
    if (position) {
      const exists = sections.some((s) => s.position === position);
      if (exists) {
        const ok = window.confirm(`A section with position '${position}' already exists. Add another?`);
        if (!ok) return null;
      }
    }
    const base = makeEmptySection("", { position: position as any, name });
    const s = section ? { ...base, ...section } : base;
    setSections((cur) => [...cur, s]);
    return s.id;
  };

  const updateSection = (id: string, patch: Partial<SectionState>) => {
    setSections((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSection = (id: string) => setSections((cur) => cur.filter((s) => s.id !== id));

  const duplicateSection = (id: string) => {
    const src = sections.find((s) => s.id === id);
    if (!src) return;
    const clone = { ...src, id: `section-${Date.now()}` } as SectionState;
    setSections((cur) => [...cur, clone]);
  };

  const addGateToSection = (sectionId: string, gate: Gate) => {
    setSections((cur) => cur.map((s) => (s.id === sectionId ? { ...s, gates: [...s.gates, gate] } : s));
  };

  const removeGateFromSection = (sectionId: string, gateId: string) => {
    setSections((cur) => cur.map((s) => (s.id === sectionId ? { ...s, gates: s.gates.filter((g) => g.id !== gateId) } : s));
  };

  const calculateSectionLayout = (sectionId: string) => {
    const s = sections.find((x) => x.id === sectionId);
    if (!s) return null;

    const engineSection: Partial<FenceSection> = {
      id: s.id,
      grossLengthM: s.grossLengthM,
      gates: s.gates,
      maximumColumnSpacingM: s.maximumColumnSpacingM,
      columnBodyHeightM: s.columnBodyHeightM,
      defaultPanelComposition: s.defaultPanelComposition as FencePanelComposition,
      panelCompositionOverrides: s.panelCompositionOverrides,
      regularColumnSpecificationId: s.regularColumnSpecificationId,
      cornerColumnSpecificationId: s.cornerColumnSpecificationId,
      pedestrianGatePostSpecificationId: s.pedestrianGatePostSpecificationId,
      vehicleGatePostSpecificationId: s.vehicleGatePostSpecificationId,
    } as FenceSection;

    try {
      return calculateFenceSectionPhysicalLayout({ section: engineSection as any, specifications: defaultColumnSpecifications });
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  };

  const totals = useMemo(() => {
    const perimeter = sections.reduce((t, s) => t + (Number.isFinite(s.grossLengthM) ? s.grossLengthM : 0), 0);
    const totalGateWidth = sections.reduce((t, s) => t + s.gates.reduce((gt, g) => gt + (Number.isFinite(g.widthM) ? g.widthM : 0), 0), 0);
    return { perimeter, totalGateWidth };
  }, [sections]);

  const value: EstimateState = {
    activeStage,
    teamMode,
    projectInfo,
    sections,
    estimateBillId,
    setEstimateBillId,
    setProjectField,
    setActiveStage: setActiveStageState,
    startNewEstimate,
    clearDraft,
    addSection,
    updateSection,
    removeSection,
    duplicateSection,
    addGateToSection,
    removeGateFromSection,
    calculateSectionLayout,
    totals,
  };

  return <EstimateContext.Provider value={value}>{children}</EstimateContext.Provider>;
}

export function useEstimate() {
  const ctx = useContext(EstimateContext);
  if (!ctx) throw new Error("useEstimate must be used within EstimateProvider");
  return ctx;
}

export default EstimateProvider;
