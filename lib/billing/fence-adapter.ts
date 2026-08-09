import {
  calculateBlockPillarColumnQuantities,
  calculateReinforcedConcreteColumnQuantities,
} from "../fence/column-quantity-calculator";
import {
  createFenceColumnSpecifications,
  normalizeFenceBoqProfile,
  type FenceBoqProfile,
} from "../fence/fence-boq-profile";
import {
  convertConcreteVolumeToMaterials,
  convertMortarVolumeToMaterials,
} from "../fence/material-converter";
import type {
  ColumnConstructionSystem,
  ColumnSpecification,
  ConcreteMixSpecification,
  FenceSection,
  FenceSectionPhysicalLayoutResult,
  MortarMixSpecification,
} from "../fence/types";
import type {
  BillAssumption,
  BillItem,
  BillSection,
  ProcurementItem,
} from "./models";

export type BillingFenceSection = FenceSection & {
  constructionSystem?: ColumnConstructionSystem;
  boqProfile?: Partial<FenceBoqProfile>;
};

const round = (value: number, precision = 3) =>
  Number(value.toFixed(precision));

const rebarWeightKg = (lengthM: number, diameterMm: number) =>
  lengthM * (diameterMm ** 2 / 162);

function workItem(input: {
  id: string;
  calculationId: string;
  module: string;
  description: string;
  unit: string;
  quantity: number;
  code?: string;
  notes?: string;
}): BillItem {
  return {
    id: input.id,
    sourceCalculationId: input.calculationId,
    sourceModule: input.module,
    itemCode: input.code,
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
    notes: input.notes,
  };
}

function material(input: {
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
}): ProcurementItem {
  return {
    id: input.id,
    materialId: input.materialId,
    sourceCalculationId: input.calculationId,
    sourceModule: input.module,
    description: input.description,
    unit: input.unit,
    calculatedQuantity: round(input.calculated, 6),
    wastagePercent: input.wastagePercent ?? 0,
    purchaseQuantity: round(input.purchase, 6),
    notes: input.notes,
  };
}

function parseRatio(value: string, fallback: number[]): number[] {
  const parts = value
    .split(":")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part) && part >= 0);
  return parts.length >= 2 && parts[0] > 0 ? parts : fallback;
}

function concreteMix(value: string): ConcreteMixSpecification {
  const [cementRatio, sandRatio, coarseAggregateRatio = 0] = parseRatio(
    value,
    [1, 2, 4],
  );
  return {
    id: `concrete-${value.replaceAll(":", "-")}`,
    name: `${value} concrete`,
    materialType: "concrete",
    calculationMethod: "ratio-based",
    cementRatio,
    sandRatio,
    coarseAggregateRatio,
    dryVolumeFactor: 1.54,
    cementBagWeightKg: 50,
    cementBagVolumeM3: 0.0347,
    waterCementRatioByWeight: 0.5,
  };
}

function mortarMix(value: string): MortarMixSpecification {
  const [cementRatio, sandRatio] = parseRatio(value, [1, 6]);
  return {
    id: `mortar-${value.replaceAll(":", "-")}`,
    name: `${value} mortar`,
    materialType: "mortar",
    calculationMethod: "ratio-based",
    cementRatio,
    sandRatio,
    dryVolumeFactor: 1.33,
    cementBagWeightKg: 50,
    cementBagVolumeM3: 0.0347,
    waterCementRatioByWeight: 0.5,
  };
}

function addConcreteMaterials(input: {
  materials: ProcurementItem[];
  calculationId: string;
  prefix: string;
  name: string;
  basicVolumeM3: number;
  mixRatio: string;
  wastagePercent: number;
}) {
  const finalVolume = input.basicVolumeM3 * (1 + input.wastagePercent / 100);
  if (finalVolume <= 0) return;
  const result = convertConcreteVolumeToMaterials({
    wetVolumeM3: finalVolume,
    mix: concreteMix(input.mixRatio),
  });
  const common = {
    calculationId: input.calculationId,
    module: "concrete",
    wastagePercent: input.wastagePercent,
  };
  input.materials.push(
    material({
      ...common,
      id: `${input.prefix}:cement`,
      materialId: "cement-50kg",
      description: `Cement for ${input.name}`,
      unit: "bag",
      calculated: result.calculatedCementBagQuantity,
      purchase: Math.ceil(result.calculatedCementBagQuantity),
      notes: `${input.mixRatio} mix; ${input.wastagePercent}% concrete wastage included.`,
    }),
    material({
      ...common,
      id: `${input.prefix}:sand`,
      materialId: "sharp-sand",
      description: `Sharp sand for ${input.name}`,
      unit: "m³",
      calculated: result.sandVolumeM3,
      purchase: result.sandVolumeM3,
    }),
    material({
      ...common,
      id: `${input.prefix}:aggregate`,
      materialId: "granite-aggregate",
      description: `Granite aggregate for ${input.name}`,
      unit: "m³",
      calculated: result.coarseAggregateVolumeM3,
      purchase: result.coarseAggregateVolumeM3,
    }),
    material({
      ...common,
      id: `${input.prefix}:water`,
      materialId: "water",
      description: `Water for ${input.name}`,
      unit: "litre",
      calculated: result.waterLitres,
      purchase: result.waterLitres,
    }),
  );
}

