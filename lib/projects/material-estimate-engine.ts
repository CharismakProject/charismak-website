export type MaterialEstimateCategory =
  | "concrete"
  | "reinforcement"
  | "blockwork"
  | "mortar-plaster"
  | "gypsum-partition"
  | "curtain-wall"
  | "facade-cladding"
  | "screed"
  | "tiling"
  | "painting"
  | "roofing"
  | "formwork";

export type MaterialEstimateLine = {
  id: string;
  material: string;
  unit: string;
  quantityLow: number;
  quantityHigh: number;
  procurementQuantity?: number;
  note?: string;
};

export type MaterialEstimateResult = {
  category: MaterialEstimateCategory;
  title: string;
  basis: string;
  lines: MaterialEstimateLine[];
  assumptions: string[];
  warnings: string[];
};

export type MaterialEstimateInput = {
  category: MaterialEstimateCategory;
  wastePercent: number;

  concreteVolumeM3: number;
  concreteMix: "1:3:6" | "1:2:4" | "1:1.5:3" | "1:1:2" | "custom";
  cementRatio: number;
  sandRatio: number;
  aggregateRatio: number;

  rebarMode: "bars" | "rc-volume";
  rebarDiameterMm: number;
  rebarBarCount: number;
  rebarBarLengthM: number;
  rcElement: "slab" | "beam" | "column" | "footing" | "retaining-wall" | "general";
  rcVolumeM3: number;

  wallAreaM2: number;
  openingsAreaM2: number;
  blockThicknessMm: 100 | 150 | 225;

  mortarAreaM2: number;
  mortarThicknessMm: number;
  mortarMix: "1:3" | "1:4" | "1:5" | "1:6";

  partitionAreaM2: number;
  partitionHeightM: number;
  studSpacingMm: 400 | 600;
  boardLayersEachSide: number;
  includePartitionInsulation: boolean;

  facadeWidthM: number;
  facadeHeightM: number;
  moduleWidthM: number;
  moduleHeightM: number;

  claddingAreaM2: number;
  claddingPanelWidthM: number;
  claddingPanelHeightM: number;
  claddingSystem: "acp" | "hpl" | "fibre-cement" | "stone-tile";

  screedAreaM2: number;
  screedThicknessMm: number;
  screedMix: "1:3" | "1:4" | "1:5";

  tileAreaM2: number;
  tileWidthMm: number;
  tileHeightMm: number;
  tilePiecesPerBox: number;

  paintAreaM2: number;
  paintCoats: number;
  paintCoverageM2PerLitre: number;
  includePrimer: boolean;

  roofAreaM2: number;
  roofSheetEffectiveWidthM: number;
  roofSheetLengthM: number;
  ridgeLengthM: number;

  formworkAreaM2: number;
  plywoodReuseCycles: number;
};

export function createMaterialEstimateInput(): MaterialEstimateInput {
  return {
    category: "concrete",
    wastePercent: 5,
    concreteVolumeM3: 0,
    concreteMix: "1:2:4",
    cementRatio: 1,
    sandRatio: 2,
    aggregateRatio: 4,
    rebarMode: "bars",
    rebarDiameterMm: 12,
    rebarBarCount: 0,
    rebarBarLengthM: 12,
    rcElement: "general",
    rcVolumeM3: 0,
    wallAreaM2: 0,
    openingsAreaM2: 0,
    blockThicknessMm: 225,
    mortarAreaM2: 0,
    mortarThicknessMm: 15,
    mortarMix: "1:6",
    partitionAreaM2: 0,
    partitionHeightM: 3,
    studSpacingMm: 600,
    boardLayersEachSide: 1,
    includePartitionInsulation: false,
    facadeWidthM: 0,
    facadeHeightM: 0,
    moduleWidthM: 1.2,
    moduleHeightM: 1.5,
    claddingAreaM2: 0,
    claddingPanelWidthM: 1.22,
    claddingPanelHeightM: 2.44,
    claddingSystem: "acp",
    screedAreaM2: 0,
    screedThicknessMm: 40,
    screedMix: "1:4",
    tileAreaM2: 0,
    tileWidthMm: 600,
    tileHeightMm: 600,
    tilePiecesPerBox: 4,
    paintAreaM2: 0,
    paintCoats: 2,
    paintCoverageM2PerLitre: 10,
    includePrimer: true,
    roofAreaM2: 0,
    roofSheetEffectiveWidthM: 1,
    roofSheetLengthM: 3,
    ridgeLengthM: 0,
    formworkAreaM2: 0,
    plywoodReuseCycles: 3,
  };
}

