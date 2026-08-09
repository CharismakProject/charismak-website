import type {
  BlockPillarColumnSpecification,
  ColumnConstructionSystem,
  ColumnSpecification,
  FenceSection,
  ReinforcedConcreteColumnSpecification,
} from "./types";

export type FoundationBlockInfill = "none" | "partial" | "full";

export type FenceBoqProfile = {
  includePreliminaries: boolean;
  siteClearanceWidthM: number;
  trenchWidthM: number;
  trenchDepthM: number;
  columnPitLengthM: number;
  columnPitWidthM: number;
  columnPitDepthM: number;
  blindingThicknessM: number;
  blindingMix: string;
  stripFootingWidthM: number;
  stripFootingThicknessM: number;
  structuralConcreteMix: string;
  weakConcreteMix: string;
  foundationBlockworkHeightM: number;
  foundationBlockworkThicknessM: number;
  foundationBlockInfill: FoundationBlockInfill;
  blockVoidRatio: number;
  columnBaseLengthM: number;
  columnBaseWidthM: number;
  columnBaseThicknessM: number;
  starterHeightM: number;
  baseMainBarCount: number;
  baseMainBarDiameterMm: number;
  baseBarLengthM: number;
  starterBarCount: number;
  starterBarDiameterMm: number;
  starterBarLengthM: number;
  rcColumnWidthM: number;
  rcColumnDepthM: number;
  rcMainBarCount: number;
  rcMainBarDiameterMm: number;
  rcLinkDiameterMm: number;
  rcLinkSpacingM: number;
  blockPillarWidthM: number;
  blockPillarDepthM: number;
  blocksPerPillarCourse: number;
  blockCourseHeightM: number;
  blockPillarInfill: FoundationBlockInfill;
  blockPillarInfillVolumePerMetreHeightM3: number;
  blockPillarVerticalBarCount: number;
  blockPillarVerticalBarDiameterMm: number;
  mortarMix: string;
  mortarVolumePerBlockM3: number;
  mortarVolumePerWallM2: number;
  wallCopingWidthM: number;
  wallCopingDepthM: number;
  wallCopingBarDiameterMm: number;
  wallCopingBarCount: number;
  columnCapProjectionM: number;
  columnCapThicknessM: number;
  plasterThicknessM: number;
  paintCoats: number;
  excavationBulkingPercent: number;
  materialWastagePercent: number;
};

export const DEFAULT_FENCE_BOQ_PROFILE: FenceBoqProfile = {
  includePreliminaries: true,
  siteClearanceWidthM: 1,
  trenchWidthM: 0.45,
  trenchDepthM: 0.75,
  columnPitLengthM: 0.9,
  columnPitWidthM: 0.9,
  columnPitDepthM: 0.9,
  blindingThicknessM: 0.05,
  blindingMix: "1:3:6",
  stripFootingWidthM: 0.45,
  stripFootingThicknessM: 0.15,
  structuralConcreteMix: "1:2:4",
  weakConcreteMix: "1:4:8",
  foundationBlockworkHeightM: 0.675,
  foundationBlockworkThicknessM: 0.225,
  foundationBlockInfill: "none",
  blockVoidRatio: 0.35,
  columnBaseLengthM: 0.75,
  columnBaseWidthM: 0.75,
  columnBaseThicknessM: 0.2,
  starterHeightM: 0.45,
  baseMainBarCount: 8,
  baseMainBarDiameterMm: 12,
  baseBarLengthM: 0.65,
  starterBarCount: 4,
  starterBarDiameterMm: 12,
  starterBarLengthM: 1.2,
  rcColumnWidthM: 0.4,
  rcColumnDepthM: 0.4,
  rcMainBarCount: 4,
  rcMainBarDiameterMm: 12,
  rcLinkDiameterMm: 8,
  rcLinkSpacingM: 0.2,
  blockPillarWidthM: 0.45,
  blockPillarDepthM: 0.45,
  blocksPerPillarCourse: 2,
  blockCourseHeightM: 0.225,
  blockPillarInfill: "none",
  blockPillarInfillVolumePerMetreHeightM3: 0.025,
  blockPillarVerticalBarCount: 0,
  blockPillarVerticalBarDiameterMm: 12,
  mortarMix: "1:6",
  mortarVolumePerBlockM3: 0.002,
  mortarVolumePerWallM2: 0.015,
  wallCopingWidthM: 0.3,
  wallCopingDepthM: 0.075,
  wallCopingBarDiameterMm: 8,
  wallCopingBarCount: 2,
  columnCapProjectionM: 0.075,
  columnCapThicknessM: 0.075,
  plasterThicknessM: 0.015,
  paintCoats: 2,
  excavationBulkingPercent: 25,
  materialWastagePercent: 5,
};

