import type { BillItem } from "./models";

const codeRates: Record<string, number> = {
  CONC: 135000,
  "CONC-BLIND": 115000,
  "CONC-RC": 135000,
  "CONC-WEAK": 105000,
  "BLK-225": 15500,
  FORM: 20000,
  "REBAR-Y8": 2450,
  "REBAR-Y10": 2450,
  "REBAR-Y12": 2450,
  "REBAR-Y16": 2450,
  "REBAR-Y20": 2450,
  "REBAR-Y25": 2450,
  "PREL-MOB": 350000,
  "PREL-SET": 1500,
  "EARTH-CLEAR": 750,
  "EARTH-EXC": 7500,
  "EARTH-PIT": 8500,
  "EARTH-FILL": 5500,
  "EARTH-DISP": 9500,
  "FIN-PLASTER": 5500,
  "FIN-PAINT": 3200,
  "FEN-BLK": 15500,
  "FEN-RCC": 165000,
  "FEN-BP": 95000,
  "FEN-GRL": 65000,
  "FEN-PG": 450000,
  "FEN-VG": 1250000,
  "FEN-COP": 12500,
  "FEN-SEC": 8500,
  "FEN-FIN": 7500,
  "FEN-CAP": 45000,
};

const moduleRates: Record<string, number> = {
  concrete: 135000,
  blockwork: 15500,
  reinforcement: 2500,
  formwork: 20000,
  excavation: 7500,
  preliminaries: 1,
  finish: 5500,
  specialist: 1,
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
