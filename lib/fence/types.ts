/**
 * Block thicknesses supported by version 1 of the estimator.
 * All dimensions are expressed in millimetres.
 */
export type BlockThicknessMm = 150 | 225;

/**
 * Physical and estimating properties of a sandcrete block.
 */
export type BlockSpecification = {
  lengthMm: number;
  heightMm: number;
  thicknessMm: BlockThicknessMm;
  blocksPerSquareMetre: number;
};

/**
 * Measurements required to calculate visible fence blockwork.
 *
 * Gate openings and reinforced-concrete columns are deducted
 * before calculating the block-panel area.
 */
export type BlockworkCalculationInput = {
  totalPerimeterLengthM: number;
  totalGateOpeningWidthM: number;
  totalColumnWidthM: number;
  fenceHeightM: number;
  wastagePercent: number;
  blockSpecification: BlockSpecification;
};

/**
 * Results returned by the blockwork calculator.
 *
 * The calculator returns the intermediate quantities so that
 * users can see and verify how the final answer was obtained.
 */
export type BlockworkCalculationResult = {
  netBlockPanelLengthM: number;
  netBlockworkAreaM2: number;
  basicBlockQuantity: number;
  wastageBlockQuantity: number;
  finalBlockQuantity: number;
};

/**
 * Supported positions for a fence section.
 */
export type FenceSectionPosition =
  | "front"
  | "rear"
  | "left-side"
  | "right-side"
  | "custom";

/**
 * Initial fence design categories.
 *
 * The detailed specifications for these categories will be
 * approved and stored separately.
 */
export type FenceDesignCategory =
  | "simple"
  | "mid-range"
  | "heavy-luxury";

/**
 * Initial ground-condition categories.
 */
export type GroundCondition =
  | "firm-lateritic"
  | "normal"
  | "weak-waterlogged";

/**
 * Gate classifications supported by version 1.
 */
export type GateType = "pedestrian" | "vehicle";

export type GateOperation = "manual" | "automated";

/**
 * Security systems supported by version 1.
 */
export type SecurityTopping =
  | "none"
  | "security-spikes"
  | "barbed-wire"
  | "razor-wire"
  | "electric-fence";

/**
 * Initial wall-finish classifications.
 *
 * More finishes can be added later without changing the
 * section-calculation structure.
 */
export type FinishType =
  | "none"
  | "fair-face"
  | "plaster-and-paint"
  | "textured-paint"
  | "stone-cladding"
  | "tile-cladding"
  | "custom";

/**
 * Initial wall-coping classifications.
 */
export type CopingType =
  | "none"
  | "in-situ-concrete"
  | "precast-concrete"
  | "stone"
  | "metal"
  | "custom";

export type ColumnCapType =
  | "none"
  | "in-situ-concrete"
  | "precast-concrete"
  | "stone"
  | "metal"
  | "custom";

/**
 * A gate is recorded individually because its exact location
 * divides a fence section into continuous wall segments.
 */
export type Gate = {
  id: string;
  name: string;
  type: GateType;
  operation: GateOperation;
  widthM: number;
  heightM: number;

  /**
   * Distance from the beginning of the fence section
   * to the near edge of the gate opening.
   */
  positionFromSectionStartM: number;
  gatePostSpecificationId?: string;
};

/**
 * Finish allocation for one face of a fence section.
 */
export type SectionFaceFinish = {
  standardFinish: FinishType;
  featureFinish: FinishType;
  featureCoveragePercent: number;
};

export type FenceUpperInfillType =
  | "none"
  | "steel-grill"
  | "aluminium-grill"
  | "decorative-screen"
  | "glass"
  | "custom";

export type FencePanelComposition = {
  blockWallHeightM: number;
  upperInfillType: FenceUpperInfillType;
  upperInfillHeightM: number;
  upperInfillSpecificationId: string | null;
};

export type FencePanelCompositionOverride = {
  wallSegmentId: string;
  panelNumber: number;
  composition: FencePanelComposition;
};

/**
 * One independently configurable section of a fence project.
 */
export type FenceSection = {
  id: string;
  name: string;
  position: FenceSectionPosition;

  grossLengthM: number;
  columnBodyHeightM: number;
defaultPanelComposition: FencePanelComposition;

  designCategory: FenceDesignCategory;
  groundCondition: GroundCondition;

  maximumColumnSpacingM: number;
  regularColumnSpecificationId: string;
cornerColumnSpecificationId: string;
pedestrianGatePostSpecificationId: string;
vehicleGatePostSpecificationId: string;

  gates: Gate[];

  externalFinish: SectionFaceFinish;
  internalFinish: SectionFaceFinish;

  wallCopingType: CopingType;
regularColumnCapType: ColumnCapType;
cornerColumnCapType: ColumnCapType;
gatePostCapType: ColumnCapType;
  securityTopping: SecurityTopping;

  notes: string;
  panelCompositionOverrides: FencePanelCompositionOverride[];
};