const positive = (value: number) => Number.isFinite(value) && value > 0 ? value : 0;
const wasteFactor = (input: MaterialEstimateInput, fallback = 5) => 1 + Math.max(0, input.wastePercent || fallback) / 100;
const ceil = (value: number) => Math.ceil(Math.max(0, value));
const cementBags = (dryVolume: number, cementPart: number, totalParts: number) => dryVolume * (cementPart / totalParts) * 1440 / 50;

function mixParts(value: string): [number, number, number] {
  const parts = value.split(":").map(Number);
  return [parts[0] || 1, parts[1] || 0, parts[2] || 0];
}

function mortarParts(value: string): [number, number] {
  const parts = value.split(":").map(Number);
  return [parts[0] || 1, parts[1] || 4];
}

function concrete(input: MaterialEstimateInput): MaterialEstimateResult {
  const volume = positive(input.concreteVolumeM3);
  let [c, s, a] = input.concreteMix === "custom" ? [positive(input.cementRatio) || 1, positive(input.sandRatio), positive(input.aggregateRatio)] : mixParts(input.concreteMix);
  const sum = c + s + a;
  const dryVolume = volume * 1.54;
  const wf = wasteFactor(input);
  const bags = cementBags(dryVolume, c, sum) * wf;
  const sand = dryVolume * (s / sum) * wf;
  const aggregate = dryVolume * (a / sum) * wf;
  return {
    category: input.category,
    title: "Concrete materials",
    basis: `${volume.toFixed(2)} m³ wet concrete at ${c}:${s}:${a} nominal mix`,
    lines: [
      { id: "cement", material: "Cement (50 kg bags)", unit: "bags", quantityLow: bags, quantityHigh: bags, procurementQuantity: ceil(bags), note: "Using 1,440 kg/m³ bulk density for cement and 1.54 dry-volume factor." },
      { id: "sand", material: "Sharp sand", unit: "m³", quantityLow: sand, quantityHigh: sand, procurementQuantity: Number(sand.toFixed(2)) },
      { id: "aggregate", material: "Coarse aggregate / granite", unit: "m³", quantityLow: aggregate, quantityHigh: aggregate, procurementQuantity: Number(aggregate.toFixed(2)) },
    ],
    assumptions: [`${input.wastePercent}% material waste allowance applied.`, "Nominal volume batching only; structural concrete mix design must follow the engineer's specified strength/design mix."],
    warnings: volume ? [] : ["Enter the required wet concrete volume in m³."],
  };
}

