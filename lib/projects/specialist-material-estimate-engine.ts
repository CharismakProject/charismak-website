export type SpecialistMaterialCategory = "electrical" | "plumbing" | "ceiling" | "paving" | "waterproofing";

export type SpecialistMaterialLine = {
  id: string;
  material: string;
  unit: string;
  quantityLow: number;
  quantityHigh: number;
  procurementQuantity?: number;
  note?: string;
};

export type SpecialistMaterialResult = {
  category: SpecialistMaterialCategory;
  title: string;
  basis: string;
  lines: SpecialistMaterialLine[];
  assumptions: string[];
  warnings: string[];
};

export type SpecialistMaterialInput = {
  category: SpecialistMaterialCategory;
  wastePercent: number;

  socketPoints: number;
  lightingPoints: number;
  acPoints: number;
  waterHeaterPoints: number;
  dataPoints: number;
  averageElectricalRouteM: number;
  includeEarthCable: boolean;

  bathrooms: number;
  kitchens: number;
  wcCount: number;
  basinCount: number;
  showerCount: number;
  sinkCount: number;
  plumbingAverageRunM: number;
  hotWaterFixtures: number;

  ceilingAreaM2: number;
  ceilingSystem: "gypsum" | "pvc" | "acoustic";
  ceilingDropM: number;

  pavingAreaM2: number;
  paverLengthMm: number;
  paverWidthMm: number;
  beddingThicknessMm: number;
  subbaseThicknessMm: number;

  waterproofAreaM2: number;
  waterproofSystem: "cementitious" | "bituminous-membrane" | "liquid-pu";
  waterproofCoats: number;
  membraneRollAreaM2: number;
};

export function createSpecialistMaterialInput(): SpecialistMaterialInput {
  return {
    category: "electrical",
    wastePercent: 10,
    socketPoints: 0,
    lightingPoints: 0,
    acPoints: 0,
    waterHeaterPoints: 0,
    dataPoints: 0,
    averageElectricalRouteM: 8,
    includeEarthCable: true,
    bathrooms: 0,
    kitchens: 0,
    wcCount: 0,
    basinCount: 0,
    showerCount: 0,
    sinkCount: 0,
    plumbingAverageRunM: 6,
    hotWaterFixtures: 0,
    ceilingAreaM2: 0,
    ceilingSystem: "gypsum",
    ceilingDropM: 0.3,
    pavingAreaM2: 0,
    paverLengthMm: 200,
    paverWidthMm: 100,
    beddingThicknessMm: 30,
    subbaseThicknessMm: 150,
    waterproofAreaM2: 0,
    waterproofSystem: "cementitious",
    waterproofCoats: 2,
    membraneRollAreaM2: 10,
  };
}

const n = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;
const wf = (input: SpecialistMaterialInput) => 1 + Math.max(0, input.wastePercent) / 100;
const ceil = (value: number) => Math.ceil(Math.max(0, value));

