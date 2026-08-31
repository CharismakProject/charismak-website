export type AdditionalMaterialCategory = "structural-steel" | "doors-windows" | "glass-partition";

export type AdditionalMaterialLine = {
  id: string;
  material: string;
  unit: string;
  quantityLow: number;
  quantityHigh: number;
  procurementQuantity?: number;
  note?: string;
};

export type AdditionalMaterialResult = {
  category: AdditionalMaterialCategory;
  title: string;
  basis: string;
  lines: AdditionalMaterialLine[];
  assumptions: string[];
  warnings: string[];
};

export type AdditionalMaterialInput = {
  category: AdditionalMaterialCategory;
  wastePercent: number;

  steelCoveredAreaM2: number;
  steelKnownTonnes: number;
  steelIntensityKgM2: number;
  boltSetsPerTonne: number;
  coatingLitresPerTonne: number;
  steelCladdingAreaM2: number;

  windowCount: number;
  windowWidthM: number;
  windowHeightM: number;
  windowSystem: "aluminium" | "upvc" | "frameless-glass";
  doorCount: number;
  doorWidthM: number;
  doorHeightM: number;
  doorSystem: "flush" | "security" | "aluminium-glass" | "timber";

  glassPartitionAreaM2: number;
  glassPartitionHeightM: number;
  glassPartitionModuleWidthM: number;
  glassPartitionSystem: "frameless" | "aluminium-framed";
  glassPartitionDoorCount: number;
  glassThicknessMm: number;
};

export function createAdditionalMaterialInput(): AdditionalMaterialInput {
  return {
    category: "structural-steel",
    wastePercent: 7,
    steelCoveredAreaM2: 0,
    steelKnownTonnes: 0,
    steelIntensityKgM2: 40,
    boltSetsPerTonne: 18,
    coatingLitresPerTonne: 10,
    steelCladdingAreaM2: 0,
    windowCount: 0,
    windowWidthM: 1.2,
    windowHeightM: 1.2,
    windowSystem: "aluminium",
    doorCount: 0,
    doorWidthM: 0.9,
    doorHeightM: 2.1,
    doorSystem: "flush",
    glassPartitionAreaM2: 0,
    glassPartitionHeightM: 2.7,
    glassPartitionModuleWidthM: 1.2,
    glassPartitionSystem: "aluminium-framed",
    glassPartitionDoorCount: 0,
    glassThicknessMm: 10,
  };
}

const n = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;
const ceil = (value: number) => Math.ceil(Math.max(0, value));
const wf = (input: AdditionalMaterialInput) => 1 + Math.max(0, input.wastePercent) / 100;

