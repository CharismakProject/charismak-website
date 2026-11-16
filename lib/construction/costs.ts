import { RATE_BANK_ITEMS, calculateRate, type RateBankItem, type RateCostLine } from "../rates/defaults";
import { DEFAULT_PRICE_ITEMS, DEFAULT_RATE_TEMPLATES } from "../pricing/defaults";
import { getLocation, localiseLines } from "../rates/locations";
import { BUILD_STAGES, type WorkItem } from "./walkthrough";
import { WALKTHROUGH_STEPS } from "../rates/walkthrough";
import { getLearningModel, type ModelId } from "./learning";

export type Resource = Omit<RateCostLine, "unitRate"> & { unitRate: number | null };
export type CostWork = WorkItem & { templateId?: string; resources?: Resource[] };
export type CostEdit = { quantity?: number; rate?: number; resources?: Record<string, { quantity?: number; unitRate?: number | null }>; allowances?: Partial<RateBankItem["allowances"]>; added?: Resource[] };
export type CostEdits = Record<string, CostEdit>;
export const COST_STORAGE = "charismak-construction-costs-v1";
const zeroAllowances = { materialFluctuation: 0, labourFluctuation: 0, plantFluctuation: 0, risk: 0, op: 0 };
const bank = new Map(RATE_BANK_ITEMS.map(item => [item.slug, item]));
const prices = new Map(DEFAULT_PRICE_ITEMS.map(item => [item.id, item]));
const templates = new Map(DEFAULT_RATE_TEMPLATES.map(item => [item.id, item]));
export const roundCost = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export const validCost = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1e9;
const resource = (id: string, label: string, category: Resource["category"], quantity: number, unit: string, unitRate: number | null, note?: string): Resource => ({ id, label, category, quantity, unit, unitRate, note });
const catalogue = (id: string, quantity: number, label?: string): Resource => {
  const price = prices.get(id);
  if (!price) throw new Error(`Missing construction teaching resource: ${id}`);
  return resource(id, label ?? price.description, price.category === "subcontract" ? "labour" : price.category, quantity, price.unit, price.rate, `Charismak Price Library starter reference, ${price.updatedAt.slice(0, 10)}. Confirm against a quotation.`);
};
const quote = (id: string, title: string, quantity: number, unit: string, basis: string, category: Resource["category"] = "material"): CostWork => ({ id, title, quantity, unit, basis, resources: [resource("quotation", "Agreed supply / subcontract quotation", category, 1, unit, null, "Enter an agreed rate or replace this allowance with individual resources.")] });
const rb = (id: string, title: string, quantity: number, unit: string, rateSlug: string, basis: string): CostWork => ({ id, title, quantity, unit, rateSlug, basis });
const tpl = (id: string, title: string, quantity: number, templateId: string, basis: string): CostWork => {
  const template = templates.get(templateId); if (!template) throw new Error(`Missing teaching template: ${templateId}`);
  return { id, title, quantity, unit: template.unit, templateId, basis };
};
const custom = (id: string, title: string, quantity: number, unit: string, resources: Resource[], basis: string): CostWork => ({ id, title, quantity, unit, resources, basis });
const concrete = (id: string, title: string, q: number, basis: string) => rb(id, title, q, "m³", "c25-structural-concrete-310kg", basis);
const rebar = (id: string, q: number) => rb(id, "Reinforcement supply & fixing", q, "t", "high-yield-reinforcement-supply-fix", "Teaching allowance only; replace with the approved bar bending schedule.");
const steel = (id: string, title: string, q: number) => tpl(id, title, q, "structural-steel-installed", "Provisional steel weight for cost teaching, not calculated from mesh geometry. Includes the template’s fabrication/erection resources; special connections and coatings are separate where listed.");
const pipe50 = (id: string, title: string, q: number) => custom(id, title, q, "m", [catalogue("pvc-pipe-50", 1.05), resource("fittings", "Branches, bends, supports and fittings", "material", 1, "m", null), catalogue("pipework-labour", 1)], "Illustrative net route length. Consumption includes 5% cutting waste; fittings need a project quotation.");

