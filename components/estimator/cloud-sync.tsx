"use client";

import { type ReactNode, useEffect, useState } from "react";

import { useBetaSession } from "@/components/auth/beta-session";
import { BILL_UPDATED_EVENT, loadBill } from "@/lib/billing/store";
import {
  persistBillCloud,
  persistBudgetCloud,
  setEstimatorCloudUser,
  syncEstimatorFromCloud,
} from "@/lib/estimator/cloud";
import { BUDGET_UPDATED_EVENT, loadProjectBudget } from "@/lib/projects/budget";
import { loadActiveProject } from "@/lib/projects/store";

export default function EstimatorCloudGate({ children }: { children: ReactNode }) {
  const session = useBetaSession();
  const userId = session.user?.id ?? null;
  const [ready, setReady] = useState(!userId);

  useEffect(() => {
    setEstimatorCloudUser(userId);
    if (!userId) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

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

    void syncEstimatorFromCloud(userId)
      .catch((error) => {
        if (!cancelled) {
          console.warn(
            "[Estimator cloud] initial sync failed; continuing with local cache:",
            error instanceof Error ? error.message : error,
          );
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
      window.removeEventListener(BILL_UPDATED_EVENT, syncBill);
      window.removeEventListener(BUDGET_UPDATED_EVENT, syncBudget);
      setEstimatorCloudUser(null);
    };
  }, [userId]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#071E33] p-6 text-white">
        <div className="text-center">
          <p className="text-sm font-bold">Syncing your estimator workspace…</p>
          <p className="mt-2 text-xs text-white/60">Projects on this device are being reconciled with your account.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
