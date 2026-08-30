export type Currency = string;

export type BillRateMode = "breakdown" | "all-in";

export type BillStatus = "draft" | "completed";
export type BillItemRateSource = "default" | "analysed" | "manual";

export type BillAdjustment = {
  contingencyPercent: number;
  overheadPercent: number;
  profitPercent: number;
  discountPercent: number;
  vatPercent: number;
};

export type BillItem = {
  id: string;
  sourceCalculationId?: string | null;
  sourceModule?: string | null;
  itemCode?: string | null;
  description: string;
  unit: string;
  calculatedQuantity: number;
  billQuantity: number;
  materialRate?: number | null;
  labourRate?: number | null;
  plantRate?: number | null;
  otherRate?: number | null;
  allInRate?: number | null;
  rateSource?: BillItemRateSource;
  defaultRate?: number | null;
  analysedRate?: number | null;
  manualRate?: number | null;
  amount?: number | null;
  notes?: string | null;
  assumptionReferences?: string[];
};

export type ProcurementItem = {
  id: string;
  materialId?: string | null;
  sourceCalculationId: string;
  sourceModule: string;
  description: string;
  unit: string;
  calculatedQuantity: number;
  wastagePercent: number;
  purchaseQuantity: number;
  bulkPurchase?: {
    densityTonnesPerM3: number;
    truckCapacity: number;
    truckCapacityBasis: "tonnes" | "cubic-metres";
  } | null;
  notes?: string | null;
};

export type BillExportOptions = {
  includeMaterialsSchedule: boolean;
  includeAssumptions: boolean;
};

export type BillAssumption = {
  id: string;
  label: string;
  value: string;
};

export type BillSection = {
  id: string;
  code?: string | null;
  title: string;
  items: BillItem[];
  subtotal?: number;
};

export type Bill = {
  id: string;
  projectId?: string | null;
  priceBasisAt?: string | null;
  billNumber?: string | null;
  status: BillStatus;
  version: number;
  rootBillId: string;
  parentBillId?: string | null;
  title: string;
  projectName?: string | null;
  clientName?: string | null;
  location?: string | null;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  sourceModules?: string[];
  rateMode: BillRateMode;
  sections: BillSection[];
  materials: ProcurementItem[];
  assumptions: BillAssumption[];
  exportOptions?: BillExportOptions;
  adjustments: BillAdjustment;
  totals?: {
    directCost: number;
    subTotal: number;
    contingency: number;
    overhead: number;
    profit: number;
    discount: number;
    subTotalBeforeTax: number;
    vat: number;
    grandTotal: number;
  };
};
