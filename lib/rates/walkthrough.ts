import { calculateRate, getRateBankItem, type RateCalculation } from "@/lib/rates/defaults";
import { localiseLines, type RateLocation } from "@/lib/rates/locations";

/**
 * Illustrative two-storey building used by the construction walkthrough.
 * Plan 10 m × 8 m on wall centrelines, one internal cross wall at 5 m, storey height 3 m.
 * Quantities are simplified teaching quantities — not a bill of quantities for a real project.
 */
export const MODEL = {
  length: 10,
  width: 8,
  wallRun: 2 * (10 + 8) + 8, // external perimeter + internal cross wall = 44 m
  trenchWidth: 0.675,
  trenchDepth: 0.9,
  footingDepth: 0.225,
  blindingDepth: 0.05,
  storey: 3,
  grossFloorArea: 2 * 10 * 8, // 160 m²
} as const;

export type WalkthroughItem = {
  slug: string;
  quantity: number;
  /** How the quantity was measured, in plain words. */
  basis: string;
};

export type WalkthroughStep = {
  id: string;
  stage: string;
  title: string;
  summary: string;
  detail: string;
  qsNote: string;
  /** Item whose rate build-up is explained in full. */
  primary: string;
  items: WalkthroughItem[];
  camera: { position: [number, number, number]; target: [number, number, number] };
};

