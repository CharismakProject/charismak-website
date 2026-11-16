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

export const PHASES = ["Pre-construction", "Substructure", "Frame", "Roof", "Services & finishes", "External & handover"] as const;
export type Phase = (typeof PHASES)[number];

export type WalkthroughStep = {
  id: string;
  phase: Phase;
  stage: string;
  title: string;
  summary: string;
  detail: string;
  qsNote: string;
  /** Item whose rate build-up is explained in full. */
  primary?: string;
  items: WalkthroughItem[];
  /** For stages the Rate Bank does not price: how a QS would normally price them. */
  notPriced?: string;
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

const gableArea = r1(2 * 0.5 * MODEL.width * (MODEL.width / 2) * Math.tan(Math.PI / 6)); // two triangles: ½ × 8 m × (4 m × tan 30°) ≈ 18.5 m²
const tiledWall = 34; // two toilets, ~17 m² of wall tiling each
const floorArea = Math.round(slabArea * 2);

type StepInput = Omit<WalkthroughStep, "stage">;

const STEP_INPUTS: StepInput[] = [
  {
    id: "survey",
    phase: "Pre-construction",
    title: "Site survey & soil investigation",
    summary: "Before anything is built, the plot is surveyed and the soil is tested.",
    detail:
      "A registered surveyor confirms the plot beacons and levels against the survey plan. A geotechnical firm drills or digs trial pits to find how strong the soil is at foundation depth. Drawings, structural design and building approval (in Abuja, from the Development Control department) should be in place before work starts.",
    qsNote: "These are professional services, usually priced as lump-sum fees, not measured work.",
    items: [],
    notPriced: "Professional fees (survey, soil test, design, approvals) — priced as lump sums by the consultants. Not in the Rate Bank.",
    camera: { position: [24, 16, 26], target: [5, 0, 3] },
  },
  {
    id: "mobilisation",
    phase: "Pre-construction",
    title: "Site clearance & mobilisation",
    summary: "The bush is cleared, the site is fenced off, and the contractor sets up an office, water and storage.",
    detail:
      "Typical set-up: hoarding around the plot, a container site office and store, a water tank, a project signboard, and space for materials. This is when the site insurance, supervision team and security start.",
    qsNote: "Priced under Preliminaries in the bill of quantities — time-related costs (supervision, security, water) and fixed costs (set-up, hoarding, signboard).",
    items: [],
    notPriced: "Preliminaries — normally a lump sum or a percentage of the works in the BoQ. Not in the Rate Bank.",
    camera: { position: [22, 12, 24], target: [5, 0, 3] },
  },
  {
    id: "setting-out",
    phase: "Pre-construction",
    title: "Setting out",
    summary: "Profile boards and string lines mark exactly where every wall and column will go.",
    detail:
      "Timber profile boards are fixed outside each corner. Strings stretched between them show the wall centrelines and trench edges. Corners are checked square with the 3-4-5 method or a total station, and a datum level is fixed for all heights.",
    qsNote: "Usually included in Preliminaries or the excavation rate; not measured separately.",
    items: [],
    notPriced: "Included in Preliminaries. Not priced separately.",
    camera: { position: [15, 9, 15], target: [5, 0, 4] },
  },
  {
    id: "excavation",
    phase: "Substructure",
    title: "Trench excavation",
    summary: "Trenches are dug along every load-bearing wall down to firm ground.",
    detail:
      "Trenches follow the wall centrelines — the outside walls and the internal cross wall. Width suits the footing (675 mm here) and depth reaches firm ground (900 mm here). On most Abuja sites an excavator does the bulk digging and labourers trim the sides and bottom by hand.",
    qsNote: "Measured in cubic metres: trench length × width × depth. Disposal or keeping spoil on site for backfill changes the rate.",
    primary: "mechanical-excavation-wall-trenches",
    items: [
      { slug: "mechanical-excavation-wall-trenches", quantity: r1(run * MODEL.trenchWidth * MODEL.trenchDepth), basis: `${run} m of trench × 0.675 m wide × 0.9 m deep` },
    ],
    camera: { position: [17, 9, 16], target: [5, -0.5, 4] },
  },
  {
    id: "blinding",
    phase: "Substructure",
    title: "Blinding concrete",
    summary: "A thin layer of weak concrete seals the trench bottom so the footing is cast on a clean, level bed.",
    detail:
      "Blinding (C15, 1:3:6) is about 50 mm thick. It is not structural — it stops the footing concrete losing water into the soil and gives the iron bender and carpenter a clean surface to set out on.",
    qsNote: "Measured in cubic metres. Thin layers carry high waste, so small quantities cost more per m³ in practice.",
    primary: "c15-blinding-1-3-6",
    items: [{ slug: "c15-blinding-1-3-6", quantity: r2(run * MODEL.trenchWidth * MODEL.blindingDepth), basis: `${run} m × 0.675 m × 0.05 m` }],
    camera: { position: [13, 5, 12], target: [5, -0.8, 4] },
  },
  {
    id: "footing",
    phase: "Substructure",
    title: "Strip foundation (footing)",
    summary: "A continuous concrete strip spreads the weight of the walls and columns into the ground.",
    detail:
      "Here the footing is 675 mm wide × 225 mm deep in C20 (1:2:4) concrete, cast against timber side forms. Size and reinforcement come from the structural engineer and the soil test — a weak soil needs a wider footing or a different foundation type.",
    qsNote: "Concrete in m³; the side formwork is measured separately in m² of contact area.",
    primary: "c20-nominal-concrete-1-2-4",
    items: [
      { slug: "c20-nominal-concrete-1-2-4", quantity: r2(run * MODEL.trenchWidth * MODEL.footingDepth), basis: `${run} m × 0.675 m × 0.225 m` },
      { slug: "timber-formwork-foundation-sides", quantity: r1(2 * MODEL.footingDepth * run), basis: `2 sides × 0.225 m × ${run} m` },
    ],
    camera: { position: [12, 4, 11], target: [5, -0.7, 4] },
  },
  {
    id: "substructure-walls",
    phase: "Substructure",
    title: "Foundation blockwork & backfill",
    summary: "9-inch blocks are laid from the footing to just above ground level, then the trenches are backfilled.",
    detail:
      "Blocks are filled solid below ground. The wall stops about 200 mm above the finished ground so the floor sits above rain splash. Excavated soil goes back around the wall in layers and is rammed.",
    qsNote: "Blockwork is measured in m² of wall face (length × height). Backfill is the trench volume less what the footing and wall now occupy.",
    primary: "230mm-hollow-sandcrete-blockwork",
    items: [
      { slug: "230mm-hollow-sandcrete-blockwork", quantity: r1(run * 0.825), basis: `${run} m × 0.825 m high (footing top to DPC)` },
      { slug: "backfill-excavated-material", quantity: r1(run * MODEL.trenchWidth * MODEL.trenchDepth - run * MODEL.trenchWidth * 0.275 - run * 0.23 * 0.625), basis: "Trench volume − blinding & footing − wall below ground" },
    ],
    camera: { position: [15, 5, 14], target: [5, 0, 4] },
  },
  {
    id: "ground-slab",
    phase: "Substructure",
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
    phase: "Frame",
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
    phase: "Frame",
    title: "Ground floor blockwork & lintels",
    summary: "9-inch hollow sandcrete blocks fill in between the columns up to beam level, leaving door and window openings.",
    detail:
      "Blocks are laid in cement-sand mortar, about 10 blocks per m². A mason and labourer lay roughly 140 blocks a day. Openings are left for doors and windows, and scaffolding goes up as the wall rises.",
    qsNote: "Measured in m² of wall face, with openings deducted.",
    primary: "230mm-hollow-sandcrete-blockwork",
    items: [
      { slug: "230mm-hollow-sandcrete-blockwork", quantity: wallArea, basis: `${run} m × 2.55 m high − ~12 m² openings` },
      { slug: "150mm-hollow-sandcrete-blockwork", quantity: 7.3, basis: "Toilet partitions: 3.4 m × 2.55 m − door" },
    ],
    camera: { position: [16, 6, 15], target: [5, 1.4, 4] },
  },
  {
    id: "ff-slab",
    phase: "Frame",
    title: "Beams & first floor slab",
    summary: "Beams run along every wall line and a 150 mm reinforced slab spans between them to form the first floor.",
    detail:
      "Beams (230 × 450 mm), the slab and the staircase are cast on plywood formwork held up by props, with an opening left in the slab over the stair. Bottom bars resist bending at mid-span; top bars resist it over the supports. Props stay until the concrete is strong enough — commonly 14–21 days.",
    qsNote: "Concrete in m³, slab soffit and beam formwork in m², reinforcement in tonnes (assumed ~150 kg/m³ for beams, ~90 kg/m³ for the slab).",
    primary: "c25-structural-concrete-310kg",
    items: [
      { slug: "c25-structural-concrete-310kg", quantity: r2(beamVol + 80 * 0.15), basis: `Beams ${beamVol} m³ + slab 10 × 8 × 0.15 m` },
      { slug: "plywood-formwork-slab-soffit", quantity: 80, basis: "10 m × 8 m soffit" },
      { slug: "plywood-formwork-beams-lintels", quantity: beamForm, basis: `${run} m × (2 × 0.3 m sides + 0.23 m bottom)` },
      { slug: "high-yield-reinforcement-supply-fix", quantity: r2((beamVol * 150 + 80 * 0.15 * 90 + 1.3 * 120) / 1000), basis: "Beams ~150 kg/m³ + slab ~90 kg/m³ + stair ~120 kg/m³" },
      { slug: "c25-structural-concrete-310kg", quantity: 1.3, basis: "Staircase: 17 steps, 1.1 m wide, 150 mm waist" },
      { slug: "plywood-formwork-staircase", quantity: 12, basis: "Stair soffit, risers and strings" },
    ],
    camera: { position: [17, 10, 16], target: [5, 3, 4] },
  },
  {
    id: "first-floor",
    phase: "Frame",
    title: "First floor columns, walls & ring beam",
    summary: "The frame and blockwork repeat on the first floor, finished with a ring beam that ties the walls and carries the roof.",
    detail: "Columns continue from the floor below. The ring beam at the top of the walls holds them together and gives the roof a level, solid bearing.",
    qsNote: "Same measurement rules as the ground floor.",
    primary: "plywood-formwork-beams-lintels",
    items: [
      { slug: "c25-structural-concrete-310kg", quantity: r2(columnVol + beamVol), basis: `Columns ${columnVol} m³ + ring beam ${beamVol} m³` },
      { slug: "plywood-formwork-columns", quantity: columnForm, basis: "As ground floor columns" },
      { slug: "plywood-formwork-beams-lintels", quantity: beamForm, basis: "Ring beam sides and bottom" },
      { slug: "high-yield-reinforcement-supply-fix", quantity: r2((columnVol * 180 + beamVol * 150) / 1000), basis: "Columns ~180 kg/m³ + beam ~150 kg/m³" },
      { slug: "230mm-hollow-sandcrete-blockwork", quantity: wallArea, basis: "As ground floor walls" },
      { slug: "150mm-hollow-sandcrete-blockwork", quantity: 7.3, basis: "Toilet partitions, as ground floor" },
    ],
    camera: { position: [18, 11, 17], target: [5, 4.5, 4] },
  },
  {
    id: "roof-carcass",
    phase: "Roof",
    title: "Gable walls & timber roof carcass",
    summary: "Triangular gable walls close the ends; a wall plate, rafters and purlins form the roof frame.",
    detail:
      "The wall plate (50 × 150 mm) is bolted to the ring beam. Rafters (50 × 100 mm) at about 600 mm centres rise at 30° to the ridge, and purlins (50 × 75 mm) run across them to carry the sheets. All timber should be treated against termites.",
    qsNote: "Timber in linear metres; gable blockwork in m².",
    primary: "50x100-rafter",
    items: [
      { slug: "230mm-hollow-sandcrete-blockwork", quantity: gableArea, basis: "Two gable triangles, 8 m base × 2.3 m rise" },
      { slug: "50x150-wall-plate-tie-beam", quantity: 20.5, basis: "2 long walls × 10.23 m" },
      { slug: "50x100-rafter", quantity: 212, basis: "40 rafters × ~5.3 m" },
      { slug: "50x75-purlin", quantity: 134, basis: "12 rows × 11.2 m" },
    ],
    camera: { position: [19, 13, 18], target: [5, 6, 4] },
  },
  {
    id: "roof-covering",
    phase: "Roof",
    title: "Roofing sheets, fascia & ridge",
    summary: "0.55 mm long-span aluminium sheets are screwed to the purlins, finished with fascia boards and a ridge cap.",
    detail:
      "Sheets run from eaves to ridge with side laps facing away from the prevailing rain. The fascia closes the rafter ends and carries gutters; the ridge cap seals the top. Once the roof is on, the building is 'dried in' and inside work can start.",
    qsNote: "Roofing in m² of the sloping surface (plan area ÷ cos 30°); fascia and ridge in linear metres.",
    primary: "055mm-aluminium-roof-covering",
    items: [
      { slug: "055mm-aluminium-roof-covering", quantity: 119, basis: "11.2 × 9.2 m plan ÷ cos 30°" },
      { slug: "300mm-aluminium-fascia", quantity: 43.6, basis: "2 eaves × 11.2 m + 4 verges × 5.3 m" },
      { slug: "600mm-ridge-capping", quantity: 11.2, basis: "Ridge length" },
    ],
    camera: { position: [-6, 14, 20], target: [5, 6, 4] },
  },
  {
    id: "mep-first-fix",
    phase: "Services & finishes",
    title: "Electrical & plumbing first fix",
    summary: "Conduits, boxes and pipes are chased into the walls and slab before plastering.",
    detail:
      "Electricians run PVC conduits to every switch, socket and light point and fix back boxes; plumbers lay supply and waste pipes to the toilets and kitchen. Everything is tested before it is covered — fixing it after plastering is expensive.",
    qsNote: "Electrical and plumbing are usually priced per point or as a specialist subcontract.",
    items: [],
    notPriced: "Electrical and plumbing installation — usually a subcontract priced per point or as a provisional sum. Not in the Rate Bank yet.",
    camera: { position: [15, 8, -10], target: [5, 2.5, 4] },
  },
  {
    id: "plaster",
    phase: "Services & finishes",
    title: "Plastering & floor screed",
    summary: "Walls are rendered in cement-sand and floors levelled with a screed.",
    detail: "15 mm cement-sand plaster goes on both faces of the walls; a 30 mm screed levels the floors ready for tiles.",
    qsNote: "Both measured in m² of finished surface.",
    primary: "15mm-cement-sand-plaster",
    items: [
      { slug: "15mm-cement-sand-plaster", quantity: wallArea * 4, basis: "Both faces of both floors' walls" },
      { slug: "30mm-floor-screed", quantity: floorArea, basis: "Ground and first floor areas" },
    ],
    camera: { position: [-8, 7, 18], target: [5, 3.5, 4] },
  },
  {
    id: "windows-doors",
    phase: "Services & finishes",
    title: "Windows & doors",
    summary: "Aluminium windows and doors are fixed into the openings.",
    detail:
      "Here: 9 aluminium windows (1.2 × 1.2 m), a front entrance door and four internal doors. Frames are fixed plumb and square, then sealed against the plaster.",
    qsNote: "Counted by number. These Rate Bank items are installation only — the window and door units themselves are supplied separately.",
    primary: "door-installation-dressing",
    items: [
      { slug: "aluminium-window-installation", quantity: 9, basis: "4 ground floor + 5 first floor windows (installation only)" },
      { slug: "door-installation-dressing", quantity: 5, basis: "Front door + 2 cross-wall doors + 2 toilet doors (installation only)" },
    ],
    camera: { position: [9, 4, -9], target: [5, 3, 4] },
  },
  {
    id: "ceilings",
    phase: "Services & finishes",
    title: "POP ceilings",
    summary: "Plaster of Paris ceilings hide the slab soffit and roof structure.",
    detail: "On the ground floor the POP finishes under the concrete slab; on the first floor it hangs from the roof timbers, closing off the roof space.",
    qsNote: "Measured in m² of ceiling.",
    primary: "standard-pop-ceiling",
    items: [{ slug: "standard-pop-ceiling", quantity: floorArea, basis: "Ground and first floor ceilings" }],
    camera: { position: [15, 9, -9], target: [5, 3, 4] },
  },
  {
    id: "tiling",
    phase: "Services & finishes",
    title: "Floor & wall tiling",
    summary: "600 × 600 porcelain tiles go on the floors; wall tiles line the toilets.",
    detail: "Toilet walls get a 20 mm backing coat and 600 × 300 wall tiles to about 2.4 m high. Floors are tiled throughout.",
    qsNote: "All measured in m²; the tiling rates include cutting waste, adhesive and grout.",
    primary: "600x600-floor-tiling",
    items: [
      { slug: "600x600-floor-tiling", quantity: floorArea, basis: "Ground and first floor areas" },
      { slug: "20mm-wall-tile-backing", quantity: tiledWall, basis: "Two toilets, walls to 2.4 m" },
      { slug: "600x300-wall-tiling", quantity: tiledWall, basis: "Two toilets, walls to 2.4 m" },
    ],
    camera: { position: [-7, 8, 13], target: [3, 1.2, 5] },
  },
  {
    id: "painting",
    phase: "Services & finishes",
    title: "Painting",
    summary: "Three coats of emulsion finish the plastered walls inside and out.",
    detail: "A mist coat seals the plaster, then two full coats. Exterior walls usually get a weather-resistant (textured or exterior-grade) paint.",
    qsNote: "Measured in m² of painted surface.",
    primary: "three-coat-emulsion-paint",
    items: [{ slug: "three-coat-emulsion-paint", quantity: wallArea * 4 - tiledWall, basis: "All plastered walls less tiled areas" }],
    camera: { position: [-9, 6, -7], target: [5, 3.5, 4] },
  },
  {
    id: "second-fix",
    phase: "Services & finishes",
    title: "Second fix: sanitary fittings",
    summary: "WCs, basins, showers, sink and floor drains are fixed and connected; switches, sockets and lights go on.",
    detail: "Plumbing is pressure-tested and every electrical circuit is tested before the client sees it.",
    qsNote: "Fittings are counted by number. The Rate Bank prices the fixing; fittings are usually client-supplied or prime-cost sums.",
    primary: "wc-wash-basin-fixing",
    items: [
      { slug: "wc-wash-basin-fixing", quantity: 2, basis: "One set per floor" },
      { slug: "shower-control-fixing", quantity: 2, basis: "One per toilet" },
      { slug: "kitchen-sink-fixing", quantity: 1, basis: "Kitchen" },
      { slug: "floor-drain-fixing", quantity: 4, basis: "Toilets and kitchen" },
    ],
    camera: { position: [-4.2, 5.4, 4.6], target: [1, 3.7, 7] },
  },
  {
    id: "external-works",
    phase: "External & handover",
    title: "External works",
    summary: "The boundary fence, gate, interlocking paving, drainage and landscaping complete the plot.",
    detail: "The temporary hoarding, site office and scaffolding are removed. A block fence and steel gate secure the plot, the driveway is paved, and the rest is grassed.",
    qsNote: "Fence in metres, paving in m², drainage in metres — usually a separate section of the BoQ.",
    items: [],
    notPriced: "External works (fence, gate, paving, drainage, landscaping) — not in the Rate Bank yet.",
    camera: { position: [26, 14, -16], target: [5, 1.5, 3] },
  },
  {
    id: "handover",
    phase: "External & handover",
    title: "Cleaning, snagging & handover",
    summary: "The building is cleaned, defects are listed and fixed, and the keys are handed to the client.",
    detail:
      "Contractor and client walk through together and record every defect (the snag list). Once fixed, the building is handed over with keys, as-built drawings and warranties. A defects liability period — commonly 6 to 12 months — follows, with a retention (often 5%) held back until it ends.",
    qsNote: "The final account adds up all measured work, variations and adjustments against the contract sum.",
    items: [],
    notPriced: "Cleaning, snagging and handover sit in Preliminaries and the contract conditions — no separate rate.",
    camera: { position: [20, 9, -14], target: [5, 3.5, 4] },
  },
];

export const WALKTHROUGH_STEPS: WalkthroughStep[] = STEP_INPUTS.map((step, i) => ({
  ...step,
  stage: `${step.phase} · ${String(i + 1).padStart(2, "0")}`,
}));

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
    const primary = step.primary ? getRateBankItem(step.primary) : undefined;
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
