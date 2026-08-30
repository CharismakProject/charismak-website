import type { FinishLevel, ProjectScope, ProjectType } from "./models";

export type GuidedEstimateSection = {
  id: string;
  label: string;
  low: number;
  high: number;
  explanation: string;
};

export type GuidedEstimateResult = {
  basisLabel: string;
  basisQuantity: number;
  basisUnit: string;
  low: number;
  high: number;
  midpoint: number;
  sections: GuidedEstimateSection[];
  assumptions: string[];
  confidence: "rough" | "detailed";
};

const buildingRates: Record<FinishLevel, [number, number]> = {
  basic: [260_000, 340_000],
  standard: [350_000, 500_000],
  premium: [520_000, 780_000],
};

const projectRates: Record<Exclude<ProjectType, "new-building" | "fence-boundary">, Record<FinishLevel, [number, number]>> = {
  renovation: { basic: [90_000, 160_000], standard: [170_000, 280_000], premium: [300_000, 500_000] },
  "external-works": { basic: [35_000, 70_000], standard: [75_000, 140_000], premium: [150_000, 260_000] },
  "civil-infrastructure": { basic: [55_000, 110_000], standard: [120_000, 220_000], premium: [240_000, 420_000] },
  "structural-steel": { basic: [1_900_000, 2_500_000], standard: [2_600_000, 3_400_000], premium: [3_500_000, 4_700_000] },
  "mep-services": { basic: [45_000, 85_000], standard: [90_000, 170_000], premium: [180_000, 320_000] },
  "specialist-work": { basic: [60_000, 120_000], standard: [130_000, 240_000], premium: [250_000, 450_000] },
};

const buildingSections = [
  ["substructure", "Foundation & ground works", 0.13, "Excavation, filling, foundations and ground-floor construction."],
  ["frame", "Concrete, reinforcement & frame", 0.22, "Structural concrete, reinforcement, formwork and load-bearing elements."],
  ["walls", "Walls & partitions", 0.1, "External walls, internal partitions, lintels and associated mortar."],
  ["roof", "Roof", 0.09, "Roof structure, covering, flashings, fascia, gutters and rainwater disposal."],
  ["openings", "Doors, windows & joinery", 0.08, "Doors, windows, locks, glazing and basic fitted joinery allowances."],
  ["finishes", "Finishes", 0.22, "Plaster, screed, ceilings, tiles, painting and other finishes."],
  ["mep", "Electrical & plumbing", 0.16, "Electrical points, plumbing pipework, sanitary fittings and testing."],
] as const;

const genericSections = [
  ["materials", "Materials", 0.52, "Main materials and consumables required for the selected work."],
  ["labour", "Labour", 0.24, "Artisan, skilled and supporting labour allowances."],
  ["plant", "Plant, tools & logistics", 0.12, "Equipment, transport, delivery, handling and small tools."],
  ["completion", "Testing, finishing & completion", 0.12, "Finishing, testing, making good and handover allowances."],
] as const;

const positive = (value?: number | null) => Number.isFinite(value) && (value ?? 0) > 0 ? Number(value) : 0;

