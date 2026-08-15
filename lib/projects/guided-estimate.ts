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
  const totalFloorArea = Math.max(1, footprint * floors);
  const isBuilding = projectType === "new-building";
  const isSteel = projectType === "structural-steel";
  const basisQuantity = isSteel ? Math.max(1, positive(scope.floorAreaM2)) : totalFloorArea;
  const basisUnit = isSteel ? "tonne planning equivalent" : "m²";
  const rates = isBuilding ? buildingRates[finish] : projectType === "fence-boundary" ? [0, 0] as [number, number] : projectRates[projectType][finish];
  const baseLow = basisQuantity * rates[0];
  const baseHigh = basisQuantity * rates[1];
  const prelimPercent = scope.preliminariesMode === "none" ? 0 : Math.max(0, scope.preliminariesPercent ?? 5);
  const prelimLow = baseLow * prelimPercent / 100;
  const prelimHigh = baseHigh * prelimPercent / 100;
  const landArea = positive(scope.landAreaM2) || positive(scope.landLengthM) * positive(scope.landWidthM);
  const openArea = Math.max(0, landArea - footprint);
  const externalLow = scope.includeExternalWorks ? openArea * 25_000 : 0;
  const externalHigh = scope.includeExternalWorks ? openArea * 65_000 : 0;
  const coreSections = (isBuilding ? buildingSections : genericSections).map(([id, label, share, explanation]) => ({
    id,
    label,
    low: baseLow * share,
    high: baseHigh * share,
    explanation,
  }));
  const sections: GuidedEstimateSection[] = [
    ...coreSections,
    ...(prelimPercent ? [{ id: "preliminaries", label: "Project preliminaries", low: prelimLow, high: prelimHigh, explanation: `Optional ${prelimPercent}% allowance for project setup, supervision and general requirements.` }] : []),
    ...(scope.includeExternalWorks && openArea ? [{ id: "external", label: "External works allowance", low: externalLow, high: externalHigh, explanation: `Planning allowance for approximately ${Math.round(openArea)} m² of remaining open land.` }] : []),
  ];
  const low = sections.reduce((sum, section) => sum + section.low, 0);
  const high = sections.reduce((sum, section) => sum + section.high, 0);
  const suppliedDimensions = positive(scope.floorAreaM2) > 0 || (positive(scope.buildingLengthM) > 0 && positive(scope.buildingWidthM) > 0);
  return {
    basisLabel: isSteel ? "Selected steel quantity" : "Total estimated floor area",
    basisQuantity,
    basisUnit,
    low,
    high,
    midpoint: (low + high) / 2,
    sections,
    confidence: suppliedDimensions ? "detailed" : "rough",
    assumptions: [
      `Starter ${finish} specification benchmark for ${projectType.replace(/-/g, " ")}.`,
      "Rates are planning references and must be checked against current prices at the project location.",
      "Final cost will change with drawings, structural design, specification, site condition and procurement decisions.",
      ...(scope.assumptions ?? []),
    ],
  };
}
