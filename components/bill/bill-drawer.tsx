"use client";

import { useEffect, useMemo, useState } from "react";

import {
  buildAccountingBillTransfer,
  type AccountingBillTransfer,
} from "@/lib/billing/accounting-export";
import type { Bill } from "@/lib/billing/models";
import {
  BILL_UPDATED_EVENT,
  getBillItemRate,
  isBillItemPriced,
  loadBill,
} from "@/lib/billing/store";

const money = (value: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0);

const safeFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "charismak-estimate";

export default function BillDrawer({
  open,
  onClose,
  onOpenBill,
}: {
  open: boolean;
  onClose: () => void;
  onOpenBill: () => void;
}) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [accountingTransfer, setAccountingTransfer] =
    useState<AccountingBillTransfer | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBill(loadBill());
    setAccountingTransfer(null);
    setHandoffError(null);
    const sync = () => {
      setBill(loadBill());
      setAccountingTransfer(null);
      setHandoffError(null);
    };
    window.addEventListener(BILL_UPDATED_EVENT, sync);
    return () => window.removeEventListener(BILL_UPDATED_EVENT, sync);
  }, [open]);

  const items = useMemo(
    () => bill?.sections.flatMap((section) => section.items) ?? [],
    [bill],
  );

  const prepareAccountingHandoff = () => {
    if (!bill) return;
    try {
      setAccountingTransfer(buildAccountingBillTransfer(bill));
      setHandoffError(null);
    } catch (error) {
      setAccountingTransfer(null);
      setHandoffError(
        error instanceof Error
          ? error.message
          : "This BOQ is not ready for Accounting review.",
      );
    }
  };

  const downloadAccountingHandoff = () => {
    if (!accountingTransfer) return;
    const blob = new Blob([JSON.stringify(accountingTransfer, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(accountingTransfer.projectName)}-accounting-handoff-v${accountingTransfer.version}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#071E33]/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Current bill"
    >
      <button
        type="button"
        aria-label="Close bill"
        className="flex-1"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-[460px] flex-col bg-[#F4F7FA] shadow-2xl">
        <header className="bg-[#071E33] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E7B34B]">
                Current bill
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {bill?.title ?? "No bill yet"}
              </h2>
              {bill ? (
                <p className="mt-2 text-xs text-white/60">
                  Version {bill.version} ·{" "}
                  {bill.status === "completed"
                    ? "Completed / locked"
                    : "Editable draft"}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/25 px-3 py-2 text-sm"
            >
              Close
            </button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-3">
              <span className="text-white/55">Items</span>
              <strong className="mt-1 block text-xl">{items.length}</strong>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <span className="text-white/55">Materials</span>
              <strong className="mt-1 block text-xl">
                {bill?.materials.length ?? 0}
              </strong>
            </div>
            <div className="rounded-2xl bg-[#C8320A] p-3">
              <span className="text-white/70">Total</span>
              <strong className="mt-1 block text-sm">
                {money(bill?.totals?.grandTotal ?? 0, bill?.currency)}
              </strong>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-[#B8C7D6] bg-white p-6 text-center">
              <p className="font-bold text-[#071E33]">No bill items yet</p>
              <p className="mt-2 text-sm leading-6 text-[#526579]">
                Run a calculator and choose Add to Bill.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-[22px] border border-[#d6dfe9] bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF1F7] text-xs font-bold text-[#0D3B66]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-5 text-[#071E33]">
                        {item.description}
                      </p>
                      <p className="mt-2 text-xs text-[#526579]">
                        {item.billQuantity} {item.unit} ×{" "}
                        {isBillItemPriced(item)
                          ? money(getBillItemRate(item), bill?.currency)
                          : "Unpriced"}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {bill?.status === "completed" && items.length > 0 ? (
            <section className="mt-5 rounded-[24px] border border-[#B9CCE0] bg-[#F7FBFF] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#175FC4]">
                    Accounting hand-off
                  </p>
                  <h3 className="mt-1 text-base font-bold text-[#071E33]">
                    Ready for Accounting review
                  </h3>
                </div>
                <span className="rounded-full bg-[#E7F7EE] px-2.5 py-1 text-[10px] font-bold text-[#16784A]">
                  Completed BOQ
                </span>
              </div>

              {!accountingTransfer ? (
                <>
                  <p className="mt-3 text-xs leading-5 text-[#526579]">
                    Prepare the locked BOQ for Charismak Construction Accounting.
                    Nothing is posted automatically; internal budget, contract value
                    and cost codes still require Accounting review.
                  </p>
                  {handoffError ? (
                    <p className="mt-3 rounded-xl bg-[#FFF0EB] px-3 py-2 text-xs font-semibold text-[#A63212]">
                      {handoffError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={prepareAccountingHandoff}
                    className="mt-4 w-full rounded-full bg-[#175FC4] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#104D9F]"
                  >
                    Prepare for Accounting
                  </button>
                </>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-white p-3">
                      <span className="text-[#6B7D90]">Direct cost</span>
                      <strong className="mt-1 block text-[#071E33]">
                        {money(
                          accountingTransfer.totals.directCost,
                          accountingTransfer.currency,
                        )}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <span className="text-[#6B7D90]">Contingency</span>
                      <strong className="mt-1 block text-[#071E33]">
                        {money(
                          accountingTransfer.totals.contingency,
                          accountingTransfer.currency,
                        )}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <span className="text-[#6B7D90]">Overhead + profit</span>
                      <strong className="mt-1 block text-[#071E33]">
                        {money(
                          accountingTransfer.totals.overhead +
                            accountingTransfer.totals.profit,
                          accountingTransfer.currency,
                        )}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <span className="text-[#6B7D90]">VAT</span>
                      <strong className="mt-1 block text-[#071E33]">
                        {money(
                          accountingTransfer.totals.vat,
                          accountingTransfer.currency,
                        )}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-2 rounded-xl bg-[#071E33] p-3 text-white">
                    <span className="text-xs text-white/65">BOQ grand total</span>
                    <strong className="mt-1 block text-base">
                      {money(
                        accountingTransfer.totals.grandTotal,
                        accountingTransfer.currency,
                      )}
                    </strong>
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-[#526579]">
                    These amounts stay separate. Accounting decides the approved
                    internal budget and commercial contract value after review.
                  </p>
                  <button
                    type="button"
                    onClick={downloadAccountingHandoff}
                    className="mt-4 w-full rounded-full bg-[#175FC4] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#104D9F]"
                  >
                    Export Accounting hand-off
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountingTransfer(null)}
                    className="mt-2 w-full rounded-full border border-[#B9CCE0] bg-white px-4 py-2.5 text-xs font-bold text-[#31516F]"
                  >
                    Close review
                  </button>
                </>
              )}
            </section>
          ) : null}
        </div>

        <footer className="border-t border-[#d6dfe9] bg-white p-5">
          <button
            type="button"
            onClick={() => {
              onOpenBill();
              onClose();
            }}
            className="w-full rounded-full bg-[#C8320A] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(200,50,10,0.22)]"
          >
            Open BOQ workspace
          </button>
        </footer>
      </aside>
    </div>
  );
}