function addMortarMaterials(input: {
  materials: ProcurementItem[];
  calculationId: string;
  prefix: string;
  name: string;
  basicVolumeM3: number;
  mixRatio: string;
  wastagePercent: number;
}) {
  const finalVolume = input.basicVolumeM3 * (1 + input.wastagePercent / 100);
  if (finalVolume <= 0) return;
  const result = convertMortarVolumeToMaterials({
    wetVolumeM3: finalVolume,
    mix: mortarMix(input.mixRatio),
  });
  input.materials.push(
    material({
      id: `${input.prefix}:cement`,
      materialId: "cement-50kg",
      calculationId: input.calculationId,
      module: "blockwork",
      description: `Cement for ${input.name}`,
      unit: "bag",
      calculated: result.calculatedCementBagQuantity,
      purchase: Math.ceil(result.calculatedCementBagQuantity),
      wastagePercent: input.wastagePercent,
      notes: `${input.mixRatio} mortar; ${input.wastagePercent}% mortar wastage included.`,
    }),
    material({
      id: `${input.prefix}:sand`,
      materialId: "sharp-sand",
      calculationId: input.calculationId,
      module: "blockwork",
      description: `Sharp sand for ${input.name}`,
      unit: "m³",
      calculated: result.sandVolumeM3,
      purchase: result.sandVolumeM3,
    }),
    material({
      id: `${input.prefix}:water`,
      materialId: "water",
      calculationId: input.calculationId,
      module: "blockwork",
      description: `Water for ${input.name}`,
      unit: "litre",
      calculated: result.waterLitres,
      purchase: result.waterLitres,
    }),
  );
}

function addBlocks(input: {
  materials: ProcurementItem[];
  calculationId: string;
  prefix: string;
  name: string;
  basicQuantity: number;
  wastagePercent: number;
}) {
  if (input.basicQuantity <= 0) return;
  input.materials.push(
    material({
      id: `${input.prefix}:blocks`,
      materialId: "block-225",
      calculationId: input.calculationId,
      module: "blockwork",
      description: `225 mm sandcrete blocks for ${input.name}`,
      unit: "number",
      calculated: input.basicQuantity,
      purchase: Math.ceil(
        input.basicQuantity * (1 + input.wastagePercent / 100),
      ),
      wastagePercent: input.wastagePercent,
      notes: "Purchase quantity rounded up to whole blocks.",
    }),
  );
}

function addRebarMaterials(input: {
  materials: ProcurementItem[];
  calculationId: string;
  prefix: string;
  name: string;
  diameterMm: number;
  basicWeightKg: number;
  wastagePercent: number;
}) {
  if (input.basicWeightKg <= 0 || input.diameterMm <= 0) return;
  const purchase = input.basicWeightKg * (1 + input.wastagePercent / 100);
  input.materials.push(
    material({
      id: `${input.prefix}:y${input.diameterMm}`,
      materialId: `reinforcement-y${input.diameterMm}`,
      calculationId: input.calculationId,
      module: "reinforcement",
      description: `Y${input.diameterMm} reinforcement for ${input.name}`,
      unit: "kg",
      calculated: input.basicWeightKg,
      purchase,
      wastagePercent: input.wastagePercent,
    }),
  );
}

function addFormworkMaterials(input: {
  materials: ProcurementItem[];
  calculationId: string;
  prefix: string;
  name: string;
  areaM2: number;
  wastagePercent: number;
}) {
  if (input.areaM2 <= 0) return;
  const sheetArea = 2.88;
  const sheets = input.areaM2 / sheetArea;
  input.materials.push(
    material({
      id: `${input.prefix}:sheets`,
      materialId: "formwork-sheet",
      calculationId: input.calculationId,
      module: "formwork",
      description: `Formwork plywood for ${input.name}`,
      unit: "sheet",
      calculated: sheets,
      purchase: Math.ceil(sheets * (1 + input.wastagePercent / 100)),
      wastagePercent: input.wastagePercent,
      notes: "1.2 m × 2.4 m sheet; reuse factor not applied.",
    }),
    material({
      id: `${input.prefix}:nails`,
      materialId: "formwork-nails",
      calculationId: input.calculationId,
      module: "formwork",
      description: `Formwork nails for ${input.name}`,
      unit: "kg",
      calculated: input.areaM2 * 0.25,
      purchase: input.areaM2 * 0.25 * (1 + input.wastagePercent / 100),
      wastagePercent: input.wastagePercent,
    }),
  );
}