export function normalizeFenceBoqProfile(
  profile?: Partial<FenceBoqProfile> | null,
): FenceBoqProfile {
  return { ...DEFAULT_FENCE_BOQ_PROFILE, ...(profile ?? {}) };
}

type ProfiledFenceSection = FenceSection & {
  constructionSystem?: ColumnConstructionSystem;
  boqProfile?: Partial<FenceBoqProfile>;
};

export function createFenceColumnSpecifications(
  section: ProfiledFenceSection,
): ColumnSpecification[] {
  const profile = normalizeFenceBoqProfile(section.boqProfile);
  const system = section.constructionSystem ?? "reinforced-concrete";
  const ids = [
    section.regularColumnSpecificationId,
    section.cornerColumnSpecificationId,
    section.pedestrianGatePostSpecificationId,
    section.vehicleGatePostSpecificationId,
  ];
  const sizeFactors = [1, 1.125, 1, 1.25];

  return ids.map((id, index) => {
    const factor = sizeFactors[index];
    if (system === "block-pillar") {
      const specification: BlockPillarColumnSpecification = {
        id,
        name: id.replaceAll("-", " "),
        constructionSystem: "block-pillar",
        widthAlongFenceM: profile.blockPillarWidthM * factor,
        depthM: profile.blockPillarDepthM * factor,
        heightM: section.columnBodyHeightM,
        blockSpecificationId: "block-225",
        blocksPerCourse: Math.max(1, Math.ceil(profile.blocksPerPillarCourse * factor)),
        courseHeightM: profile.blockCourseHeightM,
        mortarVolumePerBlockM3: profile.mortarVolumePerBlockM3,
        concreteInfill: profile.blockPillarInfill,
        concreteInfillVolumePerMetreHeightM3:
          profile.blockPillarInfillVolumePerMetreHeightM3 * factor * factor,
        verticalBarCount: profile.blockPillarVerticalBarCount,
        verticalBarDiameterMm: profile.blockPillarVerticalBarDiameterMm,
        verticalBarExtraLengthM: profile.starterBarLengthM,
        bindingWirePercentOfReinforcementWeight: 1.5,
        blockWastagePercent: profile.materialWastagePercent,
        mortarWastagePercent: profile.materialWastagePercent,
        concreteInfillWastagePercent: profile.materialWastagePercent,
        reinforcementWastagePercent: profile.materialWastagePercent,
      };
      return specification;
    }

    const specification: ReinforcedConcreteColumnSpecification = {
      id,
      name: id.replaceAll("-", " "),
      constructionSystem: "reinforced-concrete",
      widthAlongFenceM: profile.rcColumnWidthM * factor,
      depthM: profile.rcColumnDepthM * factor,
      heightM: section.columnBodyHeightM,
      concreteMixId: profile.structuralConcreteMix,
      concreteCoverMm: 40,
      mainBarCount: profile.rcMainBarCount,
      mainBarDiameterMm: profile.rcMainBarDiameterMm,
      mainBarExtraLengthM: profile.starterBarLengthM,
      linkBarDiameterMm: profile.rcLinkDiameterMm,
      linkSpacingM: profile.rcLinkSpacingM,
      linkHookAllowanceM: 0.16,
      formedWidthFaceCount: 2,
      formedDepthFaceCount: 2,
      bindingWirePercentOfReinforcementWeight: 1.5,
      concreteWastagePercent: profile.materialWastagePercent,
      reinforcementWastagePercent: profile.materialWastagePercent,
      formworkWastagePercent: profile.materialWastagePercent,
    };
    return specification;
  });
}