const r1 = (value: number) => Math.round(value * 10) / 10;
const r2 = (value: number) => Math.round(value * 100) / 100;
const run = MODEL.wallRun;
const slabArea = r1((MODEL.length - 0.23) * (MODEL.width - 0.23)); // inside face of walls ≈ 75.9 m²
const columnVol = r2(6 * 0.23 * 0.23 * MODEL.storey); // 6 columns per floor
const columnForm = r1(6 * 4 * 0.23 * MODEL.storey);
const beamVol = r2(0.23 * 0.45 * run);
const beamForm = r1(run * (2 * 0.3 + 0.23)); // two sides below slab + soffit
const wallArea = Math.round(run * (MODEL.storey - 0.45) - 12); // less ~12 m² openings per floor

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    id: "excavation",
    stage: "Substructure · 01",
    title: "Setting out & trench excavation",
    summary: "The building lines are set out and trenches are dug along every load-bearing wall.",
    detail:
      "Trenches follow the wall centrelines — the outside walls and the internal cross wall. Width suits the footing (675 mm here) and depth reaches firm ground (900 mm here). On most Abuja sites an excavator does the bulk digging and labourers trim the sides and bottom by hand.",
    qsNote: "Measured in cubic metres: trench length × width × depth. Disposal or keeping spoil on site for backfill changes the rate.",
    primary: "mechanical-excavation-wall-trenches",
    items: [
      {
        slug: "mechanical-excavation-wall-trenches",
        quantity: r1(run * MODEL.trenchWidth * MODEL.trenchDepth),
        basis: `${run} m of trench × 0.675 m wide × 0.9 m deep`,
      },
    ],
    camera: { position: [17, 9, 16], target: [5, -0.5, 4] },
  },
  {
    id: "blinding",
    stage: "Substructure · 02",
    title: "Blinding concrete",
    summary: "A thin layer of weak concrete seals the trench bottom so the footing is cast on a clean, level bed.",
    detail:
      "Blinding (C15, 1:3:6) is about 50 mm thick. It is not structural — it stops the footing concrete losing water into the soil and gives the iron bender and carpenter a clean surface to set out on.",
    qsNote: "Measured in cubic metres. Thin layers carry high waste, so small quantities cost more per m³ in practice.",
    primary: "c15-blinding-1-3-6",
    items: [
      {
        slug: "c15-blinding-1-3-6",
        quantity: r2(run * MODEL.trenchWidth * MODEL.blindingDepth),
        basis: `${run} m × 0.675 m × 0.05 m`,
      },
    ],
    camera: { position: [13, 5, 12], target: [5, -0.8, 4] },
  },
  {
    id: "footing",
    stage: "Substructure · 03",
    title: "Strip foundation (footing)",
    summary: "A continuous concrete strip spreads the weight of the walls and columns into the ground.",
    detail:
      "Here the footing is 675 mm wide × 225 mm deep in C20 (1:2:4) concrete, cast against timber side forms. Size and reinforcement come from the structural engineer and the soil test — a weak soil needs a wider footing or a different foundation type.",
    qsNote: "Concrete in m³; the side formwork is measured separately in m² of contact area.",
    primary: "c20-nominal-concrete-1-2-4",
    items: [
      {
        slug: "c20-nominal-concrete-1-2-4",
        quantity: r2(run * MODEL.trenchWidth * MODEL.footingDepth),
        basis: `${run} m × 0.675 m × 0.225 m`,
      },
      {
        slug: "timber-formwork-foundation-sides",
        quantity: r1(2 * MODEL.footingDepth * run),
        basis: `2 sides × 0.225 m × ${run} m`,
      },
    ],
    camera: { position: [12, 4, 11], target: [5, -0.7, 4] },
  },
  {
    id: "substructure-walls",
    stage: "Substructure · 04",
    title: "Foundation blockwork & backfill",
    summary: "9-inch blocks are laid from the footing up to just above ground level, then the trenches are backfilled.",
    detail:
      "Blocks are filled solid below ground. The wall stops about 200 mm above the finished ground so the floor sits above rain splash. Excavated soil goes back around the wall in layers and is rammed.",
    qsNote: "Blockwork is measured in m² of wall face (length × height). Backfill is the trench volume less what the footing and wall now occupy.",
    primary: "230mm-hollow-sandcrete-blockwork",
    items: [
      {
        slug: "230mm-hollow-sandcrete-blockwork",
        quantity: r1(run * 0.825),
        basis: `${run} m × 0.825 m high (footing top to DPC)`,
      },
      {
        slug: "backfill-excavated-material",
        quantity: r1(run * MODEL.trenchWidth * MODEL.trenchDepth - run * MODEL.trenchWidth * 0.275 - run * 0.23 * 0.625),
        basis: "Trench volume − blinding & footing − wall below ground",
      },
    ],
    camera: { position: [15, 5, 14], target: [5, 0, 4] },
  },
  {
    id: "ground-slab",
    stage: "Substructure · 05",
    title: "Hardcore, DPM & ground floor slab",
    summary: "Compacted hardcore fills the inside, a damp-proof membrane stops moisture, and a mesh-reinforced slab forms the floor.",
    detail:
      "225 mm of hardcore is spread and compacted, blinded with sand, then covered with a 1000-gauge polythene DPM. A142 BRC mesh sits on spacers and 150 mm of C20 concrete is poured on top.",
    qsNote: "Hardcore in m³; DPM and mesh in m² (laps are allowed for inside the rate); slab concrete in m³.",
    primary: "hardcore-fill-compacted",
    items: [
      { slug: "hardcore-fill-compacted", quantity: r1(slabArea * 0.225), basis: `${slabArea} m² inside walls × 0.225 m` },
      { slug: "dpm-1000-gauge", quantity: slabArea, basis: `${slabArea} m² floor area` },
      { slug: "brc-mesh-a142-laid", quantity: slabArea, basis: `${slabArea} m² floor area` },
      { slug: "c20-nominal-concrete-1-2-4", quantity: r1(slabArea * 0.15), basis: `${slabArea} m² × 0.15 m slab` },
    ],
    camera: { position: [14, 8, 13], target: [5, 0, 4] },
  },
  {
    id: "gf-columns",
    stage: "Frame · 06",
    title: "Ground floor columns",
    summary: "Reinforced concrete columns carry the floor and roof loads down to the foundation.",
    detail:
      "Six 230 × 230 mm columns sit at the corners and where the cross wall meets the outside walls. Each has 4 high-yield bars tied with links, boxed in plywood forms and cast in C25 concrete.",
    qsNote: "Concrete in m³, formwork in m² of contact face, reinforcement in tonnes (here assumed about 180 kg per m³ of column).",
    primary: "high-yield-reinforcement-supply-fix",
    items: [
      { slug: "c25-structural-concrete-310kg", quantity: columnVol, basis: "6 × 0.23 × 0.23 × 3.0 m" },
      { slug: "plywood-formwork-columns", quantity: columnForm, basis: "6 columns × 4 faces × 0.23 m × 3.0 m" },
      { slug: "high-yield-reinforcement-supply-fix", quantity: r2((columnVol * 180) / 1000), basis: `${columnVol} m³ × ~180 kg/m³` },
    ],
    camera: { position: [11, 5, 12], target: [5, 1.5, 4] },
  },
  {
    id: "gf-walls",
    stage: "Superstructure · 07",
    title: "Ground floor blockwork",
    summary: "9-inch hollow sandcrete blocks fill in between the columns up to beam level, leaving door and window openings.",
    detail:
      "Blocks are laid in cement-sand mortar, about 10 blocks per m². A mason and labourer lay roughly 140 blocks a day. Openings are left for doors and windows.",
    qsNote: "Measured in m² of wall face, with openings deducted.",
    primary: "230mm-hollow-sandcrete-blockwork",
    items: [
      { slug: "230mm-hollow-sandcrete-blockwork", quantity: wallArea, basis: `${run} m × 2.55 m high − ~12 m² openings` },
    ],
    camera: { position: [16, 6, 15], target: [5, 1.4, 4] },
  },
  {
    id: "ff-slab",
    stage: "Frame · 08",
    title: "Beams & first floor slab",
    summary: "Beams run along every wall line and a 150 mm reinforced slab spans between them to form the first floor.",
    detail:
      "Beams (230 × 450 mm) and the slab are usually cast together in one pour on plywood formwork held up by props. Bottom bars resist bending at mid-span; top bars resist it over the supports.",
    qsNote: "Concrete in m³, slab soffit and beam formwork in m², reinforcement in tonnes (assumed ~150 kg/m³ for beams, ~90 kg/m³ for the slab).",
    primary: "c25-structural-concrete-310kg",
    items: [
      { slug: "c25-structural-concrete-310kg", quantity: r2(beamVol + 80 * 0.15), basis: `Beams ${beamVol} m³ + slab 10 × 8 × 0.15 m` },
      { slug: "plywood-formwork-slab-soffit", quantity: 80, basis: "10 m × 8 m soffit" },
      { slug: "plywood-formwork-beams-lintels", quantity: beamForm, basis: `${run} m × (2 × 0.3 m sides + 0.23 m bottom)` },
      { slug: "high-yield-reinforcement-supply-fix", quantity: r2((beamVol * 150 + 80 * 0.15 * 90) / 1000), basis: "Beams ~150 kg/m³ + slab ~90 kg/m³" },
    ],
    camera: { position: [17, 10, 16], target: [5, 3, 4] },
  },
  {
    id: "first-floor",
    stage: "Superstructure · 09",
    title: "First floor columns, walls & ring beam",
    summary: "The frame and blockwork repeat on the first floor, finished with a ring beam that ties the walls and carries the roof.",
    detail:
      "Columns continue from the floor below. The ring beam at the top of the walls holds them together and gives the roof a level, solid bearing.",
    qsNote: "Same measurement rules as the ground floor.",
    primary: "plywood-formwork-beams-lintels",
    items: [
      { slug: "c25-structural-concrete-310kg", quantity: r2(columnVol + beamVol), basis: `Columns ${columnVol} m³ + ring beam ${beamVol} m³` },
      { slug: "plywood-formwork-columns", quantity: columnForm, basis: "As ground floor columns" },
      { slug: "plywood-formwork-beams-lintels", quantity: beamForm, basis: "Ring beam sides and bottom" },
      { slug: "high-yield-reinforcement-supply-fix", quantity: r2((columnVol * 180 + beamVol * 150) / 1000), basis: "Columns ~180 kg/m³ + beam ~150 kg/m³" },
      { slug: "230mm-hollow-sandcrete-blockwork", quantity: wallArea, basis: "As ground floor walls" },
    ],
    camera: { position: [18, 11, 17], target: [5, 4.5, 4] },
  },
  {
    id: "roof",
    stage: "Roof · 10",
    title: "Timber roof & aluminium roofing",
    summary: "Timber rafters and purlins form a gable roof covered with 0.55 mm long-span aluminium sheets.",
    detail:
      "Rafters (50 × 100 mm) at about 600 mm centres sit on a wall plate on the ring beam. Purlins (50 × 75 mm) run across them to carry the sheets. Roof pitch here is 30° with a 600 mm overhang.",
    qsNote: "Timber is measured in linear metres; roofing in m² of the sloping surface (plan area ÷ cos 30°).",
    primary: "055mm-aluminium-roof-covering",
    items: [
      { slug: "50x100-rafter", quantity: 212, basis: "40 rafters × ~5.3 m" },
      { slug: "50x75-purlin", quantity: 134, basis: "12 rows × 11.2 m" },
      { slug: "055mm-aluminium-roof-covering", quantity: 119, basis: "11.2 × 9.2 m plan ÷ cos 30°" },
    ],
    camera: { position: [19, 13, 18], target: [5, 6, 4] },
  },
  {
    id: "finishes",
    stage: "Finishes · 11",
    title: "Plastering, screed & painting",
    summary: "Walls are rendered, floors screeded and surfaces painted to make the shell habitable.",
    detail:
      "15 mm cement-sand plaster goes on both faces of the walls, a 30 mm screed levels the floors, and three coats of emulsion finish the plaster. Tiles, doors, windows and services would follow.",
    qsNote: "All measured in m² of finished surface.",
    primary: "15mm-cement-sand-plaster",
    items: [
      { slug: "15mm-cement-sand-plaster", quantity: wallArea * 4, basis: "Both faces of both floors' walls" },
      { slug: "30mm-floor-screed", quantity: Math.round(slabArea * 2), basis: "Ground and first floor areas" },
      { slug: "three-coat-emulsion-paint", quantity: wallArea * 4, basis: "All plastered surfaces" },
    ],
    camera: { position: [-8, 7, 18], target: [5, 3.5, 4] },
  },
];

