export type BudgetSection = {
  id: string;
  label: string;
  budget: number;
};

export type BudgetTransaction = {
  id: string;
  type: "fund" | "expense";
  amount: number;
  date: string;
  sectionId?: string | null;
  payee?: string | null;
  description: string;
  evidenceName?: string | null;
};

export type ProjectBudget = {
  projectId: string;
  estimatedTotal: number;
  sections: BudgetSection[];
  transactions: BudgetTransaction[];
  expectedFunding: Array<{ id: string; amount: number; expectedDate: string; note: string }>;
  updatedAt: string;
};

const KEY = "charismak-project-budgets-v1";
export const BUDGET_UPDATED_EVENT = "charismak:budget-updated";

const canUseStorage = () => typeof localStorage !== "undefined";

const loadAll = (): ProjectBudget[] => {
  if (!canUseStorage()) return [];
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const saveAll = (budgets: ProjectBudget[]) => {
  if (!canUseStorage()) return;
  localStorage.setItem(KEY, JSON.stringify(budgets));
  window.dispatchEvent(new CustomEvent(BUDGET_UPDATED_EVENT));
};

export function loadProjectBudget(projectId: string): ProjectBudget | null {
  return loadAll().find((budget) => budget.projectId === projectId) ?? null;
}

export function saveProjectBudget(budget: ProjectBudget): ProjectBudget {
  const next = { ...budget, updatedAt: new Date().toISOString() };
  const budgets = loadAll();
  const index = budgets.findIndex((candidate) => candidate.projectId === next.projectId);
  if (index >= 0) budgets[index] = next;
  else budgets.push(next);
  saveAll(budgets);
  return next;
}

export function createProjectBudget(
  projectId: string,
  estimatedTotal: number,
  sections: BudgetSection[],
): ProjectBudget {
  const existing = loadProjectBudget(projectId);
  return saveProjectBudget({
    projectId,
    estimatedTotal,
    sections,
    transactions: existing?.transactions ?? [],
    expectedFunding: existing?.expectedFunding ?? [],
    updatedAt: new Date().toISOString(),
  });
}

export function makeBudgetId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
