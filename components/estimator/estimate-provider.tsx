"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { calculateFenceSectionPhysicalLayout } from "@/lib/fence/physical-layout-calculator";
import type {
  FenceSection,
  Gate,
  FencePanelComposition,
  ColumnConstructionSystem,
} from "@/lib/fence/types";
import {
  createFenceColumnSpecifications,
  DEFAULT_FENCE_BOQ_PROFILE,
  normalizeFenceBoqProfile,
  type FenceBoqProfile,
} from "@/lib/fence/fence-boq-profile";
import {
  createNewBill,
  loadBill,
  loadBillById,
  selectBill,
} from "@/lib/billing/store";

const STORAGE_KEY = "charismak-estimator-draft";

type ProjectInfo = {
  projectName: string;
  clientName: string;
  location: string;
  currency: string;
  measurement: string;
  designCategory: string;
};

export type SectionState = FenceSection & {
  grossLengthM: number;
  constructionSystem: ColumnConstructionSystem;
  boqProfile: FenceBoqProfile;
};

type EstimateState = {
  activeStage: number;
  estimateBillId: string | null;
  teamMode: boolean;
  projectInfo: ProjectInfo;
  sections: SectionState[];
  setProjectField: (field: keyof ProjectInfo, value: string) => void;
  setActiveStage: (n: number) => void;
  setEstimateBillId: (id: string | null) => void;
  startNewEstimate: () => boolean;
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
  projectName: "",
  clientName: "",
  location: "",
  currency: "NGN",
  measurement: "Metric",
  designCategory: "Simple",
};

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
    constructionSystem: "reinforced-concrete",
    boqProfile: { ...DEFAULT_FENCE_BOQ_PROFILE },
  };

  return section;
}

export function EstimateProvider({ children }: { children: React.ReactNode }) {
  const [activeStage, setActiveStageState] = useState<number>(0);
  const [teamMode, setTeamMode] = useState(true);
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
      if (parsed.projectInfo) setProjectInfo(parsed.projectInfo);
      if (parsed.sections) {
        setSections(
          parsed.sections.map((section: Partial<SectionState>) => ({
            ...section,
            constructionSystem:
              section.constructionSystem ?? "reinforced-concrete",
            boqProfile: normalizeFenceBoqProfile(section.boqProfile),
          })) as SectionState[],
        );
      }
      if (typeof parsed.activeStage === "number") setActiveStageState(parsed.activeStage);

      let restoredBillId =
        typeof parsed.estimateBillId === "string" ? parsed.estimateBillId : null;
      if (!restoredBillId) {
        // One-time migration for drafts created before estimates were linked
        // to their own bill. Only reuse an editable fence bill that clearly
        // belongs to the restored project; never bind to a completed issue.
        const activeBill = loadBill();
        if (
          activeBill?.status === "draft" &&
          activeBill.sourceModules?.includes("fence") &&
          activeBill.projectName &&
          activeBill.projectName === parsed.projectInfo?.projectName
        ) {
          restoredBillId = activeBill.id;
        } else if (Array.isArray(parsed.sections) && parsed.sections.length > 0) {
          // Older beta builds could leave a new fence scope pointing at the
          // last completed bill. Give that restored scope an independent
          // editable bill during migration rather than reopening the locked
          // historical issue.
          const migratedBill = createNewBill({
            title: `${parsed.projectInfo?.projectName || "Fence Project"} Bill of Quantities`,
            projectName: parsed.projectInfo?.projectName || null,
            clientName: parsed.projectInfo?.clientName || null,
            location: parsed.projectInfo?.location || null,
            currency: parsed.projectInfo?.currency || "NGN",
          });
          restoredBillId = migratedBill.id;
        }
      }
      if (restoredBillId && loadBillById(restoredBillId)) {
        setEstimateBillId(restoredBillId);
        selectBill(restoredBillId);
      }
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
    const payload = JSON.stringify({
      ...current,
      projectInfo,
      sections,
      activeStage,
      estimateBillId,
    });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [projectInfo, sections, activeStage, estimateBillId, hydrated]);

  const setProjectField = (field: keyof ProjectInfo, value: string) => setProjectInfo((p) => ({ ...p, [field]: value }));

  const startNewEstimate = (): boolean => {
    const hasDraft =
      projectInfo.projectName.trim().length > 0 || sections.length > 0;
    if (!hasDraft && estimateBillId) {
      const existing = loadBillById(estimateBillId);
      const existingItemCount =
        existing?.sections.reduce(
          (total, section) => total + section.items.length,
          0,
        ) ?? 0;
      if (existing?.status === "draft" && existingItemCount === 0) {
        selectBill(existing.id);
        setActiveStageState(1);
        return true;
      }
    }
    if (hasDraft) {
      const ok = window.confirm(
        "Start a new fence estimate? The current bill will remain safely available in Bill Register.",
      );
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
    const newBill = createNewBill({
      title: "New Fence Estimate",
      projectName: null,
      clientName: null,
      location: null,
      currency: "NGN",
    });
    setProjectInfo(defaultProject);
    setSections([]);
    setEstimateBillId(newBill.id);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    setProjectInfo(defaultProject);
    setSections([]);
    setEstimateBillId(null);
    setActiveStageState(0);
  };

  const addSection = (section?: Partial<SectionState>, position?: FenceSection['position'], name?: string) => {
    // If a position is provided and already exists, confirm duplication
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
    const clone = {
      ...src,
      id: `section-${Date.now()}`,
      gates: src.gates.map((gate) => ({ ...gate, id: `${gate.id}-copy-${Date.now()}` })),
      boqProfile: { ...src.boqProfile },
    } as SectionState;
    setSections((cur) => [...cur, clone]);
  };

  const addGateToSection = (sectionId: string, gate: Gate) => {
    setSections((cur) => cur.map((s) => (s.id === sectionId ? { ...s, gates: [...s.gates, gate] } : s)));
  };

  const removeGateFromSection = (sectionId: string, gateId: string) => {
    setSections((cur) => cur.map((s) => (s.id === sectionId ? { ...s, gates: s.gates.filter((g) => g.id !== gateId) } : s)));
  };

  const calculateSectionLayout = (sectionId: string) => {
    const s = sections.find((x) => x.id === sectionId);
    if (!s) return null;

    // build minimal section object expected by the engine
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
      const result = calculateFenceSectionPhysicalLayout({
        section: engineSection as FenceSection,
        specifications: createFenceColumnSpecifications(s),
      });
      return result;
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
    estimateBillId,
    teamMode,
    projectInfo,
    sections,
    setProjectField,
    setActiveStage: setActiveStageState,
    setEstimateBillId,
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
