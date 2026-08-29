import type {
  BillAssumption,
  BillItem,
  BillSection,
  ProcurementItem,
} from "@/lib/billing/models";
import {
  convertConcreteVolumeToMaterials,
  convertMortarVolumeToMaterials,
} from "@/lib/fence/material-converter";
import type {
  ConcreteMixSpecification,
  RatioBasedMortarMixSpecification,
} from "@/lib/fence/types";

export type ResidentialSubstructureInput = {
  buildingLengthM: number;
  buildingWidthM: number;
  internalFoundationLengthM: number;
  siteClearanceAreaM2: number;
  trenchWidthM: number;
  trenchDepthM: number;
  footingWidthM: number;
  footingThicknessM: number;
  foundationWallHeightM: number;
  foundationWallThicknessM: number;
  floorFillDepthM: number;
  hardcoreDepthM: number;
  blindingThicknessM: number;
  slabThicknessM: number;
  dpmOverlapPercent: number;
  excavationSwellPercent: number;
  blockWastagePercent: number;
  mortarWastagePercent: number;
  includeGroundBeam: boolean;
  groundBeamLengthM: number;
  groundBeamWidthM: number;
  groundBeamDepthM: number;
  groundBeamRebarKgPerM3: number;
  includeSlabMesh: boolean;
  slabMeshType: "A142" | "A193";
  slabMeshWastagePercent: number;
};

export type ResidentialSubstructureQuantities = {
  footprintAreaM2: number;
  externalFoundationLengthM: number;
  totalFoundationLengthM: number;
  siteClearanceAreaM2: number;
  trenchExcavationM3: number;
  stripFootingConcreteM3: number;
  foundationBlockworkAreaM2: number;
  foundationBlockworkVolumeM3: number;
  trenchBackfillM3: number;
  surplusSpoilM3: number;
  floorFillM3: number;
  hardcoreM3: number;
  blindingConcreteM3: number;
  dpmAreaM2: number;
  dpcLengthM: number;
  antiTermiteAreaM2: number;
  slabConcreteM3: number;
  groundBeamConcreteM3: number;
  groundBeamReinforcementKg: number;
  groundBeamFormworkM2: number;
  slabMeshAreaM2: number;
  slabMeshSheets: number;
  foundationBlocks: number;
};

export type ResidentialSubstructureResult = {
  calculationId: string;
  quantities: ResidentialSubstructureQuantities;
  sections: BillSection[];
  materials: ProcurementItem[];
  assumptions: BillAssumption[];
};

const round = (value: number, precision = 3) =>
  Number(value.toFixed(precision));

const positive = (label: string, value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return value;
};

const nonNegative = (label: string, value: number) => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
  return value;
};

const concreteMix = (
  id: string,
  name: string,
  cementRatio: number,
  sandRatio: number,
  aggregateRatio: number,
): ConcreteMixSpecification => ({
  id,
  name,
  materialType: "concrete",
  calculationMethod: "ratio-based",
  cementRatio,
  sandRatio,
  coarseAggregateRatio: aggregateRatio,
  dryVolumeFactor: 1.54,
  cementBagWeightKg: 50,
  cementBagVolumeM3: 0.0347,
  waterCementRatioByWeight: 0.5,
});

const structuralConcreteMix = concreteMix(
  "residential-substructure-1-2-4",
  "1:2:4 concrete",
  1,
  2,
  4,
);

const blindingMix = concreteMix(
  "residential-substructure-1-3-6",
  "1:3:6 blinding concrete",
  1,
  3,
  6,
);

const mortarMix: RatioBasedMortarMixSpecification = {
  id: "residential-substructure-mortar-1-6",
  name: "1:6 blockwork mortar",
  materialType: "mortar",
  calculationMethod: "ratio-based",
  cementRatio: 1,
  sandRatio: 6,
  dryVolumeFactor: 1.33,
  cementBagWeightKg: 50,
  cementBagVolumeM3: 0.0347,
  waterCementRatioByWeight: 0.65,
};

