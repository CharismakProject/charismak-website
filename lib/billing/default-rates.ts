import type { BillItem } from "./models";

const codeRates: Record<string, number> = {
  CONC: 135000,
  "BLK-225": 15500,
  FORM: 20000,
  "FEN-BLK": 15500,
  "FEN-RCC": 165000,
  "FEN-BP": 95000,
  "FEN-GRL": 65000,
  "FEN-PG": 450000,
  "FEN-VG": 1250000,
  "FEN-COP": 12500,
  "FEN-SEC": 8500,
  "FEN-FIN": 7500,
};

const moduleRates: Record<string, number> = {
  concrete: 135000,
  blockwork: 15500,
  reinforcement: 2500,
  formwork: 20000,
  excavation: 7500,
};

export function getStarterBillItemRate(item: BillItem): number | null {
  if (item.itemCode && codeRates[item.itemCode] !== undefined) {
    return codeRates[item.itemCode];
  }
  if (item.sourceModule && moduleRates[item.sourceModule] !== undefined) {
    return moduleRates[item.sourceModule];
  }
  return null;
}
