import { calculateEstimateV2, type EstimateInput, type EstimateResult, type SpecLevel } from "./public-estimate-engine-v2";

export type ConfidenceLevel = "Higher" | "Medium" | "Lower";
export type SanityCheck = { severity: "info" | "warning" | "critical"; message: string };
export type ComparisonOption = { id: string; label: string; note: string; input: EstimateInput; result: EstimateResult };
export type SavingOption = { id: string; label: string; note: string; savingLow: number; savingHigh: number; savingMid: number; input: EstimateInput };
export type CashFlowPhase = { id: string; label: string; share: number; low: number; high: number; midpoint: number };
export type SectionConfidence = { id: string; label: string; level: ConfidenceLevel; reason: string };
export type LandFeasibility = { coveragePercent: number; openAreaM2: number; status: "Comfortable" | "Tight" | "Constrained"; notes: string[] };
export type BudgetCheck = {
  budget: number;
  status: "Below planning range" | "Within planning range" | "Above planning range";
  gapToLow: number;
  gapToMid: number;
  gapToHigh: number;
  indicativeCapacityLow?: number;
  indicativeCapacityHigh?: number;
  capacityUnit?: string;
  capacityLabel?: string;
};

const n = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const touched = (set: Set<string>, key: keyof EstimateInput) => set.has(String(key));

export const categoryLabels: Record<EstimateInput["category"], string> = {
  "new-building": "New building",
  renovation: "Renovation",
  "structural-steel": "Structural steel / fabrication",
  finishes: "Finishes",
  furniture: "Furniture / joinery",
  "external-works": "External works",
  "mep-services": "MEP services",
};