// Quotation-only work for the two-storey stages that have no Rate Bank rate.
const STOREY_QUOTES: Record<string, CostWork[]> = {
  survey: [quote("survey-fees", "Survey, soil investigation & design fees", 1, "item", "Lump-sum professional fees; enter the consultants' quotations.", "logistics")],
  mobilisation: [quote("preliminaries", "Preliminaries: set-up, hoarding, site office, water & supervision", 1, "item", "Normally a lump sum or a percentage of the works in the BoQ.", "logistics")],
  "setting-out": [quote("setting-out", "Setting out (where not included in Preliminaries)", 1, "item", "Usually inside Preliminaries; enter a separate amount only if the contract measures it.", "labour")],
  "mep-first-fix": [quote("electrical", "Electrical installation (subcontract)", 1, "item", "Usually priced per point or as a subcontract; enter the agreed sum.", "labour"), quote("plumbing", "Plumbing installation (subcontract)", 1, "item", "Usually priced per point or as a subcontract; enter the agreed sum.", "labour")],
  "external-works": [quote("external-works", "Fence, gate, paving, drainage & landscaping", 1, "item", "Measure from the external works drawing or enter a quotation.")],
  handover: [quote("handover", "Final cleaning, snagging & handover", 1, "item", "Normally inside Preliminaries.", "labour")],
};
const storeyWorks = (): CostWork[][] => WALKTHROUGH_STEPS.map(step => step.items.length
  ? step.items.map((item, index) => {
    const reference = bank.get(item.slug);
    if (!reference) throw new Error(`Missing two-storey rate: ${item.slug}`);
    return rb(`${step.id}-${index}`, reference.shortTitle, item.quantity, reference.unit, item.slug, item.basis);
  })
  : STOREY_QUOTES[step.id] ?? []);