function structuralSteel(input: AdditionalMaterialInput): AdditionalMaterialResult {
  const area = n(input.steelCoveredAreaM2);
  const enteredTonnes = n(input.steelKnownTonnes);
  const intensity = n(input.steelIntensityKgM2) || 40;
  const waste = wf(input);
  const baseTonnes = enteredTonnes || (area * intensity / 1000);
  const tonnes = baseTonnes * waste;
  const boltSets = tonnes * (n(input.boltSetsPerTonne) || 18);
  const electrodesLow = tonnes * 9;
  const electrodesHigh = tonnes * 16;
  const coatingLow = tonnes * (n(input.coatingLitresPerTonne) || 10);
  const coatingHigh = coatingLow * 1.25;
  const cladding = n(input.steelCladdingAreaM2);

  return {
    category: input.category,
    title: "Structural steel fabrication materials",
    basis: enteredTonnes
      ? `${enteredTonnes.toFixed(2)} t entered structural steel weight`
      : `${area.toFixed(2)} m² structure at ${intensity.toFixed(0)} kg/m² preliminary steel intensity`,
    lines: [
      { id: "steel-tonnes", material: "Structural steel sections / plates", unit: "tonnes", quantityLow: tonnes, quantityHigh: tonnes, procurementQuantity: Number(tonnes.toFixed(3)), note: enteredTonnes ? "Entered steel weight plus waste." : "Inferred from covered area × selected kg/m² intensity; replace with member schedule when available." },
      { id: "steel-kg", material: "Equivalent structural steel weight", unit: "kg", quantityLow: tonnes * 1000, quantityHigh: tonnes * 1000, procurementQuantity: Math.ceil(tonnes * 1000) },
      { id: "bolts", material: "High-strength / erection bolt-set allowance", unit: "sets", quantityLow: boltSets * 0.8, quantityHigh: boltSets * 1.2, procurementQuantity: ceil(boltSets * 1.2), note: "Connection design controls final bolt grade, diameter and count." },
      { id: "welding", material: "Welding electrodes / wire allowance", unit: "kg", quantityLow: electrodesLow, quantityHigh: electrodesHigh, procurementQuantity: ceil(electrodesHigh), note: "Planning range varies with connection type, process and fabrication wastage." },
      { id: "coating", material: "Primer / protective coating allowance", unit: "litres", quantityLow: coatingLow, quantityHigh: coatingHigh, procurementQuantity: ceil(coatingHigh), note: "Replace with paint manufacturer's coverage and specified DFT/system." },
      ...(cladding > 0 ? [
        { id: "cladding", material: "Roof/wall cladding to procure", unit: "m²", quantityLow: cladding * waste, quantityHigh: cladding * waste, procurementQuantity: Number((cladding * waste).toFixed(2)), note: "Entered cladding area plus waste." },
        { id: "cladding-fasteners", material: "Cladding screws / fasteners", unit: "pcs", quantityLow: cladding * 7 * waste, quantityHigh: cladding * 10 * waste, procurementQuantity: ceil(cladding * 10 * waste) },
      ] : []),
    ],
    assumptions: [
      `${input.wastePercent}% steel/cladding procurement allowance applied.`,
      enteredTonnes ? "Known tonnage is treated as the primary steel basis." : "Area-intensity mode is preliminary only; final steel tonnage must come from structural member schedules/fabrication drawings.",
    ],
    warnings: baseTonnes ? [] : ["Enter known steel tonnage or covered/structural area."],
  };
}

function doorsWindows(input: AdditionalMaterialInput): AdditionalMaterialResult {
  const waste = wf(input);
  const wc = n(input.windowCount);
  const ww = n(input.windowWidthM) || 1.2;
  const wh = n(input.windowHeightM) || 1.2;
  const dc = n(input.doorCount);
  const dw = n(input.doorWidthM) || 0.9;
  const dh = n(input.doorHeightM) || 2.1;
  const windowArea = wc * ww * wh;
  const windowPerimeter = wc * 2 * (ww + wh);
  const doorArea = dc * dw * dh;
  const doorFrameLength = dc * (2 * dh + dw);
  const glazedDoorFactor = input.doorSystem === "aluminium-glass" ? 0.75 : 0;

  const lines: AdditionalMaterialLine[] = [];
  if (wc) {
    lines.push(
      { id: "window-units", material: `${input.windowSystem.replace(/-/g, " ")} window units`, unit: "sets", quantityLow: wc, quantityHigh: wc, procurementQuantity: ceil(wc), note: `${ww.toFixed(2)} × ${wh.toFixed(2)} m typical size entered.` },
      { id: "window-area", material: "Window / glazing area", unit: "m²", quantityLow: windowArea * waste, quantityHigh: windowArea * waste, procurementQuantity: Number((windowArea * waste).toFixed(2)) },
      { id: "window-frame", material: "Window frame/profile perimeter allowance", unit: "linear m", quantityLow: windowPerimeter * waste, quantityHigh: windowPerimeter * 1.15 * waste, procurementQuantity: Math.ceil(windowPerimeter * 1.15 * waste), note: "Does not include internal mullions/transoms; detailed shop drawings supersede this perimeter allowance." },
      { id: "window-sealant", material: "Window perimeter sealant", unit: "cartridges", quantityLow: windowPerimeter / 12, quantityHigh: windowPerimeter / 8, procurementQuantity: ceil(windowPerimeter / 8) },
    );
  }
  if (dc) {
    lines.push(
      { id: "door-units", material: `${input.doorSystem.replace(/-/g, " ")} door sets`, unit: "sets", quantityLow: dc, quantityHigh: dc, procurementQuantity: ceil(dc), note: `${dw.toFixed(2)} × ${dh.toFixed(2)} m typical door size entered.` },
      { id: "door-area", material: "Door leaf area", unit: "m²", quantityLow: doorArea, quantityHigh: doorArea, procurementQuantity: Number(doorArea.toFixed(2)) },
      { id: "door-frame", material: "Door frame / lining length", unit: "linear m", quantityLow: doorFrameLength * waste, quantityHigh: doorFrameLength * waste, procurementQuantity: Math.ceil(doorFrameLength * waste) },
      { id: "door-hardware", material: "Door ironmongery / hardware sets", unit: "sets", quantityLow: dc, quantityHigh: dc, procurementQuantity: ceil(dc), note: "One hardware set per door; lock/hinge/closer specification varies by door type." },
      ...(glazedDoorFactor ? [{ id: "door-glass", material: "Glass within aluminium/glazed doors", unit: "m²", quantityLow: doorArea * glazedDoorFactor * waste, quantityHigh: doorArea * 0.9 * waste, procurementQuantity: Number((doorArea * 0.9 * waste).toFixed(2)) }] : []),
    );
  }

  return {
    category: input.category,
    title: "Doors & windows procurement allowance",
    basis: `${wc} window(s) and ${dc} door(s) using entered typical sizes`,
    lines,
    assumptions: [`${input.wastePercent}% profile/glazing allowance where applicable.`, "This is an opening schedule allowance. Final profiles, glass thickness, reinforcement, ironmongery and security ratings must follow approved schedules/shop drawings."],
    warnings: wc + dc ? [] : ["Enter at least one window or door quantity."],
  };
}