/**
 * Complete fence-estimating project.
 *
 * Sections are stored in their physical order around the site.
 * If the perimeter is closed, the final section connects back
 * to the first section.
 */
export type FenceProject = {
  id: string;
  name: string;
  location: string;
  currency: "NGN";
  isClosedPerimeter: boolean;
  sections: FenceSection[];
};

export type FenceWallSegment = {
  id: string;
  startM: number;
  endM: number;
  grossLengthM: number;
};

export type FenceSectionSegmentationResult = {
  sectionId: string;
  sectionLengthM: number;
  totalGateOpeningWidthM: number;
  totalWallSegmentLengthM: number;
  wallSegments: FenceWallSegment[];
};

export type FenceColumnRole =
  | "section-start"
  | "section-end"
  | "shared-corner"
  | "gate-post"
  | "intermediate";

export type FenceColumnPlacement = {
  id: string;
  positionM: number;
  roles: FenceColumnRole[];
  relatedGateIds: string[];
};

export type FenceWallSegmentColumnLayout = {
  wallSegmentId: string;
  wallSegmentLengthM: number;
  numberOfBays: number;
  actualBaySpacingM: number;
  intermediateColumnCount: number;
};

export type FenceSectionColumnLayoutResult = {
  sectionId: string;
  sectionLengthM: number;
  maximumColumnSpacingM: number;
  mandatoryColumnCount: number;
  intermediateColumnCount: number;
  totalColumnCount: number;
  columns: FenceColumnPlacement[];
  wallSegmentLayouts: FenceWallSegmentColumnLayout[];
};

export type ColumnConstructionSystem =
  | "reinforced-concrete"
  | "block-pillar";

export type BlockPillarConcreteInfill =
  | "none"
  | "partial"
  | "full";

export type BaseColumnSpecification = {
  id: string;
  name: string;
  constructionSystem: ColumnConstructionSystem;
  widthAlongFenceM: number;
  depthM: number;
  heightM: number;
};

export type ReinforcedConcreteColumnSpecification =
  BaseColumnSpecification & {
    constructionSystem: "reinforced-concrete";
    concreteMixId: string;
    concreteCoverMm: number;
    mainBarCount: number;
    mainBarDiameterMm: number;
    mainBarExtraLengthM: number;
    linkBarDiameterMm: number;
    linkSpacingM: number;
    linkHookAllowanceM: number;
    formedWidthFaceCount: 0 | 1 | 2;
formedDepthFaceCount: 0 | 1 | 2;
bindingWirePercentOfReinforcementWeight: number;
    concreteWastagePercent: number;
    reinforcementWastagePercent: number;
    formworkWastagePercent: number;
  };

export type BlockPillarColumnSpecification =
  BaseColumnSpecification & {
    constructionSystem: "block-pillar";
    blockSpecificationId: string;
    blocksPerCourse: number;
    courseHeightM: number;
    mortarVolumePerBlockM3: number;
    concreteInfill: BlockPillarConcreteInfill;
    concreteInfillVolumePerMetreHeightM3: number;
    verticalBarCount: number;
    verticalBarDiameterMm: number;
    verticalBarExtraLengthM: number;
    bindingWirePercentOfReinforcementWeight: number;
    blockWastagePercent: number;
    mortarWastagePercent: number;
    concreteInfillWastagePercent: number;
    reinforcementWastagePercent: number;
  };

export type ColumnSpecification =
  | ReinforcedConcreteColumnSpecification
  | BlockPillarColumnSpecification;

  export type ColumnQuantityCalculationInput = {
  columnCount: number;
  specification: ColumnSpecification;
};

export type ReinforcedConcreteColumnQuantityResult = {
  constructionSystem: "reinforced-concrete";
  specificationId: string;
  columnCount: number;
  totalColumnWidthM: number;
  concreteMixId: string;

  basicConcreteVolumeM3: number;
  wastageConcreteVolumeM3: number;
  finalConcreteVolumeM3: number;

  mainBarDiameterMm: number;
  basicMainBarLengthM: number;
  wastageMainBarLengthM: number;
  finalMainBarLengthM: number;
  finalMainBarWeightKg: number;

  linkBarDiameterMm: number;
  linksPerColumn: number;
  totalLinkQuantity: number;
  lengthPerLinkM: number;
  basicLinkBarLengthM: number;
  wastageLinkBarLengthM: number;
  finalLinkBarLengthM: number;
  finalLinkBarWeightKg: number;

  totalReinforcementWeightKg: number;
  bindingWireWeightKg: number;

  basicFormworkAreaM2: number;
  wastageFormworkAreaM2: number;
  finalFormworkAreaM2: number;
};