const MODEL_WORKS: Record<ModelId, CostWork[][]> = {
  bungalow: BUILD_STAGES.map(stage => stage.items),
  "storey-building": storeyWorks(),
  "concrete-frame": [
    [rb("excavate", "Pad foundation excavation", 38.99, "m³", "manual-trench-excavation", "12 assumed pits × 1.90 × 1.90 × 0.90 m."), rb("blinding", "Pad blinding", 1.63, "m³", "c15-blinding-1-3-6", "12 × 1.65 × 1.65 × 0.05 m."), concrete("pads", "Pads & ground-beam concrete", 20.04, "12 model pads plus schematic ground beams, less overlaps; sizes are illustrative."), rebar("foundation-bars", 2.2)],
    [concrete("starters", "Ground-storey columns & core", 12.22, "12 columns × 0.38 × 0.38 × 3 m plus 7.02 m³ schematic core."), rebar("starter-bars", 1.8), rb("starter-forms", "Column & core formwork", 120, "m²", "plywood-formwork-columns", "Provisional concrete-contact area; core geometry and reuse require measurement.")],
    [concrete("first-floor", "First-floor beams & slab", 24.98, "103.2 m² net slab × 0.18 m + 6.4 m³ assumed beams."), rebar("first-bars", 3), rb("first-forms", "First-floor soffit & beam formwork", 143.2, "m²", "plywood-formwork-slab-soffit", "103.2 m² net soffit + 40 m² assumed beam contact area; replace with the formwork take-off.")],
    [concrete("upper-frame", "Upper columns, core, beams & slabs", 111.6, "Three further floor cycles × (12.22 + 24.98) m³; excludes the first floor already priced."), rebar("upper-bars", 14.4), rb("upper-forms", "Upper-floor formwork allowance", 789.6, "m²", "plywood-formwork-slab-soffit", "Three cycles × (120 + 143.2) m² provisional contact area; confirm member-specific formwork rates.")],
    [concrete("stairs", "Concrete stairs & landings", 8, "Provisional total for eight flights and landings; measure the actual waist, risers and landings."), rebar("stair-bars", 1), rb("stair-forms", "Stair formwork", 52, "m²", "plywood-formwork-staircase", "Illustrative sloping soffit, edges and risers.")],
    [quote("facade", "Facade panels, fixings & installation", 332, "m²", "Illustrative panel area; openings, specification and access equipment require a specialist quotation.")],
    [],
  ],
  "truss-bridge": [
    [concrete("abutments", "Abutment concrete", 46.08, "Two schematic supports × 2 × 1.8 × 6.4 m; foundations below these supports are additional project scope."), rebar("abutment-bars", 5.5), rb("abutment-forms", "Abutment formwork", 60.48, "m²", "marine-plywood-formwork-shear-wall", "Two supports × perimeter 16.8 m × height 1.8 m; schematic face area.")],
    [quote("bearings", "Bridge bearing assemblies", 4, "No.", "Four illustrated bearing positions. Supply, restraints, installation and testing need an engineered specification.")],
    [steel("trusses", "Main trusses — fabricated steel allowance", 7000)],
    [steel("cross-members", "Cross members & lateral bracing", 1500)],
    [quote("deck", "Complete deck system", 86.44, "m²", "Six panels × 2.94 × 4.9 m. Select and price the engineered deck system, joints, drainage and surfacing."), steel("rails", "Fabricated edge-rail steel allowance", 360)],
    [],
  ],
  "steel-frame": [
    [rb("pits", "Excavation to steel-frame bases", 16, "m³", "manual-trench-excavation", "Ten provisional base pits; replace with the excavation take-off."), concrete("supports", "Concrete column supports", 7.29, "10 × 1.35 × 1.35 × 0.40 m schematic supports."), rebar("support-bars", 1)],
    [quote("bases", "Base plates, anchors, grout & installation", 10, "set", "Ten four-anchor base assemblies. Plate thickness, anchor grade and grout quantities require design; no mass is inferred from the drawing.")],
    [steel("portals", "Primary portal-frame steel", 6500), quote("temporary", "Lifting plan & temporary stability works", 1, "item", "Special temporary stability, lifting and site access beyond the template’s normal erection plant.", "plant")],
    [steel("bracing", "Permanent bracing steel", 550), quote("connections", "Connection plates, bolts & inspection", 1, "item", "Special connectors excluded from the primary-steel teaching allowance. Confirm the fabrication and inspection scope.")],
    [steel("secondary", "Purlins & side rails", 1200)],
    [rb("roof", "Aluminium roof covering", 145.6, "m²", "055mm-aluminium-roof-covering", "Two schematic slopes × 13 × 5.6 m. Roof rate only; gutters and wall cladding are separate."), quote("wall-cladding", "Wall cladding & flashings", 107.5, "m²", "Two long elevations, less agreed openings; confirm weathering details."), quote("rainwater", "Gutters & downpipes", 1, "item", "Complete roof drainage quotation.")],
    [quote("handover", "Final steelwork inspection & records", 1, "item", "Independent final inspection, coating checks, defects and handover records; normal fabrication labour is already in the steel rates.", "labour")],
  ],
  plumbing: [
    [custom("tank", "Water-storage tank", 1, "No.", [catalogue("water-tank-2000", 1), catalogue("plumber-day", 0.5)], "One 2,000 L starter-price tank example; model tank volume is schematic. Base, controls and utility connection are separate."), custom("pump", "Booster pump", 1, "No.", [catalogue("water-pump", 1), catalogue("plumber-day", 0.5)], "One starter-price pump example. Select capacity and controls from a hydraulic design.")],
    [tpl("cold", "Cold-water points", 6, "cold-water-point", "WC, basin and shower on two levels. Template uses 6 m of pipe per point, including shared-route allocation; do not add those same routes again.")],
    [custom("hot", "Hot-water distribution points", 4, "point", [resource("hot-pipe", "Specified hot-water-rated pipe", "material", 6, "m", null), resource("hot-fittings", "Hot-water fittings & insulation", "material", 1, "point", null), catalogue("plumbing-point-labour", 1)], "Basin and shower on each level; no hot water to WC. Obtain hot-rated pipe and insulation prices."), quote("heaters", "Water heaters with safety accessories", 2, "No.", "Two local heaters, valves, safety discharge and installation to the approved specification.")],
    [tpl("soil", "Soil branches & discharge stack", 17, "soil-pipe-110-installed", "Provisional 110 mm route allocation, fittings and installation; replace with measured route lengths."), pipe50("basin-waste", "Basin waste branches", 10), pipe50("shower-waste", "Shower waste branches", 6), tpl("vent", "Vent continuation & termination", 3.57, "soil-pipe-110-installed", "Vent-only extension above the highest drainage connection, using the pipework resource template. Confirm diameter, termination and supports.")],
    [tpl("wc", "Complete WC suites", 2, "wc-suite-installed", "Two supply-and-install teaching examples. Do not also add the installation-only bank rate."), tpl("basins", "Wash-hand basins & fittings", 2, "wash-basin-installed", "Two supply-and-install sets, including the template’s fittings allowance."), custom("showers", "Shower mixers & fixing", 2, "No.", [catalogue("shower-mixer", 1), catalogue("plumber-day", 0.25)], "Two mixer sets; pipe routes are priced in their earlier stages."), custom("drains", "Floor-drain supply & fixing", 2, "No.", [catalogue("floor-drain", 1), catalogue("plumber-day", 0.15)], "Two floor-drain sets. Confirm trap specification and access."), quote("chamber", "Inspection chamber & cover", 1, "No.", "Schematic chamber; price the measured depth, construction, benching and cover class.")],
    [quote("commission", "Whole-system testing & handover", 1, "item", "Independent final system checks and records, beyond tests already included in point/pipe installation rates.", "labour")],
  ],
  electrical: [
    [quote("incoming", "Incoming service, metering & main isolation", 1, "item", "Utility-approved service arrangement and route quotation. No incoming cable size is prescribed by the model.")],
    [custom("board", "Distribution board & protective devices", 1, "No.", [catalogue("distribution-board", 1), catalogue("mcb", 6), resource("protection", "Required RCD / RCBO / isolation arrangement", "material", 1, "set", null), catalogue("electrician-day", 1)], "Six schematic circuit groups. Device types, ratings, discrimination and additional protection require design; the missing protection price must be entered."), custom("earth", "Earthing arrangement", 1, "set", [catalogue("earthing-set", 1), catalogue("electrician-day", 0.5)], "Starter electrode-set allowance; actual earthing system, conductors and testing require project design.")],
    [tpl("lighting", "Lighting points — wiring & switching", 4, "lighting-point", "Four illustrated light points. Cable quantities are resource allowances, not route lengths or cable-sizing instructions. Light fittings are separate."), custom("lights", "LED light fittings", 4, "No.", [catalogue("led-light", 1)], "Starter luminaire supply only; point installation labour is already included above.")],
    [tpl("sockets", "Socket outlet points", 4, "socket-outlet-point", "Four illustrated socket points. The template includes wiring, conduit, boxes, outlets and point testing; quantities and cable specification require design.")],
    [custom("dedicated", "Dedicated equipment circuits", 2, "circuit", [resource("cable", "Designed cable / containment allowance", "material", 1, "circuit", null), resource("isolator", "Local isolation & connection accessories", "material", 1, "set", null), catalogue("electrical-point-labour", 1), catalogue("electrical-testing", 1)], "Two circuits for the illustrated AC/heater loads. Equipment supply is excluded; do not reuse socket-circuit cable sizes without design.")],
    [quote("verification", "Independent verification & handover records", 1, "item", "Whole-installation inspection, tests and records beyond point tests already included in the point rates.", "labour")],
  ],
};

