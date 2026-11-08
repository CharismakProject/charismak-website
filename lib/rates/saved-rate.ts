import type { RateBankItem, RateCostLine } from "./defaults";

/**
 * A visitor's edited copy of a Rate Bank item, kept on their own device
 * (browser storage). It is never sent to Charismak or shown to anyone else.
 */
export type SavedRate = {
  version: 1;
  savedAt: string;
  workQuantity: number;
  allowances: RateBankItem["allowances"];
  lines: Array<Pick<RateCostLine, "id" | "quantity" | "unitRate">>;
};

const keyFor = (slug: string) => `charismak-rate-copy-v1:${slug}`;
const finite = (value: unknown, fallback: number) => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback);

export function loadSavedRate(slug: string): SavedRate | null {
  try {
    const raw = window.localStorage.getItem(keyFor(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedRate;
    return parsed?.version === 1 && Array.isArray(parsed.lines) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveRate(slug: string, rate: Omit<SavedRate, "version" | "savedAt">): SavedRate | null {
  const saved: SavedRate = { version: 1, savedAt: new Date().toISOString(), ...rate };
  try {
    window.localStorage.setItem(keyFor(slug), JSON.stringify(saved));
    return saved;
  } catch {
    return null;
  }
}

export function clearSavedRate(slug: string) {
  try {
    window.localStorage.removeItem(keyFor(slug));
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

/**
 * Re-apply a saved copy to the current public rate. Lines are matched by id:
 * lines Charismak has since added keep their public values, removed lines are
 * dropped, and invalid saved numbers fall back to the public figure.
 */
export function applySavedRate(item: RateBankItem, saved: SavedRate) {
  const byId = new Map(saved.lines.map((line) => [line.id, line]));
  const lines = item.lines.map((line) => {
    const mine = byId.get(line.id);
    return mine ? { ...line, quantity: finite(mine.quantity, line.quantity), unitRate: finite(mine.unitRate, line.unitRate) } : { ...line };
  });
  const allowances = { ...item.allowances };
  for (const key of Object.keys(allowances) as Array<keyof typeof allowances>) {
    allowances[key] = finite(saved.allowances?.[key], allowances[key]);
  }
  const workQuantity = finite(saved.workQuantity, 1) || 1;
  const missing = saved.lines.filter((line) => !item.lines.some((current) => current.id === line.id)).length;
  const added = item.lines.filter((line) => !byId.has(line.id)).length;
  return { lines, allowances, workQuantity, changedSinceSave: missing > 0 || added > 0 };
}