export type BlockPillarColumnQuantityResult = {
  constructionSystem: "block-pillar";
  specificationId: string;
  columnCount: number;
  totalColumnWidthM: number;
  blockSpecificationId: string;

  coursesPerColumn: number;
  constructedHeightM: number;
  basicBlockQuantity: number;
  wastageBlockQuantity: number;
  finalBlockQuantity: number;

  basicMortarVolumeM3: number;
  wastageMortarVolumeM3: number;
  finalMortarVolumeM3: number;

  basicConcreteInfillVolumeM3: number;
  wastageConcreteInfillVolumeM3: number;
  finalConcreteInfillVolumeM3: number;

  verticalBarDiameterMm: number;
  basicVerticalBarLengthM: number;
  wastageVerticalBarLengthM: number;
  finalVerticalBarLengthM: number;
  finalVerticalBarWeightKg: number;
  bindingWireWeightKg: number;
};

export type ColumnQuantityCalculationResult =
  | ReinforcedConcreteColumnQuantityResult
  | BlockPillarColumnQuantityResult;

  export type EstimatorMode = "client" | "team" | "admin";

export type MixCalculationMethod =
  | "ratio-based"
  | "coefficient-based";

export type RatioBasedConcreteMixSpecification = {
  id: string;
  name: string;
  materialType: "concrete";
  calculationMethod: "ratio-based";
  cementRatio: number;
  sandRatio: number;
  coarseAggregateRatio: number;
  dryVolumeFactor: number;
  cementBagWeightKg: number;
  cementBagVolumeM3: number;
  waterCementRatioByWeight: number;
};

export type CoefficientBasedConcreteMixSpecification = {
  id: string;
  name: string;
  materialType: "concrete";
  calculationMethod: "coefficient-based";
  cementBagsPerM3: number;
  cementBagWeightKg: number;
  sandVolumeM3PerM3: number;
  coarseAggregateVolumeM3PerM3: number;
  waterLitresPerM3: number;
};

export type ConcreteMixSpecification =
  | RatioBasedConcreteMixSpecification
  | CoefficientBasedConcreteMixSpecification;

export type RatioBasedMortarMixSpecification = {
  id: string;
  name: string;
  materialType: "mortar";
  calculationMethod: "ratio-based";
  cementRatio: number;
  sandRatio: number;
  dryVolumeFactor: number;
  cementBagWeightKg: number;
  cementBagVolumeM3: number;
  waterCementRatioByWeight: number;
};

export type CoefficientBasedMortarMixSpecification = {
  id: string;
  name: string;
  materialType: "mortar";
  calculationMethod: "coefficient-based";
  cementBagsPerM3: number;
  cementBagWeightKg: number;
  sandVolumeM3PerM3: number;
  waterLitresPerM3: number;
};

export type MortarMixSpecification =
  | RatioBasedMortarMixSpecification
  | CoefficientBasedMortarMixSpecification;

  export type ConcreteMaterialConversionResult = {
  materialType: "concrete";
  mixId: string;
  calculationMethod: MixCalculationMethod;
  wetVolumeM3: number;
  dryVolumeM3: number | null;
  cementVolumeM3: number | null;
  calculatedCementBagQuantity: number;
  cementWeightKg: number;
  sandVolumeM3: number;
  coarseAggregateVolumeM3: number;
  waterLitres: number;
};

export type MortarMaterialConversionResult = {
  materialType: "mortar";
  mixId: string;
  calculationMethod: MixCalculationMethod;
  wetVolumeM3: number;
  dryVolumeM3: number | null;
  cementVolumeM3: number | null;
  calculatedCementBagQuantity: number;
  cementWeightKg: number;
  sandVolumeM3: number;
  waterLitres: number;
};

export type ResolvedFenceColumnPlacement =
  FenceColumnPlacement & {
    specificationId: string;
    constructionSystem: ColumnConstructionSystem;
    widthAlongFenceM: number;
    depthM: number;
    columnBodyHeightM: number;
    occupiedStartM: number;
    occupiedEndM: number;
  };

export type PhysicalFencePanel = {
  id: string;
  wallSegmentId: string;
  panelNumber: number;
  startM: number;
  endM: number;
  clearLengthM: number;
  leftColumnId: string;
  rightColumnId: string;
  composition: FencePanelComposition;
  blockworkAreaM2: number;
  upperInfillAreaM2: number;
};

export type FenceSectionPhysicalLayoutResult = {
  sectionId: string;
  grossSectionLengthM: number;
  totalGateOpeningWidthM: number;
  totalColumnOccupiedLengthM: number;
  totalClearBlockPanelLengthM: number;
  totalBlockworkAreaM2: number;
  totalUpperInfillAreaM2: number;
  columns: ResolvedFenceColumnPlacement[];
  panels: PhysicalFencePanel[];
};

export type ConcreteElementType =
  | "column"
  | "pad-footing"
  | "strip-footing"
  | "ground-beam"
  | "structural-beam"
  | "slab"
  | "wall-coping"
  | "column-cap"
  | "blinding"
  | "custom";

export type DimensionBasedConcreteElementInput = {
  id: string;
  name: string;
  elementType: ConcreteElementType;
  calculationMode: "dimensions";
  dimensionLengthM: number;
  dimensionWidthM: number;
  dimensionDepthOrHeightM: number;
  quantity: number;
  wastagePercent: number;
  concreteMixId: string;
};