export function completenessScore(input: EstimateInput, touchedFields: Set<string>) {
  let score = 50;
  if (touched(touchedFields, "location")) score += 3;
  if (touched(touchedFields, "finishLevel")) score += 3;

  if (input.category === "new-building") {
    if (touched(touchedFields, "buildingUse")) score += 3;
    if (n(input.totalFloorAreaM2) || n(input.footprintM2)) score += 8;
    else if (input.bedrooms || input.livingRooms || input.kitchens) score += 5;
    else if (n(input.landAreaM2)) score += 3;
    if (n(input.landAreaM2)) score += 3;
    if (touched(touchedFields, "floorsAboveGround")) score += 3;
    if (touched(touchedFields, "units")) score += 2;
    const accommodation = ["bedrooms", "bathrooms", "livingRooms", "kitchens", "familyLounges", "studies", "laundries", "bqRooms", "dining"].filter((key) => touchedFields.has(key)).length;
    score += Math.min(8, accommodation);
    const details = ["siteCondition", "foundationType", "frameType", "roofType", "roofComplexity", "windowSpec", "doorSpec", "facadeSpec", "floorFinish", "ceilingFinish", "kitchenSpec", "bathroomSpec", "electricalSpec", "acSpec", "waterSystem", "wasteSystem", "powerSystem", "includeSecurity", "includeFireSystem", "includeExternalWorks", "includeFurniture"].filter((key) => touchedFields.has(key)).length;
    score += Math.min(20, details * 2);
  } else if (input.category === "structural-steel") {
    if (touched(touchedFields, "steelStructureType")) score += 6;
    if (n(input.steelTonnes)) score += 14; else if (n(input.workAreaM2)) score += 8;
    if (n(input.steelSpanM)) score += 6;
    if (n(input.steelHeightM)) score += 5;
    if (n(input.steelBays)) score += 4;
    const details = ["steelCoating", "steelCladding", "steelErection", "craneRequired", "steelFoundations", "roofCladdingAreaM2", "wallCladdingAreaM2"].filter((key) => touchedFields.has(key)).length;
    score += Math.min(14, details * 2);
  } else if (input.category === "renovation") {
    if (n(input.workAreaM2)) score += 9;
    if (touched(touchedFields, "renovationUse")) score += 4;
    if (touched(touchedFields, "renovationIntensity")) score += 5;
    const quantityKeys = ["demolitionPercent", "floorReplacementPercent", "ceilingReplacementPercent", "paintingPercent", "bathroomRenovations", "kitchenRenovations", "electricalRewirePercent", "plumbingRenewalPercent", "windowReplacementCount", "doorReplacementCount", "acReplacementCount", "structuralAlteration"];
    score += Math.min(26, quantityKeys.filter((key) => touchedFields.has(key)).length * 3);
  } else if (input.category === "finishes") {
    if (n(input.workAreaM2)) score += 10;
    if (touched(touchedFields, "floorFinish")) score += 5;
    if (touched(touchedFields, "wallFinish")) score += 5;
    const quantityKeys = ["wallFinishAreaM2", "ceilingAreaM2", "wetWallTileAreaM2", "paintingAreaM2", "skirtingLengthM", "ceilingFinish"];
    score += Math.min(24, quantityKeys.filter((key) => touchedFields.has(key)).length * 4);
  } else if (input.category === "furniture") {
    if (n(input.workAreaM2)) score += 5;
    if (touched(touchedFields, "furnitureLevel")) score += 5;
    const quantityKeys = ["wardrobeLengthM", "kitchenCabinetLengthM", "tvUnits", "bedroomFurnitureSets", "livingFurnitureSets", "diningFurnitureSets", "officeWorkstations", "curtainAreaM2", "bathroomVanities"];
    score += Math.min(32, quantityKeys.filter((key) => n(Number(input[key as keyof EstimateInput])) || touchedFields.has(key)).length * 4);
  } else if (input.category === "external-works") {
    const quantityKeys = ["fenceLengthM", "gateCount", "pavingAreaM2", "drainageLengthM", "landscapingAreaM2", "gatehouseAreaM2", "poolAreaM2", "retainingWallAreaM2", "externalLightingPoints"];
    if (n(input.workAreaM2)) score += 5;
    score += Math.min(34, quantityKeys.filter((key) => n(Number(input[key as keyof EstimateInput])) || touchedFields.has(key)).length * 4);
  } else {
    if (n(input.workAreaM2)) score += 5;
    const quantityKeys = ["electricalPoints", "lightingPoints", "dataPoints", "mepBathrooms", "mepKitchens", "acUnits", "waterHeaters", "pumps", "generatorKva", "inverterKva", "solarKw", "securityPoints", "firePoints", "mepLifts", "includeBorehole", "includeWaterTreatment", "includeSeptic", "includeTreatmentPlant"];
    score += Math.min(36, quantityKeys.filter((key) => touchedFields.has(key) && Boolean(input[key as keyof EstimateInput])).length * 3);
    if (touched(touchedFields, "acSpec")) score += 4;
  }
  return clamp(Math.round(score), 50, 100);
}

export function levelFromScore(score: number) {
  return score >= 92 ? "High-detail" : score >= 80 ? "Detailed" : "Quick";
}

