"use client";

import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    if (!open) return;
    setBill(loadBill());
    const sync = () => setBill(loadBill());
    window.addEventListener(BILL_UPDATED_EVENT, sync);
    return () => window.removeEventListener(BILL_UPDATED_EVENT, sync);
  }, [open]);

  const items = useMemo(
    () => bill?.sections.flatMap((section) => section.items) ?? [],
    [bill],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#071E33]/45 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Current bill">
      <button type="button" aria-label="Close bill" className="flex-1" onClick={onClose} />
      <aside className="flex h-full w-full max-w-[460px] flex-col bg-[#F4F7FA] shadow-2xl">
        <header className="bg-[#071E33] p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E7B34B]">Current bill</p><h2 className="mt-2 text-2xl font-bold">{bill?.title ?? "No bill yet"}</h2>{bill ? <p className="mt-2 text-xs text-white/60">Version {bill.version} · {bill.status === "completed" ? "Completed / locked" : "Editable draft"}</p> : null}</div>
            <button type="button" onClick={onClose} className="rounded-full border border-white/25 px-3 py-2 text-sm">Close</button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl bg-white/10 p-3"><span className="text-white/55">Items</span><strong className="mt-1 block text-xl">{items.length}</strong></div>
            <div className="rounded-2xl bg-white/10 p-3"><span className="text-white/55">Materials</span><strong className="mt-1 block text-xl">{bill?.materials.length ?? 0}</strong></div>
            <div className="rounded-2xl bg-[#C8320A] p-3"><span className="text-white/70">Total</span><strong className="mt-1 block text-sm">{money(bill?.totals?.grandTotal ?? 0, bill?.currency)}</strong></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="rounded-[26px] border border-dashed border-[#B8C7D6] bg-white p-6 text-center"><p className="font-bold text-[#071E33]">No bill items yet</p><p className="mt-2 text-sm leading-6 text-[#526579]">Run a calculator and choose Add to Bill.</p></div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <article key={item.id} className="rounded-[22px] border border-[#d6dfe9] bg-white p-4">
                  <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF1F7] text-xs font-bold text-[#0D3B66]">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-5 text-[#071E33]">{item.description}</p><p className="mt-2 text-xs text-[#526579]">{item.billQuantity} {item.unit} × {isBillItemPriced(item) ? money(getBillItemRate(item), bill?.currency) : "Unpriced"}</p></div></div>
                </article>
              ))}
            </div>
          )}
        </div>

        <footer className="border-t border-[#d6dfe9] bg-white p-5">
          <button type="button" onClick={() => { onOpenBill(); onClose(); }} className="w-full rounded-full bg-[#C8320A] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(200,50,10,0.22)]">Open BOQ workspace</button>
        </footer>
      </aside>
    </div>
  );
}