export type DirectVolumeConcreteElementInput = {
  id: string;
  name: string;
  elementType: ConcreteElementType;
  calculationMode: "direct-volume";
  directVolumeM3: number;
  wastagePercent: number;
  concreteMixId: string;
};

export type ConcreteElementCalculationInput =
  | DimensionBasedConcreteElementInput
  | DirectVolumeConcreteElementInput;

export type ConcreteElementCalculationResult = {
  id: string;
  name: string;
  elementType: ConcreteElementType;
  calculationMode: "dimensions" | "direct-volume";
  quantity: number;
  dimensionLengthM: number | null;
  dimensionWidthM: number | null;
  dimensionDepthOrHeightM: number | null;
  directVolumeM3: number | null;
  concreteMixId: string;
  basicConcreteVolumeM3: number;
  wastageConcreteVolumeM3: number;
  finalConcreteVolumeM3: number;
};

export type ConcreteElementMaterialCalculationResult = {
  element: ConcreteElementCalculationResult;
  materials: ConcreteMaterialConversionResult;
};

export type BlockworkCalculationMode =
  | "dimensions"
  | "direct-area";

export type BlockworkMortarBasis =
  | "per-block"
  | "per-square-metre";

export type BaseBlockworkElementInput = {
  id: string;
  name: string;
  blockSpecificationId: string;
  blockSpecification: BlockSpecification;
  blockWastagePercent: number;
  mortarCalculationBasis: BlockworkMortarBasis;
  mortarVolumePerUnitM3: number;
  mortarWastagePercent: number;
  mortarMixId: string;
};

export type DimensionBasedBlockworkElementInput =
  BaseBlockworkElementInput & {
    calculationMode: "dimensions";
    wallLengthM: number;
    wallHeightM: number;
    openingAreaM2: number;
  };

export type DirectAreaBlockworkElementInput =
  BaseBlockworkElementInput & {
    calculationMode: "direct-area";
    directAreaM2: number;
  };

export type BlockworkElementCalculationInput =
  | DimensionBasedBlockworkElementInput
  | DirectAreaBlockworkElementInput;

export type BlockworkElementCalculationResult = {
  id: string;
  name: string;
  calculationMode: BlockworkCalculationMode;
  blockSpecificationId: string;
  wallLengthM: number | null;
  wallHeightM: number | null;
  grossWallAreaM2: number;
  openingAreaM2: number;
  directAreaM2: number | null;
  netBlockworkAreaM2: number;
  basicBlockQuantity: number;
  wastageBlockQuantity: number;
  finalBlockQuantity: number;
  mortarCalculationBasis: BlockworkMortarBasis;
  basicMortarVolumeM3: number;
  wastageMortarVolumeM3: number;
  finalMortarVolumeM3: number;
  mortarMixId: string;
};

export type BlockworkElementMaterialCalculationResult = {
  blockwork: BlockworkElementCalculationResult;
  mortarMaterials: MortarMaterialConversionResult;
};

export type ReinforcementCalculationMode =
  | "bar-mark"
  | "direct-total-length"
  | "welded-mesh";

export type ReinforcementSteelGrade = "high-yield" | "mild-steel";

export type BarMarkReinforcementInput = {
  id: string;
  name: string;
  calculationMode: "bar-mark";

  barDiameterMm: number;
  cuttingLengthM: number;
  quantity: number;
  additionalLengthPerBarM: number;

  wastagePercent: number;
  stockBarLengthM: number;
  bindingWirePercent: number;
  steelGrade?: ReinforcementSteelGrade;
};

export type DirectLengthReinforcementInput = {
  id: string;
  name: string;
  calculationMode: "direct-total-length";

  barDiameterMm: number;
  directTotalLengthM: number;

  wastagePercent: number;
  stockBarLengthM: number;
  bindingWirePercent: number;
  steelGrade?: ReinforcementSteelGrade;
};

export type WeldedMeshReinforcementInput = {
  id: string;
  name: string;
  calculationMode: "welded-mesh";
  meshDesignation: string;
  coverageAreaM2: number;
  lapPercent: number;
  wastagePercent: number;
  sheetLengthM: number;
  sheetWidthM: number;
  unitWeightKgPerM2: number;
  bindingWirePercent: number;
};

export type ReinforcementCalculationInput =
  | BarMarkReinforcementInput
  | DirectLengthReinforcementInput
  | WeldedMeshReinforcementInput;

export type BarReinforcementCalculationResult = {
  id: string;
  name: string;
  calculationMode: "bar-mark" | "direct-total-length";

  barDiameterMm: number;
  steelGrade: ReinforcementSteelGrade;

  quantity: number | null;
  cuttingLengthM: number | null;
  additionalLengthPerBarM: number | null;
  directTotalLengthM: number | null;

  basicLengthM: number;
  wastageLengthM: number;
  finalRequiredLengthM: number;

  unitWeightKgPerM: number;
  totalWeightKg: number;

  stockBarLengthM: number;
  stockBarQuantity: number;
  totalProcuredLengthM: number;
  offcutOrExcessLengthM: number;

  bindingWireWeightKg: number;
};

