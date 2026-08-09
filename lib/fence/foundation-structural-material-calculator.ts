import { calculateReinforcement } from "./reinforcement-calculator";
import { calculateFormwork } from "./formwork-calculator";

import type {
  FenceFoundationStructuralMaterialInput,
  FenceFoundationStructuralMaterialResult,
} from "./types";

const roundQuantity = (value: number): number =>
  Number(value.toFixed(6));

export function calculateFenceFoundationStructuralMaterials(
  input: FenceFoundationStructuralMaterialInput
): FenceFoundationStructuralMaterialResult {
  const reinforcementIds = new Set<string>();

  const reinforcementItems =
    input.reinforcementItems.map((item) => {
      if (
        reinforcementIds.has(
          item.calculation.id
        )
      ) {
        throw new Error(
          `Foundation reinforcement ID "${item.calculation.id}" is duplicated.`
        );
      }

      reinforcementIds.add(
        item.calculation.id
      );

      return {
        component: item.component,
        calculation: calculateReinforcement(
          item.calculation
        ),
      };
    });

  const formworkIds = new Set<string>();

  const formworkItems =
    input.formworkItems.map((item) => {
      if (
        formworkIds.has(item.calculation.id)
      ) {
        throw new Error(
          `Foundation formwork ID "${item.calculation.id}" is duplicated.`
        );
      }

      formworkIds.add(item.calculation.id);

      return {
        component: item.component,
        calculation: calculateFormwork(
          item.calculation
        ),
      };
    });

  const totalReinforcementWeightKg =
    reinforcementItems.reduce(
      (total, item) =>
        total +
        item.calculation.totalWeightKg,
      0
    );

  const totalBindingWireWeightKg =
    reinforcementItems.reduce(
      (total, item) =>
        total +
        item.calculation
          .bindingWireWeightKg,
      0
    );

  const totalFormworkAreaM2 =
    formworkItems.reduce(
      (total, item) =>
        total +
        item.calculation
          .finalFormworkAreaM2,
      0
    );

  return {
    sectionId: input.sectionId,

    reinforcementItems,
    formworkItems,

    totalReinforcementWeightKg:
      roundQuantity(
        totalReinforcementWeightKg
      ),

    totalBindingWireWeightKg:
      roundQuantity(
        totalBindingWireWeightKg
      ),

    totalFormworkAreaM2: roundQuantity(
      totalFormworkAreaM2
    ),
  };
}