export function calculateGuidedEstimate(projectType: ProjectType, scope: ProjectScope): GuidedEstimateResult {
  const finish = scope.finishLevel ?? "standard";
  const floors = Math.max(1, scope.floors ?? 1);
  const footprint = positive(scope.floorAreaM2) || positive(scope.buildingLengthM) * positive(scope.buildingWidthM);
  const totalFloorArea = footprint > 0 ? footprint * floors : 0;
  const isBuilding = projectType === "new-building";
  const isSteel = projectType === "structural-steel";
  const basisQuantity = isSteel ? positive(scope.steelWeightTonnes) : totalFloorArea;
  const basisUnit = isSteel ? "tonne" : "m²";
  const rates = isBuilding ? buildingRates[finish] : projectType === "fence-boundary" ? [0, 0] as [number, number] : projectRates[projectType][finish];
  const baseLow = basisQuantity * rates[0];
  const baseHigh = basisQuantity * rates[1];
  const prelimPercent = scope.preliminariesMode === "none" ? 0 : Math.max(0, scope.preliminariesPercent ?? 5);
  const prelimLow = baseLow * prelimPercent / 100;
  const prelimHigh = baseHigh * prelimPercent / 100;
  const landArea = positive(scope.landAreaM2) || positive(scope.landLengthM) * positive(scope.landWidthM);
  const openArea = Math.max(0, landArea - footprint);
  const externalLow = !isSteel && scope.includeExternalWorks ? openArea * 25_000 : 0;
  const externalHigh = !isSteel && scope.includeExternalWorks ? openArea * 65_000 : 0;
  const coreSections = (isBuilding ? buildingSections : genericSections).map(([id, label, share, explanation]) => ({
    id,
    label,
    low: baseLow * share,
    high: baseHigh * share,
    explanation,
  }));
  const sections: GuidedEstimateSection[] = [
    ...coreSections,
    ...(prelimPercent && basisQuantity > 0 ? [{ id: "preliminaries", label: "Project preliminaries", low: prelimLow, high: prelimHigh, explanation: `Optional ${prelimPercent}% allowance for project setup, supervision and general requirements.` }] : []),
    ...(!isSteel && scope.includeExternalWorks && openArea ? [{ id: "external", label: "External works allowance", low: externalLow, high: externalHigh, explanation: `Planning allowance for approximately ${Math.round(openArea)} m² of remaining open land.` }] : []),
  ];
  const low = sections.reduce((sum, section) => sum + section.low, 0);
  const high = sections.reduce((sum, section) => sum + section.high, 0);
  const suppliedBasis = isSteel
    ? positive(scope.steelWeightTonnes) > 0
    : positive(scope.floorAreaM2) > 0 || (positive(scope.buildingLengthM) > 0 && positive(scope.buildingWidthM) > 0);
  return {
    basisLabel: isSteel ? "Approximate steel quantity" : "Total estimated floor area",
    basisQuantity,
    basisUnit,
    low,
    high,
    midpoint: (low + high) / 2,
    sections,
    confidence: suppliedBasis ? "detailed" : "rough",
    assumptions: [
      `Starter ${finish} specification benchmark for ${projectType.replace(/-/g, " ")}.`,
      ...(isSteel && !basisQuantity ? ["Enter an approximate structural steel tonnage before using this planning estimate."] : []),
      "Rates are planning references and must be checked against current prices at the project location.",
      "Final cost will change with drawings, structural design, specification, site condition and procurement decisions.",
      ...(scope.assumptions ?? []),
    ],
  };
}

export type PublicEstimateCategory =
  | "new-building"
  | "renovation"
  | "structural-steel"
  | "finishes"
  | "furniture"
  | "external-works"
  | "mep-services";

export type BuildingUse =
  | "residential"
  | "apartments"
  | "commercial"
  | "hotel"
  | "school"
  | "healthcare"
  | "warehouse"
  | "industrial"
  | "religious"
  | "mixed-use";

export type PublicFinishLevel = "economy" | "standard" | "upper-mid" | "premium" | "luxury";