export type WeldedMeshReinforcementResult = {
  id: string;
  name: string;
  calculationMode: "welded-mesh";
  meshDesignation: string;
  coverageAreaM2: number;
  lapPercent: number;
  lapAreaM2: number;
  wastagePercent: number;
  wastageAreaM2: number;
  finalRequiredAreaM2: number;
  sheetLengthM: number;
  sheetWidthM: number;
  sheetAreaM2: number;
  exactSheetQuantity: number;
  procurementSheetQuantity: number;
  unitWeightKgPerM2: number;
  installedWeightKg: number;
  totalWeightKg: number;
  procurementWeightKg: number;
  bindingWireWeightKg: number;
};

export type ReinforcementCalculationResult =
  | BarReinforcementCalculationResult
  | WeldedMeshReinforcementResult;

export type ExcavationCalculationMode =
  | "dimensions"
  | "direct-volume";

export type ExcavationApplication =
  | "strip-foundation"
  | "column-base"
  | "block-pillar-base"
  | "pedestrian-gate-post-base"
  | "vehicle-gate-post-base"
  | "ground-beam"
  | "pit"
  | "reduced-level"
  | "custom";

type ExcavationCommonInput = {
  id: string;
  name: string;

  application: ExcavationApplication;
  groundCondition: GroundCondition;

  overExcavationPercent: number;
  permanentConstructionVolumeM3: number;
  reusableSoilPercent: number;
  bulkingPercent: number;
};

export type DimensionExcavationInput =
  ExcavationCommonInput & {
    calculationMode: "dimensions";

    lengthM: number;
    widthM: number;
    depthM: number;
    quantity: number;
  };

export type DirectVolumeExcavationInput =
  ExcavationCommonInput & {
    calculationMode: "direct-volume";

    directExcavationVolumeM3: number;
  };

export type ExcavationCalculationInput =
  | DimensionExcavationInput
  | DirectVolumeExcavationInput;

export type ExcavationCalculationResult = {
  id: string;
  name: string;

  calculationMode: ExcavationCalculationMode;
  application: ExcavationApplication;
  groundCondition: GroundCondition;

  lengthM: number | null;
  widthM: number | null;
  depthM: number | null;
  quantity: number | null;
  directExcavationVolumeM3: number | null;

  basicExcavationVolumeM3: number;
  overExcavationVolumeM3: number;
  finalExcavationVolumeM3: number;

  permanentConstructionVolumeM3: number;
  backfillRequiredM3: number;

  reusableExcavatedSoilAvailableM3: number;
  excavatedSoilUsedForBackfillM3: number;
  importedFillRequiredM3: number;

  surplusExcavatedSoilM3: number;
  looseDisposalVolumeM3: number;
};

export type FormworkCalculationMode =
  | "individual-faces"
  | "direct-area";

export type FormworkApplication =
  | "reinforced-concrete-column"
  | "gate-post"
  | "strip-foundation"
  | "pad-foundation"
  | "ground-beam"
  | "suspended-beam"
  | "concrete-wall"
  | "slab-edge"
  | "coping"
  | "column-cap"
  | "lintel"
  | "custom";

export type FormworkFaceInput = {
  id: string;
  name: string;

  lengthM: number;
  widthM: number;
  quantity: number;
};

type FormworkCommonInput = {
  id: string;
  name: string;

  application: FormworkApplication;
  wastagePercent: number;

  sheetLengthM: number;
  sheetWidthM: number;
  expectedReuseCount: number;
};

export type IndividualFacesFormworkInput =
  FormworkCommonInput & {
    calculationMode: "individual-faces";
    faces: FormworkFaceInput[];
  };

export type DirectAreaFormworkInput =
  FormworkCommonInput & {
    calculationMode: "direct-area";
    directFormworkAreaM2: number;
  };

export type FormworkCalculationInput =
  | IndividualFacesFormworkInput
  | DirectAreaFormworkInput;

export type FormworkFaceCalculationResult = {
  id: string;
  name: string;

  lengthM: number;
  widthM: number;
  quantity: number;
  contactAreaM2: number;
};

export type FormworkCalculationResult = {
  id: string;
  name: string;

  calculationMode: FormworkCalculationMode;
  application: FormworkApplication;

  faces: FormworkFaceCalculationResult[];
  directFormworkAreaM2: number | null;

  basicFormworkAreaM2: number;
  wastageFormworkAreaM2: number;
  finalFormworkAreaM2: number;

  sheetLengthM: number;
  sheetWidthM: number;
  sheetAreaM2: number;
  expectedReuseCount: number;
  effectiveSheetCoverageM2: number;

  exactSheetQuantity: number;
  procurementSheetQuantity: number;
};

