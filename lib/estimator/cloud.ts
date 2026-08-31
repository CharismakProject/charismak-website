import type { Bill } from "@/lib/billing/models";
import type { PriceItem, RateEstimate } from "@/lib/pricing/models";
import type { ProjectBudget } from "@/lib/projects/budget";
import type { UniversalProject } from "@/lib/projects/models";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const PROJECTS_KEY = "charismak-universal-projects-v1";
const ACTIVE_PROJECT_KEY = "charismak-active-project-v1";
const ESTIMATE_KEY = "charismak-rate-estimates-v1";
const DRAFT_KEY = "charismak-estimator-draft";
const BUDGET_KEY = "charismak-project-budgets-v1";
const PROJECTS_UPDATED_EVENT = "charismak:projects-updated";
const RATE_ESTIMATE_UPDATED_EVENT = "charismak:rate-estimate-updated";
const BILL_UPDATED_EVENT = "charismak:bill-updated";
const BUDGET_UPDATED_EVENT = "charismak:budget-updated";
const PRICE_LIBRARY_UPDATED_EVENT = "charismak:price-library-updated";

export const ESTIMATOR_CLOUD_SYNCED_EVENT = "charismak:estimator-cloud-synced";

let cloudUserId: string | null = null;

export function setEstimatorCloudUser(userId: string | null) {
  cloudUserId = userId;
}

const canUseStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