export type PublicEstimateInput = {
  category: PublicEstimateCategory;
  buildingUse: BuildingUse;
  location: string;
  landAreaM2: number;
  footprintM2: number;
  totalFloorAreaM2: number;
  floorsAboveGround: number;
  units: number;
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  dining: "none" | "combined" | "separate";
  kitchens: number;
  familyLounges: number;
  studies: number;
  laundries: number;
  bqRooms: number;
  balconies: number;
  staircases: number;
  lifts: number;
  finishLevel: PublicFinishLevel;
  siteCondition: "good" | "normal" | "weak" | "waterlogged" | "unknown";
  foundationType: "recommend" | "strip-pad" | "raft" | "pile";
  frameType: "recommend" | "masonry" | "reinforced-concrete" | "steel" | "composite";
  roofType: "pitched-aluminium" | "stone-coated" | "flat-concrete" | "steel-roof" | "combination";
  roofComplexity: "simple" | "moderate" | "complex";
  windowSpec: "standard-aluminium" | "premium-aluminium" | "upvc" | "double-glazed" | "curtain-wall";
  doorSpec: "basic" | "standard" | "premium" | "security-premium";
  facadeSpec: "paint-render" | "mixed-cladding" | "stone-tile" | "alucobond" | "curtain-wall";
  floorFinish: "screed" | "ceramic" | "porcelain" | "granite" | "marble" | "vinyl" | "timber" | "epoxy";
  ceilingFinish: "none" | "pvc" | "gypsum-pop" | "suspended" | "decorative";
  kitchenSpec: "basic" | "standard" | "premium" | "luxury";
  bathroomSpec: "basic" | "standard" | "premium" | "luxury";
  electricalSpec: "basic" | "standard" | "high";
  acSpec: "none" | "provision" | "split" | "cassette" | "vrf" | "central";
  waterSystem: "basic" | "borehole" | "borehole-treatment" | "enhanced-storage";
  wasteSystem: "public-sewer" | "septic" | "treatment-plant";
  powerSystem: "grid" | "generator" | "inverter" | "solar" | "hybrid";
  includeSecurity: boolean;
  includeFireSystem: boolean;
  includeExternalWorks: boolean;
  includeFence: boolean;
  includeGatehouse: boolean;
  includePaving: boolean;
  includeDrainage: boolean;
  includeLandscaping: boolean;
  includePool: boolean;
  includeFurniture: boolean;
  furnitureLevel: "essential" | "standard" | "premium" | "luxury";
  includeWardrobes: boolean;
  includeKitchenJoinery: boolean;
  workAreaM2: number;
  steelTonnes: number;
  steelSpanM: number;
  steelHeightM: number;
  steelBays: number;
  steelCladding: boolean;
  steelErection: boolean;
  craneRequired: boolean;
  renovationIntensity: "light" | "moderate" | "major" | "full-strip";
  detailedMode: boolean;
};

export type PublicEstimateResult = {
  low: number;
  high: number;
  midpoint: number;
  basisQuantity: number;
  basisLabel: string;
  sections: GuidedEstimateSection[];
  detailScore: number;
  estimateLevel: "Quick" | "Detailed" | "High-detail";
  costDrivers: string[];
  assumptions: string[];
};

const buildingUseRates: Record<BuildingUse, [number, number]> = {
  residential: [300_000, 430_000],
  apartments: [330_000, 470_000],
  commercial: [350_000, 520_000],
  hotel: [430_000, 660_000],
  school: [280_000, 420_000],
  healthcare: [460_000, 720_000],
  warehouse: [230_000, 360_000],
  industrial: [300_000, 480_000],
  religious: [300_000, 450_000],
  "mixed-use": [370_000, 560_000],
};

const finishFactors: Record<PublicFinishLevel, number> = {
  economy: 0.82,
  standard: 1,
  "upper-mid": 1.16,
  premium: 1.36,
  luxury: 1.68,
};

const finishGenericRates: Record<PublicFinishLevel, [number, number]> = {
  economy: [65_000, 110_000],
  standard: [110_000, 180_000],
  "upper-mid": [170_000, 260_000],
  premium: [250_000, 390_000],
  luxury: [380_000, 650_000],
};

const furnitureRates: Record<PublicEstimateInput["furnitureLevel"], [number, number]> = {
  essential: [55_000, 95_000],
  standard: [95_000, 165_000],
  premium: [170_000, 300_000],
  luxury: [300_000, 600_000],
};

const numberValue = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function locationFactor(location: string) {
  const value = location.toLowerCase();
  if (value.includes("lekki") || value.includes("ikoyi") || value.includes("victoria island")) return 1.22;
  if (value.includes("lagos")) return 1.14;
  if (value.includes("abuja") || value.includes("fct")) return 1.08;
  if (value.includes("port harcourt") || value.includes("rivers")) return 1.1;
  if (value.includes("kano") || value.includes("kaduna")) return 0.96;
  if (value.includes("ibadan") || value.includes("oyo")) return 0.94;
  if (value.includes("akure") || value.includes("ondo") || value.includes("ekiti")) return 0.92;
  return 1;
}