export type FenceGateFoundationTreatment =
  | "stopped-at-gate-posts"
  | "continuous-under-gate"
  | "reinforced-ground-beam"
  | "custom";

export type FenceFoundationBaseIntervalInput = {
  id: string;
  name: string;

  supportedColumnId: string;
  foundationSpecificationId: string;

  startM: number;
  endM: number;
};

export type FenceFoundationGateIntervalInput = {
  id: string;
  name: string;

  gateId: string;
  treatment: FenceGateFoundationTreatment;

  startM: number;
  endM: number;
};

export type FenceFoundationLayoutCalculationInput = {
  sectionId: string;
  grossSectionLengthM: number;

  baseIntervals: FenceFoundationBaseIntervalInput[];
  gateIntervals: FenceFoundationGateIntervalInput[];
};

export type FenceFoundationIntervalResult = {
  startM: number;
  endM: number;
  lengthM: number;
  sourceIds: string[];
};

export type FencePanelFoundationSegmentResult = {
  id: string;
  sectionId: string;
  segmentNumber: number;

  startM: number;
  endM: number;
  lengthM: number;
};

export type FenceFoundationLayoutCalculationResult = {
  sectionId: string;
  grossSectionLengthM: number;

  baseOccupiedIntervals:
    FenceFoundationIntervalResult[];

  gateExcludedIntervals:
    FenceFoundationIntervalResult[];

  combinedExcludedIntervals:
    FenceFoundationIntervalResult[];

  panelFoundationSegments:
    FencePanelFoundationSegmentResult[];

  totalBaseOccupiedLengthM: number;
  totalGateExcludedLengthM: number;
  totalCombinedExcludedLengthM: number;
  totalPanelFoundationLengthM: number;
};

export type FenceFoundationBaseSpecification = {
  id: string;
  name: string;

  lengthAlongFenceM: number;
  widthAcrossFenceM: number;
  thicknessM: number;
};

export type FenceFoundationColumnSupportInput = {
  columnId: string;
  columnName: string;

  columnStartM: number;
  columnEndM: number;

  foundationSpecificationId: string;
};

export type FenceFoundationBasePlacementResolutionInput = {
  sectionId: string;
  grossSectionLengthM: number;

  columns: FenceFoundationColumnSupportInput[];
  specifications:
    FenceFoundationBaseSpecification[];
};

export type FenceFoundationResolvedBasePlacement = {
  id: string;
  name: string;

  supportedColumnId: string;
  foundationSpecificationId: string;

  columnStartM: number;
  columnEndM: number;
  columnWidthAlongFenceM: number;
  centrePositionM: number;

  baseLengthAlongFenceM: number;
  baseWidthAcrossFenceM: number;
  baseThicknessM: number;

  rawBaseStartM: number;
  rawBaseEndM: number;

  sectionBaseStartM: number;
  sectionBaseEndM: number;
  sectionOccupiedLengthM: number;

  extensionBeforeSectionM: number;
  extensionAfterSectionM: number;
};

export type FenceFoundationBasePlacementResolutionResult = {
  sectionId: string;
  grossSectionLengthM: number;

  placements:
    FenceFoundationResolvedBasePlacement[];

  baseIntervals:
    FenceFoundationBaseIntervalInput[];
};

export type FencePanelFoundationSpecification = {
  id: string;
  name: string;

  excavationWidthM: number;
  excavationDepthM: number;

  blindingWidthM: number;
  blindingThicknessM: number;

  footingWidthM: number;
  footingThicknessM: number;

  foundationBlockworkHeightM: number;
  foundationBlockworkThicknessM: number;

  groundBeamWidthM: number;
  groundBeamDepthM: number;
};

export type FencePanelFoundationGeometryInput = {
  sectionId: string;

  segments:
    FencePanelFoundationSegmentResult[];

  specification:
    FencePanelFoundationSpecification;
};

export type FencePanelFoundationSegmentGeometryResult = {
  segmentId: string;
  sectionId: string;
  segmentNumber: number;

  specificationId: string;

  lengthM: number;

  excavationVolumeM3: number;
  blindingConcreteVolumeM3: number;
  footingConcreteVolumeM3: number;

  foundationBlockworkAreaM2: number;
  foundationBlockworkVolumeM3: number;

  groundBeamConcreteVolumeM3: number;
};

export type FencePanelFoundationGeometryResult = {
  sectionId: string;
  specificationId: string;

  segments:
    FencePanelFoundationSegmentGeometryResult[];

  totalLengthM: number;

  totalExcavationVolumeM3: number;
  totalBlindingConcreteVolumeM3: number;
  totalFootingConcreteVolumeM3: number;

  totalFoundationBlockworkAreaM2: number;
  totalFoundationBlockworkVolumeM3: number;

  totalGroundBeamConcreteVolumeM3: number;
};