function electrical(input: SpecialistMaterialInput): SpecialistMaterialResult {
  const route = n(input.averageElectricalRouteM) || 8;
  const waste = wf(input);
  const sockets = n(input.socketPoints);
  const lights = n(input.lightingPoints);
  const ac = n(input.acPoints);
  const heaters = n(input.waterHeaterPoints);
  const data = n(input.dataPoints);

  const lightingCable = lights * route * 2 * waste;
  const socketCable = sockets * route * 2 * waste;
  const powerCable = (ac + heaters) * route * 2 * waste;
  const earthCable = input.includeEarthCable ? (lights + sockets + ac + heaters) * route * waste : 0;
  const conduit = (lights + sockets + ac + heaters + data) * route * 0.72 * waste;
  const boxes = (lights + sockets + ac + heaters + data) * waste;
  const dbWays = Math.max(4, Math.ceil(lights / 8) + Math.ceil(sockets / 6) + ac + heaters + Math.ceil(data / 12) + 2);

  const lines: SpecialistMaterialLine[] = [
    { id: "light-cable", material: "1.5 mm² copper cable allowance (lighting L/N)", unit: "linear m", quantityLow: lightingCable, quantityHigh: lightingCable * 1.15, procurementQuantity: Math.ceil(lightingCable * 1.15), note: "Planning route allowance only; circuit layout controls final length." },
    { id: "socket-cable", material: "2.5 mm² copper cable allowance (socket L/N)", unit: "linear m", quantityLow: socketCable, quantityHigh: socketCable * 1.2, procurementQuantity: Math.ceil(socketCable * 1.2) },
    { id: "power-cable", material: "4-6 mm² copper cable allowance (AC / water-heater circuits)", unit: "linear m", quantityLow: powerCable, quantityHigh: powerCable * 1.25, procurementQuantity: Math.ceil(powerCable * 1.25), note: "Final cable size must be selected from load, voltage-drop and protective-device calculations." },
    ...(earthCable ? [{ id: "earth-cable", material: "Protective earth conductor allowance", unit: "linear m", quantityLow: earthCable, quantityHigh: earthCable * 1.15, procurementQuantity: Math.ceil(earthCable * 1.15) }] : []),
    { id: "conduit", material: "20/25 mm PVC conduit allowance", unit: "linear m", quantityLow: conduit, quantityHigh: conduit * 1.2, procurementQuantity: Math.ceil(conduit * 1.2) },
    { id: "boxes", material: "Switch/socket/junction/back boxes", unit: "pcs", quantityLow: boxes, quantityHigh: boxes, procurementQuantity: ceil(boxes) },
    { id: "db", material: "Indicative distribution-board capacity", unit: "ways", quantityLow: dbWays, quantityHigh: dbWays + 4, procurementQuantity: dbWays + 4, note: "Does not replace electrical circuit/load schedule." },
    ...(data ? [{ id: "data", material: "CAT6 data cable allowance", unit: "linear m", quantityLow: data * route * waste, quantityHigh: data * route * 1.4 * waste, procurementQuantity: Math.ceil(data * route * 1.4 * waste) }] : []),
  ];

  return {
    category: input.category,
    title: "Electrical first-fix material allowance",
    basis: `${lights} lighting, ${sockets} socket, ${ac} AC, ${heaters} water-heater and ${data} data point(s); average route ${route} m`,
    lines,
    assumptions: [`${input.wastePercent}% route/cutting allowance applied.`, "Single-core copper wiring in conduit planning basis. Cable sizes shown are indicative categories, not an electrical design."],
    warnings: lights + sockets + ac + heaters + data ? [] : ["Enter at least one electrical or data point quantity."],
  };
}

