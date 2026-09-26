export type RateCostCategory =
  | "material"
  | "consumable"
  | "labour"
  | "plant"
  | "logistics";

export type RateCostLine = {
  id: string;
  label: string;
  category: RateCostCategory;
  quantity: number;
  unit: string;
  unitRate: number;
  note?: string;
};

export type RateBankItem = {
  slug: string;
  code: string;
  title: string;
  shortTitle: string;
  section: string;
  unit: string;
  countryCode: string;
  country: string;
  region: string;
  city: string;
  currency: string;
  specification: string;
  methodologyNote: string;
  sourceNote: string;
  lastReviewed: string;
  status: "pilot" | "verified" | "review";
  allowances: {
    materialFluctuation: number;
    labourFluctuation: number;
    plantFluctuation: number;
    risk: number;
    op: number;
  };
  lines: RateCostLine[];
};

export type RateCalculation = {
  materialCost: number;
  labourCost: number;
  plantCost: number;
  logisticsCost: number;
  directCost: number;
  materialFluctuation: number;
  labourFluctuation: number;
  plantFluctuation: number;
  risk: number;
  baseBeforeOp: number;
  op: number;
  total: number;
};

export function calculateRate(
  lines: RateCostLine[],
  allowances: RateBankItem["allowances"],
): RateCalculation {
  const lineValue = (line: RateCostLine) => line.quantity * line.unitRate;
  const materialCost = lines
    .filter((line) => line.category === "material" || line.category === "consumable")
    .reduce((sum, line) => sum + lineValue(line), 0);
  const labourCost = lines
    .filter((line) => line.category === "labour")
    .reduce((sum, line) => sum + lineValue(line), 0);
  const plantCost = lines
    .filter((line) => line.category === "plant")
    .reduce((sum, line) => sum + lineValue(line), 0);
  const logisticsCost = lines
    .filter((line) => line.category === "logistics")
    .reduce((sum, line) => sum + lineValue(line), 0);

  const directCost = materialCost + labourCost + plantCost + logisticsCost;
  const materialFluctuation = materialCost * allowances.materialFluctuation;
  const labourFluctuation = labourCost * allowances.labourFluctuation;
  const plantFluctuation = (plantCost + logisticsCost) * allowances.plantFluctuation;
  const risk = directCost * allowances.risk;
  const baseBeforeOp =
    directCost + materialFluctuation + labourFluctuation + plantFluctuation + risk;
  const op = baseBeforeOp * allowances.op;

  return {
    materialCost,
    labourCost,
    plantCost,
    logisticsCost,
    directCost,
    materialFluctuation,
    labourFluctuation,
    plantFluctuation,
    risk,
    baseBeforeOp,
    op,
    total: baseBeforeOp + op,
  };
}