export function validateEstimateInput(input: EstimateInput): string[] {
  const issues: string[] = [];
  if (!input.location.trim()) issues.push("Enter the project city/state so the location allowance can be applied.");
  if (input.category === "new-building") {
    const hasSize = n(input.totalFloorAreaM2) || n(input.footprintM2) || n(input.landAreaM2) || input.bedrooms || input.livingRooms || input.kitchens;
    if (!hasSize) issues.push("Enter a floor area, footprint, land area or accommodation so the building size can be inferred.");
  } else if (input.category === "structural-steel") {
    if (!n(input.steelTonnes) && !n(input.workAreaM2)) issues.push("Enter either known steel tonnage or an approximate covered/work area.");
  } else if (input.category === "furniture") {
    const qty = n(input.wardrobeLengthM) + n(input.kitchenCabinetLengthM) + n(input.tvUnits) + n(input.bedroomFurnitureSets) + n(input.livingFurnitureSets) + n(input.diningFurnitureSets) + n(input.officeWorkstations) + n(input.curtainAreaM2) + n(input.bathroomVanities);
    if (!qty && !n(input.workAreaM2)) issues.push("Enter at least one furniture/joinery quantity or an approximate furnished area.");
  } else if (input.category === "external-works") {
    const qty = n(input.fenceLengthM) + n(input.gateCount) + n(input.pavingAreaM2) + n(input.drainageLengthM) + n(input.landscapingAreaM2) + n(input.gatehouseAreaM2) + n(input.poolAreaM2) + n(input.retainingWallAreaM2) + n(input.externalLightingPoints);
    if (!qty && !n(input.workAreaM2)) issues.push("Enter at least one external-work quantity or a temporary general work area.");
  } else if (input.category === "mep-services") {
    const qty = n(input.electricalPoints) + n(input.lightingPoints) + n(input.dataPoints) + n(input.mepBathrooms) + n(input.mepKitchens) + n(input.acUnits) + n(input.waterHeaters) + n(input.pumps) + n(input.generatorKva) + n(input.inverterKva) + n(input.solarKw) + n(input.securityPoints) + n(input.firePoints) + n(input.mepLifts) + Number(input.includeBorehole) + Number(input.includeWaterTreatment) + Number(input.includeSeptic) + Number(input.includeTreatmentPlant);
    if (!qty && !n(input.workAreaM2)) issues.push("Enter service points/equipment quantities or an approximate serviced area.");
  } else if (!n(input.workAreaM2)) {
    issues.push("Enter the approximate work area.");
  }
  return issues;
}

function withSpec(input: EstimateInput, level: SpecLevel): EstimateInput {
  const next: EstimateInput = { ...input, finishLevel: level };
  if (input.category === "furniture") next.furnitureLevel = level === "economy" ? "essential" : level === "upper-mid" ? "premium" : level === "premium" || level === "luxury" ? "premium" : "standard";
  return next;
}

export function buildComparisons(input: EstimateInput): ComparisonOption[] {
  const levels: Array<{ id: SpecLevel; label: string; note: string }> = [
    { id: "economy", label: "Economy", note: "Functional, cost-conscious specification" },
    { id: "standard", label: "Standard", note: "Balanced mid-market specification" },
    { id: "premium", label: "Premium", note: "Higher specification and brand allowance" },
  ];
  return levels.map((item) => {
    const next = withSpec(input, item.id);
    return { id: item.id, label: item.label, note: item.note, input: next, result: calculateEstimateV2(next) };
  });
}

function saving(input: EstimateInput, current: EstimateResult, id: string, label: string, note: string, patch: Partial<EstimateInput>): SavingOption | null {
  const next = { ...input, ...patch } as EstimateInput;
  const alt = calculateEstimateV2(next);
  const savingMid = current.midpoint - alt.midpoint;
  if (savingMid <= Math.max(50_000, current.midpoint * 0.005)) return null;
  return { id, label, note, savingLow: Math.max(0, current.low - alt.low), savingHigh: Math.max(0, current.high - alt.high), savingMid, input: next };
}