export type PricedItem = WalkthroughItem & {
  title: string;
  unit: string;
  rate: number;
  amount: number;
};

export type PricedStep = {
  step: WalkthroughStep;
  items: PricedItem[];
  subtotal: number;
  cumulative: number;
  primaryBuildUp: {
    title: string;
    unit: string;
    lines: { label: string; category: string; quantity: number; unit: string; unitRate: number; value: number }[];
    calc: RateCalculation;
    allowances: { materialFluctuation: number; labourFluctuation: number; plantFluctuation: number; risk: number; op: number };
  } | null;
};

/** Prices every step with Rate Bank rates adjusted for the chosen state. */
export function priceWalkthrough(location: RateLocation): PricedStep[] {
  let cumulative = 0;
  return WALKTHROUGH_STEPS.map((step) => {
    const items = step.items.flatMap((item) => {
      const rateItem = getRateBankItem(item.slug);
      if (!rateItem) return [];
      const rate = calculateRate(localiseLines(rateItem.lines, location), rateItem.allowances).total;
      return [{ ...item, title: rateItem.shortTitle, unit: rateItem.unit, rate, amount: rate * item.quantity }];
    });
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    cumulative += subtotal;
    const primary = getRateBankItem(step.primary);
    let primaryBuildUp: PricedStep["primaryBuildUp"] = null;
    if (primary) {
      const lines = localiseLines(primary.lines, location);
      primaryBuildUp = {
        title: primary.shortTitle,
        unit: primary.unit,
        lines: lines.map((line) => ({
          label: line.label,
          category: line.category,
          quantity: line.quantity,
          unit: line.unit,
          unitRate: line.unitRate,
          value: line.quantity * line.unitRate,
        })),
        calc: calculateRate(lines, primary.allowances),
        allowances: primary.allowances,
      };
    }
    return { step, items, subtotal, cumulative, primaryBuildUp };
  });
}