export const RATE_BANK_ITEMS: RateBankItem[] = [
  {
    slug: "mechanical-excavation-wall-trenches",
    code: "RB-EW-001",
    title: "Mechanical excavation to wall trenches",
    shortTitle: "Wall trench excavation",
    section: "Earthworks",
    unit: "m³",
    countryCode: "NG",
    country: "Nigeria",
    region: "Abuja / Nasarawa",
    city: "Abuja–Keffi market",
    currency: "NGN",
    specification:
      "Bulk excavation by backhoe/excavator with manual dressing. Disposal is excluded and priced separately.",
    methodologyNote:
      "The plant basis uses 180 m³/day output, excavator hire, fuel and a transparent mobilisation allocation. Manual dressing remains a separate labour component.",
    sourceNote:
      "Pilot build-up reconstructed from the final FMC Keffi execution-cost model and its adopted plant/productivity assumptions.",
    lastReviewed: "2026-09-26",
    status: "pilot",
    allowances: {
      materialFluctuation: 0.05,
      labourFluctuation: 0.015,
      plantFluctuation: 0,
      risk: 0.05,
      op: 0,
    },
    lines: [
      {
        id: "exc-hire",
        label: "Excavator hire allocation",
        category: "plant",
        quantity: 1 / 180,
        unit: "day",
        unitRate: 250000,
        note: "₦250,000/day ÷ 180 m³/day.",
      },
      {
        id: "exc-diesel",
        label: "Excavator diesel",
        category: "plant",
        quantity: 80 / 180,
        unit: "L",
        unitRate: 2000,
        note: "80 L/day ÷ 180 m³/day.",
      },
      {
        id: "exc-mob",
        label: "Mobilisation / demobilisation allocation",
        category: "logistics",
        quantity: 1,
        unit: "m³",
        unitRate: 408.3561020036425,
        note: "Shared plant logistics allocated across productive excavation volume.",
      },
      {
        id: "exc-dress",
        label: "Manual trimming and dressing",
        category: "labour",
        quantity: 1,
        unit: "m³",
        unitRate: 133.33333333333331,
        note: "Manual support retained separately from bulk machine excavation.",
      },
    ],
  },
  {
    slug: "c25-structural-concrete-310kg",
    code: "RB-CO-001",
    title: "C25 structural concrete — site mixed",
    shortTitle: "C25 structural concrete",
    section: "Concrete",
    unit: "m³",
    countryCode: "NG",
    country: "Nigeria",
    region: "Abuja / Nasarawa",
    city: "Abuja–Keffi market",
    currency: "NGN",
    specification:
      "C25 structural concrete with minimum cement content 310 kg/m³. Reinforcement and formwork are excluded.",
    methodologyNote:
      "The public pilot uses 310 kg/m³ minimum cement, plus a 3% cement/batching allowance. Sand and granite quantities are working factors and must be replaced by an approved mix design where one is available.",
    sourceNote:
      "Specification basis from the final FMC Keffi execution BOQ; material, labour and plant inputs reconstructed from the reviewed execution model.",
    lastReviewed: "2026-09-26",
    status: "pilot",
    allowances: {
      materialFluctuation: 0.05,
      labourFluctuation: 0.015,
      plantFluctuation: 0,
      risk: 0.05,
      op: 0,
    },
    lines: [
      {
        id: "c25-cement",
        label: "50 kg cement — 310 kg/m³ + 3% batching allowance",
        category: "material",
        quantity: 6.386,
        unit: "bag",
        unitRate: 12000,
        note: "6.2 bags theoretical minimum × 1.03 batching allowance.",
      },
      {
        id: "c25-sand",
        label: "Sharp sand",
        category: "material",
        quantity: 0.43028,
        unit: "m³",
        unitRate: 14400,
        note: "Working factor; editable where approved mix design gives a different quantity.",
      },
      {
        id: "c25-granite",
        label: "Granite / coarse aggregate",
        category: "material",
        quantity: 0.86056,
        unit: "m³",
        unitRate: 27000,
        note: "Working factor; editable where approved mix design gives a different quantity.",
      },
      {
        id: "c25-labour",
        label: "Concrete gang labour",
        category: "labour",
        quantity: 1 / 8,
        unit: "gang-day",
        unitRate: 89000,
        note: "1 concrete mason + 6 labourers; working output 8 m³/day.",
      },
      {
        id: "c25-plant",
        label: "Mixer, vibrator and small-plant allocation",
        category: "plant",
        quantity: 1,
        unit: "m³",
        unitRate: 2769,
        note: "Working plant allocation from reviewed execution model.",
      },
    ],
  },
  {
    slug: "high-yield-reinforcement-supply-fix",
    code: "RB-RF-001",
    title: "High-yield reinforcement — supply, cut, bend and fix",
    shortTitle: "Reinforcement supply & fix",
    section: "Reinforcement",
    unit: "t",
    countryCode: "NG",
    country: "Nigeria",
    region: "Abuja / Nasarawa",
    city: "Abuja–Keffi market",
    currency: "NGN",
    specification:
      "High-yield reinforcement measured by theoretical tonne, including 3% cutting/waste, binding/cutting consumables and fixing labour.",
    methodologyNote:
      "Lap allowance is not hidden in this pilot rate. Where the measured steel quantity excludes laps, the visitor can add a separate lap percentage in their own calculation.",
    sourceNote:
      "Reconstructed from the final FMC Keffi reinforcement procurement, waste, consumables and fixing-labour basis.",
    lastReviewed: "2026-09-26",
    status: "pilot",
    allowances: {
      materialFluctuation: 0.05,
      labourFluctuation: 0.015,
      plantFluctuation: 0,
      risk: 0.05,
      op: 0,
    },
    lines: [
      {
        id: "rebar-steel",
        label: "High-yield TMT reinforcement incl. 3% cutting waste",
        category: "material",
        quantity: 1.03,
        unit: "t",
        unitRate: 1100000,
        note: "1.00 t theoretical steel × 1.03 cutting/waste factor.",
      },
      {
        id: "rebar-consumables",
        label: "Binding wire / cutting consumables",
        category: "consumable",
        quantity: 1,
        unit: "t",
        unitRate: 23175,
        note: "Working consumables allowance per theoretical tonne.",
      },
      {
        id: "rebar-fix",
        label: "Cutting, bending and fixing labour",
        category: "labour",
        quantity: 1,
        unit: "t",
        unitRate: 85000,
        note: "Adopted tonne-based steel-fixing labour basis.",
      },
    ],
  },
  {
    slug: "230mm-hollow-sandcrete-blockwork",
    code: "RB-MA-001",
    title: "230 mm hollow sandcrete blockwork in 1:6 mortar",
    shortTitle: "230 mm hollow blockwork",
    section: "Masonry",
    unit: "m²",
    countryCode: "NG",
    country: "Nigeria",
    region: "Abuja / Nasarawa",
    city: "Abuja–Keffi market",
    currency: "NGN",
    specification:
      "230 mm hollow sandcrete block wall, 10 blocks/m² working basis, 5% block breakage and 1:6 cement:sand mortar.",
    methodologyNote:
      "The block count, breakage, mortar consumption and labour are all exposed so visitors can replace them with their own block size, workmanship and site productivity.",
    sourceNote:
      "Reconstructed from the reviewed residential/FMC blockwork methodology and the final FMC execution-cost inputs.",
    lastReviewed: "2026-09-26",
    status: "pilot",
    allowances: {
      materialFluctuation: 0.05,
      labourFluctuation: 0.015,
      plantFluctuation: 0,
      risk: 0.05,
      op: 0,
    },
    lines: [
      {
        id: "block-units",
        label: "230 mm hollow blocks incl. 5% breakage",
        category: "material",
        quantity: 10.5,
        unit: "No.",
        unitRate: 850,
        note: "10 blocks/m² × 1.05 breakage factor.",
      },
      {
        id: "block-cement",
        label: "Cement for 1:6 mortar",
        category: "material",
        quantity: 0.08205,
        unit: "bag",
        unitRate: 12000,
        note: "0.015 m³ wet mortar × 5.47 bags/m³.",
      },
      {
        id: "block-sand",
        label: "Sharp sand for mortar",
        category: "material",
        quantity: 0.0171,
        unit: "m³",
        unitRate: 14400,
        note: "0.015 m³ wet mortar × 1.14 m³ sand factor.",
      },
      {
        id: "block-labour",
        label: "Block laying labour",
        category: "labour",
        quantity: 1,
        unit: "m²",
        unitRate: 1000,
        note: "Piecework basis; editable by user.",
      },
    ],
  },
  {
    slug: "reusable-plywood-formwork",
    code: "RB-FW-001",
    title: "Reusable plywood formwork to vertical/horizontal surfaces",
    shortTitle: "Reusable plywood formwork",
    section: "Formwork",
    unit: "m²",
    countryCode: "NG",
    country: "Nigeria",
    region: "Abuja / Nasarawa",
    city: "Abuja–Keffi market",
    currency: "NGN",
    specification:
      "18 mm reusable plywood formwork, working basis of five reuse cycles, including timber/nails/release sundries and carpentry labour.",
    methodologyNote:
      "The plywood reuse factor is explicit. Users can change plywood price, reuse cycles indirectly through the allocated sheet quantity, sundries and labour.",
    sourceNote:
      "Reconstructed from the final FMC Keffi formwork master-rate methodology.",
    lastReviewed: "2026-09-26",
    status: "pilot",
    allowances: {
      materialFluctuation: 0.05,
      labourFluctuation: 0.015,
      plantFluctuation: 0,
      risk: 0.05,
      op: 0,
    },
    lines: [
      {
        id: "form-ply",
        label: "18 mm plywood allocation — 5 reuse cycles",
        category: "material",
        quantity: 1 / (2.9768 * 5),
        unit: "sheet",
        unitRate: 39000,
        note: "1.22 × 2.44 m sheet = 2.9768 m²; allocated over five uses.",
      },
      {
        id: "form-sundries",
        label: "Timber, nails, release agent and sundries",
        category: "consumable",
        quantity: 1,
        unit: "m²",
        unitRate: 2500,
        note: "Editable working allowance.",
      },
      {
        id: "form-labour",
        label: "Formwork carpentry labour",
        category: "labour",
        quantity: 1,
        unit: "m²",
        unitRate: 2000,
        note: "Editable working allowance.",
      },
    ],
  },
];

export function getRateBankItem(slug: string) {
  return RATE_BANK_ITEMS.find((item) => item.slug === slug);
}