export function buildSavingOptions(input: EstimateInput, result = calculateEstimateV2(input)): SavingOption[] {
  const options: Array<SavingOption | null> = [];
  const stepDown: Record<SpecLevel, SpecLevel | null> = { economy: null, standard: "economy", "upper-mid": "standard", premium: "upper-mid", luxury: "premium" };
  const lower = stepDown[input.finishLevel];
  if (lower) options.push(saving(input, result, "spec", `Move overall specification to ${lower.replace("-", " ")}`, "Keeps the same broad scope but reduces material/brand allowances. Review individual finishes before adopting.", { finishLevel: lower }));

  if (input.category === "new-building") {
    if (["granite", "marble", "timber"].includes(input.floorFinish)) options.push(saving(input, result, "floor", "Use good porcelain flooring in general areas", "Value-engineering option; retain premium finishes only in focal spaces if desired.", { floorFinish: "porcelain" }));
    if (["premium-aluminium", "double-glazed", "curtain-wall"].includes(input.windowSpec)) options.push(saving(input, result, "windows", "Review glazing/window specification", "Standard aluminium can reduce cost where premium glazing is not required by performance or design.", { windowSpec: "standard-aluminium" }));
    if (["vrf", "central", "cassette"].includes(input.acSpec)) options.push(saving(input, result, "ac", "Compare split AC with the selected cooling system", "Use only where split systems meet the building's operational and architectural requirements.", { acSpec: "split" }));
    if (input.includeFurniture) options.push(saving(input, result, "furniture", "Phase loose furniture / FF&E", "Construction can be completed first and some loose furniture procured later.", { includeFurniture: false }));
    if (input.includePool) options.push(saving(input, result, "pool", "Defer the swimming pool", "A scope-deferral option rather than a like-for-like specification change.", { includePool: false }));
  } else if (input.category === "finishes") {
    if (["granite", "marble", "timber"].includes(input.floorFinish)) options.push(saving(input, result, "floor", "Switch general flooring to porcelain", "Retain feature stone/timber only where it has the most visual value.", { floorFinish: "porcelain" }));
    if (["stone", "panel", "wallpaper"].includes(input.wallFinish)) options.push(saving(input, result, "walls", "Use painted walls for more areas", "Keep feature cladding/panelling on selected walls rather than throughout.", { wallFinish: "paint" }));
    if (input.ceilingFinish === "decorative") options.push(saving(input, result, "ceiling", "Use standard gypsum/POP ceiling", "Keep decorative ceiling work only in feature spaces.", { ceilingFinish: "gypsum-pop" }));
  } else if (input.category === "furniture") {
    const lowerFurniture = input.furnitureLevel === "luxury" ? "premium" : input.furnitureLevel === "premium" ? "standard" : input.furnitureLevel === "standard" ? "essential" : null;
    if (lowerFurniture) options.push(saving(input, result, "furniture-level", `Move furniture level to ${lowerFurniture}`, "Reduces material, hardware, upholstery and imported-component allowances.", { furnitureLevel: lowerFurniture }));
  } else if (input.category === "external-works") {
    if (n(input.landscapingAreaM2)) options.push(saving(input, result, "landscape", "Phase non-essential landscaping", "Complete drainage/access first and phase decorative landscaping later.", { landscapingAreaM2: 0 }));
    if (n(input.poolAreaM2)) options.push(saving(input, result, "pool", "Defer swimming pool works", "Scope deferral; reserve services/space if the pool is planned for a later phase.", { poolAreaM2: 0 }));
    if (n(input.externalLightingPoints)) options.push(saving(input, result, "lighting", "Review decorative external lighting quantity", "Keep safety/security lighting and reduce purely decorative fixtures where appropriate.", { externalLightingPoints: Math.ceil(input.externalLightingPoints * 0.6) }));
  } else if (input.category === "renovation") {
    if (n(input.windowReplacementCount)) options.push(saving(input, result, "windows", "Retain serviceable windows where possible", "Only applicable after condition inspection confirms existing windows can be retained.", { windowReplacementCount: 0 }));
    if (n(input.acReplacementCount)) options.push(saving(input, result, "ac", "Retain serviceable AC units where possible", "Condition-test existing units before deciding what genuinely requires replacement.", { acReplacementCount: 0 }));
  } else if (input.category === "mep-services") {
    if (["vrf", "central", "cassette"].includes(input.acSpec) && n(input.acUnits)) options.push(saving(input, result, "ac", "Compare split AC for suitable zones", "Use only where split systems satisfy cooling load, aesthetics, maintenance and operational needs.", { acSpec: "split" }));
    if (n(input.solarKw)) options.push(saving(input, result, "solar", "Phase part of the solar PV capacity", "Maintain critical backup capacity and add PV modules in a later phase if budget is constrained.", { solarKw: Math.max(0, input.solarKw * 0.5) }));
  } else if (input.category === "structural-steel") {
    if (input.steelCladding) options.push(saving(input, result, "cladding", "Separate structural steel from cladding procurement", "Scope-deferral/comparison option only; the building still needs the required envelope before use.", { steelCladding: false }));
    if (input.steelErection) options.push(saving(input, result, "erection", "Compare fabrication-only procurement", "Useful only when erection is genuinely being procured under a separate competent contractor; do not omit required erection resources.", { steelErection: false, craneRequired: false }));
  }
  return options.filter((item): item is SavingOption => Boolean(item)).sort((a, b) => b.savingMid - a.savingMid);
}