function plumbing(input: SpecialistMaterialInput): SpecialistMaterialResult {
  const bathrooms = n(input.bathrooms);
  const kitchens = n(input.kitchens);
  const wc = n(input.wcCount) || bathrooms;
  const basins = n(input.basinCount) || bathrooms;
  const showers = n(input.showerCount) || bathrooms;
  const sinks = n(input.sinkCount) || kitchens;
  const hot = n(input.hotWaterFixtures);
  const run = n(input.plumbingAverageRunM) || 6;
  const waste = wf(input);
  const coldFixtures = wc + basins + showers + sinks;
  const cold20 = coldFixtures * run * 0.65 * waste;
  const cold25 = Math.max(0, coldFixtures) * run * 0.28 * waste;
  const hot20 = hot * run * 0.7 * waste;
  const soil110 = (wc * run * 0.45 + bathrooms * 2.5) * waste;
  const waste50 = (basins + showers + sinks) * run * 0.42 * waste;
  const fittings = (coldFixtures + hot) * 4.5 * waste;
  const valves = (wc + basins + showers + sinks + hot) * waste;

  return {
    category: input.category,
    title: "Plumbing & sanitary first-fix material allowance",
    basis: `${bathrooms} bathroom(s), ${kitchens} kitchen(s), ${wc} WC(s), ${basins} basin(s), ${showers} shower(s), ${sinks} sink(s)`,
    lines: [
      { id: "ppr20", material: "20 mm PPR/cold-water branch pipe", unit: "linear m", quantityLow: cold20, quantityHigh: cold20 * 1.2, procurementQuantity: Math.ceil(cold20 * 1.2) },
      { id: "ppr25", material: "25 mm PPR/cold-water distribution pipe", unit: "linear m", quantityLow: cold25, quantityHigh: cold25 * 1.25, procurementQuantity: Math.ceil(cold25 * 1.25) },
      ...(hot ? [{ id: "hot20", material: "20 mm hot-water rated PPR/PEX pipe", unit: "linear m", quantityLow: hot20, quantityHigh: hot20 * 1.25, procurementQuantity: Math.ceil(hot20 * 1.25) }] : []),
      { id: "soil110", material: "110 mm uPVC soil pipe", unit: "linear m", quantityLow: soil110, quantityHigh: soil110 * 1.2, procurementQuantity: Math.ceil(soil110 * 1.2) },
      { id: "waste50", material: "50 mm uPVC waste pipe", unit: "linear m", quantityLow: waste50, quantityHigh: waste50 * 1.25, procurementQuantity: Math.ceil(waste50 * 1.25) },
      { id: "fittings", material: "Pipe fittings / elbows / tees / sockets allowance", unit: "pcs", quantityLow: fittings, quantityHigh: fittings * 1.35, procurementQuantity: Math.ceil(fittings * 1.35) },
      { id: "valves", material: "Angle/isolating valves and fixture connections", unit: "sets", quantityLow: valves, quantityHigh: valves, procurementQuantity: ceil(valves) },
      { id: "traps", material: "Waste traps / floor drains allowance", unit: "pcs", quantityLow: basins + sinks + showers, quantityHigh: basins + sinks + showers + bathrooms, procurementQuantity: ceil(basins + sinks + showers + bathrooms) },
    ],
    assumptions: [`${input.wastePercent}% pipe/fitting allowance applied.`, "Average route length is a planning proxy; final pipe sizes, gradients, venting and routes must follow coordinated plumbing design."],
    warnings: bathrooms + kitchens + wc + basins + showers + sinks ? [] : ["Enter bathroom/kitchen or fixture quantities."],
  };
}

