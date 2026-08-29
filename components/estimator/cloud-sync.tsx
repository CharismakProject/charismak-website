"use client";

import { useEffect } from "react";

import { BILL_UPDATED_EVENT, loadBill } from "@/lib/billing/store";
import {
  ESTIMATOR_CLOUD_SYNCED_EVENT,
  persistBillCloud,
  persistBudgetCloud,
  setEstimatorCloudUser,
  syncEstimatorFromCloud,
} from "@/lib/estimator/cloud";
import { BUDGET_UPDATED_EVENT, loadProjectBudget } from "@/lib/projects/budget";
import { loadActiveProject } from "@/lib/projects/store";

export default function EstimatorCloudSync({ userId }: { userId: string | null }) {
  useEffect(() => {
    setEstimatorCloudUser(userId);
    if (!userId) return;

    let cancelled = false;

    void syncEstimatorFromCloud(userId).catch((error) => {
      if (!cancelled) {
        console.warn(
          "[Estimator cloud] initial sync failed:",
          error instanceof Error ? error.message : error,
        );
      }
    });

    const syncBill = () => {
      const bill = loadBill();
      if (bill) persistBillCloud(bill);
    };

    const syncBudget = () => {
      const project = loadActiveProject();
      if (!project) return;
      const budget = loadProjectBudget(project.id);
      if (budget) persistBudgetCloud(budget);
    };

    window.addEventListener(BILL_UPDATED_EVENT, syncBill);
    window.addEventListener(BUDGET_UPDATED_EVENT, syncBudget);

    return () => {
      cancelled = true;
      window.removeEventListener(BILL_UPDATED_EVENT, syncBill);
      window.removeEventListener(BUDGET_UPDATED_EVENT, syncBudget);
      setEstimatorCloudUser(null);
    };
  }, [userId]);

  return <span className="hidden" data-estimator-cloud-sync={userId ? "active" : "inactive"} />;
}

export { ESTIMATOR_CLOUD_SYNCED_EVENT };