export function savingsPlanForTarget(options: SavingOption[], result: EstimateResult, targetPercent: number) {
  const target = result.midpoint * clamp(targetPercent, 1, 30) / 100;
  const selected: SavingOption[] = [];
  let cumulative = 0;
  for (const option of options) {
    if (cumulative >= target) break;
    selected.push(option);
    cumulative += option.savingMid;
  }
  return { target, cumulative, selected, achieved: cumulative >= target };
}

export function estimateDuration(input: EstimateInput, result: EstimateResult) {
  let lowWeeks = 0;
  let highWeeks = 0;
  if (input.category === "new-building") {
    const area = Math.max(60, result.basisQuantity);
    const floors = Math.max(1, 1 + Math.round(input.floorsAboveGround || 0));
    const complexity = input.roofComplexity === "complex" ? 4 : input.roofComplexity === "moderate" ? 2 : 0;
    lowWeeks = 10 + area / 12 + (floors - 1) * 5 + complexity;
    highWeeks = lowWeeks * 1.35 + 5;
  } else if (input.category === "renovation") {
    const factor = { light: 0, moderate: 3, major: 7, "full-strip": 11 }[input.renovationIntensity];
    lowWeeks = 3 + Math.max(1, input.workAreaM2) / 35 + factor;
    highWeeks = lowWeeks * 1.45 + 2;
  } else if (input.category === "structural-steel") {
    lowWeeks = 3 + Math.max(1, result.basisQuantity) / 2.3 + (input.steelErection ? 2 : 0) + (input.steelCladding ? 2 : 0);
    highWeeks = lowWeeks * 1.45 + 2;
  } else if (input.category === "finishes") {
    lowWeeks = 2 + Math.max(1, input.workAreaM2) / 55;
    highWeeks = lowWeeks * 1.5 + 2;
  } else if (input.category === "furniture") {
    lowWeeks = 3 + result.sections.length * 0.8;
    highWeeks = lowWeeks * 1.6 + 2;
  } else if (input.category === "external-works") {
    lowWeeks = 3 + result.sections.length * 0.9 + Math.max(0, input.pavingAreaM2) / 180;
    highWeeks = lowWeeks * 1.45 + 2;
  } else {
    lowWeeks = 3 + Math.max(1, input.workAreaM2) / 70 + result.sections.length * 0.7;
    highWeeks = lowWeeks * 1.5 + 2;
  }
  return {
    lowWeeks: Math.max(2, Math.round(lowWeeks)),
    highWeeks: Math.max(3, Math.round(highWeeks)),
    note: "Planning duration assumes normal access, funding continuity and procurement. Statutory approvals, design lead time, imported-item lead time and unusual site constraints can extend it.",
  };
}

const cashProfiles: Record<EstimateInput["category"], Array<[string, number]>> = {
  "new-building": [["Mobilisation & site setup", 0.07], ["Substructure / foundation", 0.17], ["Structure & walls", 0.22], ["Roof, openings & weather-tight shell", 0.13], ["MEP first/second fix", 0.15], ["Finishes, joinery & completion", 0.19], ["External works / handover reserve", 0.07]],
  renovation: [["Mobilisation, protection & strip-out", 0.18], ["Builders work / service alterations", 0.25], ["Replacement finishes & installations", 0.37], ["Testing, snagging & handover", 0.20]],
  "structural-steel": [["Design confirmation, procurement & mobilisation", 0.22], ["Steel material procurement", 0.38], ["Fabrication / coating", 0.24], ["Transport, erection & completion", 0.16]],
  finishes: [["Materials procurement & protection", 0.28], ["Substrate preparation", 0.17], ["Main finish installation", 0.40], ["Making good & completion", 0.15]],
  furniture: [["Shop drawings / selections & deposit", 0.28], ["Material procurement", 0.32], ["Fabrication / production", 0.25], ["Delivery, installation & snagging", 0.15]],
  "external-works": [["Setting out, earthworks & mobilisation", 0.20], ["Drainage / sub-bases / foundations", 0.28], ["Main external works", 0.37], ["Landscaping, lighting & completion", 0.15]],
  "mep-services": [["Design coordination & first procurement", 0.18], ["Containment / pipework / first fix", 0.27], ["Equipment & second fix", 0.38], ["Testing, commissioning & handover", 0.17]],
};