function reinforcement(input: MaterialEstimateInput): MaterialEstimateResult {
  const d = positive(input.rebarDiameterMm) || 12;
  const kgPerM = d * d / 162;
  const wf = wasteFactor(input);
  if (input.rebarMode === "bars") {
    const count = positive(input.rebarBarCount);
    const length = positive(input.rebarBarLengthM) || 12;
    const steelKg = count * length * kgPerM * wf;
    const binding = steelKg * 0.015;
    return {
      category: input.category,
      title: "Reinforcement materials",
      basis: `${count} no. Y${d} bars × ${length} m`,
      lines: [
        { id: "rebar", material: `Y${d} reinforcement steel`, unit: "kg", quantityLow: steelKg, quantityHigh: steelKg, procurementQuantity: Math.ceil(steelKg), note: `${kgPerM.toFixed(3)} kg/m using d²/162.` },
        { id: "tonnes", material: "Equivalent reinforcement steel", unit: "tonnes", quantityLow: steelKg / 1000, quantityHigh: steelKg / 1000, procurementQuantity: Number((steelKg / 1000).toFixed(3)) },
        { id: "binding", material: "Binding wire", unit: "kg", quantityLow: binding, quantityHigh: binding, procurementQuantity: Math.ceil(binding), note: "1.5% of reinforcement weight." },
      ],
      assumptions: [`${input.wastePercent}% cutting/lap waste applied to entered bar length.`],
      warnings: count ? [] : ["Enter the number of bars, or switch to RC-volume mode."],
    };
  }

  const volume = positive(input.rcVolumeM3);
  const intensity: Record<MaterialEstimateInput["rcElement"], [number, number]> = {
    slab: [80, 120], beam: [140, 200], column: [160, 220], footing: [70, 110], "retaining-wall": [90, 140], general: [90, 150],
  };
  const [lowKgM3, highKgM3] = intensity[input.rcElement];
  const low = volume * lowKgM3 * wf;
  const high = volume * highKgM3 * wf;
  const bindingLow = low * 0.015;
  const bindingHigh = high * 0.015;
  const barWeight = 12 * kgPerM;
  return {
    category: input.category,
    title: "Preliminary reinforcement allowance",
    basis: `${volume.toFixed(2)} m³ ${input.rcElement.replace("-", " ")} RC`,
    lines: [
      { id: "rebar-range", material: "Reinforcement steel", unit: "kg", quantityLow: low, quantityHigh: high, note: `${lowKgM3}-${highKgM3} kg/m³ planning intensity before waste.` },
      { id: "tonnes-range", material: "Equivalent reinforcement steel", unit: "tonnes", quantityLow: low / 1000, quantityHigh: high / 1000 },
      { id: "bars-equiv", material: `Equivalent 12 m Y${d} bars`, unit: "bars", quantityLow: low / barWeight, quantityHigh: high / barWeight, note: "Only an equivalent count; actual bar diameters and schedules must follow structural drawings." },
      { id: "binding-range", material: "Binding wire", unit: "kg", quantityLow: bindingLow, quantityHigh: bindingHigh },
    ],
    assumptions: [`${input.wastePercent}% reinforcement waste/lap allowance applied.`, "RC-volume mode is a planning range, not a bar bending schedule."],
    warnings: volume ? [] : ["Enter the reinforced-concrete volume in m³."],
  };
}

function blockwork(input: MaterialEstimateInput): MaterialEstimateResult {
  const gross = positive(input.wallAreaM2);
  const openings = Math.min(gross, positive(input.openingsAreaM2));
  const net = Math.max(0, gross - openings);
  const wf = wasteFactor(input);
  const blocks = net / (0.45 * 0.225) * wf;
  const mortarPerM2 = input.blockThicknessMm === 225 ? 0.014 : input.blockThicknessMm === 150 ? 0.011 : 0.0085;
  const wetMortar = net * mortarPerM2;
  const dry = wetMortar * 1.33;
  const c = cementBags(dry, 1, 7) * wf;
  const sand = dry * (6 / 7) * wf;
  return {
    category: input.category,
    title: `${input.blockThicknessMm} mm blockwork materials`,
    basis: `${net.toFixed(2)} m² net wall area after openings`,
    lines: [
      { id: "blocks", material: `${input.blockThicknessMm} mm sandcrete blocks (450 × 225 face)`, unit: "blocks", quantityLow: blocks, quantityHigh: blocks, procurementQuantity: ceil(blocks), note: "Approx. 9.88 blocks/m² before waste." },
      { id: "mortar-cement", material: "Cement for laying mortar (1:6)", unit: "bags", quantityLow: c, quantityHigh: c, procurementQuantity: ceil(c) },
      { id: "mortar-sand", material: "Sharp sand for laying mortar", unit: "m³", quantityLow: sand, quantityHigh: sand, procurementQuantity: Number(sand.toFixed(2)) },
    ],
    assumptions: [`${input.wastePercent}% waste applied.`, "10 mm nominal bed/perpend joints; mortar allowance varies with block quality, joint thickness and workmanship."],
    warnings: gross ? [] : ["Enter the gross wall area in m²."],
  };
}