export type FenceFoundationBaseQuantitySpecification =
  FenceFoundationBaseSpecification & {
    excavationLengthM: number;
    excavationWidthM: number;
    excavationDepthM: number;

    blindingLengthM: number;
    blindingWidthM: number;
    blindingThicknessM: number;
  };

export type FenceFoundationBaseGeometryInput = {
  sectionId: string;

  placements:
    FenceFoundationResolvedBasePlacement[];

  specifications:
    FenceFoundationBaseQuantitySpecification[];
};

export type FenceFoundationBaseGeometryItemResult = {
  baseId: string;
  sectionId: string;

  supportedColumnId: string;
  foundationSpecificationId: string;

  excavationLengthM: number;
  excavationWidthM: number;
  excavationDepthM: number;
  excavationVolumeM3: number;

  blindingLengthM: number;
  blindingWidthM: number;
  blindingThicknessM: number;
  blindingConcreteVolumeM3: number;

  baseLengthAlongFenceM: number;
  baseWidthAcrossFenceM: number;
  baseThicknessM: number;
  baseConcreteVolumeM3: number;

  permanentBelowGroundVolumeM3: number;

  extensionBeforeSectionM: number;
  extensionAfterSectionM: number;
};

export type FenceFoundationBaseGeometryResult = {
  sectionId: string;

  bases:
    FenceFoundationBaseGeometryItemResult[];

  totalExcavationVolumeM3: number;
  totalBlindingConcreteVolumeM3: number;
  totalBaseConcreteVolumeM3: number;
  totalPermanentBelowGroundVolumeM3: number;
};

export type FenceFoundationComponentLayoutInput = {
  sectionId: string;
  grossSectionLengthM: number;

  placements:
    FenceFoundationResolvedBasePlacement[];

  specifications:
    FenceFoundationBaseQuantitySpecification[];

  gateIntervals:
    FenceFoundationGateIntervalInput[];
};

export type FenceFoundationComponentLayoutResult = {
  sectionId: string;
  grossSectionLengthM: number;

  excavationLayout:
    FenceFoundationLayoutCalculationResult;

  blindingLayout:
    FenceFoundationLayoutCalculationResult;

  structuralLayout:
    FenceFoundationLayoutCalculationResult;
};

export type FencePanelFoundationComponentGeometryInput = {
  componentLayouts:
    FenceFoundationComponentLayoutResult;

  specification:
    FencePanelFoundationSpecification;
};

export type FencePanelFoundationComponentGeometryResult = {
  sectionId: string;
  specificationId: string;

  excavation:
    FencePanelFoundationGeometryResult;

  blinding:
    FencePanelFoundationGeometryResult;

  structural:
    FencePanelFoundationGeometryResult;
};

export type FenceFoundationSectionEarthworksInput = {
  id: string;
  name: string;
  sectionId: string;

  panelGeometry:
    FencePanelFoundationComponentGeometryResult;

  baseGeometry:
    FenceFoundationBaseGeometryResult;

  groundCondition: GroundCondition;

  overExcavationPercent: number;
  reusableSoilPercent: number;
  bulkingPercent: number;

  panelBlockworkBelowGroundPercent: number;
  panelGroundBeamBelowGroundPercent: number;

  additionalPermanentBelowGroundVolumeM3:
    number;
};

export type FenceFoundationConcreteVolumeSummary = {
  panelBlindingVolumeM3: number;
  panelFootingVolumeM3: number;
  panelGroundBeamVolumeM3: number;

  baseBlindingVolumeM3: number;
  baseConcreteVolumeM3: number;

  totalConcreteVolumeM3: number;
};

export type FenceFoundationBlockworkSummary = {
  areaM2: number;
  volumeM3: number;
  belowGroundVolumeM3: number;
};

export type FenceFoundationSectionEarthworksResult = {
  id: string;
  name: string;
  sectionId: string;

  panelExcavationVolumeM3: number;
  baseExcavationVolumeM3: number;
  totalBasicExcavationVolumeM3: number;

  panelPermanentBelowGroundVolumeM3:
    number;
  basePermanentBelowGroundVolumeM3:
    number;
  additionalPermanentBelowGroundVolumeM3:
    number;
  totalPermanentBelowGroundVolumeM3:
    number;

  concrete:
    FenceFoundationConcreteVolumeSummary;

  blockwork:
    FenceFoundationBlockworkSummary;

  earthworks:
    ExcavationCalculationResult;
};

export type FenceFoundationConcreteMixAssignment = {
  mix: ConcreteMixSpecification;
  wastagePercent: number;
};

export type FenceFoundationConcreteMaterialInput = {
  foundation:
    FenceFoundationSectionEarthworksResult;

  assignments: {
    panelBlinding:
      FenceFoundationConcreteMixAssignment | null;

    panelFooting:
      FenceFoundationConcreteMixAssignment | null;

    panelGroundBeam:
      FenceFoundationConcreteMixAssignment | null;

    baseBlinding:
      FenceFoundationConcreteMixAssignment | null;

    baseConcrete:
      FenceFoundationConcreteMixAssignment | null;
  };
};