export function buildCashFlow(input: EstimateInput, result: EstimateResult): CashFlowPhase[] {
  return cashProfiles[input.category].map(([label, share], index) => ({ id: `phase-${index + 1}`, label, share, low: result.low * share, high: result.high * share, midpoint: result.midpoint * share }));
}

export function marketSensitivity(result: EstimateResult) {
  return [0, 5, 10, 15].map((percent) => ({ percent, low: result.low * (1 + percent / 100), high: result.high * (1 + percent / 100), midpoint: result.midpoint * (1 + percent / 100) }));
}

export function landFeasibility(input: EstimateInput, result: EstimateResult): LandFeasibility | null {
  if (input.category !== "new-building" || !n(input.landAreaM2)) return null;
  const floors = Math.max(1, 1 + Math.round(input.floorsAboveGround || 0));
  const footprint = n(input.footprintM2) || (n(input.totalFloorAreaM2) ? input.totalFloorAreaM2 / floors : result.basisQuantity / floors);
  const coverage = footprint / input.landAreaM2 * 100;
  const openArea = Math.max(0, input.landAreaM2 - footprint);
  const status = coverage <= 45 ? "Comfortable" : coverage <= 60 ? "Tight" : "Constrained";
  const notes: string[] = [];
  if (coverage > 60) notes.push("The building footprint occupies more than 60% of the plot; setbacks, access, drainage, parking and utility space may be difficult.");
  else if (coverage > 45) notes.push("The plot may work, but parking, setbacks, drainage and utility infrastructure need careful layout.");
  else notes.push("The preliminary footprint leaves a comparatively healthy amount of open site area before statutory setback checks.");
  if (input.includeExternalWorks && openArea < footprint * 0.45) notes.push("External works have been selected but the remaining open area is relatively limited.");
  if (input.includePool && openArea < 90) notes.push("A pool is selected with limited remaining open area; confirm the actual site layout.");
  notes.push("This is not a planning-approval or statutory setback check. Local development-control requirements still govern buildable area.");
  return { coveragePercent: coverage, openAreaM2: openArea, status, notes };
}

export function sanityChecks(input: EstimateInput, result: EstimateResult): SanityCheck[] {
  const checks: SanityCheck[] = [];
  if (input.category === "new-building") {
    const floors = Math.max(1, 1 + Math.round(input.floorsAboveGround || 0));
    const minRoomArea = (input.bedrooms * 12 + input.bathrooms * 3.5 + input.livingRooms * 20 + input.kitchens * 10 + input.familyLounges * 14 + input.studies * 9 + input.laundries * 5 + input.bqRooms * 10) * 1.18;
    const area = n(input.totalFloorAreaM2) || n(input.footprintM2) * floors;
    if (area && minRoomArea && area < minRoomArea * 0.82) checks.push({ severity: "warning", message: "The entered floor area looks tight for the accommodation entered. Recheck the area or room counts." });
    if (n(input.landAreaM2) && n(input.footprintM2) > input.landAreaM2) checks.push({ severity: "critical", message: "The entered building footprint is larger than the land area." });
    if (input.floorsAboveGround > 0 && input.staircases === 0 && input.lifts === 0) checks.push({ severity: "warning", message: "Upper floors are selected but no staircase/lift count has been entered. Add vertical circulation in More details." });
  }
  if (input.category === "structural-steel") {
    if (!n(input.steelTonnes) && !n(input.steelSpanM)) checks.push({ severity: "warning", message: "Steel tonnage is unknown and clear span is blank, so inferred steel intensity remains broad." });
    if (n(input.steelTonnes) && n(input.workAreaM2)) {
      const intensity = input.steelTonnes * 1000 / input.workAreaM2;
      if (intensity < 10 || intensity > 220) checks.push({ severity: "warning", message: `The entered steel quantity implies about ${Math.round(intensity)} kg/m². Confirm that the tonnage and area refer to the same scope.` });
    }
  }
  if (input.category === "mep-services" && n(input.acUnits) && input.acSpec === "none") checks.push({ severity: "critical", message: "AC units are entered but the AC system is set to None." });
  if (input.category === "external-works" && n(input.fenceLengthM) && n(input.landAreaM2)) {
    const squarePerimeter = 4 * Math.sqrt(input.landAreaM2);
    if (input.fenceLengthM > squarePerimeter * 2.2) checks.push({ severity: "warning", message: "The entered fence length is unusually high relative to the land area. Confirm the plot geometry/perimeter." });
  }
  if (result.high > result.low * 2.4) checks.push({ severity: "info", message: "The estimate range is wide. More measured quantities or specification detail would materially improve the planning range." });
  if (!checks.length) checks.push({ severity: "info", message: "No obvious input contradictions were detected. The result still remains a planning estimate until drawings, measurements and current quotations are reviewed." });
  return checks;
}