function mortarPlaster(input: MaterialEstimateInput): MaterialEstimateResult {
  const area = positive(input.mortarAreaM2);
  const thickness = positive(input.mortarThicknessMm) || 15;
  const wet = area * thickness / 1000;
  const dry = wet * 1.33;
  const [c, s] = mortarParts(input.mortarMix);
  const sum = c + s;
  const wf = wasteFactor(input);
  const bags = cementBags(dry, c, sum) * wf;
  const sand = dry * (s / sum) * wf;
  return {
    category: input.category,
    title: "Mortar / plaster materials",
    basis: `${area.toFixed(2)} m² × ${thickness} mm at ${input.mortarMix} mix`,
    lines: [
      { id: "cement", material: "Cement (50 kg bags)", unit: "bags", quantityLow: bags, quantityHigh: bags, procurementQuantity: ceil(bags) },
      { id: "sand", material: "Plastering / sharp sand", unit: "m³", quantityLow: sand, quantityHigh: sand, procurementQuantity: Number(sand.toFixed(2)) },
    ],
    assumptions: [`1.33 dry-volume factor and ${input.wastePercent}% waste allowance.`],
    warnings: area ? [] : ["Enter the plaster/render/mortar area in m²."],
  };
}

function gypsumPartition(input: MaterialEstimateInput): MaterialEstimateResult {
  const area = positive(input.partitionAreaM2);
  const height = positive(input.partitionHeightM) || 3;
  const length = area / height;
  const spacing = input.studSpacingMm / 1000;
  const layers = Math.max(1, Math.round(input.boardLayersEachSide || 1));
  const wf = wasteFactor(input, 8);
  const boardFaceArea = area * 2 * layers;
  const boardSheets = boardFaceArea / (1.2 * 2.4) * wf;
  const studs = (Math.ceil(length / spacing) + 1) * wf;
  const track3m = (2 * length / 3) * wf;
  const screws = boardFaceArea * 20 * wf;
  const compound = boardFaceArea * 0.35 * wf;
  const tape = boardFaceArea * 1.4 * wf;
  return {
    category: input.category,
    title: "Gypsum partition materials",
    basis: `${area.toFixed(2)} m² partition, ${height.toFixed(2)} m high, studs @ ${input.studSpacingMm} mm`,
    lines: [
      { id: "boards", material: `12.5 mm gypsum boards, ${layers} layer(s) each side`, unit: "1.2×2.4 m sheets", quantityLow: boardSheets, quantityHigh: boardSheets, procurementQuantity: ceil(boardSheets) },
      { id: "studs", material: "Metal studs", unit: "members", quantityLow: studs, quantityHigh: studs, procurementQuantity: ceil(studs), note: `Assumes one full-height stud at ${input.studSpacingMm} mm centres.` },
      { id: "tracks", material: "Metal floor/head tracks", unit: "3 m lengths", quantityLow: track3m, quantityHigh: track3m, procurementQuantity: ceil(track3m) },
      { id: "screws", material: "Drywall screws", unit: "pcs", quantityLow: screws, quantityHigh: screws, procurementQuantity: ceil(screws) },
      { id: "compound", material: "Jointing compound", unit: "kg", quantityLow: compound, quantityHigh: compound, procurementQuantity: Math.ceil(compound) },
      { id: "tape", material: "Joint tape", unit: "m", quantityLow: tape, quantityHigh: tape, procurementQuantity: Math.ceil(tape) },
      ...(input.includePartitionInsulation ? [{ id: "insulation", material: "Acoustic/thermal insulation", unit: "m²", quantityLow: area * wf, quantityHigh: area * wf, procurementQuantity: Math.ceil(area * wf) }] : []),
    ],
    assumptions: [`${input.wastePercent}% waste allowance.`, "Doors, deflection heads, reinforcement around openings and special fire/acoustic board upgrades are excluded unless separately allowed."],
    warnings: area ? [] : ["Enter the partition wall area in m²."],
  };
}

