import type {
  RateComponent,
  RateTemplate,
} from "./models";

export function getDefaultAssumptionValues(
  template: RateTemplate,
): Record<string, number | string> {
  return Object.fromEntries(
    (template.assumptions ?? []).map((assumption) => [
      assumption.id,
      assumption.defaultValue,
    ]),
  );
}

const finiteNumber = (
  values: Record<string, number | string>,
  id: string,
  fallback: number,
) => {
  const value = Number(values[id] ?? fallback);
  return Number.isFinite(value) ? Math.max(0, value) : fallback;
};

export function resolveTemplateComponents(
  template: RateTemplate,
  values: Record<string, number | string> = {},
): RateComponent[] {
  if (template.formula?.type === "component-assumptions") {
    const assumptions = {
      ...getDefaultAssumptionValues(template),
      ...values,
    };
    const componentValues = new Map(
      Object.entries(template.formula.componentMappings).map(
        ([assumptionId, componentId]) => [
          componentId,
          finiteNumber(assumptions, assumptionId, 0),
        ],
      ),
    );
    return template.components.map((component) => ({
      ...component,
      quantityPerUnit:
        componentValues.get(component.id) ?? component.quantityPerUnit,
    }));
  }

  if (template.formula?.type !== "concrete-ratio") {
    return template.components.map((component) => ({ ...component }));
  }

  const assumptions = {
    ...getDefaultAssumptionValues(template),
    ...values,
  };
  const cementRatio = finiteNumber(assumptions, "cementRatio", 1);
  const sandRatio = finiteNumber(assumptions, "sandRatio", 2);
  const aggregateRatio = finiteNumber(assumptions, "aggregateRatio", 4);
  const ratioTotal = cementRatio + sandRatio + aggregateRatio;
  const dryVolumeFactor = finiteNumber(assumptions, "dryVolumeFactor", 1.54);
  const cementBagVolumeM3 = finiteNumber(
    assumptions,
    "cementBagVolumeM3",
    0.0347,
  );
  const wastageFactor =
    1 + finiteNumber(assumptions, "materialWastagePercent", 5) / 100;
  const waterLitresPerM3 = finiteNumber(
    assumptions,
    "waterLitresPerM3",
    166.43,
  );

  if (ratioTotal <= 0 || cementBagVolumeM3 <= 0) {
    return template.components.map((component) => ({ ...component }));
  }

  const quantities = new Map<string, number>([
    [
      template.formula.componentIds.cement,
      (dryVolumeFactor * cementRatio * wastageFactor)
        / ratioTotal
        / cementBagVolumeM3,
    ],
    [
      template.formula.componentIds.sand,
      (dryVolumeFactor * sandRatio * wastageFactor) / ratioTotal,
    ],
    [
      template.formula.componentIds.aggregate,
      (dryVolumeFactor * aggregateRatio * wastageFactor) / ratioTotal,
    ],
    [template.formula.componentIds.water, waterLitresPerM3],
  ]);

  return template.components.map((component) => ({
    ...component,
    quantityPerUnit: quantities.get(component.id) ?? component.quantityPerUnit,
  }));
}

export function describeTemplateAssumption(
  template: RateTemplate,
  values: Record<string, number | string> = {},
): string {
  const merged = { ...getDefaultAssumptionValues(template), ...values };
  if (template.formula?.type === "concrete-ratio") {
    return `Mix ${merged.cementRatio}:${merged.sandRatio}:${merged.aggregateRatio}; dry-volume factor ${merged.dryVolumeFactor}; material wastage ${merged.materialWastagePercent}%; water ${merged.waterLitresPerM3} L/m³.`;
  }
  return (template.assumptions ?? [])
    .map((item) => `${item.label}: ${merged[item.id]}${item.unit ? ` ${item.unit}` : ""}`)
    .join("; ");
}