const billItem = (input: {
  id: string;
  calculationId: string;
  description: string;
  unit: string;
  quantity: number;
  module: string;
  code?: string;
  notes?: string;
}): BillItem => ({
  id: input.id,
  sourceCalculationId: input.calculationId,
  sourceModule: input.module,
  itemCode: input.code ?? null,
  description: input.description,
  unit: input.unit,
  calculatedQuantity: round(input.quantity),
  billQuantity: round(input.quantity),
  materialRate: null,
  labourRate: null,
  plantRate: null,
  otherRate: null,
  allInRate: null,
  amount: null,
  notes: input.notes ?? null,
});

const material = (input: {
  id: string;
  materialId: string;
  calculationId: string;
  module: string;
  description: string;
  unit: string;
  calculated: number;
  purchase: number;
  wastagePercent?: number;
  notes?: string;
  bulkPurchase?: ProcurementItem["bulkPurchase"];
}): ProcurementItem => ({
  id: input.id,
  materialId: input.materialId,
  sourceCalculationId: input.calculationId,
  sourceModule: input.module,
  description: input.description,
  unit: input.unit,
  calculatedQuantity: round(input.calculated, 6),
  wastagePercent: input.wastagePercent ?? 0,
  purchaseQuantity: round(input.purchase, 6),
  bulkPurchase: input.bulkPurchase ?? null,
  notes: input.notes ?? null,
});

const addConcreteMaterials = (
  collection: ProcurementItem[],
  input: {
    calculationId: string;
    prefix: string;
    description: string;
    volumeM3: number;
    mix: ConcreteMixSpecification;
    wastagePercent: number;
  },
) => {
  if (input.volumeM3 <= 0) return;
  const wetVolume = input.volumeM3 * (1 + input.wastagePercent / 100);
  const result = convertConcreteVolumeToMaterials({
    wetVolumeM3: wetVolume,
    mix: input.mix,
  });
  const note = `${input.mix.name}; ${input.wastagePercent}% concrete material allowance included.`;
  collection.push(
    material({
      id: `${input.prefix}:cement`,
      materialId: "cement-50kg",
      calculationId: input.calculationId,
      module: "concrete",
      description: `Cement for ${input.description}`,
      unit: "bag",
      calculated: result.calculatedCementBagQuantity,
      purchase: Math.ceil(result.calculatedCementBagQuantity),
      wastagePercent: input.wastagePercent,
      notes: note,
    }),
    material({
      id: `${input.prefix}:sand`,
      materialId: "sharp-sand",
      calculationId: input.calculationId,
      module: "concrete",
      description: `Sharp sand for ${input.description}`,
      unit: "m³",
      calculated: result.sandVolumeM3,
      purchase: result.sandVolumeM3,
      wastagePercent: input.wastagePercent,
      bulkPurchase: {
        densityTonnesPerM3: 1.6,
        truckCapacity: 30,
        truckCapacityBasis: "tonnes",
      },
    }),
    material({
      id: `${input.prefix}:aggregate`,
      materialId: "granite-aggregate",
      calculationId: input.calculationId,
      module: "concrete",
      description: `Granite aggregate for ${input.description}`,
      unit: "m³",
      calculated: result.coarseAggregateVolumeM3,
      purchase: result.coarseAggregateVolumeM3,
      wastagePercent: input.wastagePercent,
      bulkPurchase: {
        densityTonnesPerM3: 1.6,
        truckCapacity: 30,
        truckCapacityBasis: "tonnes",
      },
    }),
    material({
      id: `${input.prefix}:water`,
      materialId: "water",
      calculationId: input.calculationId,
      module: "concrete",
      description: `Construction water for ${input.description}`,
      unit: "litre",
      calculated: result.waterLitres,
      purchase: result.waterLitres,
      wastagePercent: input.wastagePercent,
    }),
  );
};