function curtainWall(input: MaterialEstimateInput): MaterialEstimateResult {
  const width = positive(input.facadeWidthM);
  const height = positive(input.facadeHeightM);
  const area = width * height;
  const mw = positive(input.moduleWidthM) || 1.2;
  const mh = positive(input.moduleHeightM) || 1.5;
  const wf = wasteFactor(input);
  const cols = Math.ceil(width / mw);
  const rows = Math.ceil(height / mh);
  const panels = cols * rows;
  const mullions = (cols + 1) * height * wf;
  const transoms = (rows + 1) * width * wf;
  const jointLength = (mullions + transoms) * 0.75;
  return {
    category: input.category,
    title: "Curtain wall / glazed facade materials",
    basis: `${width.toFixed(2)} × ${height.toFixed(2)} m (${area.toFixed(2)} m²), module approx. ${mw} × ${mh} m`,
    lines: [
      { id: "glass", material: "Curtain-wall glazing", unit: "m²", quantityLow: area * wf, quantityHigh: area * wf, procurementQuantity: Number((area * wf).toFixed(2)) },
      { id: "panels", material: "Indicative glazed modules", unit: "panels", quantityLow: panels, quantityHigh: panels, procurementQuantity: panels },
      { id: "mullions", material: "Aluminium mullion length", unit: "linear m", quantityLow: mullions, quantityHigh: mullions, procurementQuantity: Math.ceil(mullions) },
      { id: "transoms", material: "Aluminium transom length", unit: "linear m", quantityLow: transoms, quantityHigh: transoms, procurementQuantity: Math.ceil(transoms) },
      { id: "sealant", material: "Structural/weather silicone", unit: "600 ml cartridges", quantityLow: jointLength / 12, quantityHigh: jointLength / 8, procurementQuantity: ceil(jointLength / 8), note: "Range depends on joint width/depth and system detailing." },
      { id: "anchors", material: "Brackets / anchors", unit: "sets", quantityLow: area * 2, quantityHigh: area * 3, procurementQuantity: ceil(area * 3) },
    ],
    assumptions: [`${input.wastePercent}% glazing/profile waste where applicable.`, "Final mullion/transom sizes, glass thickness, anchors and silicone must follow the engineered curtain-wall system and wind-load design."],
    warnings: area ? [] : ["Enter facade width and height."],
  };
}

function facadeCladding(input: MaterialEstimateInput): MaterialEstimateResult {
  const area = positive(input.claddingAreaM2);
  const pw = positive(input.claddingPanelWidthM) || 1.22;
  const ph = positive(input.claddingPanelHeightM) || 2.44;
  const panelArea = pw * ph;
  const wf = wasteFactor(input, 8);
  const panels = area / panelArea * wf;
  const subframe = area * (input.claddingSystem === "stone-tile" ? 1.8 : 2.6) * wf;
  const fasteners = area * (input.claddingSystem === "stone-tile" ? 10 : 14) * wf;
  const lines: MaterialEstimateLine[] = [
    { id: "cladding", material: `${input.claddingSystem.replace("-", " ")} cladding`, unit: "m²", quantityLow: area * wf, quantityHigh: area * wf, procurementQuantity: Number((area * wf).toFixed(2)) },
    { id: "panels", material: "Equivalent panel count", unit: `${pw}×${ph} m panels`, quantityLow: panels, quantityHigh: panels, procurementQuantity: ceil(panels) },
    { id: "subframe", material: "Subframe / carrier profiles", unit: "linear m", quantityLow: subframe, quantityHigh: subframe * 1.2, procurementQuantity: Math.ceil(subframe * 1.2) },
    { id: "fasteners", material: "Fixings / rivets / anchors", unit: "pcs", quantityLow: fasteners, quantityHigh: fasteners * 1.2, procurementQuantity: ceil(fasteners * 1.2) },
  ];
  if (input.claddingSystem === "stone-tile") {
    lines.push({ id: "adhesive", material: "Exterior-grade tile/stone adhesive", unit: "20 kg bags", quantityLow: area / 4 * wf, quantityHigh: area / 3 * wf, procurementQuantity: ceil(area / 3 * wf) });
  } else {
    lines.push({ id: "sealant", material: "Facade sealant", unit: "cartridges", quantityLow: area * 0.18, quantityHigh: area * 0.35, procurementQuantity: ceil(area * 0.35) });
  }
  return {
    category: input.category,
    title: "Facade / cladding materials",
    basis: `${area.toFixed(2)} m² ${input.claddingSystem.replace("-", " ")} system`,
    lines,
    assumptions: [`${input.wastePercent}% cladding waste applied.`, "Subframe and fixing quantities are planning allowances; facade engineering and manufacturer details govern final quantities."],
    warnings: area ? [] : ["Enter the facade/cladding area in m²."],
  };
}

