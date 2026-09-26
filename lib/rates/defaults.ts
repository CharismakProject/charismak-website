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
  validationNote?: string;
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
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "mechanical-excavation-wall-trenches",
    "code": "RB-EW-001",
    "title": "Mechanical excavation to wall trenches",
    "shortTitle": "Wall trench excavation",
    "section": "Earthworks",
    "unit": "m³",
    "status": "review",
    "specification": "Bulk excavation by backhoe/excavator with manual dressing. Disposal is excluded and priced separately.",
    "methodologyNote": "Plant basis uses 180 m³/day output with excavator hire, fuel and shared mobilisation. Manual dressing stays separate.",
    "sourceNote": "Reconstructed from the final FMC Keffi execution-cost model.",
    "lines": [
      {
        "id": "exc-hire",
        "label": "Excavator hire allocation",
        "category": "plant",
        "quantity": 0.005555555555555556,
        "unit": "day",
        "unitRate": 250000,
        "note": "₦250,000/day ÷ 180 m³/day."
      },
      {
        "id": "exc-diesel",
        "label": "Excavator diesel",
        "category": "plant",
        "quantity": 0.4444444444444444,
        "unit": "L",
        "unitRate": 2000,
        "note": "80 L/day ÷ 180 m³/day."
      },
      {
        "id": "exc-mob",
        "label": "Mobilisation / demobilisation allocation",
        "category": "logistics",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 408.356102,
        "note": "Shared plant logistics allocation."
      },
      {
        "id": "exc-dress",
        "label": "Manual trimming and dressing",
        "category": "labour",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 133.333333,
        "note": "Manual support to bulk excavation."
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "manual-trench-excavation",
    "code": "RB-EW-002",
    "title": "Manual excavation to foundation trenches",
    "shortTitle": "Manual trench excavation",
    "section": "Earthworks",
    "unit": "m³",
    "status": "review",
    "specification": "Excavate normal soil by hand to foundation trenches not exceeding about 1.0 m depth; trim sides and bottoms. Disposal excluded.",
    "methodologyNote": "Labour-only rate carried from the uploaded residential calculation workbook and intentionally marked for current trade-rate review.",
    "sourceNote": "2-bedroom material & labour BOQ guide.",
    "lines": [
      {
        "id": "manual-exc",
        "label": "Excavation labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 4500,
        "note": "Editable guide rate per cubic metre."
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "backfill-excavated-material",
    "code": "RB-EW-003",
    "title": "Backfill with suitable excavated material and compact",
    "shortTitle": "Backfill & compact",
    "section": "Earthworks",
    "unit": "m³",
    "status": "review",
    "specification": "Return suitable excavated material to foundations in layers, spread, water as required and compact.",
    "methodologyNote": "Separates labour spreading from light compaction instead of hiding both in one lump rate.",
    "sourceNote": "Residential BOQ + FMC earthworks methodology.",
    "lines": [
      {
        "id": "backfill-lab",
        "label": "Spreading / backfilling labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 1200,
        "note": "Residential piecework guide."
      },
      {
        "id": "backfill-comp",
        "label": "Light compaction allocation",
        "category": "plant",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 500,
        "note": "Editable plate compactor / rammer allowance."
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "imported-laterite-fill",
    "code": "RB-EW-004",
    "title": "Imported laterite filling, spread and compact",
    "shortTitle": "Imported laterite fill",
    "section": "Earthworks",
    "unit": "m³",
    "status": "review",
    "specification": "Approved laterite obtained off site, delivered, placed in layers and compacted.",
    "methodologyNote": "Material quantity includes 10% handling/compaction allowance. Haul distance can materially change the rate.",
    "sourceNote": "FMC/Central Park bulk-material benchmarks; supplier audit still required.",
    "lines": [
      {
        "id": "lat-mat",
        "label": "Imported laterite incl. 10% allowance",
        "category": "material",
        "quantity": 1.1,
        "unit": "m³",
        "unitRate": 8000,
        "note": "Working conversion from bulk tipper benchmark."
      },
      {
        "id": "lat-lab",
        "label": "Spreading labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 1200
      },
      {
        "id": "lat-plant",
        "label": "Light compaction",
        "category": "plant",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 500
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "hardcore-fill-compacted",
    "code": "RB-EW-005",
    "title": "Hardcore filling, spread and compact",
    "shortTitle": "Hardcore filling",
    "section": "Earthworks",
    "unit": "m³",
    "status": "review",
    "specification": "Hardcore obtained off site, spread to make up levels and compacted in layers.",
    "methodologyNote": "Uses 10% quantity allowance over compacted volume. Material and placing/compaction remain editable separately.",
    "sourceNote": "FMC final execution model + Central Park material benchmark.",
    "lines": [
      {
        "id": "hc-mat",
        "label": "Hardcore incl. 10% quantity allowance",
        "category": "material",
        "quantity": 1.1,
        "unit": "m³",
        "unitRate": 22500,
        "note": "Working conversion from 30t bulk supply."
      },
      {
        "id": "hc-lab",
        "label": "Spreading labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 1200
      },
      {
        "id": "hc-plant",
        "label": "Compaction allocation",
        "category": "plant",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 500
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "sharp-sand-blinding",
    "code": "RB-EW-006",
    "title": "Sharp sand filling / blinding",
    "shortTitle": "Sharp sand blinding",
    "section": "Earthworks",
    "unit": "m³",
    "status": "review",
    "specification": "Sharp sand supplied, spread to required level and lightly compacted.",
    "methodologyNote": "Allows 10% for loose-to-placed quantity. Delivery basis should be changed to the actual site market.",
    "sourceNote": "Residential BOQ and FMC aggregate benchmark.",
    "lines": [
      {
        "id": "sandfill-mat",
        "label": "Sharp sand incl. 10% allowance",
        "category": "material",
        "quantity": 1.1,
        "unit": "m³",
        "unitRate": 14400
      },
      {
        "id": "sandfill-lab",
        "label": "Spreading labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 1200
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "dpm-1000-gauge",
    "code": "RB-EW-007",
    "title": "1000 gauge damp-proof membrane laid to floor",
    "shortTitle": "DPM membrane",
    "section": "Earthworks",
    "unit": "m²",
    "status": "review",
    "specification": "1000 gauge polythene DPM laid over prepared floor filling with laps and local cutting allowance.",
    "methodologyNote": "Material is expressed by weight using the recent project procurement basis. Replace with roll coverage where supplier packaging is known.",
    "sourceNote": "Central Park material schedule + residential DPM take-off.",
    "lines": [
      {
        "id": "dpm-mat",
        "label": "DPM material allowance",
        "category": "material",
        "quantity": 0.2,
        "unit": "kg",
        "unitRate": 2000,
        "note": "Approx. 0.20 kg/m² working allowance."
      },
      {
        "id": "dpm-lab",
        "label": "Laying / laps labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 100
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "brc-mesh-a142-laid",
    "code": "RB-RF-002",
    "title": "A142 BRC mesh reinforcement supplied and laid",
    "shortTitle": "A142 mesh supply & lay",
    "section": "Reinforcement",
    "unit": "m²",
    "status": "review",
    "specification": "A142 welded mesh, 2.4 x 4.8 m sheet, including 5% lap/cutting allowance and laying labour.",
    "methodologyNote": "Sheet coverage and overlap are explicit so users can edit lap conditions and supplier sheet price.",
    "sourceNote": "Central Park BRC rate + residential sheet coverage methodology.",
    "lines": [
      {
        "id": "brc-sheet",
        "label": "A142 mesh incl. 5% lap/cutting",
        "category": "material",
        "quantity": 0.09114583333333333,
        "unit": "sheet",
        "unitRate": 44000,
        "note": "2.4 × 4.8 m sheet."
      },
      {
        "id": "brc-lab",
        "label": "Laying / tying labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 150
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "c15-blinding-1-3-6",
    "code": "RB-CO-002",
    "title": "C15 / nominal 1:3:6 concrete blinding",
    "shortTitle": "C15 concrete blinding",
    "section": "Concrete",
    "unit": "m³",
    "status": "review",
    "specification": "Nominal 1:3:6 site-mixed plain concrete using 20 mm aggregate; reinforcement and formwork excluded.",
    "methodologyNote": "Uses a 1.54 dry-volume factor and 3% cement batching allowance rather than a fixed historic bags-per-m³ shortcut.",
    "sourceNote": "Standard nominal-mix build-up aligned to FMC concrete inputs. Sep 2026 audit: cement benchmark updated to Abuja bulk working reference; concrete gang arithmetic corrected.",
    "lines": [
      {
        "id": "c15-cem",
        "label": "50 kg cement incl. 3% batching allowance",
        "category": "material",
        "quantity": 4.568,
        "unit": "bag",
        "unitRate": 12500,
        "note": "1.54 dry factor for 1:3:6 mix. Sep 2026 Abuja working bulk reference: ₦12,500/50kg bag; editable."
      },
      {
        "id": "c15-sand",
        "label": "Sharp sand",
        "category": "material",
        "quantity": 0.462,
        "unit": "m³",
        "unitRate": 14400
      },
      {
        "id": "c15-gran",
        "label": "Granite / coarse aggregate",
        "category": "material",
        "quantity": 0.924,
        "unit": "m³",
        "unitRate": 27000
      },
      {
        "id": "c15-lab",
        "label": "Concrete gang labour",
        "category": "labour",
        "quantity": 0.125,
        "unit": "gang-day",
        "unitRate": 63000,
        "note": "1 concrete mason @ ₦15,000/day + 6 labourers @ ₦8,000/day = ₦63,000/gang-day; output basis remains editable."
      },
      {
        "id": "c15-plant",
        "label": "Mixer / small plant",
        "category": "plant",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 2769
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Arithmetic and cement input updated. Sand/granite landed prices and achieved gang output still require current supplier/site confirmation before this rate is marked verified."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "c20-nominal-concrete-1-2-4",
    "code": "RB-CO-003",
    "title": "C20 nominal 1:2:4 site-mixed concrete",
    "shortTitle": "C20 site-mixed concrete",
    "section": "Concrete",
    "unit": "m³",
    "status": "review",
    "specification": "Nominal 1:2:4 site-mixed concrete for non-designed applications where permitted by the specification.",
    "methodologyNote": "Uses a 1.54 dry-volume factor and 3% batching allowance. Do not substitute for a designed mix where design concrete is required.",
    "sourceNote": "Residential 1:2:4 methodology normalized to standard volumetric build-up. Sep 2026 audit: cement benchmark updated to Abuja bulk working reference; concrete gang arithmetic corrected.",
    "lines": [
      {
        "id": "c20-cem",
        "label": "50 kg cement incl. 3% batching allowance",
        "category": "material",
        "quantity": 6.525,
        "unit": "bag",
        "unitRate": 12500,
        "note": "Sep 2026 Abuja working bulk reference: ₦12,500/50kg bag; editable."
      },
      {
        "id": "c20-sand",
        "label": "Sharp sand",
        "category": "material",
        "quantity": 0.44,
        "unit": "m³",
        "unitRate": 14400
      },
      {
        "id": "c20-gran",
        "label": "Granite / coarse aggregate",
        "category": "material",
        "quantity": 0.88,
        "unit": "m³",
        "unitRate": 27000
      },
      {
        "id": "c20-lab",
        "label": "Concrete gang labour",
        "category": "labour",
        "quantity": 0.125,
        "unit": "gang-day",
        "unitRate": 63000,
        "note": "1 concrete mason @ ₦15,000/day + 6 labourers @ ₦8,000/day = ₦63,000/gang-day; output basis remains editable."
      },
      {
        "id": "c20-plant",
        "label": "Mixer / vibrator / small plant",
        "category": "plant",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 2769
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Arithmetic and cement input updated. Sand/granite landed prices and achieved gang output still require current supplier/site confirmation before this rate is marked verified."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "c25-structural-concrete-310kg",
    "code": "RB-CO-001",
    "title": "C25 structural concrete — site mixed",
    "shortTitle": "C25 structural concrete",
    "section": "Concrete",
    "unit": "m³",
    "status": "review",
    "specification": "C25 structural concrete with minimum cement content 310 kg/m³. Reinforcement and formwork excluded.",
    "methodologyNote": "Uses 310 kg/m³ minimum cement plus 3% batching allowance. Sand/granite factors remain editable pending approved mix design.",
    "sourceNote": "Final FMC Keffi execution BOQ + reviewed execution model. Sep 2026 audit: cement benchmark updated to Abuja bulk working reference; concrete gang arithmetic corrected.",
    "lines": [
      {
        "id": "c25-cement",
        "label": "50 kg cement — 310 kg/m³ + 3% batching allowance",
        "category": "material",
        "quantity": 6.386,
        "unit": "bag",
        "unitRate": 12500,
        "note": "6.2 bags theoretical minimum × 1.03. Sep 2026 Abuja working bulk reference: ₦12,500/50kg bag; editable."
      },
      {
        "id": "c25-sand",
        "label": "Sharp sand",
        "category": "material",
        "quantity": 0.43028,
        "unit": "m³",
        "unitRate": 14400
      },
      {
        "id": "c25-granite",
        "label": "Granite / coarse aggregate",
        "category": "material",
        "quantity": 0.86056,
        "unit": "m³",
        "unitRate": 27000
      },
      {
        "id": "c25-labour",
        "label": "Concrete gang labour",
        "category": "labour",
        "quantity": 0.125,
        "unit": "gang-day",
        "unitRate": 63000,
        "note": "1 concrete mason @ ₦15,000/day + 6 labourers @ ₦8,000/day = ₦63,000/gang-day; output basis remains editable."
      },
      {
        "id": "c25-plant",
        "label": "Mixer, vibrator and small-plant allocation",
        "category": "plant",
        "quantity": 1,
        "unit": "m³",
        "unitRate": 2769
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Arithmetic and cement input updated. Sand/granite landed prices and achieved gang output still require current supplier/site confirmation before this rate is marked verified."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "high-yield-reinforcement-supply-fix",
    "code": "RB-RF-001",
    "title": "High-yield reinforcement — supply, cut, bend and fix",
    "shortTitle": "Reinforcement supply & fix",
    "section": "Reinforcement",
    "unit": "t",
    "status": "review",
    "specification": "High-yield reinforcement by theoretical tonne, including 3% cutting/waste, binding/cutting consumables and fixing labour.",
    "methodologyNote": "Lap allowance is not hidden. Add lap separately where measured steel excludes it.",
    "sourceNote": "Final FMC Keffi reinforcement procurement and fixing basis.",
    "lines": [
      {
        "id": "rebar-steel",
        "label": "High-yield TMT reinforcement incl. 3% cutting waste",
        "category": "material",
        "quantity": 1.03,
        "unit": "t",
        "unitRate": 1100000,
        "note": "Current Abuja observations conflict: bulk tonne checks are lower than some 12m TMT bar quotations when converted using theoretical mass. ₦1.10m/t is retained temporarily until supplier weight/grade is reconciled."
      },
      {
        "id": "rebar-consumables",
        "label": "Binding wire / cutting consumables",
        "category": "consumable",
        "quantity": 1,
        "unit": "t",
        "unitRate": 23175
      },
      {
        "id": "rebar-fix",
        "label": "Cutting, bending and fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "t",
        "unitRate": 85000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Do not mark verified yet. A September Abuja check shows about ₦920k/t TMT, while 12mm bars around ₦12,000–₦12,300 imply a higher tonne-equivalent at theoretical weight. We need an actual weighed/grade-confirmed supplier basis."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "230mm-hollow-sandcrete-blockwork",
    "code": "RB-MA-001",
    "title": "230 mm hollow sandcrete blockwork in 1:6 mortar",
    "shortTitle": "230 mm hollow blockwork",
    "section": "Masonry",
    "unit": "m²",
    "status": "review",
    "specification": "230 mm hollow sandcrete block wall, 10 blocks/m² working basis, 5% block breakage and 1:6 mortar.",
    "methodologyNote": "Block count, breakage, mortar and labour are all exposed.",
    "sourceNote": "Residential/FMC blockwork methodology. Sep 2026 Abuja checks show 225mm block quotations around ₦700–₦950+, with a current supplier reference at ₦750.",
    "lines": [
      {
        "id": "block225",
        "label": "230 mm hollow blocks incl. 5% breakage",
        "category": "material",
        "quantity": 10.5,
        "unit": "No.",
        "unitRate": 750,
        "note": "Working Abuja supplier reference. Current market observations vary materially with strength, curing and delivery."
      },
      {
        "id": "block225-cem",
        "label": "Cement for 1:6 mortar",
        "category": "material",
        "quantity": 0.08205,
        "unit": "bag",
        "unitRate": 12500,
        "note": "Sep 2026 Abuja working bulk reference: ₦12,500/50kg bag; editable."
      },
      {
        "id": "block225-sand",
        "label": "Sharp sand for mortar",
        "category": "material",
        "quantity": 0.0171,
        "unit": "m³",
        "unitRate": 14400
      },
      {
        "id": "block225-lab",
        "label": "Block laying labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Block count/mortar logic is sound, but the public material price must be tied to a stated compressive-strength grade and delivery basis before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "150mm-hollow-sandcrete-blockwork",
    "code": "RB-MA-002",
    "title": "150 mm hollow sandcrete blockwork in mortar",
    "shortTitle": "150 mm hollow blockwork",
    "section": "Masonry",
    "unit": "m²",
    "status": "review",
    "specification": "150 mm hollow sandcrete wall, 10 blocks/m² working basis, 5% breakage and cement:sand mortar.",
    "methodologyNote": "150 mm block price remains a provisional editable input pending the wider supplier-price audit.",
    "sourceNote": "Residential BOQ geometry; price input deliberately flagged for review. Sep 2026 Abuja supplier reference: about ₦650/piece, within broader market range.",
    "lines": [
      {
        "id": "block150",
        "label": "150 mm hollow blocks incl. 5% breakage",
        "category": "material",
        "quantity": 10.5,
        "unit": "No.",
        "unitRate": 650,
        "note": "Working Abuja supplier reference; strength/delivery basis pending validation."
      },
      {
        "id": "block150-cem",
        "label": "Cement for mortar",
        "category": "material",
        "quantity": 0.0656,
        "unit": "bag",
        "unitRate": 12500,
        "note": "Sep 2026 Abuja working bulk reference: ₦12,500/50kg bag; editable."
      },
      {
        "id": "block150-sand",
        "label": "Sharp sand for mortar",
        "category": "material",
        "quantity": 0.0137,
        "unit": "m³",
        "unitRate": 14400
      },
      {
        "id": "block150-lab",
        "label": "Block laying labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "150mm block price remains under validation because strength class, curing quality and delivery distance materially change the rate."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "15mm-cement-sand-plaster",
    "code": "RB-FN-001",
    "title": "15 mm cement-sand plaster/render to blockwork",
    "shortTitle": "15 mm wall plaster",
    "section": "Finishes",
    "unit": "m²",
    "status": "review",
    "specification": "15 mm average cement-sand plaster/render, floated finish, including material wastage and application labour.",
    "methodologyNote": "Resource quantities are normalized from the uploaded residential BOQ and current cement/sand inputs.",
    "sourceNote": "2-bedroom BOQ material consumption + FMC plaster labour benchmark.",
    "lines": [
      {
        "id": "plaster-cem",
        "label": "Cement",
        "category": "material",
        "quantity": 0.15,
        "unit": "bag",
        "unitRate": 12500,
        "note": "Sep 2026 Abuja working bulk reference: ₦12,500/50kg bag; editable."
      },
      {
        "id": "plaster-sand",
        "label": "Plaster/sharp sand",
        "category": "material",
        "quantity": 0.035,
        "unit": "m³",
        "unitRate": 14400
      },
      {
        "id": "plaster-lab",
        "label": "Plaster/render labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 900
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "20mm-wall-tile-backing",
    "code": "RB-FN-002",
    "title": "20 mm cement-sand backing to receive wall tiles",
    "shortTitle": "Wall tile backing",
    "section": "Finishes",
    "unit": "m²",
    "status": "review",
    "specification": "20 mm cement-sand backing/screed to wall surfaces ready to receive tiles.",
    "methodologyNote": "Cement and sand quantities follow the residential BOQ formula and remain editable.",
    "sourceNote": "2-bedroom material & labour BOQ guide.",
    "lines": [
      {
        "id": "wallback-cem",
        "label": "Cement",
        "category": "material",
        "quantity": 0.185,
        "unit": "bag",
        "unitRate": 12500,
        "note": "Sep 2026 Abuja working bulk reference: ₦12,500/50kg bag; editable."
      },
      {
        "id": "wallback-sand",
        "label": "Sharp sand",
        "category": "material",
        "quantity": 0.0395,
        "unit": "m³",
        "unitRate": 14400
      },
      {
        "id": "wallback-lab",
        "label": "Backing/screed labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 900
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "30mm-floor-screed",
    "code": "RB-FN-003",
    "title": "30 mm cement-sand floor screed",
    "shortTitle": "30 mm floor screed",
    "section": "Finishes",
    "unit": "m²",
    "status": "review",
    "specification": "30 mm average cement-sand floor screed to receive tiles or other finishes.",
    "methodologyNote": "Material quantities are doubled from the 15–20 mm residential backing basis and exposed for editing.",
    "sourceNote": "2-bedroom material & labour BOQ guide.",
    "lines": [
      {
        "id": "floorscreed-cem",
        "label": "Cement",
        "category": "material",
        "quantity": 0.37,
        "unit": "bag",
        "unitRate": 12500,
        "note": "Sep 2026 Abuja working bulk reference: ₦12,500/50kg bag; editable."
      },
      {
        "id": "floorscreed-sand",
        "label": "Sharp sand",
        "category": "material",
        "quantity": 0.079,
        "unit": "m³",
        "unitRate": 14400
      },
      {
        "id": "floorscreed-lab",
        "label": "Screeding labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 900
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "600x600-floor-tiling",
    "code": "RB-FN-004",
    "title": "600 x 600 porcelain floor tiling",
    "shortTitle": "600×600 floor tiling",
    "section": "Finishes",
    "unit": "m²",
    "status": "review",
    "specification": "Supply and lay 600 x 600 porcelain floor tiles on prepared screed, including 15% cutting/waste, adhesive, spacers/grout allowance and laying labour.",
    "methodologyNote": "Tile and adhesive inputs are separated so product choice can be changed without rewriting the rate.",
    "sourceNote": "FMC tile benchmark + residential material consumption; adhesive input from recent Abuja project pricing.",
    "lines": [
      {
        "id": "floortile-tile",
        "label": "600×600 floor tile incl. 15% waste",
        "category": "material",
        "quantity": 1.15,
        "unit": "m²",
        "unitRate": 10500
      },
      {
        "id": "floortile-adh",
        "label": "20 kg tile adhesive",
        "category": "material",
        "quantity": 0.2222222222222222,
        "unit": "bag",
        "unitRate": 22500
      },
      {
        "id": "floortile-acc",
        "label": "Spacers / grout / minor accessories",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 350
      },
      {
        "id": "floortile-lab",
        "label": "Tile laying labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 3000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "600x300-wall-tiling",
    "code": "RB-FN-005",
    "title": "600 x 300 porcelain wall tiling",
    "shortTitle": "600×300 wall tiling",
    "section": "Finishes",
    "unit": "m²",
    "status": "review",
    "specification": "Supply and fix 600 x 300 wall tiles on prepared backing, including 15% cutting/waste, adhesive, spacers/trims allowance and labour.",
    "methodologyNote": "Backing/screed is measured separately; this rate covers the tile finish itself.",
    "sourceNote": "FMC wall-tile benchmark + residential consumption guide.",
    "lines": [
      {
        "id": "walltile-tile",
        "label": "600×300 wall tile incl. 15% waste",
        "category": "material",
        "quantity": 1.15,
        "unit": "m²",
        "unitRate": 7500
      },
      {
        "id": "walltile-adh",
        "label": "20 kg tile adhesive",
        "category": "material",
        "quantity": 0.25,
        "unit": "bag",
        "unitRate": 22500
      },
      {
        "id": "walltile-acc",
        "label": "Spacers / trim / grout allowance",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 500
      },
      {
        "id": "walltile-lab",
        "label": "Wall tile laying labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 3000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "three-coat-emulsion-paint",
    "code": "RB-FN-006",
    "title": "Three-coat emulsion paint to prepared wall",
    "shortTitle": "3-coat emulsion painting",
    "section": "Finishes",
    "unit": "m²",
    "status": "review",
    "specification": "Prepare and apply three coats of approved emulsion paint to prepared plastered/screeded wall.",
    "methodologyNote": "Paint consumption follows the residential workbook coverage logic; preparation level and product coverage remain editable.",
    "sourceNote": "FMC paint pail benchmark + residential 3-coat consumption.",
    "lines": [
      {
        "id": "paint-emul",
        "label": "20 L emulsion paint",
        "category": "material",
        "quantity": 0.01875,
        "unit": "pail",
        "unitRate": 99437.5,
        "note": "3 coats at 8 m²/L working coverage."
      },
      {
        "id": "paint-sund",
        "label": "Rollers, masking, fillers and sundries",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 150
      },
      {
        "id": "paint-lab",
        "label": "Painting labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 650
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "timber-formwork-foundation-sides",
    "code": "RB-FW-001",
    "title": "Traditional well-sawn plank formwork to below-ground concrete",
    "shortTitle": "Below-ground plank formwork",
    "section": "Formwork",
    "unit": "m²",
    "status": "review",
    "specification": "Traditional formwork to footings, ground beams, plinths and low underground concrete faces using well-sawn straight 1x12 plank with four reuse cycles, 2x3 framing, 2x2 bracing, nails/release agent and carpentry labour.",
    "methodologyNote": "Default facing-board rule: well-sawn 1x12 plank is charged over 4 reuses. Framing and bracing remain separate editable resources. Use this below ground; use a plywood system above ground where the project requires smoother concrete.",
    "sourceNote": "2-bedroom/KMSTEEL timber take-offs + Central Park timber/nail rates. Sep 2026 Abuja audit checked plywood, timber, H20/Peri and labour market references; structural/shuttering quantities remain to be validated against a formwork layout. User-approved V2 rule: well-sawn normal plank = 4 reuse cycles.",
    "lines": [
      {
        "id": "fwf-plank",
        "label": "Well-sawn 1x12 plank facing — 4 reuses",
        "category": "material",
        "quantity": 0.22768670309653916,
        "unit": "3.6m length",
        "unitRate": 3000,
        "note": "1m² facing ÷ (0.305m × 3.6m plank area × 4 reuses)."
      },
      {
        "id": "fwf-2x3",
        "label": "2x3 studs and walers — 4 reuses",
        "category": "material",
        "quantity": 0.23152777777777778,
        "unit": "3.6m length",
        "unitRate": 1300,
        "note": "Working geometry: about 1.667m vertical + 1.667m horizontal timber per m², then four reuses."
      },
      {
        "id": "fwf-2x2",
        "label": "2x2 braces/cleats — 4 reuses",
        "category": "material",
        "quantity": 0.034722222222222224,
        "unit": "3.6m length",
        "unitRate": 1000,
        "note": "Working bracing allowance; editable for height and shutter arrangement."
      },
      {
        "id": "fwf-nail",
        "label": "2–3 inch nails",
        "category": "consumable",
        "quantity": 0.006,
        "unit": "bag",
        "unitRate": 27000
      },
      {
        "id": "fwf-release",
        "label": "Release agent / small sundries",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 250
      },
      {
        "id": "fwf-carp",
        "label": "Formwork carpenter",
        "category": "labour",
        "quantity": 0.12,
        "unit": "day",
        "unitRate": 15000
      },
      {
        "id": "fwf-help",
        "label": "Carpenter helper / labourer",
        "category": "labour",
        "quantity": 0.12,
        "unit": "day",
        "unitRate": 8000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The 4-reuse plank rule is fixed as the default, but stud/waler spacing and labour productivity still vary with ground-beam depth, footing geometry and access."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "plywood-formwork-columns",
    "code": "RB-FW-002",
    "title": "Economical marine-plywood formwork to RC columns",
    "shortTitle": "Column formwork — cheap marine",
    "section": "Formwork",
    "unit": "m²",
    "status": "review",
    "specification": "18 mm economical marine plywood column formwork with 2x2/2x3 framing, 2x6 walers, nails, release agent and fixing/striking labour.",
    "methodologyNote": "Each timber component is separated. Plywood is allocated over three reuse cycles; user can edit quantities to match column size and reuse plan.",
    "sourceNote": "FMC plywood/reuse basis + 2-bedroom/KMSTEEL timber methodology; timber market inputs refreshed from recent Abuja references. Sep 2026 Abuja audit checked plywood, timber, H20/Peri and labour market references; structural/shuttering quantities remain to be validated against a formwork layout. User-approved V2 rule: economical/cheap marine board = 3 casting cycles.",
    "lines": [
      {
        "id": "fwc-ply",
        "label": "18 mm economical marine plywood facing — 3 casting cycles",
        "category": "material",
        "quantity": 0.11197706709665863,
        "unit": "sheet",
        "unitRate": 27500,
        "note": "4×8 sheet = 2.9768m²; charged over 3 casting cycles. Abuja construction-board working reference ₦27,500/sheet; editable."
      },
      {
        "id": "fwc-2x3",
        "label": "2x3 vertical studs",
        "category": "material",
        "quantity": 0.3,
        "unit": "length",
        "unitRate": 1300
      },
      {
        "id": "fwc-2x2",
        "label": "2x2 braces / cleats",
        "category": "material",
        "quantity": 0.3,
        "unit": "length",
        "unitRate": 1000
      },
      {
        "id": "fwc-2x6",
        "label": "2x6 walers / strongbacks",
        "category": "material",
        "quantity": 0.15,
        "unit": "length",
        "unitRate": 2500,
        "note": "Editable Abuja working input."
      },
      {
        "id": "fwc-nail",
        "label": "2–3 inch nails",
        "category": "consumable",
        "quantity": 0.008,
        "unit": "bag",
        "unitRate": 27000
      },
      {
        "id": "fwc-release",
        "label": "Release agent / tie sundries",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 250
      },
      {
        "id": "fwc-carp",
        "label": "Formwork carpenter",
        "category": "labour",
        "quantity": 0.18,
        "unit": "day",
        "unitRate": 15000
      },
      {
        "id": "fwc-help",
        "label": "Carpenter helper / labourer",
        "category": "labour",
        "quantity": 0.18,
        "unit": "day",
        "unitRate": 8000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. Formwork cannot be verified from material prices alone: member spacing, shutter geometry, reuse cycles, prop/H20 arrangement, rental duration and stripping cycle must be checked for the specific formwork type."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "plywood-formwork-beams-lintels",
    "code": "RB-FW-003",
    "title": "Economical marine-plywood formwork to beams and lintels",
    "shortTitle": "Beam/lintel — cheap marine",
    "section": "Formwork",
    "unit": "m²",
    "status": "review",
    "specification": "Beam/lintel formwork with reusable plywood, 2x2 and 2x3 timber, 2x6 bearers, Peri/H20 beam support allowance, nails, release agent and labour.",
    "methodologyNote": "Beam sides and soffits need a stronger support system than simple wall/edge shuttering, so 2x6 and Peri/H20 support are visible inputs.",
    "sourceNote": "2-bedroom/KMSTEEL formwork logic + FMC plywood basis + current Abuja timber/Peri working observations. Sep 2026 Abuja audit checked plywood, timber, H20/Peri and labour market references; structural/shuttering quantities remain to be validated against a formwork layout. User-approved V2 rule: economical/cheap marine board = 3 casting cycles.",
    "lines": [
      {
        "id": "fwb-ply",
        "label": "18 mm economical marine plywood facing — 3 casting cycles",
        "category": "material",
        "quantity": 0.11197706709665863,
        "unit": "sheet",
        "unitRate": 27500,
        "note": "4×8 sheet = 2.9768m²; charged over 3 casting cycles. Abuja construction-board working reference ₦27,500/sheet; editable."
      },
      {
        "id": "fwb-2x3",
        "label": "2x3 studs / runners",
        "category": "material",
        "quantity": 0.35,
        "unit": "length",
        "unitRate": 1300
      },
      {
        "id": "fwb-2x2",
        "label": "2x2 cleats / bracing",
        "category": "material",
        "quantity": 0.25,
        "unit": "length",
        "unitRate": 1000
      },
      {
        "id": "fwb-2x6",
        "label": "2x6 bearers",
        "category": "material",
        "quantity": 0.2,
        "unit": "length",
        "unitRate": 2500
      },
      {
        "id": "fwb-peri",
        "label": "Peri / Doka H20 beam allocation",
        "category": "material",
        "quantity": 0.05,
        "unit": "No.",
        "unitRate": 16900,
        "note": "Working purchase-equivalent allocation; edit for rental or reuse. Sep 2026 Abuja H20 working purchase reference: ₦16,900; allocation/reuse remains under validation."
      },
      {
        "id": "fwb-nail",
        "label": "2–3 inch nails",
        "category": "consumable",
        "quantity": 0.008,
        "unit": "bag",
        "unitRate": 27000
      },
      {
        "id": "fwb-release",
        "label": "Release agent / tie sundries",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 250
      },
      {
        "id": "fwb-carp",
        "label": "Formwork carpenter",
        "category": "labour",
        "quantity": 0.2,
        "unit": "day",
        "unitRate": 15000
      },
      {
        "id": "fwb-help",
        "label": "Carpenter helper / labourer",
        "category": "labour",
        "quantity": 0.2,
        "unit": "day",
        "unitRate": 8000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. Formwork cannot be verified from material prices alone: member spacing, shutter geometry, reuse cycles, prop/H20 arrangement, rental duration and stripping cycle must be checked for the specific formwork type."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "plywood-formwork-slab-soffit",
    "code": "RB-FW-004",
    "title": "Economical marine-plywood formwork to suspended slab soffit",
    "shortTitle": "Slab soffit — cheap marine",
    "section": "Formwork",
    "unit": "m²",
    "status": "review",
    "specification": "Suspended slab formwork with reusable 18 mm plywood, 2x2/2x3 framing, 2x6 secondary bearers, Peri/H20 primary beams, nails, release agent and erection/striking labour.",
    "methodologyNote": "Suspended slab formwork with reusable 18 mm plywood, timber framing, H20/Peri support and explicit Acrow-prop rental. The prop quantity currently uses a published 175mm slab / 3.0m-height schedule as a working benchmark and must be redesigned for the actual slab.",
    "sourceNote": "FMC reuse methodology + residential/KMSTEEL timber take-offs + current Abuja Peri/timber working observations. Sep 2026 Abuja audit checked plywood, timber, H20/Peri and labour market references; structural/shuttering quantities remain to be validated against a formwork layout. User-approved V2 rule: economical/cheap marine board = 3 casting cycles.",
    "lines": [
      {
        "id": "fws-ply",
        "label": "18 mm economical marine plywood facing — 3 casting cycles",
        "category": "material",
        "quantity": 0.11197706709665863,
        "unit": "sheet",
        "unitRate": 27500,
        "note": "4×8 sheet = 2.9768m²; charged over 3 casting cycles. Abuja construction-board working reference ₦27,500/sheet; editable."
      },
      {
        "id": "fws-2x3",
        "label": "2x3 joists / runners",
        "category": "material",
        "quantity": 0.3,
        "unit": "length",
        "unitRate": 1300
      },
      {
        "id": "fws-2x2",
        "label": "2x2 noggins / bracing",
        "category": "material",
        "quantity": 0.25,
        "unit": "length",
        "unitRate": 1000
      },
      {
        "id": "fws-2x6",
        "label": "2x6 secondary bearers",
        "category": "material",
        "quantity": 0.25,
        "unit": "length",
        "unitRate": 2500
      },
      {
        "id": "fws-peri",
        "label": "Peri / Doka H20 primary beam allocation",
        "category": "material",
        "quantity": 0.08,
        "unit": "No.",
        "unitRate": 16900,
        "note": "Sep 2026 Abuja H20 working purchase reference: ₦16,900; allocation/reuse remains under validation."
      },
      {
        "id": "fws-prop-rental",
        "label": "Acrow prop rental allocation — 21-day working cycle",
        "category": "plant",
        "quantity": 29.22,
        "unit": "prop-day",
        "unitRate": 200,
        "note": "Working basis: 487 props / 350m² = 1.391 props/m²; × 21 days. Current Abuja rental reference ₦200/prop/day, excluding delivery/VAT. Edit to suit slab design and cycle."
      },
      {
        "id": "fws-nail",
        "label": "2–3 inch nails",
        "category": "consumable",
        "quantity": 0.01,
        "unit": "bag",
        "unitRate": 27000
      },
      {
        "id": "fws-release",
        "label": "Release agent / tie sundries",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 250
      },
      {
        "id": "fws-carp",
        "label": "Formwork carpenter",
        "category": "labour",
        "quantity": 0.22,
        "unit": "day",
        "unitRate": 15000
      },
      {
        "id": "fws-help",
        "label": "Carpenter helper / labourer",
        "category": "labour",
        "quantity": 0.22,
        "unit": "day",
        "unitRate": 8000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. Formwork cannot be verified from material prices alone: member spacing, shutter geometry, reuse cycles, prop/H20 arrangement, rental duration and stripping cycle must be checked for the specific formwork type."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "plywood-formwork-staircase",
    "code": "RB-FW-005",
    "title": "Economical marine-plywood formwork to reinforced concrete staircase",
    "shortTitle": "Staircase — cheap marine",
    "section": "Formwork",
    "unit": "m²",
    "status": "review",
    "specification": "Stair/landing formwork with plywood facing, timber stringers/joists/bracing, 2x6/Peri support allowance, nails, release agent and higher-detail carpentry labour.",
    "methodologyNote": "Stairs attract more cutting, setting-out and striking labour than flat soffits; the labour factor is therefore separately visible and editable.",
    "sourceNote": "Residential staircase/formwork methodology normalized with current formwork inputs. Sep 2026 Abuja audit checked plywood, timber, H20/Peri and labour market references; structural/shuttering quantities remain to be validated against a formwork layout. User-approved V2 rule: economical/cheap marine board = 3 casting cycles.",
    "lines": [
      {
        "id": "fwst-ply",
        "label": "18 mm economical marine plywood facing — 3 casting cycles",
        "category": "material",
        "quantity": 0.11197706709665863,
        "unit": "sheet",
        "unitRate": 27500,
        "note": "4×8 sheet = 2.9768m²; charged over 3 casting cycles. Abuja construction-board working reference ₦27,500/sheet; editable."
      },
      {
        "id": "fwst-2x3",
        "label": "2x3 framing / riser supports",
        "category": "material",
        "quantity": 0.35,
        "unit": "length",
        "unitRate": 1300
      },
      {
        "id": "fwst-2x2",
        "label": "2x2 cleats / bracing",
        "category": "material",
        "quantity": 0.3,
        "unit": "length",
        "unitRate": 1000
      },
      {
        "id": "fwst-2x6",
        "label": "2x6 stringer / bearer allowance",
        "category": "material",
        "quantity": 0.25,
        "unit": "length",
        "unitRate": 2500
      },
      {
        "id": "fwst-peri",
        "label": "Peri / H20 support allocation",
        "category": "material",
        "quantity": 0.04,
        "unit": "No.",
        "unitRate": 16900,
        "note": "Sep 2026 Abuja H20 working purchase reference: ₦16,900; allocation/reuse remains under validation."
      },
      {
        "id": "fwst-nail",
        "label": "2–3 inch nails",
        "category": "consumable",
        "quantity": 0.012,
        "unit": "bag",
        "unitRate": 27000
      },
      {
        "id": "fwst-release",
        "label": "Release agent / small sundries",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 300
      },
      {
        "id": "fwst-carp",
        "label": "Formwork carpenter",
        "category": "labour",
        "quantity": 0.3,
        "unit": "day",
        "unitRate": 15000
      },
      {
        "id": "fwst-help",
        "label": "Carpenter helper / labourer",
        "category": "labour",
        "quantity": 0.3,
        "unit": "day",
        "unitRate": 8000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. Formwork cannot be verified from material prices alone: member spacing, shutter geometry, reuse cycles, prop/H20 arrangement, rental duration and stripping cycle must be checked for the specific formwork type."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "aluminium-window-installation",
    "code": "RB-JN-001",
    "title": "Aluminium window installation and dressing",
    "shortTitle": "Window installation",
    "section": "Doors & Windows",
    "unit": "No.",
    "status": "review",
    "specification": "Install and dress client-supplied aluminium window unit, including normal fixing labour and minor consumables; major making-good excluded.",
    "methodologyNote": "Workmanship benchmark from the uploaded residential BOQ; window size and opening condition should be edited.",
    "sourceNote": "2-bedroom labour BOQ guide.",
    "lines": [
      {
        "id": "win-cons",
        "label": "Fixings / silicone / minor consumables",
        "category": "consumable",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 1500
      },
      {
        "id": "win-lab",
        "label": "Installation & dressing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 20000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "door-installation-dressing",
    "code": "RB-JN-002",
    "title": "Door installation and dressing",
    "shortTitle": "Door installation",
    "section": "Doors & Windows",
    "unit": "No.",
    "status": "review",
    "specification": "Install and dress client-supplied door and frame, including normal fixing consumables and labour.",
    "methodologyNote": "Door type, frame material, hardware and making-good can materially change the rate.",
    "sourceNote": "2-bedroom labour BOQ guide.",
    "lines": [
      {
        "id": "door-cons",
        "label": "Fixings / foam / sealant / minor consumables",
        "category": "consumable",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 2000
      },
      {
        "id": "door-lab",
        "label": "Door installation labour",
        "category": "labour",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 35000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "wc-wash-basin-fixing",
    "code": "RB-ME-001",
    "title": "Fix complete WC and wash-hand basin set",
    "shortTitle": "WC + wash basin fixing",
    "section": "Plumbing",
    "unit": "set",
    "status": "review",
    "specification": "Fix client-supplied WC and wash-hand basin set to prepared points, including normal connection and testing labour. Major pipe rerouting excluded.",
    "methodologyNote": "Workmanship benchmark only; pan connectors, traps, flexible connectors and specialist accessories should be added where not client supplied.",
    "sourceNote": "2-bedroom M&E labour BOQ guide.",
    "lines": [
      {
        "id": "wc-cons",
        "label": "Minor fixing / sealant consumables",
        "category": "consumable",
        "quantity": 1,
        "unit": "set",
        "unitRate": 1500
      },
      {
        "id": "wc-lab",
        "label": "Plumber fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "set",
        "unitRate": 15000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "kitchen-sink-fixing",
    "code": "RB-ME-002",
    "title": "Fix kitchen sink and mixer to prepared points",
    "shortTitle": "Kitchen sink fixing",
    "section": "Plumbing",
    "unit": "No.",
    "status": "review",
    "specification": "Fix client-supplied sink and mixer to prepared supply/waste points; normal connection and testing included.",
    "methodologyNote": "Cabinet cutting, new pipe routes and specialist traps are excluded unless added by the user.",
    "sourceNote": "2-bedroom M&E labour BOQ guide.",
    "lines": [
      {
        "id": "sink-cons",
        "label": "Minor connectors / sealant consumables",
        "category": "consumable",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 1200
      },
      {
        "id": "sink-lab",
        "label": "Plumber fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 8000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "shower-control-fixing",
    "code": "RB-ME-003",
    "title": "Fix shower set and control",
    "shortTitle": "Shower fitting",
    "section": "Plumbing",
    "unit": "No.",
    "status": "review",
    "specification": "Fix client-supplied shower head/rail and control to prepared plumbing points.",
    "methodologyNote": "Concealed-body installation before tiling is a different activity and should be priced separately.",
    "sourceNote": "2-bedroom M&E labour BOQ guide.",
    "lines": [
      {
        "id": "shower-cons",
        "label": "Minor connectors / sealant",
        "category": "consumable",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 750
      },
      {
        "id": "shower-lab",
        "label": "Plumber fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 5000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "bathroom-mirror-fixing",
    "code": "RB-ME-004",
    "title": "Fix bathroom mirror",
    "shortTitle": "Mirror fixing",
    "section": "Finishes",
    "unit": "No.",
    "status": "review",
    "specification": "Fix client-supplied bathroom mirror with normal mechanical/adhesive fixings to prepared wall.",
    "methodologyNote": "Large frameless mirrors, cut-outs, concealed lighting and specialist brackets require separate adjustment.",
    "sourceNote": "2-bedroom finishing labour BOQ guide.",
    "lines": [
      {
        "id": "mirror-cons",
        "label": "Fixings / adhesive / buffers",
        "category": "consumable",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 1000
      },
      {
        "id": "mirror-lab",
        "label": "Fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 5000
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "slug": "floor-drain-fixing",
    "code": "RB-ME-005",
    "title": "Fix stainless-steel floor drain",
    "shortTitle": "Floor drain fixing",
    "section": "Plumbing",
    "unit": "No.",
    "status": "review",
    "specification": "Fix client-supplied stainless-steel floor drain to prepared waste point and dress flush with finish.",
    "methodologyNote": "Core drilling, new waste line and waterproofing repair are excluded.",
    "sourceNote": "2-bedroom M&E labour BOQ guide.",
    "lines": [
      {
        "id": "fd-cons",
        "label": "Sealant / minor connection consumables",
        "category": "consumable",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 500
      },
      {
        "id": "fd-lab",
        "label": "Plumber fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "No.",
        "unitRate": 1500
      }
    ],
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "validationNote": "Under validation. The calculation remains usable and editable, but current material/labour inputs are still being checked against fresh market observations and project evidence before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "marine-plywood-formwork-shear-wall",
    "code": "RB-FW-006",
    "title": "Economical marine-plywood formwork to RC walls / shear walls",
    "shortTitle": "Wall formwork — cheap marine",
    "section": "Formwork",
    "unit": "m²",
    "specification": "18 mm economical marine plywood wall formwork on 2x3 studs, 2x6 walers/strongbacks, ties/bracing, nails, release agent and fixing/striking labour. Plywood charged over 3 casting cycles.",
    "methodologyNote": "Designed for above-ground wall faces. Tie spacing, wall height and concrete pressure govern framing quantity; every resource is editable.",
    "sourceNote": "Formwork V2 methodology + Abuja Sep-2026 marine-board/H20/timber checks. User-approved cheap marine board reuse: 3 cycles.",
    "lines": [
      {
        "id": "fww-ply",
        "label": "18 mm economical marine plywood — 3 cycles",
        "category": "material",
        "quantity": 0.11197706709665863,
        "unit": "sheet",
        "unitRate": 27500
      },
      {
        "id": "fww-2x3",
        "label": "2x3 vertical studs",
        "category": "material",
        "quantity": 0.3,
        "unit": "3.6m length",
        "unitRate": 1300
      },
      {
        "id": "fww-2x6",
        "label": "2x6 walers / strongbacks",
        "category": "material",
        "quantity": 0.18,
        "unit": "3.6m length",
        "unitRate": 3000
      },
      {
        "id": "fww-ties",
        "label": "Tie-rod / clamp / spacer allocation",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 750
      },
      {
        "id": "fww-nail",
        "label": "Nails / screws",
        "category": "consumable",
        "quantity": 0.008,
        "unit": "bag",
        "unitRate": 27000
      },
      {
        "id": "fww-release",
        "label": "Release agent",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 250
      },
      {
        "id": "fww-carp",
        "label": "Formwork carpenter",
        "category": "labour",
        "quantity": 0.2,
        "unit": "day",
        "unitRate": 15000
      },
      {
        "id": "fww-help",
        "label": "Helper / labourer",
        "category": "labour",
        "quantity": 0.2,
        "unit": "day",
        "unitRate": 8000
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "plank-formwork-columns",
    "code": "RB-FW-007",
    "title": "Well-sawn plank formwork to reinforced concrete columns",
    "shortTitle": "Column formwork — plank",
    "section": "Formwork",
    "unit": "m²",
    "specification": "Well-sawn straight 1x12 plank column formwork with 2x3 studs, 2x6 walers, 2x2 bracing, nails/release agent and labour. Facing plank charged over 4 reuses.",
    "methodologyNote": "Alternative to marine plywood where a plank finish is acceptable or cheaper. The 4-reuse plank rule is explicit.",
    "sourceNote": "Residential/KMSTEEL traditional shuttering logic. User-approved normal well-sawn plank reuse: 4 cycles.",
    "lines": [
      {
        "id": "fwcp-plank",
        "label": "Well-sawn 1x12 plank facing — 4 reuses",
        "category": "material",
        "quantity": 0.22768670309653916,
        "unit": "3.6m length",
        "unitRate": 3000
      },
      {
        "id": "fwcp-2x3",
        "label": "2x3 studs",
        "category": "material",
        "quantity": 0.28,
        "unit": "3.6m length",
        "unitRate": 1300
      },
      {
        "id": "fwcp-2x6",
        "label": "2x6 walers",
        "category": "material",
        "quantity": 0.14,
        "unit": "3.6m length",
        "unitRate": 3000
      },
      {
        "id": "fwcp-2x2",
        "label": "2x2 bracing/cleats",
        "category": "material",
        "quantity": 0.12,
        "unit": "3.6m length",
        "unitRate": 1000
      },
      {
        "id": "fwcp-nail",
        "label": "Nails",
        "category": "consumable",
        "quantity": 0.008,
        "unit": "bag",
        "unitRate": 27000
      },
      {
        "id": "fwcp-release",
        "label": "Release agent / ties",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 350
      },
      {
        "id": "fwcp-carp",
        "label": "Formwork carpenter",
        "category": "labour",
        "quantity": 0.2,
        "unit": "day",
        "unitRate": 15000
      },
      {
        "id": "fwcp-help",
        "label": "Helper",
        "category": "labour",
        "quantity": 0.2,
        "unit": "day",
        "unitRate": 8000
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "plank-formwork-beams-lintels",
    "code": "RB-FW-008",
    "title": "Well-sawn plank formwork to beams and lintels",
    "shortTitle": "Beam/lintel — plank",
    "section": "Formwork",
    "unit": "m²",
    "specification": "Traditional beam/lintel shuttering using well-sawn 1x12 plank facing, 2x3 framing, 2x6 bearers, bracing, nails/release agent and erection/striking labour. Plank charged over 4 reuses.",
    "methodologyNote": "Useful where projects use plank below and/or above ground instead of marine plywood. Bearer/support quantity changes with beam size and span.",
    "sourceNote": "Residential and Jahi formwork evidence. User-approved well-sawn plank reuse: 4 cycles.",
    "lines": [
      {
        "id": "fwbp-plank",
        "label": "Well-sawn 1x12 plank facing — 4 reuses",
        "category": "material",
        "quantity": 0.22768670309653916,
        "unit": "3.6m length",
        "unitRate": 3000
      },
      {
        "id": "fwbp-2x3",
        "label": "2x3 side framing",
        "category": "material",
        "quantity": 0.3,
        "unit": "3.6m length",
        "unitRate": 1300
      },
      {
        "id": "fwbp-2x6",
        "label": "2x6 bottom bearer / strongback",
        "category": "material",
        "quantity": 0.18,
        "unit": "3.6m length",
        "unitRate": 3000
      },
      {
        "id": "fwbp-2x2",
        "label": "2x2 cleats/bracing",
        "category": "material",
        "quantity": 0.1,
        "unit": "3.6m length",
        "unitRate": 1000
      },
      {
        "id": "fwbp-nail",
        "label": "Nails",
        "category": "consumable",
        "quantity": 0.008,
        "unit": "bag",
        "unitRate": 27000
      },
      {
        "id": "fwbp-release",
        "label": "Release agent / ties",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 300
      },
      {
        "id": "fwbp-carp",
        "label": "Formwork carpenter",
        "category": "labour",
        "quantity": 0.22,
        "unit": "day",
        "unitRate": 15000
      },
      {
        "id": "fwbp-help",
        "label": "Helper",
        "category": "labour",
        "quantity": 0.22,
        "unit": "day",
        "unitRate": 8000
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "plank-formwork-slab-edges-upstands",
    "code": "RB-FW-009",
    "title": "Well-sawn plank formwork to slab edges, kerbs and concrete upstands",
    "shortTitle": "Slab edge/upstand — plank",
    "section": "Formwork",
    "unit": "m²",
    "specification": "Well-sawn plank shuttering to slab edges, kerbs and upstands with 2x3 framing, 2x2 bracing, nails and release agent. Plank charged over 4 reuses.",
    "methodologyNote": "Linear work is converted to measured contact area; low heights can have poor labour productivity, so labour remains editable.",
    "sourceNote": "Traditional formwork methodology; user-approved well-sawn plank reuse: 4 cycles.",
    "lines": [
      {
        "id": "fwup-plank",
        "label": "Well-sawn 1x12 plank facing — 4 reuses",
        "category": "material",
        "quantity": 0.22768670309653916,
        "unit": "3.6m length",
        "unitRate": 3000
      },
      {
        "id": "fwup-2x3",
        "label": "2x3 framing",
        "category": "material",
        "quantity": 0.18,
        "unit": "3.6m length",
        "unitRate": 1300
      },
      {
        "id": "fwup-2x2",
        "label": "2x2 pegs/braces",
        "category": "material",
        "quantity": 0.1,
        "unit": "3.6m length",
        "unitRate": 1000
      },
      {
        "id": "fwup-nail",
        "label": "Nails",
        "category": "consumable",
        "quantity": 0.006,
        "unit": "bag",
        "unitRate": 27000
      },
      {
        "id": "fwup-release",
        "label": "Release agent",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 200
      },
      {
        "id": "fwup-carp",
        "label": "Carpenter labour",
        "category": "labour",
        "quantity": 0.15,
        "unit": "day",
        "unitRate": 15000
      },
      {
        "id": "fwup-help",
        "label": "Helper labour",
        "category": "labour",
        "quantity": 0.15,
        "unit": "day",
        "unitRate": 8000
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "premium-marine-formwork-slab-soffit",
    "code": "RB-FW-010",
    "title": "Premium marine-plywood formwork to suspended slab soffit",
    "shortTitle": "Slab soffit — premium marine",
    "section": "Formwork",
    "unit": "m²",
    "specification": "Premium 18 mm marine/film-faced plywood slab soffit formwork with H20/Peri beams, Acrow props, secondary timber, nails/release agent and labour. Working plywood reuse: 5 cycles.",
    "methodologyNote": "Premium-board alternative to the 3-cycle economical marine-board system. Actual reuse depends on brand, handling, release agent and stripping practice.",
    "sourceNote": "Abuja Sep-2026 premium marine-board listings around ₦39,000–₦43,000/sheet; working 5-cycle reuse for comparison.",
    "lines": [
      {
        "id": "fwp-ply",
        "label": "Premium 18 mm marine plywood — 5 cycles",
        "category": "material",
        "quantity": 0.06718624025799516,
        "unit": "sheet",
        "unitRate": 40000
      },
      {
        "id": "fwp-2x3",
        "label": "2x3 joists/runners",
        "category": "material",
        "quantity": 0.25,
        "unit": "3.6m length",
        "unitRate": 1300
      },
      {
        "id": "fwp-2x6",
        "label": "2x6 secondary bearers",
        "category": "material",
        "quantity": 0.22,
        "unit": "3.6m length",
        "unitRate": 3000
      },
      {
        "id": "fwp-h20",
        "label": "H20 / Peri primary beam allocation",
        "category": "material",
        "quantity": 0.08,
        "unit": "No.",
        "unitRate": 16900
      },
      {
        "id": "fwp-prop",
        "label": "Acrow prop rental — 21-day cycle",
        "category": "plant",
        "quantity": 29.22,
        "unit": "prop-day",
        "unitRate": 200
      },
      {
        "id": "fwp-nail",
        "label": "Nails / fixings",
        "category": "consumable",
        "quantity": 0.01,
        "unit": "bag",
        "unitRate": 27000
      },
      {
        "id": "fwp-release",
        "label": "Release agent / sundries",
        "category": "consumable",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 250
      },
      {
        "id": "fwp-carp",
        "label": "Formwork carpenter",
        "category": "labour",
        "quantity": 0.22,
        "unit": "day",
        "unitRate": 15000
      },
      {
        "id": "fwp-help",
        "label": "Helper",
        "category": "labour",
        "quantity": 0.22,
        "unit": "day",
        "unitRate": 8000
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "10mm-levelling-screed-1-4-admix",
    "code": "RB-FN-007",
    "title": "10 mm 1:4 levelling screed with acrylic admixture",
    "shortTitle": "10mm levelling screed",
    "section": "Finishes",
    "unit": "m²",
    "specification": "10 mm average cement:sand (1:4) levelling screed with acrylic admixture, placed, ruled level and steel-trowelled.",
    "methodologyNote": "Physical build-up per 1m²: 10mm wet screed × 1.33 dry-volume factor at 1:4 cement:sand, with 5% physical material waste. Acrylic/SBR admixture remains an explicit editable line pending product dosage.",
    "sourceNote": "Sora Restaurant corrected-rate workbook, Abuja: explicit screed formula.",
    "lines": [
      {
        "id": "screed-10-cement",
        "label": "Cement for 1:4 screed",
        "category": "material",
        "quantity": 0.08043840000000001,
        "unit": "50kg bag",
        "unitRate": 12500,
        "note": "Per 1m² at 10mm: wet volume 0.010m³ × 1.33 dry factor × 1/5 cement share × 5% physical waste."
      },
      {
        "id": "screed-10-sand",
        "label": "Sharp sand for 1:4 screed",
        "category": "material",
        "quantity": 0.011172000000000003,
        "unit": "m³",
        "unitRate": 14400,
        "note": "Per 1m² at 10mm: 1.33 dry factor × 4/5 sand share × 5% physical waste."
      },
      {
        "id": "screed-10-admix",
        "label": "Acrylic/SBR admixture",
        "category": "consumable",
        "quantity": 1,
        "unit": "provisional allowance/m²",
        "unitRate": 0,
        "note": "Dosage depends on the approved product/manufacturer. Kept visible at zero until the product dosage and price are confirmed instead of hiding it in the rate."
      },
      {
        "id": "screed-10-lab",
        "label": "Placing, levelling and steel-trowelling labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1400
      }
    ],
    "validationNote": "Under validation. Cement and sand quantities are now physically calculated and visible. Admixture dosage, current sand landed price and screeding labour productivity still require final validation."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "20mm-levelling-screed-1-4-admix",
    "code": "RB-FN-008",
    "title": "20 mm 1:4 levelling screed with acrylic admixture",
    "shortTitle": "20mm levelling screed",
    "section": "Finishes",
    "unit": "m²",
    "specification": "20 mm average cement:sand (1:4) levelling screed with acrylic admixture, placed, ruled level and steel-trowelled.",
    "methodologyNote": "Physical build-up per 1m²: 20mm wet screed × 1.33 dry-volume factor at 1:4 cement:sand, with 5% physical material waste. Acrylic/SBR admixture remains an explicit editable line pending product dosage.",
    "sourceNote": "Sora Restaurant corrected-rate workbook, Abuja: explicit screed formula.",
    "lines": [
      {
        "id": "screed-20-cement",
        "label": "Cement for 1:4 screed",
        "category": "material",
        "quantity": 0.16087680000000001,
        "unit": "50kg bag",
        "unitRate": 12500,
        "note": "Per 1m² at 20mm: wet volume 0.020m³ × 1.33 dry factor × 1/5 cement share × 5% physical waste."
      },
      {
        "id": "screed-20-sand",
        "label": "Sharp sand for 1:4 screed",
        "category": "material",
        "quantity": 0.022344000000000006,
        "unit": "m³",
        "unitRate": 14400,
        "note": "Per 1m² at 20mm: 1.33 dry factor × 4/5 sand share × 5% physical waste."
      },
      {
        "id": "screed-20-admix",
        "label": "Acrylic/SBR admixture",
        "category": "consumable",
        "quantity": 1,
        "unit": "provisional allowance/m²",
        "unitRate": 0,
        "note": "Dosage depends on the approved product/manufacturer. Kept visible at zero until the product dosage and price are confirmed instead of hiding it in the rate."
      },
      {
        "id": "screed-20-lab",
        "label": "Placing, levelling and steel-trowelling labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1400
      }
    ],
    "validationNote": "Under validation. Cement and sand quantities are now physically calculated and visible. Admixture dosage, current sand landed price and screeding labour productivity still require final validation."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "23mm-levelling-screed-1-4-admix",
    "code": "RB-FN-009",
    "title": "23 mm 1:4 levelling screed with acrylic admixture",
    "shortTitle": "23mm levelling screed",
    "section": "Finishes",
    "unit": "m²",
    "specification": "23 mm average cement:sand (1:4) levelling screed with acrylic admixture, placed, ruled level and steel-trowelled.",
    "methodologyNote": "Physical build-up per 1m²: 23mm wet screed × 1.33 dry-volume factor at 1:4 cement:sand, with 5% physical material waste. Acrylic/SBR admixture remains an explicit editable line pending product dosage.",
    "sourceNote": "Sora Restaurant corrected-rate workbook, Abuja: explicit screed formula.",
    "lines": [
      {
        "id": "screed-23-cement",
        "label": "Cement for 1:4 screed",
        "category": "material",
        "quantity": 0.18500832000000003,
        "unit": "50kg bag",
        "unitRate": 12500,
        "note": "Per 1m² at 23mm: wet volume 0.023m³ × 1.33 dry factor × 1/5 cement share × 5% physical waste."
      },
      {
        "id": "screed-23-sand",
        "label": "Sharp sand for 1:4 screed",
        "category": "material",
        "quantity": 0.025695600000000006,
        "unit": "m³",
        "unitRate": 14400,
        "note": "Per 1m² at 23mm: 1.33 dry factor × 4/5 sand share × 5% physical waste."
      },
      {
        "id": "screed-23-admix",
        "label": "Acrylic/SBR admixture",
        "category": "consumable",
        "quantity": 1,
        "unit": "provisional allowance/m²",
        "unitRate": 0,
        "note": "Dosage depends on the approved product/manufacturer. Kept visible at zero until the product dosage and price are confirmed instead of hiding it in the rate."
      },
      {
        "id": "screed-23-lab",
        "label": "Placing, levelling and steel-trowelling labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1400
      }
    ],
    "validationNote": "Under validation. Cement and sand quantities are now physically calculated and visible. Admixture dosage, current sand landed price and screeding labour productivity still require final validation."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "32mm-levelling-screed-1-4-admix",
    "code": "RB-FN-010",
    "title": "32 mm 1:4 levelling screed with acrylic admixture",
    "shortTitle": "32mm levelling screed",
    "section": "Finishes",
    "unit": "m²",
    "specification": "32 mm average cement:sand (1:4) levelling screed with acrylic admixture, placed, ruled level and steel-trowelled.",
    "methodologyNote": "Physical build-up per 1m²: 32mm wet screed × 1.33 dry-volume factor at 1:4 cement:sand, with 5% physical material waste. Acrylic/SBR admixture remains an explicit editable line pending product dosage.",
    "sourceNote": "Sora Restaurant corrected-rate workbook, Abuja: explicit screed formula.",
    "lines": [
      {
        "id": "screed-32-cement",
        "label": "Cement for 1:4 screed",
        "category": "material",
        "quantity": 0.25740288000000006,
        "unit": "50kg bag",
        "unitRate": 12500,
        "note": "Per 1m² at 32mm: wet volume 0.032m³ × 1.33 dry factor × 1/5 cement share × 5% physical waste."
      },
      {
        "id": "screed-32-sand",
        "label": "Sharp sand for 1:4 screed",
        "category": "material",
        "quantity": 0.0357504,
        "unit": "m³",
        "unitRate": 14400,
        "note": "Per 1m² at 32mm: 1.33 dry factor × 4/5 sand share × 5% physical waste."
      },
      {
        "id": "screed-32-admix",
        "label": "Acrylic/SBR admixture",
        "category": "consumable",
        "quantity": 1,
        "unit": "provisional allowance/m²",
        "unitRate": 0,
        "note": "Dosage depends on the approved product/manufacturer. Kept visible at zero until the product dosage and price are confirmed instead of hiding it in the rate."
      },
      {
        "id": "screed-32-lab",
        "label": "Placing, levelling and steel-trowelling labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1400
      }
    ],
    "validationNote": "Under validation. Cement and sand quantities are now physically calculated and visible. Admixture dosage, current sand landed price and screeding labour productivity still require final validation."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "marble-field-laying-20mm",
    "code": "RB-FN-011",
    "title": "20 mm marble field laying — employer-supplied stone",
    "shortTitle": "Marble field laying",
    "section": "Finishes",
    "unit": "m²",
    "specification": "Lay employer-supplied 20 mm marble on 10 mm cement/sand/admix bed including setting out, grouting, protection and cleaning.",
    "methodologyNote": "Sora guide rate had commercial content. This working no-profit build-up strips a provisional 15% source O/P and separates bedding/consumables from specialist laying labour.",
    "sourceNote": "Sora Restaurant laid-down field marble rate ₦8,000/m² used as a guide only.",
    "lines": [
      {
        "id": "marble-field-mat",
        "label": "10mm bedding, grout, protection consumables",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1200
      },
      {
        "id": "marble-field-lab",
        "label": "Specialist marble laying labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 5757
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "marble-narrow-border-laying",
    "code": "RB-FN-012",
    "title": "Narrow marble border-strip laying — 60/100 mm",
    "shortTitle": "Marble narrow-border laying",
    "section": "Finishes",
    "unit": "m²",
    "specification": "Lay employer-supplied narrow marble border strips to string lines with multiple cuts, 10 mm bedding, grouting, protection and cleaning.",
    "methodologyNote": "Derived from Sora premium narrow-strip guide after provisional 15% O/P removal; narrow work has materially lower productivity.",
    "sourceNote": "Sora Restaurant premium narrow border guide ₦15,500/m².",
    "lines": [
      {
        "id": "marble-border-mat",
        "label": "Bedding, grout, cutting/protection consumables",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 2700
      },
      {
        "id": "marble-border-lab",
        "label": "Precision narrow-strip laying labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 10778
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "marble-mitred-flowerbed-top-laying",
    "code": "RB-FN-013",
    "title": "Shaped marble top with mitred exposed edges — laying only",
    "shortTitle": "Mitred marble shaped top",
    "section": "Finishes",
    "unit": "m²",
    "specification": "Template, cut and lay employer-supplied marble to shaped tops with mitred exposed edges, bedding, grout, protection and cleaning.",
    "methodologyNote": "Derived from Sora shaped/mitred marble guide after provisional 15% O/P removal.",
    "sourceNote": "Sora Restaurant flower-bed top guide ₦20,000/m².",
    "lines": [
      {
        "id": "marble-mitre-mat",
        "label": "Bedding, grout, blades/protection consumables",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 4350
      },
      {
        "id": "marble-mitre-lab",
        "label": "Templating, precision cutting and laying labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 13041
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "patterned-stone-band-laying",
    "code": "RB-FN-014",
    "title": "Patterned stone floor-band laying — employer-supplied stone",
    "shortTitle": "Patterned stone laying",
    "section": "Finishes",
    "unit": "m²",
    "specification": "Set out and lay employer-supplied patterned stone modules to design, including grouting and normal protection. Specialist adhesive measured separately.",
    "methodologyNote": "Derived from Sora patterned-stone guide after provisional 15% O/P removal.",
    "sourceNote": "Sora Restaurant patterned stone laying guide ₦10,000/m².",
    "lines": [
      {
        "id": "stone-pattern-cons",
        "label": "Grout, spacers, protection and cutting consumables",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1750
      },
      {
        "id": "stone-pattern-lab",
        "label": "Pattern setting-out and laying labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 6946
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "stone-adhesive-14kg-per-m2",
    "code": "RB-FN-015",
    "title": "Premium stone adhesive at 14 kg/m² consumption",
    "shortTitle": "Stone adhesive — 14kg/m²",
    "section": "Finishes",
    "unit": "m²",
    "specification": "High-performance cement-based stone adhesive at approximately 14 kg/m² consumption, based on 25 kg bags.",
    "methodologyNote": "Material-only helper rate for stone installations. Product price and consumption are editable.",
    "sourceNote": "Sora Restaurant SikaCeram-255 StarFix or equal guide, ₦22,000/25kg bag.",
    "lines": [
      {
        "id": "stone-adh",
        "label": "25kg stone adhesive",
        "category": "material",
        "quantity": 0.56,
        "unit": "bag",
        "unitRate": 22000
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "engineered-oak-straight-laying",
    "code": "RB-FN-016",
    "title": "Engineered oak strip flooring — laying only",
    "shortTitle": "Oak straight-layout laying",
    "section": "Finishes",
    "unit": "m²",
    "specification": "Lay employer-supplied engineered oak boards in straight strip layout including adhesive where required, cutting, edge trims and protection. Underlay separate.",
    "methodologyNote": "Guide rate normalized by provisionally stripping 15% source O/P. Consumables and labour remain editable.",
    "sourceNote": "Sora Restaurant straight-layout engineered oak guide ₦8,500/m².",
    "lines": [
      {
        "id": "oak-straight-cons",
        "label": "Adhesive, trims, cutting and protection consumables",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 2600
      },
      {
        "id": "oak-straight-lab",
        "label": "Flooring installation labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 4791
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "engineered-oak-chevron-laying",
    "code": "RB-FN-017",
    "title": "Engineered oak chevron flooring — laying only",
    "shortTitle": "Oak chevron laying",
    "section": "Finishes",
    "unit": "m²",
    "specification": "Lay employer-supplied engineered oak boards in chevron pattern including detailed setting out, angled cutting, adhesive, edge trims and protection.",
    "methodologyNote": "Chevron productivity is lower than straight layout. Guide rate normalized by stripping a provisional 15% source O/P.",
    "sourceNote": "Sora Restaurant chevron guide ₦13,500/m².",
    "lines": [
      {
        "id": "oak-chev-cons",
        "label": "Adhesive, trims, cutting and protection consumables",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 3000
      },
      {
        "id": "oak-chev-lab",
        "label": "Chevron setting-out and installation labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 8739
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "decorative-wood-tile-laying",
    "code": "RB-FN-018",
    "title": "Decorative patterned wood-tile flooring — laying only",
    "shortTitle": "Decorative wood-tile laying",
    "section": "Finishes",
    "unit": "m²",
    "specification": "Lay employer-supplied decorative wood tiles including pattern alignment, adhesive, cutting, trims and protection.",
    "methodologyNote": "Guide rate normalized by stripping provisional 15% source O/P.",
    "sourceNote": "Sora Restaurant decorative wood-tile guide ₦11,000/m².",
    "lines": [
      {
        "id": "woodtile-cons",
        "label": "Adhesive, trims, cutting and protection consumables",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 2700
      },
      {
        "id": "woodtile-lab",
        "label": "Patterned wood-tile installation labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 6865
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "3mm-hd-foam-underlay",
    "code": "RB-FN-019",
    "title": "3 mm high-density foam underlay — supply and lay",
    "shortTitle": "3mm foam underlay",
    "section": "Finishes",
    "unit": "m²",
    "specification": "Supply and lay 3 mm high-density foam underlay beneath engineered wood flooring, including laps, cutting and normal waste.",
    "methodologyNote": "Source all-in guide normalized to a no-profit working split; update with supplier roll coverage and laying productivity.",
    "sourceNote": "Sora Restaurant corrected-rate guide ₦2,000/m².",
    "lines": [
      {
        "id": "foam-underlay-mat",
        "label": "3mm HD foam underlay incl. waste",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1400
      },
      {
        "id": "foam-underlay-lab",
        "label": "Laying/cutting labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 339
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "flat-gypsum-board-ceiling",
    "code": "RB-CL-001",
    "title": "Flat gypsum-board suspended ceiling",
    "shortTitle": "Flat gypsum ceiling",
    "section": "Ceilings",
    "unit": "m²",
    "specification": "Flat gypsum-board suspended ceiling including framing/supports, boards or forming material, fixings/joint treatment, installation labour and normal transport unless stated otherwise.",
    "methodologyNote": "Resource build-up now shows board sheets, main/secondary profiles, hangers, screws, compound, joint tape, labour and handling per 1m². Geometry factor 1 is a working allowance for this ceiling type and remains editable.",
    "sourceNote": "Sora Restaurant corrected-rates ceiling schedule, Abuja.",
    "lines": [
      {
        "id": "gflat-board",
        "label": "12.5 mm gypsum ceiling board",
        "category": "material",
        "quantity": 0.375,
        "unit": "1.2×2.4m sheet",
        "unitRate": 16500,
        "note": "Board quantity derived from face area with 8% cutting/waste."
      },
      {
        "id": "gflat-main",
        "label": "Main ceiling channel/profile",
        "category": "material",
        "quantity": 1.1340000000000001,
        "unit": "linear m",
        "unitRate": 667,
        "note": "Working profile price equivalent to about ₦2,000 per 3m length."
      },
      {
        "id": "gflat-furring",
        "label": "Furring / secondary channel",
        "category": "material",
        "quantity": 2.3760000000000003,
        "unit": "linear m",
        "unitRate": 667,
        "note": "Working secondary-profile density from the Material Estimator."
      },
      {
        "id": "gflat-hanger",
        "label": "Hanger rods/wires and fixing points",
        "category": "material",
        "quantity": 1.2000000000000002,
        "unit": "set",
        "unitRate": 250,
        "note": "Working hanger density; actual suspension design governs."
      },
      {
        "id": "gflat-screws",
        "label": "Drywall screws",
        "category": "consumable",
        "quantity": 27,
        "unit": "pcs",
        "unitRate": 20
      },
      {
        "id": "gflat-compound",
        "label": "Jointing compound / joint screed",
        "category": "consumable",
        "quantity": 0.48600000000000004,
        "unit": "kg",
        "unitRate": 1200
      },
      {
        "id": "gflat-tape",
        "label": "Fibreglass / joint tape",
        "category": "consumable",
        "quantity": 1.512,
        "unit": "linear m",
        "unitRate": 150
      },
      {
        "id": "gflat-lab",
        "label": "Gypsum ceiling specialist labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 6500
      },
      {
        "id": "gflat-log",
        "label": "Handling / local transport allocation",
        "category": "logistics",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1000
      }
    ],
    "validationNote": "Under validation. The quantity schedule is now transparent, but final profile centres, hanger density, curved framing method, board brand and specialist labour productivity must be confirmed before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "straight-gypsum-ceiling-drop",
    "code": "RB-CL-002",
    "title": "Straight stepped gypsum ceiling drop",
    "shortTitle": "Straight gypsum drop",
    "section": "Ceilings",
    "unit": "m²",
    "specification": "Straight stepped gypsum ceiling drop including framing/supports, boards or forming material, fixings/joint treatment, installation labour and normal transport unless stated otherwise.",
    "methodologyNote": "Resource build-up now shows board sheets, main/secondary profiles, hangers, screws, compound, joint tape, labour and handling per 1m². Geometry factor 1.18 is a working allowance for this ceiling type and remains editable.",
    "sourceNote": "Sora Restaurant corrected-rates ceiling schedule, Abuja.",
    "lines": [
      {
        "id": "gdrop-board",
        "label": "12.5 mm gypsum ceiling board",
        "category": "material",
        "quantity": 0.4425,
        "unit": "1.2×2.4m sheet",
        "unitRate": 16500,
        "note": "Board quantity derived from face area with 8% cutting/waste."
      },
      {
        "id": "gdrop-main",
        "label": "Main ceiling channel/profile",
        "category": "material",
        "quantity": 1.33812,
        "unit": "linear m",
        "unitRate": 667,
        "note": "Working profile price equivalent to about ₦2,000 per 3m length."
      },
      {
        "id": "gdrop-furring",
        "label": "Furring / secondary channel",
        "category": "material",
        "quantity": 2.8036800000000004,
        "unit": "linear m",
        "unitRate": 667,
        "note": "Working secondary-profile density from the Material Estimator."
      },
      {
        "id": "gdrop-hanger",
        "label": "Hanger rods/wires and fixing points",
        "category": "material",
        "quantity": 1.4160000000000001,
        "unit": "set",
        "unitRate": 250,
        "note": "Working hanger density; actual suspension design governs."
      },
      {
        "id": "gdrop-screws",
        "label": "Drywall screws",
        "category": "consumable",
        "quantity": 31.86,
        "unit": "pcs",
        "unitRate": 20
      },
      {
        "id": "gdrop-compound",
        "label": "Jointing compound / joint screed",
        "category": "consumable",
        "quantity": 0.57348,
        "unit": "kg",
        "unitRate": 1200
      },
      {
        "id": "gdrop-tape",
        "label": "Fibreglass / joint tape",
        "category": "consumable",
        "quantity": 1.78416,
        "unit": "linear m",
        "unitRate": 150
      },
      {
        "id": "gdrop-lab",
        "label": "Gypsum ceiling specialist labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 9000
      },
      {
        "id": "gdrop-log",
        "label": "Handling / local transport allocation",
        "category": "logistics",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1000
      }
    ],
    "validationNote": "Under validation. The quantity schedule is now transparent, but final profile centres, hanger density, curved framing method, board brand and specialist labour productivity must be confirmed before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "curved-gypsum-ceiling-drop",
    "code": "RB-CL-003",
    "title": "Curved gypsum ceiling drop",
    "shortTitle": "Curved gypsum drop",
    "section": "Ceilings",
    "unit": "m²",
    "specification": "Curved gypsum ceiling drop including framing/supports, boards or forming material, fixings/joint treatment, installation labour and normal transport unless stated otherwise.",
    "methodologyNote": "Resource build-up now shows board sheets, main/secondary profiles, hangers, screws, compound, joint tape, labour and handling per 1m². Geometry factor 1.35 is a working allowance for this ceiling type and remains editable.",
    "sourceNote": "Sora Restaurant corrected-rates ceiling schedule, Abuja.",
    "lines": [
      {
        "id": "gcurve-board",
        "label": "12.5 mm gypsum ceiling board",
        "category": "material",
        "quantity": 0.5062500000000001,
        "unit": "1.2×2.4m sheet",
        "unitRate": 16500,
        "note": "Board quantity derived from face area with 8% cutting/waste."
      },
      {
        "id": "gcurve-main",
        "label": "Main ceiling channel/profile",
        "category": "material",
        "quantity": 1.5309000000000004,
        "unit": "linear m",
        "unitRate": 667,
        "note": "Working profile price equivalent to about ₦2,000 per 3m length."
      },
      {
        "id": "gcurve-furring",
        "label": "Furring / secondary channel",
        "category": "material",
        "quantity": 3.2076000000000007,
        "unit": "linear m",
        "unitRate": 667,
        "note": "Working secondary-profile density from the Material Estimator."
      },
      {
        "id": "gcurve-hanger",
        "label": "Hanger rods/wires and fixing points",
        "category": "material",
        "quantity": 1.6200000000000003,
        "unit": "set",
        "unitRate": 250,
        "note": "Working hanger density; actual suspension design governs."
      },
      {
        "id": "gcurve-screws",
        "label": "Drywall screws",
        "category": "consumable",
        "quantity": 36.45,
        "unit": "pcs",
        "unitRate": 20
      },
      {
        "id": "gcurve-compound",
        "label": "Jointing compound / joint screed",
        "category": "consumable",
        "quantity": 0.6561000000000001,
        "unit": "kg",
        "unitRate": 1200
      },
      {
        "id": "gcurve-tape",
        "label": "Fibreglass / joint tape",
        "category": "consumable",
        "quantity": 2.0412000000000003,
        "unit": "linear m",
        "unitRate": 150
      },
      {
        "id": "gcurve-lab",
        "label": "Gypsum ceiling specialist labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 12000
      },
      {
        "id": "gcurve-log",
        "label": "Handling / local transport allocation",
        "category": "logistics",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1000
      }
    ],
    "validationNote": "Under validation. The quantity schedule is now transparent, but final profile centres, hanger density, curved framing method, board brand and specialist labour productivity must be confirmed before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "recessed-curved-gypsum-ceiling",
    "code": "RB-CL-004",
    "title": "Recessed / inverted gypsum ceiling with curved edges",
    "shortTitle": "Recessed curved gypsum",
    "section": "Ceilings",
    "unit": "m²",
    "specification": "Recessed / inverted gypsum ceiling with curved edges including framing/supports, boards or forming material, fixings/joint treatment, installation labour and normal transport unless stated otherwise.",
    "methodologyNote": "Resource build-up now shows board sheets, main/secondary profiles, hangers, screws, compound, joint tape, labour and handling per 1m². Geometry factor 1.45 is a working allowance for this ceiling type and remains editable.",
    "sourceNote": "Sora Restaurant corrected-rates ceiling schedule, Abuja.",
    "lines": [
      {
        "id": "grecess-board",
        "label": "12.5 mm gypsum ceiling board",
        "category": "material",
        "quantity": 0.54375,
        "unit": "1.2×2.4m sheet",
        "unitRate": 16500,
        "note": "Board quantity derived from face area with 8% cutting/waste."
      },
      {
        "id": "grecess-main",
        "label": "Main ceiling channel/profile",
        "category": "material",
        "quantity": 1.6443,
        "unit": "linear m",
        "unitRate": 667,
        "note": "Working profile price equivalent to about ₦2,000 per 3m length."
      },
      {
        "id": "grecess-furring",
        "label": "Furring / secondary channel",
        "category": "material",
        "quantity": 3.4452000000000003,
        "unit": "linear m",
        "unitRate": 667,
        "note": "Working secondary-profile density from the Material Estimator."
      },
      {
        "id": "grecess-hanger",
        "label": "Hanger rods/wires and fixing points",
        "category": "material",
        "quantity": 1.7400000000000002,
        "unit": "set",
        "unitRate": 250,
        "note": "Working hanger density; actual suspension design governs."
      },
      {
        "id": "grecess-screws",
        "label": "Drywall screws",
        "category": "consumable",
        "quantity": 39.15,
        "unit": "pcs",
        "unitRate": 20
      },
      {
        "id": "grecess-compound",
        "label": "Jointing compound / joint screed",
        "category": "consumable",
        "quantity": 0.7047,
        "unit": "kg",
        "unitRate": 1200
      },
      {
        "id": "grecess-tape",
        "label": "Fibreglass / joint tape",
        "category": "consumable",
        "quantity": 2.1924,
        "unit": "linear m",
        "unitRate": 150
      },
      {
        "id": "grecess-lab",
        "label": "Gypsum ceiling specialist labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 12500
      },
      {
        "id": "grecess-log",
        "label": "Handling / local transport allocation",
        "category": "logistics",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1000
      }
    ],
    "validationNote": "Under validation. The quantity schedule is now transparent, but final profile centres, hanger density, curved framing method, board brand and specialist labour productivity must be confirmed before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "grooved-pop-edge-detail",
    "code": "RB-CL-005",
    "title": "150 mm grooved POP ceiling-edge detail",
    "shortTitle": "Grooved POP edge",
    "section": "Ceilings",
    "unit": "m",
    "specification": "30 mm thick × 150 mm wide POP edge detail with repeated longitudinal grooves, including forming/carving, sanding and finishing.",
    "methodologyNote": "Sora guide normalized by provisional 15% O/P removal; material/labour split remains under validation.",
    "sourceNote": "Sora Restaurant grooved POP guide ₦6,500/lm.",
    "lines": [
      {
        "id": "popgroove-mat",
        "label": "POP/reinforcement/sundry materials",
        "category": "material",
        "quantity": 1,
        "unit": "m",
        "unitRate": 1800
      },
      {
        "id": "popgroove-lab",
        "label": "Forming, carving, sanding and finishing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m",
        "unitRate": 3852
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "bespoke-pop-column-crown",
    "code": "RB-CL-006",
    "title": "Bespoke POP column crown",
    "shortTitle": "POP column crown",
    "section": "Ceilings",
    "unit": "m²",
    "specification": "Bespoke moulded POP crown around top of column including forming, reinforcement/support, sanding and installation.",
    "methodologyNote": "Design-sensitive provisional rate. Source guide normalized by provisional 15% O/P removal.",
    "sourceNote": "Sora Restaurant column-crown guide ₦25,000/m² pending final architect design.",
    "lines": [
      {
        "id": "popcrown-mat",
        "label": "POP, reinforcement and moulding materials",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 7000
      },
      {
        "id": "popcrown-lab",
        "label": "Moulding/forming/installation labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 13739
      },
      {
        "id": "popcrown-log",
        "label": "Handling/transport",
        "category": "logistics",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1000
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "standard-pop-ceiling",
    "code": "RB-CL-007",
    "title": "Standard POP ceiling work",
    "shortTitle": "Standard POP ceiling",
    "section": "Ceilings",
    "unit": "m²",
    "specification": "Conventional POP ceiling to general internal areas including support, POP material, forming, finishing and labour.",
    "methodologyNote": "2-bedroom BOQ guide normalized by provisional 15% O/P removal. Detailed material take-off still required before verification.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦13,500/m².",
    "lines": [
      {
        "id": "popstd-mat",
        "label": "POP/support materials allowance",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 7000
      },
      {
        "id": "popstd-lab",
        "label": "POP installer labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 4739
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "pop-skim-coat-soffit",
    "code": "RB-CL-008",
    "title": "POP skim coat to prepared concrete/plastered soffit",
    "shortTitle": "POP skimming",
    "section": "Ceilings",
    "unit": "m²",
    "specification": "Prepare and apply POP skim coat to soffit, floated smooth ready for painting.",
    "methodologyNote": "2-bedroom guide normalized by provisional 15% O/P removal.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦2,000/m².",
    "lines": [
      {
        "id": "popskim-mat",
        "label": "POP skim material / sandpaper",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 500
      },
      {
        "id": "popskim-lab",
        "label": "Skimming labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1239
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "055mm-aluminium-roof-covering",
    "code": "RB-RO-001",
    "title": "0.55 mm oven-baked aluminium roof covering — supply and fix",
    "shortTitle": "0.55mm aluminium roofing",
    "section": "Roofing",
    "unit": "m²",
    "specification": "Supply and fix 0.55 mm oven-baked aluminium roof covering to prepared timber support, including screws and normal laps/accessories.",
    "methodologyNote": "2-bedroom source guide normalized by provisional 15% O/P removal. Current sheet-gauge and manufacturer price require fresh validation.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦13,800/m².",
    "lines": [
      {
        "id": "roof055-sheet",
        "label": "0.55 mm oven-baked aluminium roofing sheet",
        "category": "material",
        "quantity": 1.08,
        "unit": "m²",
        "unitRate": 8500,
        "note": "Includes 8% working lap/cutting allowance per 1m² measured roof."
      },
      {
        "id": "roof055-screws",
        "label": "Roofing screws with washers/accessories",
        "category": "consumable",
        "quantity": 8,
        "unit": "pcs",
        "unitRate": 100,
        "note": "Working 8 fasteners/m²; profile and support spacing govern final count."
      },
      {
        "id": "roof055-lab",
        "label": "Roofing installation labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1500
      },
      {
        "id": "roof055-log",
        "label": "Handling/transport allocation",
        "category": "logistics",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 500
      }
    ],
    "validationNote": "Under validation. Sheet quantity and fasteners are now visible. Gauge verification, manufacturer/profile effective cover width, current sheet price and installer productivity still require final validation."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "600mm-ridge-capping",
    "code": "RB-RO-002",
    "title": "600 mm wide aluminium ridge capping — supply and fix",
    "shortTitle": "600mm ridge capping",
    "section": "Roofing",
    "unit": "m",
    "specification": "Supply and fix 600 mm wide aluminium ridge capping including laps, screws and dressing.",
    "methodologyNote": "Source guide normalized by provisional 15% O/P removal; gauge/colour/profile to match roof.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦8,280/m.",
    "lines": [
      {
        "id": "ridge-sheet",
        "label": "600 mm wide aluminium ridge capping",
        "category": "material",
        "quantity": 1.05,
        "unit": "linear m",
        "unitRate": 5400,
        "note": "5% working lap/cutting allowance."
      },
      {
        "id": "ridge-screws",
        "label": "Roofing screws / rivets",
        "category": "consumable",
        "quantity": 4,
        "unit": "pcs",
        "unitRate": 75
      },
      {
        "id": "ridge-lab",
        "label": "Fixing and dressing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "linear m",
        "unitRate": 1000
      },
      {
        "id": "ridge-log",
        "label": "Handling",
        "category": "logistics",
        "quantity": 1,
        "unit": "linear m",
        "unitRate": 200
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "300mm-aluminium-fascia",
    "code": "RB-RO-003",
    "title": "300 mm aluminium fascia — supply and fix",
    "shortTitle": "300mm aluminium fascia",
    "section": "Roofing",
    "unit": "m",
    "specification": "Supply and fix 300 mm aluminium fascia to prepared support including screws, joints and dressing.",
    "methodologyNote": "Source guide normalized by provisional 15% O/P removal.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦4,140/m.",
    "lines": [
      {
        "id": "fascia-sheet",
        "label": "300 mm aluminium fascia",
        "category": "material",
        "quantity": 1.05,
        "unit": "linear m",
        "unitRate": 2700,
        "note": "5% working cutting/lap allowance."
      },
      {
        "id": "fascia-fix",
        "label": "Screws/rivets/fixings",
        "category": "consumable",
        "quantity": 4,
        "unit": "pcs",
        "unitRate": 40
      },
      {
        "id": "fascia-lab",
        "label": "Fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "linear m",
        "unitRate": 500
      },
      {
        "id": "fascia-log",
        "label": "Handling",
        "category": "logistics",
        "quantity": 1,
        "unit": "linear m",
        "unitRate": 100
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "50x150-wall-plate-tie-beam",
    "code": "RB-RO-004",
    "title": "50×150 mm wall plate / tie beam",
    "shortTitle": "50×150 wall plate",
    "section": "Roofing",
    "unit": "m",
    "specification": "50×150 mm wall plate / tie beam in tanalised sawn hardwood/timber, supplied, cut and fixed to roof framing.",
    "methodologyNote": "Historical residential guide normalized by provisional 15% O/P removal; timber species, section accuracy, treatment and current length price need validation.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦1,500/m.",
    "lines": [
      {
        "id": "50x150-wall-plate-tie-beam-mat",
        "label": "Treated timber material",
        "category": "material",
        "quantity": 1,
        "unit": "m",
        "unitRate": 1000
      },
      {
        "id": "50x150-wall-plate-tie-beam-lab",
        "label": "Cutting/fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m",
        "unitRate": 304.34782608695673
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "50x100-rafter",
    "code": "RB-RO-005",
    "title": "50×100 mm timber rafter",
    "shortTitle": "50×100 rafter",
    "section": "Roofing",
    "unit": "m",
    "specification": "50×100 mm timber rafter in tanalised sawn hardwood/timber, supplied, cut and fixed to roof framing.",
    "methodologyNote": "Historical residential guide normalized by provisional 15% O/P removal; timber species, section accuracy, treatment and current length price need validation.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦1,200/m.",
    "lines": [
      {
        "id": "50x100-rafter-mat",
        "label": "Treated timber material",
        "category": "material",
        "quantity": 1,
        "unit": "m",
        "unitRate": 800
      },
      {
        "id": "50x100-rafter-lab",
        "label": "Cutting/fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m",
        "unitRate": 243.47826086956525
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "50x100-strut-tie",
    "code": "RB-RO-006",
    "title": "50×100 mm roof strut / tie",
    "shortTitle": "50×100 strut/tie",
    "section": "Roofing",
    "unit": "m",
    "specification": "50×100 mm roof strut / tie in tanalised sawn hardwood/timber, supplied, cut and fixed to roof framing.",
    "methodologyNote": "Historical residential guide normalized by provisional 15% O/P removal; timber species, section accuracy, treatment and current length price need validation.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦1,200/m.",
    "lines": [
      {
        "id": "50x100-strut-tie-mat",
        "label": "Treated timber material",
        "category": "material",
        "quantity": 1,
        "unit": "m",
        "unitRate": 800
      },
      {
        "id": "50x100-strut-tie-lab",
        "label": "Cutting/fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m",
        "unitRate": 243.47826086956525
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "50x75-purlin",
    "code": "RB-RO-007",
    "title": "50×75 mm timber purlin",
    "shortTitle": "50×75 purlin",
    "section": "Roofing",
    "unit": "m",
    "specification": "50×75 mm timber purlin in tanalised sawn hardwood/timber, supplied, cut and fixed to roof framing.",
    "methodologyNote": "Historical residential guide normalized by provisional 15% O/P removal; timber species, section accuracy, treatment and current length price need validation.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦800/m.",
    "lines": [
      {
        "id": "50x75-purlin-mat",
        "label": "Treated timber material",
        "category": "material",
        "quantity": 1,
        "unit": "m",
        "unitRate": 550
      },
      {
        "id": "50x75-purlin-lab",
        "label": "Cutting/fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m",
        "unitRate": 145.6521739130435
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "50x75-noggin",
    "code": "RB-RO-008",
    "title": "50×75 mm roof noggin",
    "shortTitle": "50×75 noggin",
    "section": "Roofing",
    "unit": "m",
    "specification": "50×75 mm roof noggin in tanalised sawn hardwood/timber, supplied, cut and fixed to roof framing.",
    "methodologyNote": "Historical residential guide normalized by provisional 15% O/P removal; timber species, section accuracy, treatment and current length price need validation.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦800/m.",
    "lines": [
      {
        "id": "50x75-noggin-mat",
        "label": "Treated timber material",
        "category": "material",
        "quantity": 1,
        "unit": "m",
        "unitRate": 550
      },
      {
        "id": "50x75-noggin-lab",
        "label": "Cutting/fixing labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m",
        "unitRate": 145.6521739130435
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  },
  {
    "countryCode": "NG",
    "country": "Nigeria",
    "region": "Abuja / Nasarawa",
    "city": "Abuja–Keffi market",
    "currency": "NGN",
    "lastReviewed": "2026-09-26",
    "status": "review",
    "allowances": {
      "materialFluctuation": 0.05,
      "labourFluctuation": 0.015,
      "plantFluctuation": 0,
      "risk": 0.05,
      "op": 0
    },
    "slug": "fibre-cement-external-ceiling",
    "code": "RB-CL-009",
    "title": "Fibre-cement / asbestos-type external ceiling — supply and fix",
    "shortTitle": "External fibre-cement ceiling",
    "section": "Ceilings",
    "unit": "m²",
    "specification": "Supply and fix external ceiling boards to prepared framing including normal cutting, fixings and installation.",
    "methodologyNote": "2-bedroom guide normalized by provisional 15% O/P removal; board type/specification must be updated before verification.",
    "sourceNote": "2-bedroom Abuja BOQ guide ₦7,500/m².",
    "lines": [
      {
        "id": "fceiling-mat",
        "label": "External ceiling board + fixings",
        "category": "material",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 5000
      },
      {
        "id": "fceiling-lab",
        "label": "Installation labour",
        "category": "labour",
        "quantity": 1,
        "unit": "m²",
        "unitRate": 1522
      }
    ],
    "validationNote": "Under validation. This working rate is editable and is being checked against current Abuja market inputs, project evidence and trade productivity before verification."
  }
];

export function getRateBankItem(slug: string) {
  if (slug === "reusable-plywood-formwork") {
    return RATE_BANK_ITEMS.find((item) => item.slug === "plywood-formwork-slab-soffit");
  }
  return RATE_BANK_ITEMS.find((item) => item.slug === slug);
}
