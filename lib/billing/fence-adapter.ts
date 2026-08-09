import type {
  FenceSection,
  FenceSectionPhysicalLayoutResult,
} from "../fence/types";
import type { BillAssumption, BillItem, ProcurementItem } from "./models";

type BillingFenceSection = FenceSection & {
  constructionSystem?: "reinforced-concrete" | "block-pillar";
};

const round = (value: number, precision = 3) =>
  Number(value.toFixed(precision));

const workItem = (input: {
  id: string;
  calculationId: string;
  description: string;
  unit: string;
  quantity: number;
  code?: string;
  notes?: string;
}): BillItem => ({
  id: input.id,
  sourceCalculationId: input.calculationId,
  sourceModule: "fence",
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
});

export function adaptFenceScopeToBill(input: {
  calculationId: string;
  sections: Array<{
    section: BillingFenceSection;
    layout: FenceSectionPhysicalLayoutResult;
  }>;
}): {
  workItems: BillItem[];
  materials: ProcurementItem[];
  assumptions: BillAssumption[];
} {
  const { calculationId, sections } = input;
  const workItems: BillItem[] = [];
  const materials: ProcurementItem[] = [];
  const assumptions: BillAssumption[] = [
    {
      id: `${calculationId}:block-basis`,
      label: "Fence blockwork procurement basis",
      value: "225mm sandcrete blocks at 10 blocks/m² with 5% block wastage",
    },
    {
      id: `${calculationId}:mortar-basis`,
      label: "Fence mortar procurement basis",
      value: "0.015 m³ mortar/m², 10% mortar wastage; 8 cement bags, 1.1 m³ sand and 220 litres water per m³ mortar",
    },
    {
      id: `${calculationId}:foundation-status`,
      label: "Foundation quantities",
      value: "Not included until excavation, footing/ground-beam dimensions and structural specifications are entered or calculated.",
    },
  ];

  for (const { section, layout } of sections) {
    const prefix = `${calculationId}:${section.id}`;
    const name = section.name || "Fence section";
    const system = section.constructionSystem ?? "reinforced-concrete";

    if (layout.totalBlockworkAreaM2 > 0) {
      workItems.push(workItem({
        id: `${prefix}:blockwork`,
        calculationId,
        code: "FEN-BLK",
        description: `Provide and lay 225mm thick sandcrete blockwork to ${name}`,
        unit: "m²",
        quantity: layout.totalBlockworkAreaM2,
        notes: `Net panel area after gates and column widths are deducted.`,
      }));

      const basicBlocks = layout.totalBlockworkAreaM2 * 10;
      const mortarM3 = layout.totalBlockworkAreaM2 * 0.015 * 1.1;
      materials.push(
        {
          id: `${prefix}:blocks`,
          materialId: "block-225",
          sourceCalculationId: calculationId,
          sourceModule: "fence",
          description: `225mm sandcrete blocks for ${name}`,
          unit: "number",
          calculatedQuantity: round(basicBlocks, 2),
          wastagePercent: 5,
          purchaseQuantity: Math.ceil(basicBlocks * 1.05),
          notes: "10 blocks/m²; purchase quantity includes 5% wastage.",
        },
        {
          id: `${prefix}:cement`,
          materialId: "cement-50kg",
          sourceCalculationId: calculationId,
          sourceModule: "fence",
          description: `Cement for ${name} block-laying mortar`,
          unit: "bag",
          calculatedQuantity: round(mortarM3 * 8, 2),
          wastagePercent: 0,
          purchaseQuantity: Math.ceil(mortarM3 * 8),
          notes: "Mortar wastage is included before material conversion.",
        },
        {
          id: `${prefix}:sand`,
          materialId: "sharp-sand",
          sourceCalculationId: calculationId,
          sourceModule: "fence",
          description: `Sharp sand for ${name} block-laying mortar`,
          unit: "m³",
          calculatedQuantity: round(mortarM3 * 1.1),
          wastagePercent: 0,
          purchaseQuantity: round(mortarM3 * 1.1),
        },
        {
          id: `${prefix}:water`,
          materialId: "water",
          sourceCalculationId: calculationId,
          sourceModule: "fence",
          description: `Water for ${name} block-laying mortar`,
          unit: "litre",
          calculatedQuantity: round(mortarM3 * 220, 1),
          wastagePercent: 0,
          purchaseQuantity: round(mortarM3 * 220, 1),
        },
      );
    }

    if (layout.columns.length > 0) {
      workItems.push(workItem({
        id: `${prefix}:columns`,
        calculationId,
        code: system === "block-pillar" ? "FEN-BP" : "FEN-RCC",
        description: `Construct ${system === "block-pillar" ? "block-pillar" : "reinforced-concrete"} fence columns to ${name}`,
        unit: "number",
        quantity: layout.columns.length,
        notes: `${section.columnBodyHeightM}m column body height; detailed column materials require the selected structural specification.`,
      }));
    }

    if (layout.totalUpperInfillAreaM2 > 0) {
      workItems.push(workItem({
        id: `${prefix}:upper-infill`,
        calculationId,
        code: "FEN-GRL",
        description: `Provide and install ${section.defaultPanelComposition.upperInfillType.replaceAll("-", " ")} upper infill to ${name}`,
        unit: "m²",
        quantity: layout.totalUpperInfillAreaM2,
      }));
    }

    for (const gate of section.gates) {
      workItems.push(workItem({
        id: `${prefix}:gate:${gate.id}`,
        calculationId,
        code: gate.type === "vehicle" ? "FEN-VG" : "FEN-PG",
        description: `Provide and install ${gate.operation} ${gate.type} gate, ${gate.widthM}m wide × ${gate.heightM}m high, to ${name}`,
        unit: "number",
        quantity: 1,
      }));
    }

    if (section.wallCopingType !== "none") {
      workItems.push(workItem({
        id: `${prefix}:coping`,
        calculationId,
        code: "FEN-COP",
        description: `Provide ${section.wallCopingType.replaceAll("-", " ")} wall coping to ${name}`,
        unit: "m",
        quantity: layout.totalClearBlockPanelLengthM,
      }));
    }

    if (section.securityTopping !== "none") {
      workItems.push(workItem({
        id: `${prefix}:security`,
        calculationId,
        code: "FEN-SEC",
        description: `Provide and install ${section.securityTopping.replaceAll("-", " ")} security topping to ${name}`,
        unit: "m",
        quantity: layout.grossSectionLengthM - layout.totalGateOpeningWidthM,
      }));
    }

    const faceFinishes = [
      ["external", section.externalFinish],
      ["internal", section.internalFinish],
    ] as const;
    for (const [face, finish] of faceFinishes) {
      if (finish.standardFinish === "none") continue;
      workItems.push(workItem({
        id: `${prefix}:finish:${face}`,
        calculationId,
        code: "FEN-FIN",
        description: `Apply ${finish.standardFinish.replaceAll("-", " ")} finish to ${face} face of ${name}`,
        unit: "m²",
        quantity: layout.totalBlockworkAreaM2,
      }));
    }
  }

  return { workItems, materials, assumptions };
}