function glassPartition(input: AdditionalMaterialInput): AdditionalMaterialResult {
  const area = n(input.glassPartitionAreaM2);
  const height = n(input.glassPartitionHeightM) || 2.7;
  const moduleWidth = n(input.glassPartitionModuleWidthM) || 1.2;
  const doors = n(input.glassPartitionDoorCount);
  const waste = wf(input);
  const length = area / height;
  const panels = Math.ceil(length / moduleWidth);
  const perimeterChannel = (2 * length + 2 * height) * waste;
  const verticals = Math.max(0, panels - 1) * height * waste;
  const siliconeJointLength = Math.max(0, panels - 1) * height + 2 * length;

  return {
    category: input.category,
    title: "Glass / aluminium partition materials",
    basis: `${area.toFixed(2)} m² partition, ${height.toFixed(2)} m high, approx. ${moduleWidth.toFixed(2)} m modules`,
    lines: [
      { id: "glass", material: `${input.glassThicknessMm} mm toughened/laminated glass allowance`, unit: "m²", quantityLow: area * waste, quantityHigh: area * waste, procurementQuantity: Number((area * waste).toFixed(2)) },
      { id: "panels", material: "Indicative glass panels", unit: "panels", quantityLow: panels, quantityHigh: panels, procurementQuantity: panels },
      { id: "channels", material: "Floor/head/perimeter channels or tracks", unit: "linear m", quantityLow: perimeterChannel, quantityHigh: perimeterChannel * 1.1, procurementQuantity: Math.ceil(perimeterChannel * 1.1) },
      ...(input.glassPartitionSystem === "aluminium-framed" ? [{ id: "verticals", material: "Aluminium vertical framing / mullions", unit: "linear m", quantityLow: verticals, quantityHigh: verticals * 1.15, procurementQuantity: Math.ceil(verticals * 1.15) }] : []),
      { id: "silicone", material: "Clear/structural silicone and weather seal", unit: "cartridges", quantityLow: siliconeJointLength / 12, quantityHigh: siliconeJointLength / 8, procurementQuantity: ceil(siliconeJointLength / 8) },
      ...(doors ? [{ id: "glass-doors", material: "Glass partition door hardware / patch fitting sets", unit: "sets", quantityLow: doors, quantityHigh: doors, procurementQuantity: ceil(doors) }] : []),
    ],
    assumptions: [`${input.wastePercent}% glass/profile allowance.`, "Panel sizes, glass thickness, channels, patch fittings and structural supports must follow the approved partition/shop-drawing system."],
    warnings: area ? [] : ["Enter the glass partition area in m²."],
  };
}

export function calculateAdditionalMaterialEstimate(input: AdditionalMaterialInput): AdditionalMaterialResult {
  if (input.category === "structural-steel") return structuralSteel(input);
  if (input.category === "doors-windows") return doorsWindows(input);
  return glassPartition(input);
}