function ceiling(input: SpecialistMaterialInput): SpecialistMaterialResult {
  const area = n(input.ceilingAreaM2);
  const waste = wf(input);
  const perimeterEquivalent = Math.sqrt(area || 0) * 4;
  const gridMain = area * (input.ceilingSystem === "acoustic" ? 0.85 : 1.05) * waste;
  const secondary = area * (input.ceilingSystem === "acoustic" ? 1.75 : 2.2) * waste;
  const hangers = area / (input.ceilingSystem === "acoustic" ? 1.2 : 0.9) * waste;
  const lines: SpecialistMaterialLine[] = [];

  if (input.ceilingSystem === "gypsum") {
    const boards = area / (1.2 * 2.4) * waste;
    lines.push(
      { id: "boards", material: "12.5 mm gypsum ceiling boards", unit: "1.2×2.4 m sheets", quantityLow: boards, quantityHigh: boards, procurementQuantity: ceil(boards) },
      { id: "main", material: "Main ceiling channels", unit: "linear m", quantityLow: gridMain, quantityHigh: gridMain * 1.15, procurementQuantity: Math.ceil(gridMain * 1.15) },
      { id: "furring", material: "Furring / secondary channels", unit: "linear m", quantityLow: secondary, quantityHigh: secondary * 1.15, procurementQuantity: Math.ceil(secondary * 1.15) },
      { id: "screws", material: "Drywall screws", unit: "pcs", quantityLow: area * 20 * waste, quantityHigh: area * 25 * waste, procurementQuantity: Math.ceil(area * 25 * waste) },
      { id: "compound", material: "Jointing compound", unit: "kg", quantityLow: area * 0.3 * waste, quantityHigh: area * 0.45 * waste, procurementQuantity: Math.ceil(area * 0.45 * waste) },
    );
  } else if (input.ceilingSystem === "pvc") {
    const pvcArea = area * waste;
    lines.push(
      { id: "pvc", material: "PVC ceiling panels", unit: "m²", quantityLow: pvcArea, quantityHigh: pvcArea, procurementQuantity: Number(pvcArea.toFixed(2)) },
      { id: "brandering", material: "Ceiling brandering / carrier members", unit: "linear m", quantityLow: secondary, quantityHigh: secondary * 1.2, procurementQuantity: Math.ceil(secondary * 1.2) },
      { id: "clips", material: "PVC clips / screws / fasteners", unit: "pcs", quantityLow: area * 10 * waste, quantityHigh: area * 14 * waste, procurementQuantity: Math.ceil(area * 14 * waste) },
    );
  } else {
    const tileArea = 0.6 * 0.6;
    const tiles = area / tileArea * waste;
    lines.push(
      { id: "tiles", material: "600×600 acoustic ceiling tiles", unit: "pcs", quantityLow: tiles, quantityHigh: tiles, procurementQuantity: ceil(tiles) },
      { id: "main", material: "T-grid main tees", unit: "linear m", quantityLow: gridMain, quantityHigh: gridMain * 1.15, procurementQuantity: Math.ceil(gridMain * 1.15) },
      { id: "cross", material: "T-grid cross tees", unit: "linear m", quantityLow: secondary, quantityHigh: secondary * 1.15, procurementQuantity: Math.ceil(secondary * 1.15) },
    );
  }

  lines.push(
    { id: "perimeter", material: "Perimeter angle / trim", unit: "linear m", quantityLow: perimeterEquivalent * waste, quantityHigh: perimeterEquivalent * 1.2 * waste, procurementQuantity: Math.ceil(perimeterEquivalent * 1.2 * waste) },
    { id: "hangers", material: "Hanger rods/wires and fixing points", unit: "sets", quantityLow: hangers, quantityHigh: hangers * 1.2, procurementQuantity: Math.ceil(hangers * 1.2) },
  );

  return {
    category: input.category,
    title: `${input.ceilingSystem.replace("-", " ")} ceiling materials`,
    basis: `${area.toFixed(2)} m² ceiling area, approx. ${input.ceilingDropM.toFixed(2)} m drop`,
    lines,
    assumptions: [`${input.wastePercent}% cutting/waste allowance.`, "Perimeter is inferred from area where room dimensions are not supplied; framing centres must follow the selected ceiling system/manufacturer."],
    warnings: area ? [] : ["Enter the ceiling area in m²."],
  };
}

function paving(input: SpecialistMaterialInput): SpecialistMaterialResult {
  const area = n(input.pavingAreaM2);
  const waste = wf(input);
  const l = (n(input.paverLengthMm) || 200) / 1000;
  const w = (n(input.paverWidthMm) || 100) / 1000;
  const pieces = area / (l * w) * waste;
  const bedding = area * (n(input.beddingThicknessMm) || 30) / 1000 * 1.08;
  const subbase = area * (n(input.subbaseThicknessMm) || 150) / 1000 * 1.15;
  const jointingSand = area * 0.005 * waste;

  return {
    category: input.category,
    title: "Interlocking paving materials",
    basis: `${area.toFixed(2)} m² paving, ${Math.round(l * 1000)}×${Math.round(w * 1000)} mm pavers`,
    lines: [
      { id: "pavers", material: "Interlocking paving blocks", unit: "pcs", quantityLow: pieces, quantityHigh: pieces, procurementQuantity: ceil(pieces) },
      { id: "paver-area", material: "Pavers to procure", unit: "m²", quantityLow: area * waste, quantityHigh: area * waste, procurementQuantity: Number((area * waste).toFixed(2)) },
      { id: "bedding", material: "Sharp sand / stone-dust bedding", unit: "m³", quantityLow: bedding, quantityHigh: bedding * 1.15, procurementQuantity: Number((bedding * 1.15).toFixed(2)) },
      { id: "subbase", material: "Compacted hardcore/crushed-stone subbase", unit: "m³", quantityLow: subbase, quantityHigh: subbase * 1.15, procurementQuantity: Number((subbase * 1.15).toFixed(2)) },
      { id: "joint-sand", material: "Jointing sand", unit: "m³", quantityLow: jointingSand, quantityHigh: jointingSand * 1.2, procurementQuantity: Number((jointingSand * 1.2).toFixed(2)) },
    ],
    assumptions: [`${input.wastePercent}% paver waste/cutting allowance.`, "Subbase volume includes a planning compaction allowance; actual pavement build-up depends on ground condition, traffic loading and drainage design."],
    warnings: area ? [] : ["Enter the paving area in m²."],
  };
}