function inferRoomArea(input: PublicEstimateInput) {
  const roomNet =
    input.bedrooms * 17 +
    input.bathrooms * 5.2 +
    input.livingRooms * 28 +
    (input.dining === "separate" ? 16 : input.dining === "combined" ? 8 : 0) +
    input.kitchens * 15 +
    input.familyLounges * 20 +
    input.studies * 12 +
    input.laundries * 8 +
    input.bqRooms * 14 +
    input.balconies * 8 +
    input.staircases * 10 +
    input.lifts * 7;
  return roomNet > 0 ? roomNet * 1.28 : 0;
}

function buildingArea(input: PublicEstimateInput) {
  if (numberValue(input.totalFloorAreaM2)) return input.totalFloorAreaM2;
  const totalFloors = Math.max(1, 1 + Math.round(input.floorsAboveGround || 0));
  if (numberValue(input.footprintM2)) return input.footprintM2 * totalFloors;
  const roomArea = inferRoomArea(input);
  if (roomArea) return roomArea;
  if (numberValue(input.landAreaM2)) return input.landAreaM2 * 0.35 * totalFloors;
  return 150 * totalFloors;
}

function section(id: string, label: string, baseLow: number, baseHigh: number, share: number, multiplier: number, explanation: string): GuidedEstimateSection {
  return { id, label, low: baseLow * share * multiplier, high: baseHigh * share * multiplier, explanation };
}

function genericPublicEstimate(input: PublicEstimateInput): PublicEstimateResult {
  const quantity = Math.max(1, numberValue(input.workAreaM2) || numberValue(input.totalFloorAreaM2) || numberValue(input.footprintM2) || 100);
  const loc = locationFactor(input.location);
  const finish = input.finishLevel;
  let rates: [number, number];
  let label = "Selected work area";

  if (input.category === "renovation") {
    const intensity = { light: 0.72, moderate: 1, major: 1.42, "full-strip": 1.78 }[input.renovationIntensity];
    const base = finishGenericRates[finish];
    rates = [base[0] * intensity, base[1] * intensity];
  } else if (input.category === "finishes") {
    rates = finishGenericRates[finish];
  } else if (input.category === "furniture") {
    rates = furnitureRates[input.furnitureLevel];
  } else if (input.category === "external-works") {
    rates = finish === "luxury" ? [180_000, 340_000] : finish === "premium" ? [125_000, 240_000] : finish === "upper-mid" ? [90_000, 175_000] : finish === "economy" ? [40_000, 85_000] : [65_000, 130_000];
  } else if (input.category === "mep-services") {
    rates = finish === "luxury" ? [230_000, 420_000] : finish === "premium" ? [170_000, 320_000] : finish === "upper-mid" ? [130_000, 240_000] : finish === "economy" ? [55_000, 105_000] : [90_000, 175_000];
  } else {
    const tonnes = numberValue(input.steelTonnes);
    if (tonnes) {
      const steelFactor = (input.steelErection ? 1.14 : 1) * (input.craneRequired ? 1.08 : 1) * (input.steelCladding ? 1.12 : 1);
      const base: [number, number] = [2_300_000, 3_800_000];
      rates = [base[0] * steelFactor, base[1] * steelFactor];
      label = "Estimated structural steel tonnage";
      const low = tonnes * rates[0] * loc;
      const high = tonnes * rates[1] * loc;
      const sections = genericSections.map(([id, sectionLabel, share, explanation]) => ({ id, label: sectionLabel, low: low * share, high: high * share, explanation }));
      return {
        low,
        high,
        midpoint: (low + high) / 2,
        basisQuantity: tonnes,
        basisLabel: label,
        sections,
        detailScore: clamp(74 + (input.detailedMode ? 16 : 0) + (input.steelSpanM ? 4 : 0) + (input.steelHeightM ? 3 : 0) + (input.steelBays ? 3 : 0), 70, 100),
        estimateLevel: input.detailedMode ? "Detailed" : "Quick",
        costDrivers: [
          input.steelErection ? "Fabrication plus site erection is included." : "Fabrication-only basis selected.",
          input.craneRequired ? "Crane-assisted erection increases plant and logistics allowance." : "No crane allowance selected.",
          input.steelCladding ? "Cladding/roofing allowance is included." : "No cladding allowance selected.",
        ],
        assumptions: ["Steel rates are planning benchmarks and should be replaced by current section weights, fabrication drawings and supplier quotations."],
      };
    }
    rates = [220_000, 390_000];
    label = "Approximate steel-covered area";
  }

  const low = quantity * rates[0] * loc;
  const high = quantity * rates[1] * loc;
  const sections = genericSections.map(([id, sectionLabel, share, explanation]) => ({ id, label: sectionLabel, low: low * share, high: high * share, explanation }));
  const detailScore = clamp(70 + (input.location ? 4 : 0) + (input.workAreaM2 ? 8 : 0) + (input.detailedMode ? 12 : 0), 70, 96);
  return {
    low,
    high,
    midpoint: (low + high) / 2,
    basisQuantity: quantity,
    basisLabel: label,
    sections,
    detailScore,
    estimateLevel: detailScore >= 90 ? "High-detail" : detailScore >= 82 ? "Detailed" : "Quick",
    costDrivers: [
      `Selected ${input.finishLevel.replace("-", " ")} specification affects material and workmanship allowances.`,
      `Location factor applied for ${input.location || "unspecified location"}.`,
      input.category === "renovation" ? `${input.renovationIntensity.replace("-", " ")} renovation intensity selected.` : "Measured work area is the primary cost basis.",
    ],
    assumptions: ["Planning estimate only; final scope, quantities, specifications and live quotations will change the result."],
  };
}

