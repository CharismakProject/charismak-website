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
    "title": "Traditional timber formwork to foundation / slab edges",
    "shortTitle": "Foundation edge formwork",
    "section": "Formwork",
    "unit": "m²",
    "status": "review",
    "specification": "Traditional timber formwork to low foundation and slab-edge faces using reusable sawn plank, 2x2 and 2x3 timber, nails, release agent and carpentry labour.",
    "methodologyNote": "This low-height formwork intentionally uses plank/timber rather than pretending every formwork application is the same plywood system.",
    "sourceNote": "2-bedroom/KMSTEEL timber take-offs + Central Park timber/nail rates. Sep 2026 Abuja audit checked plywood, timber, H20/Peri and labour market references; structural/shuttering quantities remain to be validated against a formwork layout.",
    "lines": [
      {
        "id": "fwf-plank",
        "label": "1x12 sawn plank allocation",
        "category": "material",
        "quantity": 0.18,
        "unit": "length",
        "unitRate": 3000,
        "note": "Reusable traditional facing board."
      },
      {
        "id": "fwf-2x3",
        "label": "2x3 timber framing",
        "category": "material",
        "quantity": 0.25,
        "unit": "length",
        "unitRate": 1300
      },
      {
        "id": "fwf-2x2",
        "label": "2x2 timber bracing",
        "category": "material",
        "quantity": 0.2,
        "unit": "length",
        "unitRate": 1000
      },
      {
        "id": "fwf-nail",
        "label": "2–3 inch nails",
        "category": "consumable",
        "quantity": 0.008,
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
    "validationNote": "Under validation. Formwork cannot be verified from material prices alone: member spacing, shutter geometry, reuse cycles, prop/H20 arrangement, rental duration and stripping cycle must be checked for the specific formwork type."
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
    "title": "Plywood formwork to reinforced concrete columns",
    "shortTitle": "Column formwork",
    "section": "Formwork",
    "unit": "m²",
    "status": "review",
    "specification": "18 mm reusable plywood column formwork with 2x2/2x3 framing, 2x6 walers, nails, release agent and fixing/striking labour.",
    "methodologyNote": "Each timber component is separated. Plywood is allocated over five reuse cycles; user can edit quantities to match column size and reuse plan.",
    "sourceNote": "FMC plywood/reuse basis + 2-bedroom/KMSTEEL timber methodology; timber market inputs refreshed from recent Abuja references. Sep 2026 Abuja audit checked plywood, timber, H20/Peri and labour market references; structural/shuttering quantities remain to be validated against a formwork layout.",
    "lines": [
      {
        "id": "fwc-ply",
        "label": "18 mm plywood allocation — 5 reuse cycles",
        "category": "material",
        "quantity": 0.06718624025799516,
        "unit": "sheet",
        "unitRate": 40000
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
    "title": "Plywood formwork to beams and lintels",
    "shortTitle": "Beam / lintel formwork",
    "section": "Formwork",
    "unit": "m²",
    "status": "review",
    "specification": "Beam/lintel formwork with reusable plywood, 2x2 and 2x3 timber, 2x6 bearers, Peri/H20 beam support allowance, nails, release agent and labour.",
    "methodologyNote": "Beam sides and soffits need a stronger support system than simple wall/edge shuttering, so 2x6 and Peri/H20 support are visible inputs.",
    "sourceNote": "2-bedroom/KMSTEEL formwork logic + FMC plywood basis + current Abuja timber/Peri working observations. Sep 2026 Abuja audit checked plywood, timber, H20/Peri and labour market references; structural/shuttering quantities remain to be validated against a formwork layout.",
    "lines": [
      {
        "id": "fwb-ply",
        "label": "18 mm plywood allocation — 5 reuse cycles",
        "category": "material",
        "quantity": 0.06718624025799516,
        "unit": "sheet",
        "unitRate": 40000
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
    "title": "Plywood formwork to suspended slab soffit",
    "shortTitle": "Slab soffit formwork",
    "section": "Formwork",
    "unit": "m²",
    "status": "review",
    "specification": "Suspended slab formwork with reusable 18 mm plywood, 2x2/2x3 framing, 2x6 secondary bearers, Peri/H20 primary beams, nails, release agent and erection/striking labour.",
    "methodologyNote": "Suspended slab formwork with reusable 18 mm plywood, timber framing, H20/Peri support and explicit Acrow-prop rental. The prop quantity currently uses a published 175mm slab / 3.0m-height schedule as a working benchmark and must be redesigned for the actual slab.",
    "sourceNote": "FMC reuse methodology + residential/KMSTEEL timber take-offs + current Abuja Peri/timber working observations. Sep 2026 Abuja audit checked plywood, timber, H20/Peri and labour market references; structural/shuttering quantities remain to be validated against a formwork layout.",
    "lines": [
      {
        "id": "fws-ply",
        "label": "18 mm plywood allocation — 5 reuse cycles",
        "category": "material",
        "quantity": 0.06718624025799516,
        "unit": "sheet",
        "unitRate": 40000
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
    "title": "Plywood formwork to reinforced concrete staircase",
    "shortTitle": "Staircase formwork",
    "section": "Formwork",
    "unit": "m²",
    "status": "review",
    "specification": "Stair/landing formwork with plywood facing, timber stringers/joists/bracing, 2x6/Peri support allowance, nails, release agent and higher-detail carpentry labour.",
    "methodologyNote": "Stairs attract more cutting, setting-out and striking labour than flat soffits; the labour factor is therefore separately visible and editable.",
    "sourceNote": "Residential staircase/formwork methodology normalized with current formwork inputs. Sep 2026 Abuja audit checked plywood, timber, H20/Peri and labour market references; structural/shuttering quantities remain to be validated against a formwork layout.",
    "lines": [
      {
        "id": "fwst-ply",
        "label": "18 mm plywood allocation — 5 reuse cycles",
        "category": "material",
        "quantity": 0.06718624025799516,
        "unit": "sheet",
        "unitRate": 40000
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
  }
];

export function getRateBankItem(slug: string) {
  if (slug === "reusable-plywood-formwork") {
    return RATE_BANK_ITEMS.find((item) => item.slug === "plywood-formwork-slab-soffit");
  }
  return RATE_BANK_ITEMS.find((item) => item.slug === slug);
}
