export type PriceCategory = "material" | "labour" | "plant" | "subcontract";
export type PriceConfidence = "starter" | "manual" | "index-adjusted" | "verified";
export type EstimateRateSource = "default" | "analysed" | "manual";
export type PriceMarketMode = "buy" | "rent" | "buy-or-rent" | "service";

export type PriceItem = {
  id: string;
  code: string;
  description: string;
  category: PriceCategory;

  // Technical/QS unit used by rate analysis and estimating calculations.
  unit: string;
  rate: number | null;
  defaultRate?: number | null;
  currency: string;
  countryCode?: string;
  region?: string;
  location: string;
  source: string;
  sourceUrl?: string | null;
  confidence?: PriceConfidence;
  updatedAt: string;
  active: boolean;

  // Optional public-marketplace metadata. These fields deliberately remain
  // optional so existing estimator/rate-analysis IDs and calculations continue
  // to work unchanged while the public catalogue grows into a richer market feed.
  imageUrl?: string | null;
  imageAlt?: string | null;
  brand?: string | null;
  specification?: string | null;
  priceLow?: number | null;
  priceHigh?: number | null;
  sourceCount?: number | null;
  deliveryIncluded?: boolean | null;

  // Human-facing Nigerian buying units. The public marketplace should lead with
  // these (tipper, tonne, bag, 12 m length, carton, bucket, sheet, hire/day, etc.)
  // and only show `unit` as a secondary QS conversion reference.
  marketUnit?: string | null;
  marketUnitOptions?: string[];
  marketMode?: PriceMarketMode;
  marketNote?: string | null;
};

export type RateComponent = {
  id: string;
  priceItemId: string;
  description: string;
  category: PriceCategory;
  quantityPerUnit: number;
  notes?: string;
};

export type RateAssumptionDefinition = {
  id: string;
  label: string;
  unit?: string;
  help?: string;
  inputType?: "number" | "text";
  defaultValue: number | string;
  min?: number;
  max?: number;
  step?: number;
};

export type RateTemplateFormula =
  | {
      type: "concrete-ratio";
      componentIds: {
        cement: string;
        sand: string;
        aggregate: string;
        water: string;
      };
    }
  | {
      type: "component-assumptions";
      componentMappings: Record<string, string>;
    };

export type RateTemplate = {
  id: string;
  code: string;
  name: string;
  description: string;
  unit: string;
  module: string;
  category?: string;
  defaultUnitRate?: number | null;
  diagramType?: string;
  assumptions?: RateAssumptionDefinition[];
  formula?: RateTemplateFormula;
  components: RateComponent[];
};

export type AnalysedRateComponent = RateComponent & {
  priceDescription: string;
  priceUnit: string;
  unitRate: number | null;
  amount: number | null;
  missingPrice: boolean;
};

export type RateAnalysisResult = {
  templateId: string;
  name: string;
  unit: string;
  components: AnalysedRateComponent[];
  materialCost: number;
  labourCost: number;
  plantCost: number;
  subcontractCost: number;
  directCost: number;
  overheadPercent: number;
  overheadAmount: number;
  profitPercent: number;
  profitAmount: number;
  unitRate: number;
  missingPriceItemIds: string[];
};

export type EstimateLine = {
  id: string;
  templateId: string;
  description: string;
  unit: string;
  quantity: number;
  overheadPercent: number;
  profitPercent: number;
  componentQuantityOverrides: Record<string, number>;
  category?: string;
  customUnitRate?: number | null;
  customComponents?: RateComponent[];
  manualUnitRateOverride?: number | null;
  rateSource?: EstimateRateSource;
  assumptionValues?: Record<string, number | string>;
};

export type RateEstimate = {
  id: string;
  projectId?: string | null;
  priceBasisAt?: string | null;
  title: string;
  projectName: string;
  clientName: string;
  location: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  lines: EstimateLine[];
};