export const costKey = (model: ModelId, location: string, id: string) => `${location}:${model}:${id}`;
export function getCostStages(modelId: ModelId) {
  const model = getLearningModel(modelId);
  return model.lessons.map((lesson, step) => ({ ...(modelId === "bungalow" ? BUILD_STAGES[step] : { id: `${modelId}-${step}`, title: lesson.title, short: lesson.short, group: model.title, description: lesson.see, checks: [lesson.check] }), items: MODEL_WORKS[modelId][step] }));
}

export function priceConstruction(modelId: ModelId, locationId: string, edits: CostEdits = {}) {
  const location = getLocation(locationId);
  return getCostStages(modelId).map(stage => {
    const items = stage.items.map(work => {
      const edit = edits[costKey(modelId, location.id, work.id)] ?? {};
      const reference = work.rateSlug ? bank.get(work.rateSlug) : undefined;
      if (work.rateSlug && (!reference || reference.unit !== work.unit)) throw new Error(`Construction rate/unit mismatch: ${work.id}`);
      const template = work.templateId ? templates.get(work.templateId) : undefined;
      const defaults: Resource[] = reference ? reference.lines.map(line => ({ ...line })) : template ? template.components.map(component => catalogue(component.priceItemId, component.quantityPerUnit, component.description)).map((line, index) => ({ ...line, id: template.components[index].id })) : work.resources?.map(line => ({ ...line })) ?? [resource("quotation", "Agreed quotation / fee", "logistics", 1, work.unit, null)];
      const localised = defaults.map(line => line.unitRate === null ? line : localiseLines([line as RateCostLine], location)[0]);
      const lines: Resource[] = [...localised, ...edit.added ?? []].map(line => {
        const mine = edit.resources?.[line.id];
        return { ...line, quantity: validCost(mine?.quantity) ? mine.quantity : line.quantity, unitRate: mine?.unitRate === null ? null : validCost(mine?.unitRate) ? mine.unitRate : line.unitRate };
      });
      const allowances = { ...(reference?.allowances ?? zeroAllowances) };
      for (const field of Object.keys(allowances) as Array<keyof typeof allowances>) if (validCost(edit.allowances?.[field]) && edit.allowances[field]! <= 1) allowances[field] = edit.allowances[field]!;
      const calculation = calculateRate(lines.map(line => ({ ...line, unitRate: line.unitRate ?? 0 })), allowances);
      const knownRate = roundCost(calculation.total), missing = lines.filter(line => line.quantity > 0 && line.unitRate === null).length;
      const manual = validCost(edit.rate), rate = manual ? edit.rate! : missing ? null : knownRate;
      const quantity = validCost(edit.quantity) ? edit.quantity : work.quantity;
      return { ...work, quantity, rate, amount: roundCost((rate ?? 0) * quantity), reference, lines, allowances, calculation, knownRate, missing, custom: manual, adjustment: manual ? roundCost(rate! - knownRate) : 0, source: reference ? "Rate Bank · under review" : defaults.some(line => line.unitRate !== null) ? "Price Library / teaching reference" : "Project quotation required", sourceDate: reference?.lastReviewed ?? null };
    });
    return { ...stage, items, total: roundCost(items.reduce((sum, item) => sum + item.amount, 0)), unpriced: items.filter(item => item.quantity > 0 && item.rate === null).length };
  });
}
export type PricedConstruction = ReturnType<typeof priceConstruction>;
export type PricedCostWork = PricedConstruction[number]["items"][number];