function screed(input: MaterialEstimateInput): MaterialEstimateResult {
  const area = positive(input.screedAreaM2);
  const thickness = positive(input.screedThicknessMm) || 40;
  const wet = area * thickness / 1000;
  const dry = wet * 1.33;
  const [c, s] = mortarParts(input.screedMix);
  const sum = c + s;
  const wf = wasteFactor(input);
  const bags = cementBags(dry, c, sum) * wf;
  const sand = dry * (s / sum) * wf;
  return {
    category: input.category,
    title: "Floor screed materials",
    basis: `${area.toFixed(2)} m² × ${thickness} mm at ${input.screedMix}`,
    lines: [
      { id: "cement", material: "Cement (50 kg bags)", unit: "bags", quantityLow: bags, quantityHigh: bags, procurementQuantity: ceil(bags) },
      { id: "sand", material: "Sharp sand", unit: "m³", quantityLow: sand, quantityHigh: sand, procurementQuantity: Number(sand.toFixed(2)) },
    ],
    assumptions: [`1.33 dry-volume factor and ${input.wastePercent}% waste allowance.`],
    warnings: area ? [] : ["Enter the screed floor area in m²."],
  };
}

function tiling(input: MaterialEstimateInput): MaterialEstimateResult {
  const area = positive(input.tileAreaM2);
  const w = positive(input.tileWidthMm) / 1000 || 0.6;
  const h = positive(input.tileHeightMm) / 1000 || 0.6;
  const wf = wasteFactor(input, 10);
  const purchaseArea = area * wf;
  const pieces = purchaseArea / (w * h);
  const adhesive = purchaseArea / 4;
  const grout = purchaseArea / 20;
  const ppb = positive(input.tilePiecesPerBox);
  return {
    category: input.category,
    title: "Tiling materials",
    basis: `${area.toFixed(2)} m² at ${Math.round(w * 1000)}×${Math.round(h * 1000)} mm tile size`,
    lines: [
      { id: "tile-area", material: "Tiles to procure", unit: "m²", quantityLow: purchaseArea, quantityHigh: purchaseArea, procurementQuantity: Number(purchaseArea.toFixed(2)) },
      { id: "tile-pieces", material: "Equivalent tile pieces", unit: "pcs", quantityLow: pieces, quantityHigh: pieces, procurementQuantity: ceil(pieces) },
      ...(ppb ? [{ id: "boxes", material: "Tile boxes", unit: "boxes", quantityLow: pieces / ppb, quantityHigh: pieces / ppb, procurementQuantity: ceil(pieces / ppb), note: `${ppb} pieces per box entered.` }] : []),
      { id: "adhesive", material: "Tile adhesive", unit: "20 kg bags", quantityLow: adhesive, quantityHigh: purchaseArea / 3, procurementQuantity: ceil(purchaseArea / 3), note: "Approx. 3-4 m²/bag depending on substrate and trowel." },
      { id: "grout", material: "Tile grout", unit: "5 kg bags", quantityLow: grout, quantityHigh: purchaseArea / 14, procurementQuantity: ceil(purchaseArea / 14) },
    ],
    assumptions: [`${input.wastePercent}% cutting/waste allowance.`, "Adhesive/grout coverage varies with tile size, substrate, joint width and manufacturer."],
    warnings: area ? [] : ["Enter the tiling area in m²."],
  };
}

function painting(input: MaterialEstimateInput): MaterialEstimateResult {
  const area = positive(input.paintAreaM2);
  const coats = Math.max(1, Math.round(input.paintCoats || 2));
  const coverage = positive(input.paintCoverageM2PerLitre) || 10;
  const wf = wasteFactor(input, 10);
  const litres = area * coats / coverage * wf;
  const primer = area / coverage * wf;
  return {
    category: input.category,
    title: "Painting materials",
    basis: `${area.toFixed(2)} m², ${coats} finishing coat(s), ${coverage} m²/L/coat coverage`,
    lines: [
      { id: "paint", material: "Finishing paint", unit: "litres", quantityLow: litres, quantityHigh: litres, procurementQuantity: Math.ceil(litres) },
      { id: "paint-buckets", material: "Equivalent 20 L paint buckets", unit: "buckets", quantityLow: litres / 20, quantityHigh: litres / 20, procurementQuantity: ceil(litres / 20) },
      ...(input.includePrimer ? [{ id: "primer", material: "Primer / sealer", unit: "litres", quantityLow: primer, quantityHigh: primer, procurementQuantity: Math.ceil(primer) }] : []),
      { id: "putty", material: "Wall putty / filler allowance", unit: "kg", quantityLow: area * 0.3, quantityHigh: area * 0.6, procurementQuantity: Math.ceil(area * 0.6), note: "Only where surface preparation requires skim/filling." },
    ],
    assumptions: [`${input.wastePercent}% paint loss/touch-up allowance.`, "Actual manufacturer coverage and substrate porosity should replace the default coverage where known."],
    warnings: area ? [] : ["Enter the paintable area in m²."],
  };
}