type ResolvedFrame = Exclude<PublicEstimateInput["frameType"], "recommend">;

type ElementShares = {
  substructure: number;
  frame: number;
  walls: number;
  roof: number;
  openings: number;
  finishes: number;
  mep: number;
  joinery: number;
};

function inferFrame(input: PublicEstimateInput, totalFloors: number): ResolvedFrame {
  if (input.frameType !== "recommend") return input.frameType;
  if (input.buildingUse === "warehouse" || input.buildingUse === "industrial") return "steel";
  if (input.buildingUse === "residential" && totalFloors === 1) return "masonry";
  return "reinforced-concrete";
}

function elementShares(input: PublicEstimateInput, totalFloors: number, frame: ResolvedFrame): ElementShares {
  if (input.buildingUse === "warehouse" || input.buildingUse === "industrial") {
    return { substructure: 0.12, frame: 0.26, walls: 0.08, roof: 0.15, openings: 0.06, finishes: 0.09, mep: 0.16, joinery: 0.08 };
  }

  if (totalFloors === 1 && frame === "masonry") {
    return { substructure: 0.14, frame: 0.10, walls: 0.15, roof: 0.11, openings: 0.09, finishes: 0.18, mep: 0.14, joinery: 0.09 };
  }

  if (totalFloors === 1) {
    return { substructure: 0.14, frame: 0.14, walls: 0.13, roof: 0.10, openings: 0.09, finishes: 0.17, mep: 0.14, joinery: 0.09 };
  }

  if (totalFloors === 2) {
    return { substructure: 0.13, frame: 0.19, walls: 0.12, roof: 0.07, openings: 0.09, finishes: 0.17, mep: 0.14, joinery: 0.09 };
  }

  return { substructure: 0.12, frame: 0.23, walls: 0.11, roof: 0.05, openings: 0.09, finishes: 0.16, mep: 0.15, joinery: 0.09 };
}