function waterproofing(input: SpecialistMaterialInput): SpecialistMaterialResult {
  const area = n(input.waterproofAreaM2);
  const waste = wf(input);
  const coats = Math.max(1, Math.round(input.waterproofCoats || 2));
  let lines: SpecialistMaterialLine[] = [];
  if (input.waterproofSystem === "cementitious") {
    const kg = area * coats * 1.2 * waste;
    lines = [
      { id: "compound", material: "Cementitious waterproofing compound", unit: "kg", quantityLow: kg, quantityHigh: kg * 1.25, procurementQuantity: Math.ceil(kg * 1.25), note: "Approx. 1.2-1.5 kg/m²/coat depending on substrate/product." },
      { id: "bags", material: "Equivalent 20 kg packs", unit: "packs", quantityLow: kg / 20, quantityHigh: kg * 1.25 / 20, procurementQuantity: ceil(kg * 1.25 / 20) },
      { id: "mesh", material: "Reinforcement mesh/tape allowance", unit: "m²", quantityLow: area * 0.12, quantityHigh: area * 0.25, procurementQuantity: Math.ceil(area * 0.25) },
    ];
  } else if (input.waterproofSystem === "bituminous-membrane") {
    const covered = area * Math.max(1.12, waste);
    const rollArea = n(input.membraneRollAreaM2) || 10;
    lines = [
      { id: "membrane", material: "Torch-on / bituminous membrane", unit: "m²", quantityLow: covered, quantityHigh: covered * 1.08, procurementQuantity: Number((covered * 1.08).toFixed(2)) },
      { id: "rolls", material: "Membrane rolls", unit: "rolls", quantityLow: covered / rollArea, quantityHigh: covered * 1.08 / rollArea, procurementQuantity: ceil(covered * 1.08 / rollArea), note: `${rollArea} m² nominal roll area entered.` },
      { id: "primer", material: "Bituminous primer", unit: "litres", quantityLow: area / 5, quantityHigh: area / 3.5, procurementQuantity: ceil(area / 3.5) },
    ];
  } else {
    const litres = area * coats * 0.75 * waste;
    lines = [
      { id: "pu", material: "Liquid polyurethane waterproofing", unit: "litres", quantityLow: litres, quantityHigh: litres * 1.3, procurementQuantity: Math.ceil(litres * 1.3), note: "Planning consumption only; use manufacturer kg/m² or L/m² when known." },
      { id: "primer", material: "Compatible primer", unit: "litres", quantityLow: area / 8, quantityHigh: area / 5, procurementQuantity: ceil(area / 5) },
      { id: "mesh", material: "Detailing/reinforcement fabric allowance", unit: "m²", quantityLow: area * 0.08, quantityHigh: area * 0.2, procurementQuantity: Math.ceil(area * 0.2) },
    ];
  }

  return {
    category: input.category,
    title: `${input.waterproofSystem.replace(/-/g, " ")} waterproofing materials`,
    basis: `${area.toFixed(2)} m² waterproofing area, ${coats} coat/layer basis where applicable`,
    lines,
    assumptions: [`${input.wastePercent}% waste/lap allowance.`, "Manufacturer coverage, laps, upstands, corners, substrate condition and protective screed/detailing must be confirmed before procurement."],
    warnings: area ? [] : ["Enter the waterproofing area in m²."],
  };
}

export function calculateSpecialistMaterialEstimate(input: SpecialistMaterialInput): SpecialistMaterialResult {
  if (input.category === "electrical") return electrical(input);
  if (input.category === "plumbing") return plumbing(input);
  if (input.category === "ceiling") return ceiling(input);
  if (input.category === "paving") return paving(input);
  return waterproofing(input);
}