export function sectionConfidence(input: EstimateInput, result: EstimateResult): SectionConfidence[] {
  return result.sections.map((section) => {
    let level: ConfidenceLevel = "Medium";
    let reason = "The element uses project-specific scope plus planning benchmark rates.";
    if (input.category === "structural-steel") {
      if (n(input.steelTonnes)) { level = "Higher"; reason = "Actual steel tonnage was supplied; commercial rates and connection details remain to be confirmed."; }
      else if (n(input.steelSpanM) && n(input.steelHeightM)) { level = "Medium"; reason = "Steel weight is inferred from structure type and geometry rather than a member schedule."; }
      else { level = "Lower"; reason = "Steel quantity is inferred mainly from area and broad intensity."; }
    } else if (input.category === "new-building") {
      if (["substructure", "frame"].includes(section.id) && input.foundationType === "recommend") { level = "Lower"; reason = "Foundation/structural quantities are still assumption-led until design and soil information are available."; }
      else if (section.id === "mep" && input.electricalSpec === "standard" && input.acSpec === "provision") { level = "Medium"; reason = "Services use a planning specification rather than measured points/equipment schedules."; }
      else level = "Medium";
    } else if (["allowance", "site"].includes(section.id)) { level = "Lower"; reason = "This section is an area-based placeholder because measured quantities were not supplied."; }
    else if (section.explanation.match(/\d/)) { level = "Higher"; reason = "A measured percentage, count, area, length or equipment capacity is explicitly driving this section."; }
    return { id: section.id, label: section.label, level, reason };
  });
}

export function inclusionsAndExclusions(input: EstimateInput, result: EstimateResult) {
  const included = result.sections.map((section) => section.label);
  const excluded: string[] = [];
  if (input.category === "new-building") {
    if (!input.includeFurniture) excluded.push("Loose furniture / FF&E unless specifically included elsewhere");
    if (!input.includeExternalWorks) excluded.push("General external works beyond basic building allowances");
    if (!input.includePool) excluded.push("Swimming pool");
    if (input.acSpec === "none" || input.acSpec === "provision") excluded.push(input.acSpec === "none" ? "Air-conditioning system" : "AC equipment beyond provision/pipework allowance");
    excluded.push("Professional/statutory fees unless explicitly included in a formal proposal", "Land acquisition and finance costs");
  } else if (input.category === "structural-steel") {
    if (!input.steelCladding) excluded.push("Roof/wall cladding");
    if (!input.steelErection) excluded.push("Site erection");
    if (!input.steelFoundations) excluded.push("Concrete foundations / base support works");
    if (!input.craneRequired) excluded.push("Dedicated crane/heavy-lifting allowance");
  } else if (input.category === "renovation") excluded.push("Hidden defects/concealed-condition discoveries not visible before opening up", "Unselected replacement items");
  else if (input.category === "finishes") excluded.push("Structural alterations", "MEP replacement unless separately estimated", "Loose furniture/FF&E");
  else if (input.category === "furniture") excluded.push("Building/structural works", "MEP works", "Unlisted appliances/equipment");
  else if (input.category === "external-works") excluded.push("Main building works", "Utility authority charges", "Unmeasured specialist civil works");
  else excluded.push("Builders work/civil alterations unless specifically included", "Utility authority connection charges", "Specialist systems not entered in the questionnaire");
  return { included, excluded };
}