function emptySections(calculationId: string): BillSection[] {
  return [
    { id: `${calculationId}:preliminaries`, code: "A", title: "Preliminaries and General", items: [] },
    { id: `${calculationId}:substructure`, code: "B", title: "Substructure", items: [] },
    { id: `${calculationId}:superstructure`, code: "C", title: "Superstructure", items: [] },
    { id: `${calculationId}:finishes`, code: "D", title: "Finishes", items: [] },
    { id: `${calculationId}:gates-security`, code: "E", title: "Gates, Security and Specialist Work", items: [] },
  ];
}

export function adaptFenceScopeToBill(input: {
  calculationId: string;
  sections: Array<{
    section: BillingFenceSection;
    layout: FenceSectionPhysicalLayoutResult;
  }>;
}): {
  workSections: BillSection[];
  materials: ProcurementItem[];
  assumptions: BillAssumption[];
} {
  const { calculationId, sections } = input;
  const workSections = emptySections(calculationId);
  const [preliminaries, substructure, superstructure, finishes, specialist] = workSections;
  const materials: ProcurementItem[] = [];
  const assumptions: BillAssumption[] = [];

  const totalPerimeter = sections.reduce(
    (total, entry) => total + entry.layout.grossSectionLengthM,
    0,
  );
  if (sections.some(({ section }) => normalizeFenceBoqProfile(section.boqProfile).includePreliminaries)) {
    preliminaries.items.push(
      workItem({
        id: `${calculationId}:preliminaries:mobilisation`,
        calculationId,
        module: "preliminaries",
        code: "PREL-MOB",
        description: "Mobilisation, demobilisation, insurances, temporary services and general attendance for the fence works",
        unit: "sum",
        quantity: 1,
      }),
      workItem({
        id: `${calculationId}:preliminaries:setting-out`,
        calculationId,
        module: "preliminaries",
        code: "PREL-SET",
        description: "Set out the perimeter fence line, corners, gates, columns and levels",
        unit: "m",
        quantity: totalPerimeter,
      }),
    );
  }

  for (const { section, layout } of sections) {
    const profile = normalizeFenceBoqProfile(section.boqProfile);
    const prefix = `${calculationId}:${section.id}`;
    const name = section.name || "Fence section";
    const clearLength = layout.totalClearBlockPanelLengthM;
    const columnCount = layout.columns.length;
    const waste = profile.materialWastagePercent;
    const columnSpecs = createFenceColumnSpecifications(section);
    const specificationMap = new Map(columnSpecs.map((specification) => [specification.id, specification]));
    const columnGroups = new Map<string, number>();
    for (const column of layout.columns) {
      columnGroups.set(
        column.specificationId,
        (columnGroups.get(column.specificationId) ?? 0) + 1,
      );
    }

    assumptions.push(
      {
        id: `${prefix}:geometry`,
        label: `${name} — measured geometry`,
        value: `${round(layout.grossSectionLengthM)} m gross; ${round(clearLength)} m clear panels; ${columnCount} columns used only as a quantity driver.`,
      },
      {
        id: `${prefix}:foundation`,
        label: `${name} — foundation basis`,
        value: `${profile.trenchWidthM} m × ${profile.trenchDepthM} m trench; ${profile.blindingThicknessM} m ${profile.blindingMix} blinding; ${profile.stripFootingWidthM} m × ${profile.stripFootingThicknessM} m ${profile.structuralConcreteMix} strip footing; ${profile.foundationBlockworkHeightM} m foundation blockwork (${profile.foundationBlockInfill} infill).`,
      },
      {
        id: `${prefix}:columns`,
        label: `${name} — column basis`,
        value: section.constructionSystem === "block-pillar"
          ? `${profile.blockPillarWidthM} m block pillars, ${profile.blocksPerPillarCourse} blocks/course, ${profile.blockPillarInfill} ${profile.weakConcreteMix} infill, ${profile.blockPillarVerticalBarCount}Y${profile.blockPillarVerticalBarDiameterMm} vertical bars.`
          : `${profile.rcColumnWidthM} m × ${profile.rcColumnDepthM} m RC columns in ${profile.structuralConcreteMix}, ${profile.rcMainBarCount}Y${profile.rcMainBarDiameterMm} main bars and Y${profile.rcLinkDiameterMm} links at ${profile.rcLinkSpacingM} m centres.`,
      },
    );

    if (profile.siteClearanceWidthM > 0) {
      preliminaries.items.push(workItem({
        id: `${prefix}:site-clearance`,
        calculationId,
        module: "excavation",
        code: "EARTH-CLEAR",
        description: `Clear fence working strip to ${name}`,
        unit: "m²",
        quantity: layout.grossSectionLengthM * profile.siteClearanceWidthM,
        notes: `${profile.siteClearanceWidthM} m working width.`,
      }));
    }

    const trenchExcavation = clearLength * profile.trenchWidthM * profile.trenchDepthM;
    const pitExcavation = columnCount * profile.columnPitLengthM * profile.columnPitWidthM * profile.columnPitDepthM;
    const stripBlinding = clearLength * profile.stripFootingWidthM * profile.blindingThicknessM;
    const baseBlinding = columnCount * profile.columnBaseLengthM * profile.columnBaseWidthM * profile.blindingThicknessM;
    const blindingVolume = stripBlinding + baseBlinding;
    const stripFootingConcrete = clearLength * profile.stripFootingWidthM * profile.stripFootingThicknessM;
    const foundationBlockworkArea = clearLength * profile.foundationBlockworkHeightM;
    const infillFactor = profile.foundationBlockInfill === "full" ? 1 : profile.foundationBlockInfill === "partial" ? 0.5 : 0;
    const foundationInfill = foundationBlockworkArea * profile.foundationBlockworkThicknessM * profile.blockVoidRatio * infillFactor;
    const columnBaseConcrete = columnCount * profile.columnBaseLengthM * profile.columnBaseWidthM * profile.columnBaseThicknessM;
    const starterWidth = section.constructionSystem === "block-pillar" ? profile.blockPillarWidthM : profile.rcColumnWidthM;
    const starterDepth = section.constructionSystem === "block-pillar" ? profile.blockPillarDepthM : profile.rcColumnDepthM;
    const starterConcrete = columnCount * starterWidth * starterDepth * profile.starterHeightM;
    const baseFormwork = columnCount * 2 * (profile.columnBaseLengthM + profile.columnBaseWidthM) * profile.columnBaseThicknessM;
    const starterFormwork = columnCount * 2 * (starterWidth + starterDepth) * profile.starterHeightM;
    const baseRebar = rebarWeightKg(columnCount * profile.baseMainBarCount * profile.baseBarLengthM, profile.baseMainBarDiameterMm);
    const starterRebar = rebarWeightKg(columnCount * profile.starterBarCount * profile.starterBarLengthM, profile.starterBarDiameterMm);
    const excavationTotal = trenchExcavation + pitExcavation;
    const displaced = blindingVolume + stripFootingConcrete + foundationBlockworkArea * profile.foundationBlockworkThicknessM + columnBaseConcrete + starterConcrete;
    const backfill = Math.max(0, excavationTotal - displaced);
    const disposal = Math.max(0, excavationTotal - backfill) * (1 + profile.excavationBulkingPercent / 100);

    substructure.items.push(
      workItem({ id: `${prefix}:trench-excavation`, calculationId, module: "excavation", code: "EARTH-EXC", description: `Excavate foundation trenches to ${name}`, unit: "m³", quantity: trenchExcavation }),
      workItem({ id: `${prefix}:pit-excavation`, calculationId, module: "excavation", code: "EARTH-PIT", description: `Excavate pits for column bases to ${name}`, unit: "m³", quantity: pitExcavation }),
      workItem({ id: `${prefix}:blinding`, calculationId, module: "concrete", code: "CONC-BLIND", description: `Provide and place ${profile.blindingMix} plain concrete blinding under strip footings and column bases to ${name}`, unit: "m³", quantity: blindingVolume }),
      workItem({ id: `${prefix}:strip-footing`, calculationId, module: "concrete", code: "CONC-RC", description: `Provide and place ${profile.structuralConcreteMix} concrete strip footing to ${name}`, unit: "m³", quantity: stripFootingConcrete }),
      workItem({ id: `${prefix}:foundation-blockwork`, calculationId, module: "blockwork", code: "BLK-225", description: `Provide and lay 225 mm sandcrete blockwork in foundation to ${name}`, unit: "m²", quantity: foundationBlockworkArea }),
      workItem({ id: `${prefix}:column-bases`, calculationId, module: "concrete", code: "CONC-RC", description: `Provide and place ${profile.structuralConcreteMix} reinforced concrete bases to fence columns at ${name}`, unit: "m³", quantity: columnBaseConcrete }),
      workItem({ id: `${prefix}:starters`, calculationId, module: "concrete", code: "CONC-RC", description: `Provide and place ${profile.structuralConcreteMix} concrete column starters at ${name}`, unit: "m³", quantity: starterConcrete }),
      workItem({ id: `${prefix}:base-formwork`, calculationId, module: "formwork", code: "FORM", description: `Provide formwork to sides of column bases and starters at ${name}`, unit: "m²", quantity: baseFormwork + starterFormwork }),
      workItem({ id: `${prefix}:base-rebar`, calculationId, module: "reinforcement", code: `REBAR-Y${profile.baseMainBarDiameterMm}`, description: `Provide, cut, bend and fix Y${profile.baseMainBarDiameterMm} reinforcement to column base baskets at ${name}`, unit: "kg", quantity: baseRebar }),
      workItem({ id: `${prefix}:starter-rebar`, calculationId, module: "reinforcement", code: `REBAR-Y${profile.starterBarDiameterMm}`, description: `Provide, cut, bend and fix Y${profile.starterBarDiameterMm} column starter bars at ${name}`, unit: "kg", quantity: starterRebar }),
      workItem({ id: `${prefix}:backfill`, calculationId, module: "excavation", code: "EARTH-FILL", description: `Return, fill and compact selected excavated material around foundations at ${name}`, unit: "m³", quantity: backfill }),
      workItem({ id: `${prefix}:disposal`, calculationId, module: "excavation", code: "EARTH-DISP", description: `Load and dispose surplus excavated material from ${name}`, unit: "m³", quantity: disposal, notes: `${profile.excavationBulkingPercent}% bulking applied.` }),
    );
    if (foundationInfill > 0) {
      substructure.items.push(workItem({
        id: `${prefix}:foundation-infill`, calculationId, module: "concrete", code: "CONC-WEAK",
        description: `Fill hollow foundation blockwork with ${profile.weakConcreteMix} weak concrete at ${name}`,
        unit: "m³", quantity: foundationInfill,
        notes: `${profile.foundationBlockInfill} infill; ${round(profile.blockVoidRatio * 100)}% block void ratio.`,
      }));
    }

    addConcreteMaterials({ materials, calculationId, prefix: `${prefix}:mat:blinding`, name: `${name} blinding`, basicVolumeM3: blindingVolume, mixRatio: profile.blindingMix, wastagePercent: waste });
    addConcreteMaterials({ materials, calculationId, prefix: `${prefix}:mat:footings`, name: `${name} footings, bases and starters`, basicVolumeM3: stripFootingConcrete + columnBaseConcrete + starterConcrete, mixRatio: profile.structuralConcreteMix, wastagePercent: waste });
    addConcreteMaterials({ materials, calculationId, prefix: `${prefix}:mat:foundation-infill`, name: `${name} foundation block infill`, basicVolumeM3: foundationInfill, mixRatio: profile.weakConcreteMix, wastagePercent: waste });
    addBlocks({ materials, calculationId, prefix: `${prefix}:mat:foundation-blocks`, name: `${name} foundation blockwork`, basicQuantity: foundationBlockworkArea * 10, wastagePercent: waste });
    addMortarMaterials({ materials, calculationId, prefix: `${prefix}:mat:foundation-mortar`, name: `${name} foundation blockwork mortar`, basicVolumeM3: foundationBlockworkArea * profile.mortarVolumePerWallM2, mixRatio: profile.mortarMix, wastagePercent: waste });
    addRebarMaterials({ materials, calculationId, prefix: `${prefix}:mat:base-rebar`, name: `${name} column bases`, diameterMm: profile.baseMainBarDiameterMm, basicWeightKg: baseRebar, wastagePercent: waste });
    addRebarMaterials({ materials, calculationId, prefix: `${prefix}:mat:starter-rebar`, name: `${name} column starters`, diameterMm: profile.starterBarDiameterMm, basicWeightKg: starterRebar, wastagePercent: waste });
    addFormworkMaterials({ materials, calculationId, prefix: `${prefix}:mat:base-formwork`, name: `${name} bases and starters`, areaM2: baseFormwork + starterFormwork, wastagePercent: waste });

    if (layout.totalBlockworkAreaM2 > 0) {
      superstructure.items.push(workItem({
        id: `${prefix}:panel-blockwork`, calculationId, module: "blockwork", code: "BLK-225",
        description: `Provide and lay 225 mm sandcrete blockwork above ground to fence panels at ${name}`,
        unit: "m²", quantity: layout.totalBlockworkAreaM2,
        notes: "Net panel area after gates and physical column widths are deducted.",
      }));
      addBlocks({ materials, calculationId, prefix: `${prefix}:mat:panel-blocks`, name: `${name} superstructure wall`, basicQuantity: layout.totalBlockworkAreaM2 * 10, wastagePercent: waste });
      addMortarMaterials({ materials, calculationId, prefix: `${prefix}:mat:panel-mortar`, name: `${name} superstructure wall mortar`, basicVolumeM3: layout.totalBlockworkAreaM2 * profile.mortarVolumePerWallM2, mixRatio: profile.mortarMix, wastagePercent: waste });
    }

    for (const [specificationId, count] of columnGroups) {
      const specification = specificationMap.get(specificationId) as ColumnSpecification | undefined;
      if (!specification) continue;
      const groupPrefix = `${prefix}:column:${specificationId}`;
      if (specification.constructionSystem === "reinforced-concrete") {
        const result = calculateReinforcedConcreteColumnQuantities({ columnCount: count, specification });
        const mainBasicKg = rebarWeightKg(result.basicMainBarLengthM, result.mainBarDiameterMm);
        const linkBasicKg = rebarWeightKg(result.basicLinkBarLengthM, result.linkBarDiameterMm);
        superstructure.items.push(
          workItem({ id: `${groupPrefix}:concrete`, calculationId, module: "concrete", code: "CONC-RC", description: `Provide and place ${profile.structuralConcreteMix} reinforced concrete in ${specification.name} superstructure columns at ${name}`, unit: "m³", quantity: result.basicConcreteVolumeM3, notes: `${count} columns used to derive the measured volume.` }),
          workItem({ id: `${groupPrefix}:main-rebar`, calculationId, module: "reinforcement", code: `REBAR-Y${result.mainBarDiameterMm}`, description: `Provide, cut, bend and fix Y${result.mainBarDiameterMm} main reinforcement in ${specification.name} columns at ${name}`, unit: "kg", quantity: mainBasicKg }),
          workItem({ id: `${groupPrefix}:links`, calculationId, module: "reinforcement", code: `REBAR-Y${result.linkBarDiameterMm}`, description: `Provide, cut, bend and fix Y${result.linkBarDiameterMm} links in ${specification.name} columns at ${name}`, unit: "kg", quantity: linkBasicKg }),
          workItem({ id: `${groupPrefix}:formwork`, calculationId, module: "formwork", code: "FORM", description: `Provide formwork to sides of ${specification.name} columns at ${name}`, unit: "m²", quantity: result.basicFormworkAreaM2 }),
        );
        addConcreteMaterials({ materials, calculationId, prefix: `${groupPrefix}:mat:concrete`, name: `${name} ${specification.name} columns`, basicVolumeM3: result.basicConcreteVolumeM3, mixRatio: profile.structuralConcreteMix, wastagePercent: waste });
        addRebarMaterials({ materials, calculationId, prefix: `${groupPrefix}:mat:main`, name: `${name} ${specification.name} columns`, diameterMm: result.mainBarDiameterMm, basicWeightKg: mainBasicKg, wastagePercent: waste });
        addRebarMaterials({ materials, calculationId, prefix: `${groupPrefix}:mat:links`, name: `${name} ${specification.name} column links`, diameterMm: result.linkBarDiameterMm, basicWeightKg: linkBasicKg, wastagePercent: waste });
        addFormworkMaterials({ materials, calculationId, prefix: `${groupPrefix}:mat:formwork`, name: `${name} ${specification.name} columns`, areaM2: result.basicFormworkAreaM2, wastagePercent: waste });
      } else {
        const result = calculateBlockPillarColumnQuantities({ columnCount: count, specification });
        const pillarArea = result.basicBlockQuantity / 10;
        const verticalBasicKg = rebarWeightKg(result.basicVerticalBarLengthM, result.verticalBarDiameterMm);
        superstructure.items.push(workItem({ id: `${groupPrefix}:blockwork`, calculationId, module: "blockwork", code: "BLK-225", description: `Provide and lay 225 mm sandcrete blockwork in ${specification.name} pillars at ${name}`, unit: "m²", quantity: pillarArea, notes: `${count} pillars and ${result.basicBlockQuantity} blocks used to derive the measured area.` }));
        addBlocks({ materials, calculationId, prefix: `${groupPrefix}:mat:blocks`, name: `${name} ${specification.name} pillars`, basicQuantity: result.basicBlockQuantity, wastagePercent: waste });
        addMortarMaterials({ materials, calculationId, prefix: `${groupPrefix}:mat:mortar`, name: `${name} ${specification.name} pillar mortar`, basicVolumeM3: result.basicMortarVolumeM3, mixRatio: profile.mortarMix, wastagePercent: waste });
        if (result.basicConcreteInfillVolumeM3 > 0) {
          superstructure.items.push(workItem({ id: `${groupPrefix}:infill`, calculationId, module: "concrete", code: "CONC-WEAK", description: `Fill hollow ${specification.name} pillars with ${profile.weakConcreteMix} weak concrete at ${name}`, unit: "m³", quantity: result.basicConcreteInfillVolumeM3, notes: `${specification.concreteInfill} pillar infill.` }));
          addConcreteMaterials({ materials, calculationId, prefix: `${groupPrefix}:mat:infill`, name: `${name} ${specification.name} pillar infill`, basicVolumeM3: result.basicConcreteInfillVolumeM3, mixRatio: profile.weakConcreteMix, wastagePercent: waste });
        }
        if (verticalBasicKg > 0) {
          superstructure.items.push(workItem({ id: `${groupPrefix}:vertical-rebar`, calculationId, module: "reinforcement", code: `REBAR-Y${result.verticalBarDiameterMm}`, description: `Provide, cut and fix Y${result.verticalBarDiameterMm} vertical reinforcement in ${specification.name} pillars at ${name}`, unit: "kg", quantity: verticalBasicKg }));
          addRebarMaterials({ materials, calculationId, prefix: `${groupPrefix}:mat:vertical`, name: `${name} ${specification.name} pillars`, diameterMm: result.verticalBarDiameterMm, basicWeightKg: verticalBasicKg, wastagePercent: waste });
        }
      }
    }

    const allColumnRebarKg = baseRebar + starterRebar;
    if (allColumnRebarKg > 0) {
      materials.push(material({
        id: `${prefix}:mat:binding-wire`, materialId: "binding-wire", calculationId, module: "reinforcement",
        description: `Binding wire for reinforcement at ${name}`, unit: "kg",
        calculated: allColumnRebarKg * 0.015,
        purchase: allColumnRebarKg * 0.015 * (1 + waste / 100),
        wastagePercent: waste,
      }));
    }

    if (section.wallCopingType !== "none") {
      if (section.wallCopingType === "in-situ-concrete") {
        const copingConcrete = clearLength * profile.wallCopingWidthM * profile.wallCopingDepthM;
        const copingFormwork = clearLength * (profile.wallCopingWidthM + 2 * profile.wallCopingDepthM);
        const copingRebar = rebarWeightKg(clearLength * profile.wallCopingBarCount, profile.wallCopingBarDiameterMm);
        superstructure.items.push(
          workItem({ id: `${prefix}:wall-coping-concrete`, calculationId, module: "concrete", code: "CONC-RC", description: `Provide and place ${profile.structuralConcreteMix} in-situ concrete coping to fence wall at ${name}`, unit: "m³", quantity: copingConcrete }),
          workItem({ id: `${prefix}:wall-coping-formwork`, calculationId, module: "formwork", code: "FORM", description: `Provide formwork to wall coping at ${name}`, unit: "m²", quantity: copingFormwork }),
          workItem({ id: `${prefix}:wall-coping-rebar`, calculationId, module: "reinforcement", code: `REBAR-Y${profile.wallCopingBarDiameterMm}`, description: `Provide, cut and fix Y${profile.wallCopingBarDiameterMm} reinforcement in wall coping at ${name}`, unit: "kg", quantity: copingRebar }),
        );
        addConcreteMaterials({ materials, calculationId, prefix: `${prefix}:mat:coping-concrete`, name: `${name} wall coping`, basicVolumeM3: copingConcrete, mixRatio: profile.structuralConcreteMix, wastagePercent: waste });
        addRebarMaterials({ materials, calculationId, prefix: `${prefix}:mat:coping-rebar`, name: `${name} wall coping`, diameterMm: profile.wallCopingBarDiameterMm, basicWeightKg: copingRebar, wastagePercent: waste });
        addFormworkMaterials({ materials, calculationId, prefix: `${prefix}:mat:coping-formwork`, name: `${name} wall coping`, areaM2: copingFormwork, wastagePercent: waste });
      } else {
        superstructure.items.push(workItem({ id: `${prefix}:wall-coping`, calculationId, module: "specialist", code: "FEN-COP", description: `Provide ${section.wallCopingType.replaceAll("-", " ")} wall coping to ${name}`, unit: "m", quantity: clearLength }));
      }
    }

    const capType = section.regularColumnCapType;
    if (capType !== "none") {
      if (capType === "in-situ-concrete") {
        const capWidth = starterWidth + profile.columnCapProjectionM * 2;
        const capDepth = starterDepth + profile.columnCapProjectionM * 2;
        const capConcrete = columnCount * capWidth * capDepth * profile.columnCapThicknessM;
        const capFormwork = columnCount * (capWidth * capDepth + 2 * (capWidth + capDepth) * profile.columnCapThicknessM);
        superstructure.items.push(
          workItem({ id: `${prefix}:column-caps-concrete`, calculationId, module: "concrete", code: "CONC-RC", description: `Provide and place ${profile.structuralConcreteMix} in-situ concrete caps to columns at ${name}`, unit: "m³", quantity: capConcrete }),
          workItem({ id: `${prefix}:column-caps-formwork`, calculationId, module: "formwork", code: "FORM", description: `Provide formwork to in-situ column caps at ${name}`, unit: "m²", quantity: capFormwork }),
        );
        addConcreteMaterials({ materials, calculationId, prefix: `${prefix}:mat:cap-concrete`, name: `${name} column caps`, basicVolumeM3: capConcrete, mixRatio: profile.structuralConcreteMix, wastagePercent: waste });
        addFormworkMaterials({ materials, calculationId, prefix: `${prefix}:mat:cap-formwork`, name: `${name} column caps`, areaM2: capFormwork, wastagePercent: waste });
      } else {
        specialist.items.push(workItem({ id: `${prefix}:column-caps`, calculationId, module: "specialist", code: "FEN-CAP", description: `Provide and install ${capType.replaceAll("-", " ")} caps to fence columns at ${name}`, unit: "nr", quantity: columnCount }));
      }
    }

    const columnFaceArea = layout.columns.reduce(
      (area, column) => area + 2 * (column.widthAlongFenceM + column.depthM) * column.columnBodyHeightM,
      0,
    );
    const copingFinishArea = section.wallCopingType === "none" ? 0 : clearLength * (profile.wallCopingWidthM + 2 * profile.wallCopingDepthM);
    const finishFaces = [
      ["external", section.externalFinish],
      ["internal", section.internalFinish],
    ] as const;
    for (const [face, finish] of finishFaces) {
      if (finish.standardFinish === "none" || finish.standardFinish === "fair-face") continue;
      const wallArea = layout.totalBlockworkAreaM2;
      const finishArea = wallArea + columnFaceArea / 2 + copingFinishArea / 2;
      if (finish.standardFinish === "plaster-and-paint" || finish.standardFinish === "textured-paint") {
        finishes.items.push(
          workItem({ id: `${prefix}:plaster:${face}`, calculationId, module: "finish", code: "FIN-PLASTER", description: `Prepare and apply ${round(profile.plasterThicknessM * 1000)} mm cement-and-sand plaster to ${face} fence walls, columns and coping at ${name}`, unit: "m²", quantity: finishArea }),
          workItem({ id: `${prefix}:paint:${face}`, calculationId, module: "finish", code: "FIN-PAINT", description: `Prepare and apply primer and ${profile.paintCoats} coats of ${finish.standardFinish === "textured-paint" ? "textured" : "approved"} paint to ${face} fence surfaces at ${name}`, unit: "m²", quantity: finishArea }),
        );
        addMortarMaterials({ materials, calculationId, prefix: `${prefix}:mat:plaster:${face}`, name: `${name} ${face} plaster`, basicVolumeM3: finishArea * profile.plasterThicknessM, mixRatio: "1:4", wastagePercent: waste });
        materials.push(material({
          id: `${prefix}:mat:paint:${face}`, materialId: finish.standardFinish === "textured-paint" ? "textured-paint" : "emulsion-paint", calculationId, module: "finish",
          description: `${finish.standardFinish === "textured-paint" ? "Textured" : "Emulsion"} paint for ${name} ${face} face`, unit: "litre",
          calculated: finishArea * profile.paintCoats / 10,
          purchase: finishArea * profile.paintCoats / 10 * (1 + waste / 100), wastagePercent: waste,
          notes: "Coverage assumed at 10 m²/litre/coat; edit the bill or assumption for the selected product.",
        }));
      } else {
        finishes.items.push(workItem({ id: `${prefix}:finish:${face}`, calculationId, module: "finish", code: "FEN-FIN", description: `Provide ${finish.standardFinish.replaceAll("-", " ")} to ${face} face of fence walls, columns and coping at ${name}`, unit: "m²", quantity: finishArea }));
      }
    }

    if (layout.totalUpperInfillAreaM2 > 0) {
      specialist.items.push(workItem({ id: `${prefix}:upper-infill`, calculationId, module: "specialist", code: "FEN-GRL", description: `Provide and install ${section.defaultPanelComposition.upperInfillType.replaceAll("-", " ")} upper infill to ${name}`, unit: "m²", quantity: layout.totalUpperInfillAreaM2 }));
    }
    for (const gate of section.gates) {
      specialist.items.push(workItem({ id: `${prefix}:gate:${gate.id}`, calculationId, module: "specialist", code: gate.type === "vehicle" ? "FEN-VG" : "FEN-PG", description: `Provide and install ${gate.operation} ${gate.type} gate, ${gate.widthM} m wide × ${gate.heightM} m high, to ${name}`, unit: "nr", quantity: 1 }));
    }
    if (section.securityTopping !== "none") {
      specialist.items.push(workItem({ id: `${prefix}:security`, calculationId, module: "specialist", code: "FEN-SEC", description: `Provide and install ${section.securityTopping.replaceAll("-", " ")} security topping to ${name}`, unit: "m", quantity: layout.grossSectionLengthM - layout.totalGateOpeningWidthM }));
    }
  }

  return {
    workSections: workSections.filter((section) => section.items.length > 0),
    materials,
    assumptions,
  };
}