export const DEFAULT_RESIDENTIAL_SUBSTRUCTURE_INPUT: ResidentialSubstructureInput = {
  buildingLengthM: 12,
  buildingWidthM: 15,
  internalFoundationLengthM: 30,
  siteClearanceAreaM2: 450,
  trenchWidthM: 0.75,
  trenchDepthM: 0.9,
  footingWidthM: 0.675,
  footingThicknessM: 0.225,
  foundationWallHeightM: 0.675,
  foundationWallThicknessM: 0.225,
  floorFillDepthM: 0.3,
  hardcoreDepthM: 0.15,
  blindingThicknessM: 0.05,
  slabThicknessM: 0.1,
  dpmOverlapPercent: 10,
  excavationSwellPercent: 20,
  blockWastagePercent: 5,
  mortarWastagePercent: 10,
  includeGroundBeam: true,
  groundBeamLengthM: 84,
  groundBeamWidthM: 0.225,
  groundBeamDepthM: 0.3,
  groundBeamRebarKgPerM3: 120,
  includeSlabMesh: true,
  slabMeshType: "A142",
  slabMeshWastagePercent: 10,
};

export function calculateResidentialSubstructure(
  raw: ResidentialSubstructureInput,
  projectId = "residential-project",
): ResidentialSubstructureResult {
  const input = {
    ...raw,
    buildingLengthM: positive("Building length", raw.buildingLengthM),
    buildingWidthM: positive("Building width", raw.buildingWidthM),
    internalFoundationLengthM: nonNegative("Internal foundation length", raw.internalFoundationLengthM),
    siteClearanceAreaM2: positive("Site clearance area", raw.siteClearanceAreaM2),
    trenchWidthM: positive("Trench width", raw.trenchWidthM),
    trenchDepthM: positive("Trench depth", raw.trenchDepthM),
    footingWidthM: positive("Footing width", raw.footingWidthM),
    footingThicknessM: positive("Footing thickness", raw.footingThicknessM),
    foundationWallHeightM: positive("Foundation wall height", raw.foundationWallHeightM),
    foundationWallThicknessM: positive("Foundation wall thickness", raw.foundationWallThicknessM),
    floorFillDepthM: nonNegative("Floor filling depth", raw.floorFillDepthM),
    hardcoreDepthM: nonNegative("Hardcore depth", raw.hardcoreDepthM),
    blindingThicknessM: nonNegative("Blinding thickness", raw.blindingThicknessM),
    slabThicknessM: positive("Slab thickness", raw.slabThicknessM),
    dpmOverlapPercent: nonNegative("DPM overlap", raw.dpmOverlapPercent),
    excavationSwellPercent: nonNegative("Excavation swell", raw.excavationSwellPercent),
    blockWastagePercent: nonNegative("Block wastage", raw.blockWastagePercent),
    mortarWastagePercent: nonNegative("Mortar wastage", raw.mortarWastagePercent),
    groundBeamLengthM: raw.includeGroundBeam ? positive("Ground beam length", raw.groundBeamLengthM) : 0,
    groundBeamWidthM: raw.includeGroundBeam ? positive("Ground beam width", raw.groundBeamWidthM) : 0,
    groundBeamDepthM: raw.includeGroundBeam ? positive("Ground beam depth", raw.groundBeamDepthM) : 0,
    groundBeamRebarKgPerM3: raw.includeGroundBeam ? positive("Ground beam reinforcement allowance", raw.groundBeamRebarKgPerM3) : 0,
    slabMeshWastagePercent: nonNegative("Slab mesh wastage", raw.slabMeshWastagePercent),
  };

  if (input.footingWidthM > input.trenchWidthM) {
    throw new Error("Footing width cannot exceed trench width for this strip-foundation model.");
  }

  const calculationId = `${projectId}:residential-substructure-strip-v1`;
  const footprintAreaM2 = input.buildingLengthM * input.buildingWidthM;
  const externalFoundationLengthM = 2 * (input.buildingLengthM + input.buildingWidthM);
  const totalFoundationLengthM = externalFoundationLengthM + input.internalFoundationLengthM;
  const trenchExcavationM3 = totalFoundationLengthM * input.trenchWidthM * input.trenchDepthM;
  const stripFootingConcreteM3 = totalFoundationLengthM * input.footingWidthM * input.footingThicknessM;
  const foundationBlockworkAreaM2 = totalFoundationLengthM * input.foundationWallHeightM;
  const foundationBlockworkVolumeM3 = foundationBlockworkAreaM2 * input.foundationWallThicknessM;
  const groundBeamConcreteM3 = input.includeGroundBeam
    ? input.groundBeamLengthM * input.groundBeamWidthM * input.groundBeamDepthM
    : 0;
  const groundBeamReinforcementKg = input.includeGroundBeam
    ? groundBeamConcreteM3 * input.groundBeamRebarKgPerM3
    : 0;
  const groundBeamFormworkM2 = input.includeGroundBeam
    ? input.groundBeamLengthM * input.groundBeamDepthM * 2
    : 0;
  const trenchBackfillM3 = Math.max(
    0,
    trenchExcavationM3 - stripFootingConcreteM3 - foundationBlockworkVolumeM3 - groundBeamConcreteM3,
  );
  const compactedSpoilM3 = Math.max(0, trenchExcavationM3 - trenchBackfillM3);
  const surplusSpoilM3 = compactedSpoilM3 * (1 + input.excavationSwellPercent / 100);
  const floorFillM3 = footprintAreaM2 * input.floorFillDepthM;
  const hardcoreM3 = footprintAreaM2 * input.hardcoreDepthM;
  const blindingConcreteM3 = footprintAreaM2 * input.blindingThicknessM;
  const dpmAreaM2 = footprintAreaM2 * (1 + input.dpmOverlapPercent / 100);
  const dpcLengthM = totalFoundationLengthM;
  const antiTermiteAreaM2 = footprintAreaM2;
  const slabConcreteM3 = footprintAreaM2 * input.slabThicknessM;
  const foundationBlocks = Math.ceil(
    foundationBlockworkAreaM2 * 10 * (1 + input.blockWastagePercent / 100),
  );
  const slabMeshAreaM2 = input.includeSlabMesh
    ? footprintAreaM2 * (1 + input.slabMeshWastagePercent / 100)
    : 0;
  const meshSheetAreaM2 = 2.4 * 4.8;
  const slabMeshSheets = input.includeSlabMesh
    ? Math.ceil(slabMeshAreaM2 / meshSheetAreaM2)
    : 0;

  const quantities: ResidentialSubstructureQuantities = {
    footprintAreaM2: round(footprintAreaM2),
    externalFoundationLengthM: round(externalFoundationLengthM),
    totalFoundationLengthM: round(totalFoundationLengthM),
    siteClearanceAreaM2: round(input.siteClearanceAreaM2),
    trenchExcavationM3: round(trenchExcavationM3),
    stripFootingConcreteM3: round(stripFootingConcreteM3),
    foundationBlockworkAreaM2: round(foundationBlockworkAreaM2),
    foundationBlockworkVolumeM3: round(foundationBlockworkVolumeM3),
    trenchBackfillM3: round(trenchBackfillM3),
    surplusSpoilM3: round(surplusSpoilM3),
    floorFillM3: round(floorFillM3),
    hardcoreM3: round(hardcoreM3),
    blindingConcreteM3: round(blindingConcreteM3),
    dpmAreaM2: round(dpmAreaM2),
    dpcLengthM: round(dpcLengthM),
    antiTermiteAreaM2: round(antiTermiteAreaM2),
    slabConcreteM3: round(slabConcreteM3),
    groundBeamConcreteM3: round(groundBeamConcreteM3),
    groundBeamReinforcementKg: round(groundBeamReinforcementKg),
    groundBeamFormworkM2: round(groundBeamFormworkM2),
    slabMeshAreaM2: round(slabMeshAreaM2),
    slabMeshSheets,
    foundationBlocks,
  };

  const sections: BillSection[] = [
    {
      id: "substructure-site-earthworks",
      title: "Substructure — Site Preparation & Earthworks",
      items: [
        billItem({ id: `${calculationId}:clear`, calculationId, description: "Clear site within working area", unit: "m²", quantity: quantities.siteClearanceAreaM2, module: "excavation", code: "EARTH-CLEAR" }),
        billItem({ id: `${calculationId}:excavate`, calculationId, description: `Excavate strip-foundation trenches ${round(input.trenchWidthM)} m wide × ${round(input.trenchDepthM)} m deep`, unit: "m³", quantity: quantities.trenchExcavationM3, module: "excavation", code: "EARTH-EXC" }),
        billItem({ id: `${calculationId}:backfill`, calculationId, description: "Return, fill and compact selected excavated material around foundations", unit: "m³", quantity: quantities.trenchBackfillM3, module: "excavation", code: "EARTH-FILL" }),
        billItem({ id: `${calculationId}:dispose`, calculationId, description: "Load and dispose surplus excavated material", unit: "m³", quantity: quantities.surplusSpoilM3, module: "excavation", code: "EARTH-DISP", notes: `${input.excavationSwellPercent}% loose-volume swell allowance.` }),
        billItem({ id: `${calculationId}:floor-fill`, calculationId, description: `Approved filling under ground floor, average ${round(input.floorFillDepthM)} m compacted depth`, unit: "m³", quantity: quantities.floorFillM3, module: "excavation", code: "EARTH-FILL" }),
        billItem({ id: `${calculationId}:hardcore`, calculationId, description: `Hardcore filling under ground floor, ${round(input.hardcoreDepthM)} m compacted depth`, unit: "m³", quantity: quantities.hardcoreM3, module: "specialist", code: "EARTH-HARDCORE" }),
        billItem({ id: `${calculationId}:anti-termite`, calculationId, description: "Anti-termite treatment to prepared ground", unit: "m²", quantity: quantities.antiTermiteAreaM2, module: "specialist", code: "SUB-ANTITERMITE" }),
      ].filter((item) => item.billQuantity > 0),
    },
    {
      id: "substructure-concrete",
      title: "Substructure — Concrete",
      items: [
        billItem({ id: `${calculationId}:footing`, calculationId, description: `Plain concrete strip footing ${round(input.footingWidthM)} m wide × ${round(input.footingThicknessM)} m thick`, unit: "m³", quantity: quantities.stripFootingConcreteM3, module: "concrete", code: "CONC" }),
        billItem({ id: `${calculationId}:blinding`, calculationId, description: `Weak concrete blinding under ground floor, ${round(input.blindingThicknessM * 1000)} mm thick`, unit: "m³", quantity: quantities.blindingConcreteM3, module: "concrete", code: "CONC-BLIND" }),
        ...(input.includeGroundBeam ? [billItem({ id: `${calculationId}:ground-beam-concrete`, calculationId, description: `Reinforced concrete ground beam ${round(input.groundBeamWidthM * 1000)} × ${round(input.groundBeamDepthM * 1000)} mm`, unit: "m³", quantity: quantities.groundBeamConcreteM3, module: "concrete", code: "CONC-RC" })] : []),
        billItem({ id: `${calculationId}:slab`, calculationId, description: `Ground-floor concrete slab ${round(input.slabThicknessM * 1000)} mm thick`, unit: "m³", quantity: quantities.slabConcreteM3, module: "concrete", code: "CONC-RC" }),
      ].filter((item) => item.billQuantity > 0),
    },
    {
      id: "substructure-masonry-membranes",
      title: "Substructure — Foundation Walling & Membranes",
      items: [
        billItem({ id: `${calculationId}:foundation-blockwork`, calculationId, description: `${round(input.foundationWallThicknessM * 1000)} mm sandcrete block foundation walling`, unit: "m²", quantity: quantities.foundationBlockworkAreaM2, module: "blockwork", code: "BLK-225" }),
        billItem({ id: `${calculationId}:dpc`, calculationId, description: `${round(input.foundationWallThicknessM * 1000)} mm wide damp-proof course`, unit: "m", quantity: quantities.dpcLengthM, module: "specialist", code: "SUB-DPC" }),
        billItem({ id: `${calculationId}:dpm`, calculationId, description: "Damp-proof membrane to ground floor including laps", unit: "m²", quantity: quantities.dpmAreaM2, module: "specialist", code: "SUB-DPM" }),
      ],
    },
    {
      id: "substructure-reinforcement-formwork",
      title: "Substructure — Reinforcement & Formwork",
      items: [
        ...(input.includeGroundBeam ? [
          billItem({ id: `${calculationId}:ground-beam-rebar`, calculationId, description: `High-yield reinforcement to ground beams; planning allowance ${round(input.groundBeamRebarKgPerM3)} kg/m³`, unit: "kg", quantity: quantities.groundBeamReinforcementKg, module: "reinforcement", code: "REBAR-Y12" }),
          billItem({ id: `${calculationId}:ground-beam-formwork`, calculationId, description: "Formwork to vertical sides of ground beams", unit: "m²", quantity: quantities.groundBeamFormworkM2, module: "formwork", code: "FORM" }),
        ] : []),
        ...(input.includeSlabMesh ? [billItem({ id: `${calculationId}:slab-mesh`, calculationId, description: `${input.slabMeshType} welded reinforcement mesh to ground-floor slab including laps`, unit: "m²", quantity: quantities.slabMeshAreaM2, module: "reinforcement", code: `REBAR-${input.slabMeshType}` })] : []),
      ],
    },
  ].filter((section) => section.items.length > 0);

  const materials: ProcurementItem[] = [];
  addConcreteMaterials(materials, {
    calculationId,
    prefix: `${calculationId}:footing-materials`,
    description: "strip footing",
    volumeM3: stripFootingConcreteM3,
    mix: structuralConcreteMix,
    wastagePercent: 5,
  });
  addConcreteMaterials(materials, {
    calculationId,
    prefix: `${calculationId}:blinding-materials`,
    description: "ground-floor blinding",
    volumeM3: blindingConcreteM3,
    mix: blindingMix,
    wastagePercent: 5,
  });
  addConcreteMaterials(materials, {
    calculationId,
    prefix: `${calculationId}:ground-beam-materials`,
    description: "ground beam",
    volumeM3: groundBeamConcreteM3,
    mix: structuralConcreteMix,
    wastagePercent: 5,
  });
  addConcreteMaterials(materials, {
    calculationId,
    prefix: `${calculationId}:slab-materials`,
    description: "ground-floor slab",
    volumeM3: slabConcreteM3,
    mix: structuralConcreteMix,
    wastagePercent: 5,
  });

  const mortarWetVolumeM3 = foundationBlockworkAreaM2 * 0.015 * (1 + input.mortarWastagePercent / 100);
  const mortarMaterials = convertMortarVolumeToMaterials({
    wetVolumeM3: mortarWetVolumeM3,
    mix: mortarMix,
  });
  materials.push(
    material({ id: `${calculationId}:blocks`, materialId: "block-225", calculationId, module: "blockwork", description: "225 mm sandcrete foundation blocks", unit: "nr", calculated: foundationBlockworkAreaM2 * 10, purchase: foundationBlocks, wastagePercent: input.blockWastagePercent }),
    material({ id: `${calculationId}:mortar-cement`, materialId: "cement-50kg", calculationId, module: "blockwork", description: "Cement for foundation blockwork mortar", unit: "bag", calculated: mortarMaterials.calculatedCementBagQuantity, purchase: Math.ceil(mortarMaterials.calculatedCementBagQuantity), wastagePercent: input.mortarWastagePercent }),
    material({ id: `${calculationId}:mortar-sand`, materialId: "sharp-sand", calculationId, module: "blockwork", description: "Sharp sand for foundation blockwork mortar", unit: "m³", calculated: mortarMaterials.sandVolumeM3, purchase: mortarMaterials.sandVolumeM3, wastagePercent: input.mortarWastagePercent, bulkPurchase: { densityTonnesPerM3: 1.6, truckCapacity: 30, truckCapacityBasis: "tonnes" } }),
    material({ id: `${calculationId}:mortar-water`, materialId: "water", calculationId, module: "blockwork", description: "Water for foundation blockwork mortar", unit: "litre", calculated: mortarMaterials.waterLitres, purchase: mortarMaterials.waterLitres, wastagePercent: input.mortarWastagePercent }),
    material({ id: `${calculationId}:floor-fill-material`, materialId: "laterite", calculationId, module: "excavation", description: "Approved lateritic filling under floor", unit: "m³", calculated: floorFillM3, purchase: floorFillM3 * 1.1, wastagePercent: 10, bulkPurchase: { densityTonnesPerM3: 1.7, truckCapacity: 30, truckCapacityBasis: "tonnes" } }),
    material({ id: `${calculationId}:hardcore-material`, materialId: "hardcore", calculationId, module: "specialist", description: "Hardcore filling", unit: "m³", calculated: hardcoreM3, purchase: hardcoreM3 * 1.08, wastagePercent: 8, bulkPurchase: { densityTonnesPerM3: 1.6, truckCapacity: 30, truckCapacityBasis: "tonnes" } }),
    material({ id: `${calculationId}:dpc-material`, materialId: "dpc-roll", calculationId, module: "specialist", description: `${round(input.foundationWallThicknessM * 1000)} mm DPC`, unit: "m", calculated: dpcLengthM, purchase: dpcLengthM * 1.05, wastagePercent: 5 }),
    material({ id: `${calculationId}:dpm-material`, materialId: "dpm-1000", calculationId, module: "specialist", description: "DPM / polythene membrane", unit: "m²", calculated: footprintAreaM2, purchase: dpmAreaM2, wastagePercent: input.dpmOverlapPercent }),
  );

  if (input.includeGroundBeam) {
    materials.push(
      material({ id: `${calculationId}:ground-beam-rebar-material`, materialId: "reinforcement-steel", calculationId, module: "reinforcement", description: "High-yield reinforcement for ground beams", unit: "kg", calculated: groundBeamReinforcementKg, purchase: groundBeamReinforcementKg * 1.05, wastagePercent: 5 }),
      material({ id: `${calculationId}:ground-beam-wire`, materialId: "binding-wire", calculationId, module: "reinforcement", description: "Binding wire for ground-beam reinforcement", unit: "kg", calculated: groundBeamReinforcementKg * 0.015, purchase: groundBeamReinforcementKg * 0.015 * 1.05, wastagePercent: 5 }),
    );
  }
  if (input.includeSlabMesh) {
    materials.push(
      material({ id: `${calculationId}:slab-mesh-material`, materialId: input.slabMeshType === "A142" ? "brc-a142-sheet" : "brc-a193-sheet", calculationId, module: "reinforcement", description: `${input.slabMeshType} BRC mesh 2.4 × 4.8 m`, unit: "sheet", calculated: slabMeshAreaM2 / meshSheetAreaM2, purchase: slabMeshSheets, wastagePercent: input.slabMeshWastagePercent }),
    );
  }

  const assumptions: BillAssumption[] = [
    { id: `${calculationId}:foundation-system`, label: "Foundation system", value: "Rectangular residential strip foundation with user-entered internal wall length." },
    { id: `${calculationId}:geometry`, label: "Building footprint", value: `${round(input.buildingLengthM)} m × ${round(input.buildingWidthM)} m = ${quantities.footprintAreaM2} m².` },
    { id: `${calculationId}:foundation-length`, label: "Measured foundation length", value: `External perimeter ${quantities.externalFoundationLengthM} m + internal foundation walls ${round(input.internalFoundationLengthM)} m = ${quantities.totalFoundationLengthM} m.` },
    { id: `${calculationId}:block`, label: "Foundation blocks", value: `225 mm blockwork at 10 blocks/m² plus ${input.blockWastagePercent}% wastage.` },
    { id: `${calculationId}:mortar`, label: "Blockwork mortar", value: `0.015 m³ mortar per m², 1:6 cement:sand, plus ${input.mortarWastagePercent}% wastage.` },
    { id: `${calculationId}:concrete`, label: "Concrete mixes", value: "1:2:4 for footing, ground beam and slab; 1:3:6 for blinding; 5% material allowance." },
    { id: `${calculationId}:spoil`, label: "Spoil disposal", value: `Surplus solid excavation converted to loose disposal volume with ${input.excavationSwellPercent}% swell.` },
    ...(input.includeGroundBeam ? [{ id: `${calculationId}:beam-steel`, label: "Ground-beam reinforcement planning allowance", value: `${input.groundBeamRebarKgPerM3} kg of reinforcement per m³ of ground-beam concrete. Replace with structural schedule when available.` }] : []),
    ...(input.includeSlabMesh ? [{ id: `${calculationId}:mesh`, label: "Ground-floor reinforcement", value: `${input.slabMeshType} BRC 2.4 × 4.8 m sheets; ${input.slabMeshWastagePercent}% lap/wastage allowance.` }] : []),
  ];

  return { calculationId, quantities, sections, materials, assumptions };
}
