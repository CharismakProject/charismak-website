import { calculatePublicEstimate, type PublicEstimateInput } from "./guided-estimate";

export type EstimateCategory =
  | "new-building"
  | "renovation"
  | "structural-steel"
  | "finishes"
  | "furniture"
  | "external-works"
  | "mep-services";

export type SpecLevel = "economy" | "standard" | "upper-mid" | "premium" | "luxury";

export type EstimateSection = {
  id: string;
  label: string;
  low: number;
  high: number;
  explanation: string;
};

export type EstimateResult = {
  low: number;
  high: number;
  midpoint: number;
  basisQuantity: number;
  basisUnit: string;
  basisLabel: string;
  sections: EstimateSection[];
  detailScore: number;
  estimateLevel: "Quick" | "Detailed" | "High-detail";
  costDrivers: string[];
  assumptions: string[];
};

export type EstimateInput = PublicEstimateInput & {
  steelStructureType: "warehouse" | "canopy" | "roof-truss" | "mezzanine" | "multi-storey-frame" | "platform" | "staircase" | "other";
  steelCoating: "primer" | "epoxy" | "galvanized" | "fireproof";
  steelFoundations: boolean;
  roofCladdingAreaM2: number;
  wallCladdingAreaM2: number;

  renovationUse: "residential" | "office" | "retail" | "hotel" | "restaurant" | "other";
  demolitionPercent: number;
  floorReplacementPercent: number;
  ceilingReplacementPercent: number;
  paintingPercent: number;
  bathroomRenovations: number;
  kitchenRenovations: number;
  electricalRewirePercent: number;
  plumbingRenewalPercent: number;
  windowReplacementCount: number;
  doorReplacementCount: number;
  acReplacementCount: number;
  structuralAlteration: boolean;

  wallFinish: "paint" | "wallpaper" | "tile" | "stone" | "panel";
  wallFinishAreaM2: number;
  ceilingAreaM2: number;
  wetWallTileAreaM2: number;
  paintingAreaM2: number;
  skirtingLengthM: number;

  wardrobeLengthM: number;
  kitchenCabinetLengthM: number;
  tvUnits: number;
  bedroomFurnitureSets: number;
  livingFurnitureSets: number;
  diningFurnitureSets: number;
  officeWorkstations: number;
  curtainAreaM2: number;
  bathroomVanities: number;

  fenceLengthM: number;
  gateCount: number;
  pavingAreaM2: number;
  drainageLengthM: number;
  landscapingAreaM2: number;
  gatehouseAreaM2: number;
  poolAreaM2: number;
  retainingWallAreaM2: number;
  externalLightingPoints: number;

  electricalPoints: number;
  lightingPoints: number;
  dataPoints: number;
  mepBathrooms: number;
  mepKitchens: number;
  acUnits: number;
  waterHeaters: number;
  pumps: number;
  includeBorehole: boolean;
  includeWaterTreatment: boolean;
  includeSeptic: boolean;
  includeTreatmentPlant: boolean;
  generatorKva: number;
  inverterKva: number;
  solarKw: number;
  securityPoints: number;
  firePoints: number;
  mepLifts: number;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const n = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
const pct = (v: number) => clamp(n(v), 0, 100) / 100;

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

const specFactor: Record<SpecLevel, number> = {
  economy: 0.84,
  standard: 1,
  "upper-mid": 1.16,
  premium: 1.36,
  luxury: 1.65,
};

function resultFromSections(
  input: EstimateInput,
  sections: EstimateSection[],
  basisQuantity: number,
  basisUnit: string,
  basisLabel: string,
  score: number,
  costDrivers: string[],
  assumptions: string[],
): EstimateResult {
  const loc = locationFactor(input.location);
  const localized = sections.map((section) => ({ ...section, low: section.low * loc, high: section.high * loc }));
  const low = localized.reduce((sum, item) => sum + item.low, 0);
  const high = localized.reduce((sum, item) => sum + item.high, 0);
  const detailScore = clamp(Math.round(score), 65, 100);
  return {
    low,
    high,
    midpoint: (low + high) / 2,
    basisQuantity,
    basisUnit,
    basisLabel,
    sections: localized,
    detailScore,
    estimateLevel: detailScore >= 92 ? "High-detail" : detailScore >= 80 ? "Detailed" : "Quick",
    costDrivers,
    assumptions: [
      ...assumptions,
      `Broad location adjustment applied for ${input.location || "unspecified location"}.`,
      "This is a planning estimate. Current quotations, drawings, measured quantities and final specifications remain necessary before procurement or contract award.",
    ],
  };
}

function buildingScore(input: EstimateInput) {
  let score = 66;
  if (input.location.trim()) score += 4;
  if (n(input.totalFloorAreaM2) || n(input.footprintM2)) score += 7;
  else if (input.bedrooms || input.livingRooms || input.kitchens) score += 4;
  if (n(input.landAreaM2)) score += 3;
  if (input.bedrooms || input.bathrooms) score += 3;
  if (input.siteCondition !== "unknown") score += 2;
  if (input.foundationType !== "recommend") score += 2;
  if (input.frameType !== "recommend") score += 2;
  if (input.roofType) score += 2;
  if (input.windowSpec && input.doorSpec) score += 2;
  if (input.floorFinish && input.ceilingFinish) score += 2;
  if (input.electricalSpec && input.acSpec) score += 2;
  if (input.waterSystem && input.wasteSystem && input.powerSystem) score += 2;
  if (input.includeExternalWorks || input.includeFurniture) score += 1;
  return clamp(score, 65, 96);
}

function buildingEstimate(input: EstimateInput): EstimateResult {
  const base = calculatePublicEstimate(input);
  return {
    ...base,
    basisUnit: "m²",
    detailScore: buildingScore(input),
    estimateLevel: buildingScore(input) >= 92 ? "High-detail" : buildingScore(input) >= 80 ? "Detailed" : "Quick",
  };
}

function steelEstimate(input: EstimateInput): EstimateResult {
  const area = Math.max(1, n(input.workAreaM2));
  const knownTonnes = n(input.steelTonnes);
  const intensity: Record<EstimateInput["steelStructureType"], [number, number]> = {
    warehouse: [32, 48],
    canopy: [22, 36],
    "roof-truss": [18, 30],
    mezzanine: [45, 70],
    "multi-storey-frame": [55, 90],
    platform: [50, 85],
    staircase: [70, 120],
    other: [35, 60],
  };
  let [kgLow, kgHigh] = intensity[input.steelStructureType];
  if (n(input.steelSpanM) > 15) { kgLow *= 1.12; kgHigh *= 1.2; }
  if (n(input.steelSpanM) > 25) { kgLow *= 1.15; kgHigh *= 1.2; }
  if (n(input.steelHeightM) > 7) { kgLow *= 1.08; kgHigh *= 1.14; }
  if (input.craneRequired) { kgLow *= 1.02; kgHigh *= 1.05; }
  const tonnesLow = knownTonnes || (area * kgLow / 1000);
  const tonnesHigh = knownTonnes || (area * kgHigh / 1000);
  const avgTonnes = (tonnesLow + tonnesHigh) / 2;
  const coatingFactor = { primer: 1, epoxy: 1.12, galvanized: 1.3, fireproof: 1.42 }[input.steelCoating];

  const sections: EstimateSection[] = [
    { id: "steel-material", label: "Structural steel material", low: tonnesLow * 1_250_000, high: tonnesHigh * 1_700_000, explanation: `${knownTonnes ? "Entered" : "Inferred"} steel weight priced as primary sections, plates and reasonable wastage.` },
    { id: "fabrication", label: "Fabrication, welding & connections", low: tonnesLow * 360_000, high: tonnesHigh * 680_000, explanation: "Cutting, welding, drilling, bolts, plates, shop labour and fabrication consumables." },
    { id: "coating", label: "Surface protection / coating", low: tonnesLow * 120_000 * coatingFactor, high: tonnesHigh * 330_000 * coatingFactor, explanation: `${input.steelCoating} protection allowance for fabricated steel.` },
    { id: "transport", label: "Transport & handling", low: tonnesLow * 80_000, high: tonnesHigh * 210_000, explanation: "Loading, transport, offloading and normal handling allowance." },
  ];
  if (input.steelErection) sections.push({ id: "erection", label: "Site erection", low: tonnesLow * 180_000, high: tonnesHigh * 480_000, explanation: "Assembly, alignment, bolting/welding and erection labour." });
  if (input.craneRequired) sections.push({ id: "crane", label: "Crane / lifting plant", low: Math.max(650_000, avgTonnes * 90_000), high: Math.max(1_800_000, avgTonnes * 240_000), explanation: "Mobile crane or lifting-plant allowance based on estimated steel quantity and geometry." });
  if (input.steelCladding) {
    const claddingArea = n(input.roofCladdingAreaM2) + n(input.wallCladdingAreaM2) || area * 1.2;
    sections.push({ id: "cladding", label: "Roofing / cladding", low: claddingArea * 28_000, high: claddingArea * 72_000, explanation: `Allowance for approximately ${Math.round(claddingArea)} m² of selected roofing/cladding.` });
  }
  if (input.steelFoundations) sections.push({ id: "foundations", label: "Base plates, anchors & foundations", low: avgTonnes * 180_000, high: avgTonnes * 520_000, explanation: "Planning allowance for anchor bolts, base details and supporting concrete foundations." });

  let score = 62;
  if (input.location.trim()) score += 4;
  if (knownTonnes) score += 14; else if (n(input.workAreaM2)) score += 7;
  if (input.steelStructureType !== "other") score += 6;
  if (n(input.steelSpanM)) score += 5;
  if (n(input.steelHeightM)) score += 4;
  if (n(input.steelBays)) score += 3;
  if (input.steelCladding && (n(input.roofCladdingAreaM2) || n(input.wallCladdingAreaM2))) score += 3;
  if (input.steelErection || input.craneRequired || input.steelFoundations) score += 2;

  const costDrivers = [
    knownTonnes ? `Cost is driven by the entered ${knownTonnes.toFixed(1)} t steel quantity.` : `Steel weight is inferred at about ${kgLow.toFixed(0)}–${kgHigh.toFixed(0)} kg/m² for the selected structure and geometry.`,
    n(input.steelSpanM) > 15 ? "Longer clear spans increase section weights and connection demand." : "Selected span is within the lighter planning range.",
    input.steelErection ? "Site erection is included." : "Fabrication-only basis; erection is excluded.",
    input.steelCladding ? "Roof/wall cladding is included as a separate measured allowance." : "Roof/wall cladding is excluded.",
  ];
  return resultFromSections(input, sections, avgTonnes, "t", knownTonnes ? "Entered structural steel quantity" : "Inferred structural steel quantity", score, costDrivers, ["Inferred steel tonnage is a feasibility approximation until structural drawings/member schedules are available."]);
}

function renovationEstimate(input: EstimateInput): EstimateResult {
  const area = Math.max(1, n(input.workAreaM2));
  const f = specFactor[input.finishLevel];
  const intensityBase = { light: 12_000, moderate: 28_000, major: 45_000, "full-strip": 65_000 }[input.renovationIntensity];
  const sections: EstimateSection[] = [
    { id: "protection", label: "Preliminaries, protection & making safe", low: area * intensityBase * 0.45, high: area * intensityBase * 0.8, explanation: "Site setup, protection of retained work, access, temporary works and careful removals." },
  ];
  if (pct(input.demolitionPercent)) sections.push({ id: "demolition", label: "Demolition & strip-out", low: area * pct(input.demolitionPercent) * 9_000, high: area * pct(input.demolitionPercent) * 24_000, explanation: `${input.demolitionPercent}% of the work area allowed for demolition/strip-out and disposal.` });
  if (pct(input.floorReplacementPercent)) sections.push({ id: "floors", label: "Floor replacement", low: area * pct(input.floorReplacementPercent) * 24_000 * f, high: area * pct(input.floorReplacementPercent) * 72_000 * f, explanation: `${input.floorReplacementPercent}% floor replacement including removal, preparation and new finish.` });
  if (pct(input.ceilingReplacementPercent)) sections.push({ id: "ceilings", label: "Ceiling replacement", low: area * pct(input.ceilingReplacementPercent) * 18_000 * f, high: area * pct(input.ceilingReplacementPercent) * 55_000 * f, explanation: `${input.ceilingReplacementPercent}% ceiling replacement allowance.` });
  if (pct(input.paintingPercent)) sections.push({ id: "painting", label: "Wall & ceiling painting", low: area * 3 * pct(input.paintingPercent) * 4_000 * f, high: area * 3 * pct(input.paintingPercent) * 10_000 * f, explanation: "Approximate paintable surface derived from work area and selected repainting percentage." });
  if (n(input.bathroomRenovations)) sections.push({ id: "bathrooms", label: "Bathroom renovations", low: input.bathroomRenovations * 2_000_000 * f, high: input.bathroomRenovations * 6_500_000 * f, explanation: `${input.bathroomRenovations} bathroom(s): finishes, sanitary fittings, plumbing alterations and accessories.` });
  if (n(input.kitchenRenovations)) sections.push({ id: "kitchens", label: "Kitchen renovations", low: input.kitchenRenovations * 2_800_000 * f, high: input.kitchenRenovations * 10_000_000 * f, explanation: `${input.kitchenRenovations} kitchen(s): cabinetry, worktops, finishes and service alterations.` });
  if (pct(input.electricalRewirePercent)) sections.push({ id: "electrical", label: "Electrical renewal", low: area * pct(input.electricalRewirePercent) * 28_000, high: area * pct(input.electricalRewirePercent) * 75_000, explanation: `${input.electricalRewirePercent}% electrical rewiring/point renewal.` });
  if (pct(input.plumbingRenewalPercent)) sections.push({ id: "plumbing", label: "Plumbing renewal", low: area * pct(input.plumbingRenewalPercent) * 18_000, high: area * pct(input.plumbingRenewalPercent) * 52_000, explanation: `${input.plumbingRenewalPercent}% plumbing distribution renewal allowance.` });
  if (n(input.windowReplacementCount)) sections.push({ id: "windows", label: "Window replacement", low: input.windowReplacementCount * 220_000 * f, high: input.windowReplacementCount * 750_000 * f, explanation: `${input.windowReplacementCount} replacement window(s).` });
  if (n(input.doorReplacementCount)) sections.push({ id: "doors", label: "Door replacement", low: input.doorReplacementCount * 150_000 * f, high: input.doorReplacementCount * 800_000 * f, explanation: `${input.doorReplacementCount} replacement door(s).` });
  if (n(input.acReplacementCount)) sections.push({ id: "ac", label: "Air-conditioning replacement", low: input.acReplacementCount * 380_000 * f, high: input.acReplacementCount * 1_400_000 * f, explanation: `${input.acReplacementCount} AC unit(s)/zones replacement allowance.` });
  if (input.structuralAlteration) sections.push({ id: "structural", label: "Structural alterations", low: area * 30_000, high: area * 110_000, explanation: "Allowance for openings, strengthening, local beams/columns and associated making good; engineering design still required." });

  let score = 60;
  if (input.location.trim()) score += 4;
  if (n(input.workAreaM2)) score += 7;
  score += [input.demolitionPercent, input.floorReplacementPercent, input.ceilingReplacementPercent, input.paintingPercent, input.electricalRewirePercent, input.plumbingRenewalPercent].filter(n).length * 3;
  score += [input.bathroomRenovations, input.kitchenRenovations, input.windowReplacementCount, input.doorReplacementCount, input.acReplacementCount].filter(n).length * 2;
  if (input.structuralAlteration) score += 2;
  const drivers = [
    `${input.renovationIntensity.replace("-", " ")} renovation intensity selected.`,
    input.bathroomRenovations || input.kitchenRenovations ? "Wet areas and kitchens are major renovation cost drivers." : "No detailed kitchen/bathroom replacement quantity entered.",
    input.structuralAlteration ? "Structural alteration allowance is included and requires engineering review." : "No structural alteration allowance selected.",
  ];
  return resultFromSections(input, sections, area, "m²", "Renovation work area", score, drivers, ["Existing-condition surprises, concealed services and demolition discoveries can materially affect renovation cost."]);
}

const floorRates: Record<EstimateInput["floorFinish"], [number, number]> = {
  screed: [8_000, 16_000], ceramic: [22_000, 40_000], porcelain: [34_000, 72_000], granite: [52_000, 105_000], marble: [85_000, 190_000], vinyl: [22_000, 58_000], timber: [65_000, 155_000], epoxy: [30_000, 78_000],
};
const ceilingRates: Record<EstimateInput["ceilingFinish"], [number, number]> = {
  none: [0, 0], pvc: [14_000, 30_000], "gypsum-pop": [24_000, 52_000], suspended: [28_000, 58_000], decorative: [45_000, 105_000],
};
const wallRates: Record<EstimateInput["wallFinish"], [number, number]> = {
  paint: [4_000, 11_000], wallpaper: [14_000, 42_000], tile: [28_000, 75_000], stone: [65_000, 170_000], panel: [45_000, 125_000],
};

function finishesEstimate(input: EstimateInput): EstimateResult {
  const floorArea = Math.max(1, n(input.workAreaM2));
  const wallArea = n(input.wallFinishAreaM2) || floorArea * 2.4;
  const ceilingArea = n(input.ceilingAreaM2) || floorArea;
  const [fl, fh] = floorRates[input.floorFinish];
  const [wl, wh] = wallRates[input.wallFinish];
  const [cl, ch] = ceilingRates[input.ceilingFinish];
  const f = specFactor[input.finishLevel];
  const sections: EstimateSection[] = [
    { id: "floor", label: "Floor finishes", low: floorArea * fl * f, high: floorArea * fh * f, explanation: `${Math.round(floorArea)} m² of ${input.floorFinish.replace("-", " ")} floor finish including normal preparation and laying.` },
    { id: "wall", label: "Wall finishes", low: wallArea * wl * f, high: wallArea * wh * f, explanation: `${Math.round(wallArea)} m² ${input.wallFinish} wall-finish allowance.` },
  ];
  if (input.ceilingFinish !== "none") sections.push({ id: "ceiling", label: "Ceiling finishes", low: ceilingArea * cl * f, high: ceilingArea * ch * f, explanation: `${Math.round(ceilingArea)} m² ${input.ceilingFinish.replace("-", " ")} ceiling.` });
  if (n(input.wetWallTileAreaM2)) sections.push({ id: "wet-tiles", label: "Wet-area wall tiling", low: input.wetWallTileAreaM2 * 32_000 * f, high: input.wetWallTileAreaM2 * 82_000 * f, explanation: `${input.wetWallTileAreaM2} m² bathroom/kitchen wall tiling.` });
  if (n(input.paintingAreaM2) && input.wallFinish !== "paint") sections.push({ id: "painting", label: "Additional painting", low: input.paintingAreaM2 * 4_000 * f, high: input.paintingAreaM2 * 11_000 * f, explanation: `${input.paintingAreaM2} m² separately entered painting area.` });
  if (n(input.skirtingLengthM)) sections.push({ id: "skirting", label: "Skirting", low: input.skirtingLengthM * 5_500 * f, high: input.skirtingLengthM * 18_000 * f, explanation: `${input.skirtingLengthM} linear metres of skirting.` });
  const prelimLow = sections.reduce((s, x) => s + x.low, 0) * 0.06;
  const prelimHigh = sections.reduce((s, x) => s + x.high, 0) * 0.1;
  sections.push({ id: "waste-prelim", label: "Wastage, protection & finishing labour", low: prelimLow, high: prelimHigh, explanation: "Cutting waste, protection, adhesives/consumables, access and final making good." });

  let score = 61 + (input.location.trim() ? 4 : 0) + (n(input.workAreaM2) ? 7 : 0);
  if (n(input.wallFinishAreaM2)) score += 6;
  if (n(input.ceilingAreaM2)) score += 5;
  if (n(input.wetWallTileAreaM2)) score += 4;
  if (n(input.skirtingLengthM)) score += 3;
  const drivers = [`${input.floorFinish.replace("-", " ")} flooring and ${input.wallFinish} wall finish are priced separately.`, n(input.wallFinishAreaM2) ? "Measured wall-finish area supplied." : "Wall-finish area is inferred from floor area until measured.", input.ceilingFinish !== "none" ? `${input.ceilingFinish.replace("-", " ")} ceiling is included.` : "No ceiling finish included."];
  return resultFromSections(input, sections, floorArea, "m²", "Primary floor-finish area", score, drivers, ["Finish rates vary strongly with tile/stone size, brand, substrate condition, patterns and imported materials."]);
}

function furnitureEstimate(input: EstimateInput): EstimateResult {
  const f = { essential: 0.78, standard: 1, premium: 1.42, luxury: 2.05 }[input.furnitureLevel];
  const sections: EstimateSection[] = [];
  if (n(input.wardrobeLengthM)) sections.push({ id: "wardrobes", label: "Wardrobes", low: input.wardrobeLengthM * 260_000 * f, high: input.wardrobeLengthM * 760_000 * f, explanation: `${input.wardrobeLengthM} linear metres of fitted wardrobes.` });
  if (n(input.kitchenCabinetLengthM)) sections.push({ id: "kitchen", label: "Kitchen cabinetry", low: input.kitchenCabinetLengthM * 330_000 * f, high: input.kitchenCabinetLengthM * 950_000 * f, explanation: `${input.kitchenCabinetLengthM} linear metres of fitted kitchen cabinetry/worktop allowance.` });
  if (n(input.tvUnits)) sections.push({ id: "tv", label: "TV / media units", low: input.tvUnits * 420_000 * f, high: input.tvUnits * 1_600_000 * f, explanation: `${input.tvUnits} fitted TV/media unit(s).` });
  if (n(input.bedroomFurnitureSets)) sections.push({ id: "bedsets", label: "Bedroom furniture", low: input.bedroomFurnitureSets * 1_000_000 * f, high: input.bedroomFurnitureSets * 4_200_000 * f, explanation: `${input.bedroomFurnitureSets} bedroom furniture set(s).` });
  if (n(input.livingFurnitureSets)) sections.push({ id: "living", label: "Living-room furniture", low: input.livingFurnitureSets * 1_400_000 * f, high: input.livingFurnitureSets * 6_500_000 * f, explanation: `${input.livingFurnitureSets} living-room furniture set(s).` });
  if (n(input.diningFurnitureSets)) sections.push({ id: "dining", label: "Dining furniture", low: input.diningFurnitureSets * 850_000 * f, high: input.diningFurnitureSets * 4_500_000 * f, explanation: `${input.diningFurnitureSets} dining furniture set(s).` });
  if (n(input.officeWorkstations)) sections.push({ id: "office", label: "Office workstations", low: input.officeWorkstations * 220_000 * f, high: input.officeWorkstations * 900_000 * f, explanation: `${input.officeWorkstations} workstation(s).` });
  if (n(input.curtainAreaM2)) sections.push({ id: "curtains", label: "Curtains / blinds", low: input.curtainAreaM2 * 24_000 * f, high: input.curtainAreaM2 * 95_000 * f, explanation: `${input.curtainAreaM2} m² curtain/blind area.` });
  if (n(input.bathroomVanities)) sections.push({ id: "vanities", label: "Bathroom vanities", low: input.bathroomVanities * 280_000 * f, high: input.bathroomVanities * 1_100_000 * f, explanation: `${input.bathroomVanities} vanity unit(s).` });
  if (!sections.length) {
    const area = Math.max(1, n(input.workAreaM2));
    sections.push({ id: "allowance", label: "Furniture / joinery planning allowance", low: area * 55_000 * f, high: area * 165_000 * f, explanation: "Area-based placeholder until furniture counts or joinery lengths are supplied." });
  }
  const subtotalLow = sections.reduce((s, x) => s + x.low, 0);
  const subtotalHigh = sections.reduce((s, x) => s + x.high, 0);
  sections.push({ id: "delivery", label: "Delivery, installation & accessories", low: subtotalLow * 0.07, high: subtotalHigh * 0.14, explanation: "Hardware, delivery, installation, adjustments and normal accessories." });
  const quantityCount = [input.wardrobeLengthM, input.kitchenCabinetLengthM, input.tvUnits, input.bedroomFurnitureSets, input.livingFurnitureSets, input.diningFurnitureSets, input.officeWorkstations, input.curtainAreaM2, input.bathroomVanities].filter(n).length;
  const score = 60 + (input.location.trim() ? 4 : 0) + Math.min(28, quantityCount * 4) + (n(input.workAreaM2) ? 3 : 0);
  const drivers = [quantityCount ? `${quantityCount} measured/count-based furniture inputs supplied.` : "No item counts supplied; temporary area-based allowance used.", `${input.furnitureLevel} furniture/joinery level selected.`, n(input.kitchenCabinetLengthM) || n(input.wardrobeLengthM) ? "Fitted joinery is priced by linear metre rather than floor area." : "No fitted joinery length entered."];
  return resultFromSections(input, sections, quantityCount || Math.max(1, n(input.workAreaM2)), quantityCount ? "measured inputs" : "m²", quantityCount ? "Item/count-based furniture scope" : "Approximate furnished area", score, drivers, ["Loose furniture and joinery prices vary widely by material, hardware, upholstery, imported components and bespoke design."]);
}

function externalEstimate(input: EstimateInput): EstimateResult {
  const f = specFactor[input.finishLevel];
  const sections: EstimateSection[] = [];
  if (n(input.fenceLengthM)) sections.push({ id: "fence", label: "Boundary fence", low: input.fenceLengthM * 95_000 * f, high: input.fenceLengthM * 220_000 * f, explanation: `${input.fenceLengthM} m boundary fence including typical foundations, wall/columns and basic finish.` });
  if (n(input.gateCount)) sections.push({ id: "gates", label: "Entrance gates", low: input.gateCount * 1_800_000 * f, high: input.gateCount * 7_500_000 * f, explanation: `${input.gateCount} vehicle/pedestrian gate set(s), depending on size and automation.` });
  if (n(input.pavingAreaM2)) sections.push({ id: "paving", label: "Paving / parking / driveway", low: input.pavingAreaM2 * 20_000 * f, high: input.pavingAreaM2 * 52_000 * f, explanation: `${input.pavingAreaM2} m² paving including normal sub-base and laying.` });
  if (n(input.drainageLengthM)) sections.push({ id: "drainage", label: "Surface drainage", low: input.drainageLengthM * 75_000 * f, high: input.drainageLengthM * 230_000 * f, explanation: `${input.drainageLengthM} m drains/channels including excavation and covers where required.` });
  if (n(input.landscapingAreaM2)) sections.push({ id: "landscape", label: "Landscaping", low: input.landscapingAreaM2 * 10_000 * f, high: input.landscapingAreaM2 * 48_000 * f, explanation: `${input.landscapingAreaM2} m² soft/hard landscape allowance.` });
  if (n(input.gatehouseAreaM2)) sections.push({ id: "gatehouse", label: "Gatehouse / security building", low: input.gatehouseAreaM2 * 280_000 * f, high: input.gatehouseAreaM2 * 600_000 * f, explanation: `${input.gatehouseAreaM2} m² gatehouse allowance.` });
  if (n(input.poolAreaM2)) sections.push({ id: "pool", label: "Swimming pool", low: input.poolAreaM2 * 650_000 * f, high: input.poolAreaM2 * 1_350_000 * f, explanation: `${input.poolAreaM2} m² pool water-surface planning allowance including structure, finish and basic plant.` });
  if (n(input.retainingWallAreaM2)) sections.push({ id: "retaining", label: "Retaining walls", low: input.retainingWallAreaM2 * 160_000, high: input.retainingWallAreaM2 * 480_000, explanation: `${input.retainingWallAreaM2} m² retaining wall face; structural design and ground conditions remain critical.` });
  if (n(input.externalLightingPoints)) sections.push({ id: "lighting", label: "External lighting", low: input.externalLightingPoints * 140_000 * f, high: input.externalLightingPoints * 480_000 * f, explanation: `${input.externalLightingPoints} external lighting point(s)/fixtures with cabling allowance.` });
  if (!sections.length) {
    const area = Math.max(1, n(input.workAreaM2));
    sections.push({ id: "site", label: "General external works allowance", low: area * 35_000 * f, high: area * 95_000 * f, explanation: "Temporary area-based allowance until fence, paving, drainage and landscape quantities are entered." });
  }
  const subtotalLow = sections.reduce((s, x) => s + x.low, 0);
  const subtotalHigh = sections.reduce((s, x) => s + x.high, 0);
  sections.push({ id: "earthworks", label: "Earthworks, setting out & preliminaries", low: subtotalLow * 0.06, high: subtotalHigh * 0.14, explanation: "Setting out, minor earthworks, access, mobilisation, disposal and general external-work preliminaries." });
  const qtyCount = [input.fenceLengthM, input.gateCount, input.pavingAreaM2, input.drainageLengthM, input.landscapingAreaM2, input.gatehouseAreaM2, input.poolAreaM2, input.retainingWallAreaM2, input.externalLightingPoints].filter(n).length;
  const score = 60 + (input.location.trim() ? 4 : 0) + Math.min(32, qtyCount * 4) + (n(input.workAreaM2) ? 2 : 0);
  const drivers = [qtyCount ? `${qtyCount} external-work quantities supplied.` : "No measured external-work quantities supplied; area allowance used.", n(input.fenceLengthM) ? "Boundary fence length is priced directly." : "Boundary fence length not entered.", n(input.drainageLengthM) || n(input.retainingWallAreaM2) ? "Drainage/retaining works can be strongly affected by levels and soil conditions." : "No major drainage/retaining quantity entered."];
  return resultFromSections(input, sections, qtyCount || Math.max(1, n(input.workAreaM2)), qtyCount ? "measured inputs" : "m²", qtyCount ? "Measured external-work quantities" : "Approximate external-work area", score, drivers, ["External works are highly sensitive to site levels, drainage outfalls, soil conditions, access and utility conflicts."]);
}

function mepEstimate(input: EstimateInput): EstimateResult {
  const area = Math.max(1, n(input.workAreaM2));
  const f = specFactor[input.finishLevel];
  const sections: EstimateSection[] = [];
  if (n(input.electricalPoints) || n(input.lightingPoints) || n(input.dataPoints)) {
    sections.push({ id: "electrical", label: "Electrical power, lighting & data", low: (input.electricalPoints * 45_000 + input.lightingPoints * 32_000 + input.dataPoints * 38_000) * f, high: (input.electricalPoints * 125_000 + input.lightingPoints * 105_000 + input.dataPoints * 95_000) * f, explanation: `${input.electricalPoints} power point(s), ${input.lightingPoints} lighting point(s), ${input.dataPoints} data/low-current point(s).` });
  }
  if (n(input.mepBathrooms) || n(input.mepKitchens)) sections.push({ id: "plumbing", label: "Plumbing & sanitary services", low: (input.mepBathrooms * 1_100_000 + input.mepKitchens * 480_000) * f, high: (input.mepBathrooms * 4_200_000 + input.mepKitchens * 1_650_000) * f, explanation: `${input.mepBathrooms} bathroom/WC group(s) and ${input.mepKitchens} kitchen service group(s).` });
  if (n(input.acUnits)) {
    const perUnit: Record<EstimateInput["acSpec"], [number, number]> = { none: [0, 0], provision: [150_000, 350_000], split: [420_000, 1_050_000], cassette: [1_100_000, 2_600_000], vrf: [1_800_000, 4_800_000], central: [2_500_000, 6_500_000] };
    const [al, ah] = perUnit[input.acSpec];
    sections.push({ id: "cooling", label: "Air-conditioning / cooling", low: input.acUnits * al * f, high: input.acUnits * ah * f, explanation: `${input.acUnits} cooling unit(s)/zone(s) using ${input.acSpec.replace("-", " ")} basis.` });
  }
  if (n(input.waterHeaters)) sections.push({ id: "heaters", label: "Water heaters", low: input.waterHeaters * 280_000 * f, high: input.waterHeaters * 900_000 * f, explanation: `${input.waterHeaters} water heater(s) including connection allowance.` });
  if (n(input.pumps)) sections.push({ id: "pumps", label: "Pumps & water transfer", low: input.pumps * 380_000, high: input.pumps * 1_400_000, explanation: `${input.pumps} pump set(s) with basic controls.` });
  if (input.includeBorehole) sections.push({ id: "borehole", label: "Borehole & water source", low: 4_000_000, high: 11_000_000, explanation: "Borehole drilling, casing, pump and normal connection allowance; depth/geology can change cost materially." });
  if (input.includeWaterTreatment) sections.push({ id: "treatment", label: "Water treatment", low: 2_000_000, high: 8_500_000, explanation: "Domestic/light-commercial water treatment and storage allowance." });
  if (input.includeSeptic) sections.push({ id: "septic", label: "Septic tank / soakaway", low: 3_000_000, high: 9_000_000, explanation: "Septic/soakaway construction allowance subject to soil and capacity." });
  if (input.includeTreatmentPlant) sections.push({ id: "stp", label: "Sewage treatment plant", low: 8_000_000, high: 32_000_000, explanation: "Packaged/small treatment-plant planning allowance; capacity and discharge requirements remain critical." });
  if (n(input.generatorKva)) sections.push({ id: "generator", label: "Generator system", low: input.generatorKva * 70_000, high: input.generatorKva * 165_000, explanation: `${input.generatorKva} kVA generator capacity including normal accessories/changeover allowance.` });
  if (n(input.inverterKva)) sections.push({ id: "inverter", label: "Inverter / battery backup", low: input.inverterKva * 240_000, high: input.inverterKva * 560_000, explanation: `${input.inverterKva} kVA inverter capacity with battery allowance.` });
  if (n(input.solarKw)) sections.push({ id: "solar", label: "Solar PV system", low: input.solarKw * 650_000, high: input.solarKw * 1_450_000, explanation: `${input.solarKw} kW solar PV/inverter/battery planning allowance.` });
  if (n(input.securityPoints)) sections.push({ id: "security", label: "CCTV / access / security", low: input.securityPoints * 140_000, high: input.securityPoints * 520_000, explanation: `${input.securityPoints} security device/point allowance.` });
  if (n(input.firePoints)) sections.push({ id: "fire", label: "Fire alarm / firefighting", low: input.firePoints * 110_000, high: input.firePoints * 420_000, explanation: `${input.firePoints} fire-system point/device allowance.` });
  if (n(input.mepLifts)) sections.push({ id: "lifts", label: "Lift / vertical transportation", low: input.mepLifts * 35_000_000, high: input.mepLifts * 95_000_000, explanation: `${input.mepLifts} passenger/service lift(s), excluding major structural modifications.` });
  if (!sections.length) sections.push({ id: "mep-allowance", label: "MEP planning allowance", low: area * 65_000 * f, high: area * 175_000 * f, explanation: "Temporary area-based allowance until points, fixtures and equipment quantities are entered." });
  const subtotalLow = sections.reduce((s, x) => s + x.low, 0);
  const subtotalHigh = sections.reduce((s, x) => s + x.high, 0);
  sections.push({ id: "testing", label: "Distribution, controls, testing & commissioning", low: subtotalLow * 0.08, high: subtotalHigh * 0.16, explanation: "Distribution accessories, containment/pipe supports, controls, testing, commissioning and documentation allowance." });

  const qtyCount = [input.electricalPoints, input.lightingPoints, input.dataPoints, input.mepBathrooms, input.mepKitchens, input.acUnits, input.waterHeaters, input.pumps, input.generatorKva, input.inverterKva, input.solarKw, input.securityPoints, input.firePoints, input.mepLifts].filter(n).length + [input.includeBorehole, input.includeWaterTreatment, input.includeSeptic, input.includeTreatmentPlant].filter(Boolean).length;
  const score = 58 + (input.location.trim() ? 4 : 0) + (n(input.workAreaM2) ? 4 : 0) + Math.min(34, qtyCount * 3);
  const drivers = [qtyCount ? `${qtyCount} MEP quantities/capacities supplied.` : "No MEP point/equipment quantities supplied; area allowance used.", n(input.acUnits) ? `${input.acUnits} cooling unit(s)/zone(s) materially affect services cost.` : "No AC unit/zone quantity entered.", n(input.generatorKva) || n(input.inverterKva) || n(input.solarKw) ? "Backup/renewable power capacity is priced separately." : "No backup-power capacity entered."];
  return resultFromSections(input, sections, qtyCount || area, qtyCount ? "measured inputs" : "m²", qtyCount ? "Point, fixture & equipment quantities" : "Approximate serviced area", score, drivers, ["MEP cost depends heavily on equipment brands, cable/pipe routes, distribution-board strategy, redundancy, pressure/head requirements and utility availability."]);
}

export function calculateEstimateV2(input: EstimateInput): EstimateResult {
  switch (input.category as EstimateCategory) {
    case "new-building": return buildingEstimate(input);
    case "structural-steel": return steelEstimate(input);
    case "renovation": return renovationEstimate(input);
    case "finishes": return finishesEstimate(input);
    case "furniture": return furnitureEstimate(input);
    case "external-works": return externalEstimate(input);
    case "mep-services": return mepEstimate(input);
    default: return buildingEstimate(input);
  }
}