export function cleanCostEdits(raw: unknown): CostEdits {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const clean: CostEdits = {};
  for (const [key, value] of Object.entries(raw).slice(0, 2000)) {
    if (!/^[a-z-]+:[a-z-]+:[a-z0-9-]+$/.test(key) || !value || typeof value !== "object") continue;
    const source = value as CostEdit, entry: CostEdit = {};
    if (validCost(source.quantity)) entry.quantity = source.quantity;
    if (validCost(source.rate)) entry.rate = source.rate;
    if (source.resources && typeof source.resources === "object") {
      entry.resources = {};
      for (const [id, line] of Object.entries(source.resources).slice(0, 100)) if (/^[a-z0-9-]+$/.test(id) && line && typeof line === "object") entry.resources[id] = { ...(validCost(line.quantity) ? { quantity: line.quantity } : {}), ...(line.unitRate === null || validCost(line.unitRate) ? { unitRate: line.unitRate } : {}) };
    }
    if (source.allowances && typeof source.allowances === "object") {
      entry.allowances = {};
      for (const field of Object.keys(zeroAllowances) as Array<keyof typeof zeroAllowances>) if (validCost(source.allowances[field]) && source.allowances[field]! <= 1) entry.allowances[field] = source.allowances[field];
    }
    if (Array.isArray(source.added)) entry.added = source.added.slice(0, 50).filter(line => line && /^extra-[a-z0-9-]+$/.test(line.id) && typeof line.label === "string" && line.label.length <= 160 && typeof line.unit === "string" && line.unit.length <= 20 && ["material", "consumable", "labour", "plant", "logistics"].includes(line.category) && validCost(line.quantity) && (line.unitRate === null || validCost(line.unitRate))).map(line => ({ id: line.id, label: line.label, category: line.category, quantity: line.quantity, unit: line.unit, unitRate: line.unitRate }));
    clean[key] = entry;
  }
  return clean;
}