const timestamp = (value?: string | null) => {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const readJson = <T,>(key: string, fallback: T): T => {
  if (!canUseStorage()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const mergeByUpdatedAt = <T extends { id: string; updatedAt: string }>(
  local: T[],
  remote: T[],
): T[] => {
  const merged = new Map<string, T>();
  for (const item of [...local, ...remote]) {
    const existing = merged.get(item.id);
    if (!existing || timestamp(item.updatedAt) >= timestamp(existing.updatedAt)) {
      merged.set(item.id, item);
    }
  }
  return [...merged.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

const report = (label: string, error: { message?: string } | null) => {
  if (error) console.warn(`[Estimator cloud] ${label}: ${error.message ?? "unknown error"}`);
};

export function persistProjectCloud(project: UniversalProject) {
  const userId = cloudUserId;
  const client = getSupabaseBrowserClient();
  if (!userId || !client) return;
  void client
    .from("estimator_projects")
    .upsert(
      { user_id: userId, id: project.id, payload: project, updated_at: project.updatedAt },
      { onConflict: "user_id,id" },
    )
    .then(({ error }) => report("project save", error));
}

export function deleteProjectCloud(projectId: string) {
  const userId = cloudUserId;
  const client = getSupabaseBrowserClient();
  if (!userId || !client) return;
  void client
    .from("estimator_projects")
    .delete()
    .eq("user_id", userId)
    .eq("id", projectId)
    .then(({ error }) => report("project delete", error));
}

export function persistRateEstimateCloud(estimate: RateEstimate) {
  const userId = cloudUserId;
  const client = getSupabaseBrowserClient();
  if (!userId || !client) return;
  void client
    .from("estimator_rate_estimates")
    .upsert(
      {
        user_id: userId,
        id: estimate.id,
        project_id: estimate.projectId ?? null,
        price_basis_at: estimate.priceBasisAt ?? estimate.createdAt,
        payload: estimate,
        updated_at: estimate.updatedAt,
      },
      { onConflict: "user_id,id" },
    )
    .then(({ error }) => report("rate estimate save", error));
}

export function deleteRateEstimateCloud(estimateId: string) {
  const userId = cloudUserId;
  const client = getSupabaseBrowserClient();
  if (!userId || !client) return;
  void client
    .from("estimator_rate_estimates")
    .delete()
    .eq("user_id", userId)
    .eq("id", estimateId)
    .then(({ error }) => report("rate estimate delete", error));
}

export function persistBillCloud(bill: Bill) {
  const userId = cloudUserId;
  const client = getSupabaseBrowserClient();
  if (!userId || !client) return;
  void client
    .from("estimator_bills")
    .upsert(
      {
        user_id: userId,
        id: bill.id,
        project_id: bill.projectId ?? null,
        root_bill_id: bill.rootBillId,
        status: bill.status,
        version: bill.version,
        price_basis_at: bill.priceBasisAt ?? bill.createdAt,
        payload: bill,
        updated_at: bill.updatedAt,
      },
      { onConflict: "user_id,id" },
    )
    .then(({ error }) => report("bill save", error));
}

export function deleteBillCloud(billId: string) {
  const userId = cloudUserId;
  const client = getSupabaseBrowserClient();
  if (!userId || !client) return;
  void client
    .from("estimator_bills")
    .delete()
    .eq("user_id", userId)
    .eq("id", billId)
    .then(({ error }) => report("bill delete", error));
}

export function persistBudgetCloud(budget: ProjectBudget) {
  const userId = cloudUserId;
  const client = getSupabaseBrowserClient();
  if (!userId || !client) return;
  void client
    .from("estimator_project_budgets")
    .upsert(
      { user_id: userId, project_id: budget.projectId, payload: budget, updated_at: budget.updatedAt },
      { onConflict: "user_id,project_id" },
    )
    .then(({ error }) => report("budget save", error));
}

export function persistWorkspaceCloud(payload: Record<string, unknown>, updatedAt: string) {
  const userId = cloudUserId;
  const client = getSupabaseBrowserClient();
  if (!userId || !client) return;
  void client
    .from("estimator_workspace_state")
    .upsert(
      { user_id: userId, payload, updated_at: updatedAt },
      { onConflict: "user_id" },
    )
    .then(({ error }) => report("workspace save", error));
}

export async function capturePriceSnapshot(input: {
  projectId?: string | null;
  estimateId?: string | null;
  location?: string | null;
  prices: PriceItem[];
  capturedAt?: string;
}) {
  const userId = cloudUserId;
  const client = getSupabaseBrowserClient();
  if (!userId || !client) return null;
  const capturedAt = input.capturedAt ?? new Date().toISOString();
  const id = `price-snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await client.from("estimator_price_snapshots").insert({
    user_id: userId,
    id,
    project_id: input.projectId ?? null,
    estimate_id: input.estimateId ?? null,
    location: input.location ?? null,
    captured_at: capturedAt,
    payload: { prices: input.prices, capturedAt },
  });
  report("price snapshot", error);
  return error ? null : { id, capturedAt };
}

export async function syncEstimatorFromCloud(userId: string) {
  const client = getSupabaseBrowserClient();
  if (!client || !canUseStorage()) return;
  setEstimatorCloudUser(userId);

  const [projectsResult, estimatesResult, billsResult, budgetsResult, workspaceResult] = await Promise.all([
    client.from("estimator_projects").select("payload,updated_at").eq("user_id", userId),
    client.from("estimator_rate_estimates").select("payload,updated_at").eq("user_id", userId),
    client.from("estimator_bills").select("payload,updated_at").eq("user_id", userId),
    client.from("estimator_project_budgets").select("payload,updated_at").eq("user_id", userId),
    client.from("estimator_workspace_state").select("payload,updated_at").eq("user_id", userId).maybeSingle(),
  ]);

  const firstError = [projectsResult.error, estimatesResult.error, billsResult.error, budgetsResult.error, workspaceResult.error].find(Boolean);
  if (firstError) throw firstError;

  const localProjects = readJson<UniversalProject[]>(PROJECTS_KEY, []);
  const remoteProjects = (projectsResult.data ?? []).map((row) => row.payload as UniversalProject);
  const projects = mergeByUpdatedAt(localProjects, remoteProjects);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

  const localEstimatePayload = readJson<{ activeEstimateId: string | null; estimates: RateEstimate[] }>(ESTIMATE_KEY, { activeEstimateId: null, estimates: [] });
  const remoteEstimates = (estimatesResult.data ?? []).map((row) => row.payload as RateEstimate);
  const estimates = mergeByUpdatedAt(localEstimatePayload.estimates ?? [], remoteEstimates);
  const activeEstimateId = estimates.some((item) => item.id === localEstimatePayload.activeEstimateId)
    ? localEstimatePayload.activeEstimateId
    : estimates[0]?.id ?? null;
  localStorage.setItem(ESTIMATE_KEY, JSON.stringify({ activeEstimateId, estimates }));

  const draft = readJson<Record<string, unknown>>(DRAFT_KEY, {});
  const localBills = Array.isArray(draft.bills) ? (draft.bills as Bill[]) : draft.bill ? [draft.bill as Bill] : [];
  const remoteBills = (billsResult.data ?? []).map((row) => row.payload as Bill);
  const bills = mergeByUpdatedAt(localBills, remoteBills);
  const currentActiveBillId = typeof draft.activeBillId === "string" ? draft.activeBillId : null;
  const activeBillId = bills.some((item) => item.id === currentActiveBillId)
    ? currentActiveBillId
    : bills[0]?.id ?? null;

  const remoteWorkspace = workspaceResult.data?.payload as Record<string, unknown> | undefined;
  const remoteWorkspaceUpdatedAt = workspaceResult.data?.updated_at ?? null;
  const localWorkspaceUpdatedAt = typeof draft.workspaceUpdatedAt === "string" ? draft.workspaceUpdatedAt : null;
  const useRemoteWorkspace = remoteWorkspace && timestamp(remoteWorkspaceUpdatedAt) > timestamp(localWorkspaceUpdatedAt);
  const workspace = useRemoteWorkspace ? remoteWorkspace : {
    projectInfo: draft.projectInfo,
    sections: draft.sections,
    activeStage: draft.activeStage,
    estimateBillId: draft.estimateBillId,
  };
  const workspaceUpdatedAt = useRemoteWorkspace ? remoteWorkspaceUpdatedAt : localWorkspaceUpdatedAt ?? new Date().toISOString();

  const activeBill = bills.find((item) => item.id === activeBillId) ?? null;
  localStorage.setItem(DRAFT_KEY, JSON.stringify({
    ...draft,
    ...workspace,
    workspaceUpdatedAt,
    bills,
    activeBillId,
    bill: activeBill,
  }));

  const localBudgets = readJson<ProjectBudget[]>(BUDGET_KEY, []);
  const remoteBudgets = (budgetsResult.data ?? []).map((row) => row.payload as ProjectBudget);
  const budgetMap = new Map<string, ProjectBudget>();
  for (const item of [...localBudgets, ...remoteBudgets]) {
    const existing = budgetMap.get(item.projectId);
    if (!existing || timestamp(item.updatedAt) >= timestamp(existing.updatedAt)) budgetMap.set(item.projectId, item);
  }
  const budgets = [...budgetMap.values()];
  localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets));

  await Promise.all([
    projects.length ? client.from("estimator_projects").upsert(projects.map((project) => ({ user_id: userId, id: project.id, payload: project, updated_at: project.updatedAt })), { onConflict: "user_id,id" }) : Promise.resolve({ error: null }),
    estimates.length ? client.from("estimator_rate_estimates").upsert(estimates.map((estimate) => ({ user_id: userId, id: estimate.id, project_id: estimate.projectId ?? null, price_basis_at: estimate.priceBasisAt ?? estimate.createdAt, payload: estimate, updated_at: estimate.updatedAt })), { onConflict: "user_id,id" }) : Promise.resolve({ error: null }),
    bills.length ? client.from("estimator_bills").upsert(bills.map((bill) => ({ user_id: userId, id: bill.id, project_id: bill.projectId ?? null, root_bill_id: bill.rootBillId, status: bill.status, version: bill.version, price_basis_at: bill.priceBasisAt ?? bill.createdAt, payload: bill, updated_at: bill.updatedAt })), { onConflict: "user_id,id" }) : Promise.resolve({ error: null }),
    budgets.length ? client.from("estimator_project_budgets").upsert(budgets.map((budget) => ({ user_id: userId, project_id: budget.projectId, payload: budget, updated_at: budget.updatedAt })), { onConflict: "user_id,project_id" }) : Promise.resolve({ error: null }),
    client.from("estimator_workspace_state").upsert({ user_id: userId, payload: workspace, updated_at: workspaceUpdatedAt }, { onConflict: "user_id" }),
  ]);

  if (!localStorage.getItem(ACTIVE_PROJECT_KEY) && projects[0]?.id) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, projects[0].id);
  }

  window.dispatchEvent(new CustomEvent(PROJECTS_UPDATED_EVENT));
  window.dispatchEvent(new CustomEvent(RATE_ESTIMATE_UPDATED_EVENT));
  window.dispatchEvent(new CustomEvent(BILL_UPDATED_EVENT));
  window.dispatchEvent(new CustomEvent(BUDGET_UPDATED_EVENT));
  window.dispatchEvent(new CustomEvent(PRICE_LIBRARY_UPDATED_EVENT));
  window.dispatchEvent(new CustomEvent(ESTIMATOR_CLOUD_SYNCED_EVENT));
}
