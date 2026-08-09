"use client";

import { useEffect, useMemo, useState } from "react";

import type { Bill } from "@/lib/billing/models";
import {
  BILL_UPDATED_EVENT,
  createBillRevision,
  createNewBill,
  deleteDraftBill,
  loadBills,
  selectBill,
} from "@/lib/billing/store";
import ShellButton from "../estimator/ui/button";

const money = (value: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const itemCount = (bill: Bill) =>
  bill.sections.reduce((total, section) => total + section.items.length, 0);

export default function EstimatesArchive({
  onOpenBill,
  onStartFence,
}: {
  onOpenBill: () => void;
  onStartFence: () => void;
}) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setBills(loadBills());
    refresh();
    window.addEventListener(BILL_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BILL_UPDATED_EVENT, refresh);
  }, []);

  const completedCount = useMemo(
    () => bills.filter((bill) => bill.status === "completed").length,
    [bills],
  );

  const openBill = (bill: Bill) => {
    selectBill(bill.id);
    onOpenBill();
  };

  const startBlankBill = () => {
    createNewBill({ title: "New Bill of Quantities" });
    onOpenBill();
  };

  const reviseBill = (bill: Bill) => {
    try {
      const revision = createBillRevision(bill.id);
      setMessage(
        `Version ${revision.version} created. The completed Version ${bill.version} remains unchanged.`,
      );
      onOpenBill();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create revision.");
    }
  };

  const removeDraft = (bill: Bill) => {
    if (!window.confirm(`Delete the draft “${bill.title}”?`)) return;
    try {
      deleteDraftBill(bill.id);
      setBills(loadBills());
      setMessage("Draft deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete draft.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] bg-[#071E33] p-6 text-white shadow-[0_24px_70px_rgba(7,30,51,0.18)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#E7B34B]">
              Estimate register
            </p>
            <h2 className="mt-3 text-3xl font-bold">Saved bills and revisions</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">
              Drafts remain editable. Completed bills are locked permanently, while revisions preserve the original issue and open a new editable version.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ShellButton onClick={startBlankBill}>New Blank Bill</ShellButton>
            <button
              type="button"
              onClick={onStartFence}
              className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              New Fence Estimate
            </button>
          </div>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4"><span className="text-xs text-white/60">All versions</span><strong className="mt-1 block text-2xl">{bills.length}</strong></div>
          <div className="rounded-2xl bg-white/10 p-4"><span className="text-xs text-white/60">Editable drafts</span><strong className="mt-1 block text-2xl">{bills.length - completedCount}</strong></div>
          <div className="rounded-2xl bg-[#C8320A] p-4"><span className="text-xs text-white/70">Completed</span><strong className="mt-1 block text-2xl">{completedCount}</strong></div>
        </div>
        {message ? <p className="mt-4 text-sm text-[#FFE3A3]">{message}</p> : null}
      </section>

      {bills.length === 0 ? (
        <section className="rounded-[30px] border border-dashed border-[#B8C7D6] bg-white p-10 text-center">
          <h3 className="text-2xl font-bold text-[#071E33]">No saved bills yet</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#526579]">
            Start a calculator or fence estimate, then add the result to a bill. It will appear here automatically.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {bills.map((bill) => {
            const completed = bill.status === "completed";
            return (
              <article
                key={bill.id}
                className="rounded-[28px] border border-[#d6dfe9] bg-white p-6 shadow-[0_12px_34px_rgba(7,30,51,0.06)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${completed ? "bg-[#EAF1F7] text-[#0D3B66]" : "bg-[#FFF0E9] text-[#C8320A]"}`}>
                        {completed ? "Completed" : "Editable draft"}
                      </span>
                      <span className="rounded-full bg-[#F4F7FA] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#526579]">
                        Version {bill.version}
                      </span>
                    </div>
                    <h3 className="mt-4 truncate text-xl font-bold text-[#071E33]">{bill.title}</h3>
                    <p className="mt-1 text-sm text-[#526579]">{bill.projectName || "Project not named"}{bill.clientName ? ` · ${bill.clientName}` : ""}</p>
                  </div>
                  <strong className="shrink-0 text-right text-sm text-[#0D3B66]">{money(bill.totals?.grandTotal ?? 0, bill.currency)}</strong>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-[#F4F7FA] p-3"><dt className="text-xs text-[#526579]">Items</dt><dd className="mt-1 font-bold">{itemCount(bill)}</dd></div>
                  <div className="rounded-2xl bg-[#F4F7FA] p-3"><dt className="text-xs text-[#526579]">Materials</dt><dd className="mt-1 font-bold">{bill.materials.length}</dd></div>
                  <div className="rounded-2xl bg-[#F4F7FA] p-3"><dt className="text-xs text-[#526579]">Updated</dt><dd className="mt-1 text-xs font-semibold">{formatDate(bill.updatedAt)}</dd></div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#DFE6EE] pt-5">
                  <button
                    type="button"
                    onClick={() => openBill(bill)}
                    className="rounded-full bg-[#0D3B66] px-4 py-2 text-sm font-bold text-white"
                  >
                    {completed ? "View Completed Bill" : "Open & Edit"}
                  </button>
                  {completed ? (
                    <button
                      type="button"
                      onClick={() => reviseBill(bill)}
                      className="rounded-full border border-[#C8320A] px-4 py-2 text-sm font-bold text-[#C8320A]"
                    >
                      Create Revision
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeDraft(bill)}
                      className="rounded-full px-4 py-2 text-sm font-semibold text-[#C8320A]"
                    >
                      Delete Draft
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