function roofing(input: MaterialEstimateInput): MaterialEstimateResult {
  const area = positive(input.roofAreaM2);
  const width = positive(input.roofSheetEffectiveWidthM) || 1;
  const length = positive(input.roofSheetLengthM) || 3;
  const wf = wasteFactor(input, 8);
  const sheets = area / (width * length) * wf;
  const screws = area * 8 * wf;
  const ridge = positive(input.ridgeLengthM);
  return {
    category: input.category,
    title: "Roof covering materials",
    basis: `${area.toFixed(2)} m² roof surface, ${width.toFixed(2)} m effective sheet width × ${length.toFixed(2)} m sheet length`,
    lines: [
      { id: "sheets", material: "Roofing sheets", unit: "sheets", quantityLow: sheets, quantityHigh: sheets, procurementQuantity: ceil(sheets) },
      { id: "screws", material: "Roofing screws / fasteners", unit: "pcs", quantityLow: screws, quantityHigh: screws, procurementQuantity: ceil(screws) },
      ...(ridge ? [{ id: "ridge", material: "Ridge / hip caps", unit: "3 m lengths", quantityLow: ridge / 3 * wf, quantityHigh: ridge / 3 * wf, procurementQuantity: ceil(ridge / 3 * wf) }] : []),
    ],
    assumptions: [`${input.wastePercent}% laps/cutting allowance.`, "Enter actual sloping roof surface area; purlins, timber/steel trusses, gutters and flashings are separate systems."],
    warnings: area ? [] : ["Enter the roof surface area in m²."],
  };
}

function formwork(input: MaterialEstimateInput): MaterialEstimateResult {
  const area = positive(input.formworkAreaM2);
  const reuse = Math.max(1, Math.round(input.plywoodReuseCycles || 3));
  const wf = wasteFactor(input, 10);
  const sheets = area / (1.22 * 2.44) / reuse * wf;
  const timber = area * 2.5 / reuse * wf;
  const nails = area * 0.22 / reuse * wf;
  return {
    category: input.category,
    title: "Formwork materials",
    basis: `${area.toFixed(2)} m² contact area with ${reuse} planned plywood reuse cycle(s)`,
    lines: [
      { id: "plywood", material: "18 mm formwork plywood", unit: "1.22×2.44 m sheets", quantityLow: sheets, quantityHigh: sheets * 1.15, procurementQuantity: ceil(sheets * 1.15) },
      { id: "timber", material: "Timber studs/walers/props allowance", unit: "linear m", quantityLow: timber, quantityHigh: timber * 1.35, procurementQuantity: Math.ceil(timber * 1.35) },
      { id: "nails", material: "Nails / formwork fasteners", unit: "kg", quantityLow: nails, quantityHigh: nails * 1.3, procurementQuantity: Math.ceil(nails * 1.3) },
      { id: "release", material: "Form-release oil", unit: "litres", quantityLow: area / 20, quantityHigh: area / 12, procurementQuantity: ceil(area / 12) },
    ],
    assumptions: [`${input.wastePercent}% loss/damage allowance.`, "Reuse depends on plywood grade, concrete finish, handling and form geometry; props/scaffolding must be designed for the actual pour."],
    warnings: area ? [] : ["Enter the formwork contact area in m²."],
  };
}

export function calculateMaterialEstimate(input: MaterialEstimateInput): MaterialEstimateResult {
  switch (input.category) {
    case "concrete": return concrete(input);
    case "reinforcement": return reinforcement(input);
    case "blockwork": return blockwork(input);
    case "mortar-plaster": return mortarPlaster(input);
    case "gypsum-partition": return gypsumPartition(input);
    case "curtain-wall": return curtainWall(input);
    case "facade-cladding": return facadeCladding(input);
    case "screed": return screed(input);
    case "tiling": return tiling(input);
    case "painting": return painting(input);
    case "roofing": return roofing(input);
    case "formwork": return formwork(input);
  }
}