export type FenceFoundationConcreteMaterialResult = {
  sectionId: string;

  panelBlinding:
    ConcreteElementMaterialCalculationResult | null;

  panelFooting:
    ConcreteElementMaterialCalculationResult | null;

  panelGroundBeam:
    ConcreteElementMaterialCalculationResult | null;

  baseBlinding:
    ConcreteElementMaterialCalculationResult | null;

  baseConcrete:
    ConcreteElementMaterialCalculationResult | null;
};

export type FenceFoundationBlockworkMaterialAssignment = {
  blockSpecificationId: string;
  blockSpecification: BlockSpecification;

  blockWastagePercent: number;

  mortarCalculationBasis:
    | "per-block"
    | "per-square-metre";

  mortarVolumePerUnitM3: number;
  mortarWastagePercent: number;

  mortarMix: MortarMixSpecification;
};

export type FenceFoundationBlockworkMaterialInput = {
  foundation:
    FenceFoundationSectionEarthworksResult;

  assignment:
    FenceFoundationBlockworkMaterialAssignment | null;
};

export type FenceFoundationBlockworkMaterialResult = {
  sectionId: string;

  blockwork:
    BlockworkElementMaterialCalculationResult | null;
};

export type FenceFoundationStructuralComponent =
  | "panel-footing"
  | "panel-ground-beam"
  | "regular-column-base"
  | "corner-column-base"
  | "block-pillar-base"
  | "pedestrian-gate-post-base"
  | "vehicle-gate-post-base"
  | "custom";

export type FenceFoundationReinforcementItemInput = {
  component:
    FenceFoundationStructuralComponent;

  calculation:
    ReinforcementCalculationInput;
};

export type FenceFoundationFormworkItemInput = {
  component:
    FenceFoundationStructuralComponent;

  calculation:
    FormworkCalculationInput;
};

export type FenceFoundationStructuralMaterialInput = {
  sectionId: string;

  reinforcementItems:
    FenceFoundationReinforcementItemInput[];

  formworkItems:
    FenceFoundationFormworkItemInput[];
};

export type FenceFoundationReinforcementItemResult = {
  component:
    FenceFoundationStructuralComponent;

  calculation:
    ReinforcementCalculationResult;
};

export type FenceFoundationFormworkItemResult = {
  component:
    FenceFoundationStructuralComponent;

  calculation:
    FormworkCalculationResult;
};

export type FenceFoundationStructuralMaterialResult = {
  sectionId: string;

  reinforcementItems:
    FenceFoundationReinforcementItemResult[];

  formworkItems:
    FenceFoundationFormworkItemResult[];

  totalReinforcementWeightKg: number;
  totalBindingWireWeightKg: number;
  totalFormworkAreaM2: number;
};

export type EstimateCostCategory =
  | "material"
  | "labour"
  | "plant"
  | "transport"
  | "subcontract"
  | "other";

export type EstimateQuantityRoundingPolicy =
  | "none"
  | "ceil-whole-unit"
  | "ceil-package";

export type EstimateRate = {
  id: string;
  resourceId: string;

  name: string;
  category: EstimateCostCategory;

  unit: string;
  currency: string;
  unitRate: number;

  location?: string;
  source?: string;
  effectiveDate?: string;
};

export type EstimateQuantityLineInput = {
  id: string;
  description: string;

  resourceId: string;
  rateId: string;

  quantity: number;

  roundingPolicy:
    EstimateQuantityRoundingPolicy;

  packageSize: number | null;

  sourceComponentId?: string;
};

export type EstimateCostCalculationInput = {
  id: string;
  name: string;

  currency: string;

  rates: EstimateRate[];
  quantityLines: EstimateQuantityLineInput[];

  contingencyPercent: number;
  overheadPercent: number;
  profitPercent: number;
  taxPercent: number;
};

export type EstimateResourceCostResult = {
  resourceId: string;
  rateId: string;

  name: string;
  category: EstimateCostCategory;

  unit: string;
  currency: string;

  sourceLineIds: string[];

  basicQuantity: number;
  procurementQuantity: number;
  roundingAddition: number;

  roundingPolicy:
    EstimateQuantityRoundingPolicy;

  packageSize: number | null;

  unitRate: number;
  amount: number;
};

export type EstimateCategoryCostResult = {
  category: EstimateCostCategory;
  amount: number;
};

export type EstimateCostCalculationResult = {
  id: string;
  name: string;
  currency: string;

  resources: EstimateResourceCostResult[];
  categories: EstimateCategoryCostResult[];

  directCost: number;

  contingencyPercent: number;
  contingencyAmount: number;

  overheadPercent: number;
  overheadAmount: number;

  profitPercent: number;
  profitAmount: number;

  subtotalBeforeTax: number;

  taxPercent: number;
  taxAmount: number;

  grandTotal: number;
};