export function calculatePublicEstimate(input: PublicEstimateInput): PublicEstimateResult {
  if (input.category !== "new-building") return genericPublicEstimate(input);

  const area = Math.max(1, buildingArea(input));
  const totalFloors = Math.max(1, 1 + Math.round(input.floorsAboveGround || 0));
  const loc = locationFactor(input.location);
  const rate = buildingUseRates[input.buildingUse];
  const finishFactor = finishFactors[input.finishLevel];
  const baseLow = area * rate[0] * finishFactor * loc;
  const baseHigh = area * rate[1] * finishFactor * loc;

  const resolvedFrame = inferFrame(input, totalFloors);
  const shares = elementShares(input, totalFloors, resolvedFrame);

  const siteFactor = { good: 0.94, normal: 1, weak: 1.16, waterlogged: 1.28, unknown: 1.08 }[input.siteCondition];
  const foundationFactor = { recommend: 1, "strip-pad": 0.98, raft: 1.14, pile: 1.34 }[input.foundationType];
  const frameFactor = { masonry: 0.92, "reinforced-concrete": 1, steel: 1.12, composite: 1.18 }[resolvedFrame];
  const floorFactor = 1 + Math.max(0, totalFloors - 1) * 0.025 + input.lifts * 0.025;
  const roofFactor = { "pitched-aluminium": 1, "stone-coated": 1.2, "flat-concrete": 1.3, "steel-roof": 1.08, combination: 1.22 }[input.roofType] * { simple: 0.96, moderate: 1.06, complex: 1.22 }[input.roofComplexity];
  const openingFactor = { "standard-aluminium": 0.96, "premium-aluminium": 1.12, upvc: 1.16, "double-glazed": 1.38, "curtain-wall": 1.62 }[input.windowSpec] * { basic: 0.92, standard: 1, premium: 1.18, "security-premium": 1.32 }[input.doorSpec];
  const facadeFactor = { "paint-render": 0.94, "mixed-cladding": 1.08, "stone-tile": 1.18, alucobond: 1.22, "curtain-wall": 1.42 }[input.facadeSpec];
  const floorFinishFactor = { screed: 0.7, ceramic: 0.9, porcelain: 1, granite: 1.18, marble: 1.48, vinyl: 0.92, timber: 1.3, epoxy: 1.15 }[input.floorFinish];
  const ceilingFactor = { none: 0.72, pvc: 0.88, "gypsum-pop": 1, suspended: 1.04, decorative: 1.3 }[input.ceilingFinish];
  const kitchenFactor = { basic: 0.82, standard: 1, premium: 1.28, luxury: 1.62 }[input.kitchenSpec];
  const bathroomFactor = { basic: 0.82, standard: 1, premium: 1.3, luxury: 1.68 }[input.bathroomSpec];
  const electricalFactor = { basic: 0.82, standard: 1, high: 1.28 }[input.electricalSpec];
  const acFactor = { none: 0.78, provision: 0.9, split: 1, cassette: 1.14, vrf: 1.38, central: 1.55 }[input.acSpec];
  const waterFactor = { basic: 0.9, borehole: 1, "borehole-treatment": 1.12, "enhanced-storage": 1.1 }[input.waterSystem];
  const wasteFactor = { "public-sewer": 0.92, septic: 1, "treatment-plant": 1.2 }[input.wasteSystem];
  const powerFactor = { grid: 0.86, generator: 1, inverter: 1.05, solar: 1.16, hybrid: 1.24 }[input.powerSystem];
  const useMepFactor = { residential: 1, apartments: 1.05, commercial: 1.05, hotel: 1.16, school: 0.92, healthcare: 1.25, warehouse: 0.72, industrial: 1.12, religious: 0.86, "mixed-use": 1.08 }[input.buildingUse];
  const mepFactor = ((electricalFactor + acFactor + waterFactor + wasteFactor + powerFactor) / 5) * useMepFactor * (input.includeSecurity ? 1.04 : 1) * (input.includeFireSystem ? 1.05 : 1);

  const expectedBathrooms = Math.max(1, area / 48);
  const wetRoomAdjustment = input.bathrooms > expectedBathrooms ? 1 + Math.min(0.24, (input.bathrooms - expectedBathrooms) * 0.022) : 1;
  const wallComplexity = 1 + Math.min(0.14, ((input.bedrooms + input.livingRooms + input.kitchens + input.familyLounges + input.studies) / Math.max(1, area / 20)) * 0.035);
  const finishSectionFactor = ((floorFinishFactor + ceilingFactor + facadeFactor) / 3) * wetRoomAdjustment;
  const joineryFactor = ((kitchenFactor + bathroomFactor) / 2) * (input.includeWardrobes ? 1.12 : 1) * (input.includeKitchenJoinery ? 1.08 : 1);

  const structuralLabel = resolvedFrame === "masonry" ? "Structural concrete & support" : "Structural frame";
  const structuralExplanation = resolvedFrame === "masonry"
    ? "Allowance for lintels, ring beams, local columns and other structural concrete/support. No suspended upper-floor slab is assumed for this ground-floor masonry profile."
    : `Structural ${resolvedFrame.replace("-", " ")} system, including the associated frame, reinforcement/formwork or steelwork allowance.`;

  const core: GuidedEstimateSection[] = [
    section("substructure", "Foundation & ground works", baseLow, baseHigh, shares.substructure, siteFactor * foundationFactor, "Excavation, earthworks, foundations, filling, DPM/hardcore and ground-floor construction adjusted for selected site/foundation condition."),
    section("frame", structuralLabel, baseLow, baseHigh, shares.frame, frameFactor * floorFactor, structuralExplanation),
    section("walls", "Walls & partitions", baseLow, baseHigh, shares.walls, wallComplexity, "External walls, internal partitions, lintels and related masonry adjusted for room density."),
    section("roof", "Roof", baseLow, baseHigh, shares.roof, roofFactor, "Roof structure, covering and rainwater goods adjusted for selected roof type and complexity."),
    section("openings", "Doors, windows & façade", baseLow, baseHigh, shares.openings, openingFactor * facadeFactor, "Windows, doors, glazing and façade treatment adjusted for selected specification."),
    section("finishes", "Internal & architectural finishes", baseLow, baseHigh, shares.finishes, finishSectionFactor, "Floor, wall and ceiling finishes adjusted for detailed finish selections and wet-room intensity."),
    section("mep", "Electrical, plumbing & building services", baseLow, baseHigh, shares.mep, mepFactor * wetRoomAdjustment, "Electrical, plumbing, cooling, water, waste, power and selected life-safety/security systems, adjusted for building use and wet-room density."),
    section("joinery", "Kitchen, sanitary & fitted joinery", baseLow, baseHigh, shares.joinery, joineryFactor, "Kitchen fittings, sanitary fittings, wardrobes and related fitted joinery allowances."),
  ];

  const coreLow = core.reduce((sum, item) => sum + item.low, 0);
  const coreHigh = core.reduce((sum, item) => sum + item.high, 0);
  const prelim = { id: "preliminaries", label: "Preliminaries & project setup", low: coreLow * 0.05, high: coreHigh * 0.065, explanation: "Mobilisation, supervision, temporary works, project administration, safety and general requirements." };

  const landArea = numberValue(input.landAreaM2);
  const footprint = numberValue(input.footprintM2) || area / totalFloors;
  const openLand = Math.max(0, landArea - footprint);
  let externalLow = 0;
  let externalHigh = 0;
  const externalItems: string[] = [];
  if (input.includeExternalWorks && openLand > 0) {
    externalLow += openLand * 28_000;
    externalHigh += openLand * 72_000;
    externalItems.push("general site development");
  }
  if (input.includePaving && openLand > 0) { externalLow += openLand * 18_000; externalHigh += openLand * 42_000; externalItems.push("paving/driveways"); }
  if (input.includeDrainage) { externalLow += Math.max(2_500_000, openLand * 9_000); externalHigh += Math.max(6_000_000, openLand * 22_000); externalItems.push("drainage"); }
  if (input.includeLandscaping && openLand > 0) { externalLow += openLand * 7_000; externalHigh += openLand * 22_000; externalItems.push("landscaping"); }
  if (input.includeFence && landArea > 0) { const perimeterEquivalent = Math.sqrt(landArea) * 4; externalLow += perimeterEquivalent * 95_000; externalHigh += perimeterEquivalent * 190_000; externalItems.push("boundary fence"); }
  if (input.includeGatehouse) { externalLow += 6_000_000; externalHigh += 16_000_000; externalItems.push("gatehouse"); }
  if (input.includePool) { externalLow += 18_000_000; externalHigh += 55_000_000; externalItems.push("swimming pool"); }

  const furnitureBase = input.includeFurniture ? furnitureRates[input.furnitureLevel] : [0, 0] as [number, number];
  const furnitureLow = input.includeFurniture ? area * furnitureBase[0] : 0;
  const furnitureHigh = input.includeFurniture ? area * furnitureBase[1] : 0;

  const sections: GuidedEstimateSection[] = [
    ...core,
    prelim,
    ...(externalLow || externalHigh ? [{ id: "external", label: "External works", low: externalLow, high: externalHigh, explanation: `Includes selected external items: ${externalItems.join(", ")}.` }] : []),
    ...(input.includeFurniture ? [{ id: "furniture", label: "Furniture, equipment & loose fittings", low: furnitureLow, high: furnitureHigh, explanation: `${input.furnitureLevel} furnishing allowance based on the estimated building area.` }] : []),
  ];

  const low = sections.reduce((sum, item) => sum + item.low, 0);
  const high = sections.reduce((sum, item) => sum + item.high, 0);

  let score = 70;
  if (input.location.trim()) score += 4;
  if (input.totalFloorAreaM2 || input.footprintM2) score += 7;
  else if (input.bedrooms || input.livingRooms || input.kitchens) score += 5;
  if (input.landAreaM2) score += 3;
  if (input.bathrooms || input.bedrooms) score += 3;
  if (input.detailedMode) score += 5;
  if (input.detailedMode && input.siteCondition !== "unknown") score += 2;
  if (input.detailedMode) score += 2;
  if (input.detailedMode) score += 2;
  if (input.detailedMode) score += 2;
  if (input.includeExternalWorks || input.includeFurniture) score += 1;
  score = clamp(score, 70, 100);

  const costDrivers: string[] = [];
  if (resolvedFrame === "masonry" && totalFloors === 1) costDrivers.push("Ground-floor masonry construction uses a reduced structural-frame allowance; no suspended upper-floor slab is assumed.");
  if (input.siteCondition === "waterlogged" || input.foundationType === "pile") costDrivers.push("Difficult ground/foundation requirements are materially increasing substructure cost.");
  if (totalFloors >= 3 || input.lifts > 0) costDrivers.push("Additional storeys and/or lifts increase structural and building-services allowances.");
  if (input.roofType === "flat-concrete") costDrivers.push("A flat reinforced-concrete roof increases both roof and structural requirements compared with a light pitched roof.");
  if (["double-glazed", "curtain-wall"].includes(input.windowSpec) || ["alucobond", "curtain-wall"].includes(input.facadeSpec)) costDrivers.push("High-specification glazing/façade selections are increasing the envelope cost.");
  if (["vrf", "central"].includes(input.acSpec)) costDrivers.push("Central/VRF cooling is a major MEP cost driver.");
  if (["premium", "luxury"].includes(input.kitchenSpec) || ["premium", "luxury"].includes(input.bathroomSpec)) costDrivers.push("Premium kitchen and sanitary specifications are increasing fitted-out cost.");
  if (input.includeFurniture) costDrivers.push(`${input.furnitureLevel} furniture/FF&E is included in the project budget.`);
  if (externalLow > 0) costDrivers.push(`Selected external works (${externalItems.join(", ")}) are included rather than treated as a separate future budget.`);
  if (!costDrivers.length) costDrivers.push("The estimate is currently driven mainly by building area, use, location and overall finish level.");

  return {
    low,
    high,
    midpoint: (low + high) / 2,
    basisQuantity: area,
    basisLabel: "Estimated total floor area",
    sections,
    detailScore: score,
    estimateLevel: score >= 92 ? "High-detail" : score >= 82 ? "Detailed" : "Quick",
    costDrivers,
    assumptions: [
      `Planning benchmark for a ${input.buildingUse.replace("-", " ")} project with ${input.finishLevel.replace("-", " ")} specification.`,
      input.frameType === "recommend" ? `Structural system inferred as ${resolvedFrame.replace("-", " ")} from building use and number of floors.` : `Selected structural system: ${resolvedFrame.replace("-", " ")}.`,
      "100% questionnaire completion means input completeness, not a guaranteed final contract-price accuracy.",
      "Final cost depends on drawings, structural design, measured quantities, procurement strategy and current local quotations.",
      "Location adjustments are broad planning factors until live city-specific rate libraries are connected.",
    ],
  };
}