function solveBuildingArea(input: EstimateInput, budget: number, highSide: boolean) {
  let low = 25;
  let high = 5000;
  for (let i = 0; i < 28; i += 1) {
    const mid = (low + high) / 2;
    const result = calculateEstimateV2({ ...input, totalFloorAreaM2: mid, footprintM2: 0 });
    const cost = highSide ? result.high : result.low;
    if (cost <= budget) low = mid; else high = mid;
  }
  return low;
}

export function checkBudget(input: EstimateInput, result: EstimateResult, budget: number): BudgetCheck | null {
  if (!Number.isFinite(budget) || budget <= 0) return null;
  const status = budget < result.low ? "Below planning range" : budget <= result.high ? "Within planning range" : "Above planning range";
  const base: BudgetCheck = { budget, status, gapToLow: budget - result.low, gapToMid: budget - result.midpoint, gapToHigh: budget - result.high };
  if (input.category === "new-building") {
    base.indicativeCapacityLow = solveBuildingArea(input, budget, true);
    base.indicativeCapacityHigh = solveBuildingArea(input, budget, false);
    base.capacityUnit = "m²";
    base.capacityLabel = "Indicative total floor area supported by this budget at the current specification";
  } else if (result.basisQuantity > 0 && result.midpoint > 0) {
    const costPerBasis = result.midpoint / result.basisQuantity;
    base.indicativeCapacityLow = budget / (costPerBasis * 1.15);
    base.indicativeCapacityHigh = budget / (costPerBasis * 0.85);
    base.capacityUnit = result.basisUnit;
    base.capacityLabel = "Indicative scope capacity if the current mix of work remains broadly similar";
  }
  return base;
}

export function buildContactSummary(input: EstimateInput, result: EstimateResult, score: number) {
  const parts = [
    `Estimator enquiry: ${categoryLabels[input.category]}`,
    `Location: ${input.location || "Not supplied"}`,
    `Specification: ${input.finishLevel.replace("-", " ")}`,
    `Planning range: NGN ${Math.round(result.low).toLocaleString()} - NGN ${Math.round(result.high).toLocaleString()}`,
    `Likely planning figure: NGN ${Math.round(result.midpoint).toLocaleString()}`,
    `Estimate detail/completeness: ${score}%`,
    `Cost basis: ${Number(result.basisQuantity.toFixed(1))} ${result.basisUnit} - ${result.basisLabel}`,
  ];
  if (input.category === "new-building") parts.push(`Building: ${input.buildingUse}; ${input.bedrooms} bedroom(s); ${input.bathrooms} bathroom/WC(s); ${1 + input.floorsAboveGround} floor level(s); land ${input.landAreaM2 || "unknown"} m².`);
  if (input.category === "structural-steel") parts.push(`Steel scope: ${input.steelStructureType}; ${input.steelTonnes || "unknown"} t entered; span ${input.steelSpanM || "unknown"} m; height ${input.steelHeightM || "unknown"} m.`);
  if (input.category === "renovation") parts.push(`Renovation: ${input.renovationUse}; ${input.renovationIntensity} intensity; work area ${input.workAreaM2 || "unknown"} m².`);
  if (input.category === "mep-services") parts.push(`MEP: ${input.electricalPoints} power points; ${input.lightingPoints} lighting points; ${input.mepBathrooms} bathroom groups; ${input.acUnits} AC unit/zone(s).`);
  return parts.join("\n");
}
