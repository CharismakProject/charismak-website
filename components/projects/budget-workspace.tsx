"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, CircleDollarSign, Plus, ReceiptText, WalletCards } from "lucide-react";

import {
  BUDGET_UPDATED_EVENT,
  loadProjectBudget,
  makeBudgetId,
  saveProjectBudget,
  type ProjectBudget,
} from "@/lib/projects/budget";
import type { UniversalProject } from "@/lib/projects/models";

const money = (value: number, currency = "NGN") => new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value || 0);

export default function BudgetWorkspace({ project, onBack }: { project: UniversalProject; onBack: () => void }) {
  const [budget, setBudget] = useState<ProjectBudget | null>(null);
  const [type, setType] = useState<"fund" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [payee, setPayee] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [futureAmount, setFutureAmount] = useState("");
  const [futureDate, setFutureDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setBudget(loadProjectBudget(project.id));
    refresh();
    window.addEventListener(BUDGET_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BUDGET_UPDATED_EVENT, refresh);
  }, [project.id]);

  const totals = useMemo(() => {
    const funds = budget?.transactions.filter((item) => item.type === "fund").reduce((sum, item) => sum + item.amount, 0) ?? 0;
    const spent = budget?.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0) ?? 0;
    const expected = budget?.expectedFunding.reduce((sum, item) => sum + item.amount, 0) ?? 0;
    return { funds, spent, expected, cashLeft: funds - spent, costToComplete: Math.max(0, (budget?.estimatedTotal ?? 0) - spent) };
  }, [budget]);

  const addTransaction = () => {
    const parsed = Number(amount);
    if (!budget || !Number.isFinite(parsed) || parsed <= 0 || !description.trim()) {
      setMessage("Enter an amount and a short description.");
      return;
    }
    const next = saveProjectBudget({ ...budget, transactions: [{ id: makeBudgetId(type), type, amount: parsed, date: new Date().toISOString(), sectionId: type === "expense" ? sectionId || null : null, payee: payee.trim() || null, description: description.trim(), evidenceName: null }, ...budget.transactions] });
    setBudget(next);
    setAmount(""); setDescription(""); setPayee(""); setMessage(type === "expense" ? "Expense recorded against the project budget." : "Available project funds recorded.");
  };

  const addFutureFunding = () => {
    const parsed = Number(futureAmount);
    if (!budget || !Number.isFinite(parsed) || parsed <= 0 || !futureDate) { setMessage("Enter the expected amount and date."); return; }
    const next = saveProjectBudget({ ...budget, expectedFunding: [...budget.expectedFunding, { id: makeBudgetId("future"), amount: parsed, expectedDate: futureDate, note: "Expected project funding" }] });
    setBudget(next); setFutureAmount(""); setFutureDate(""); setMessage("Expected future funding added to the plan.");
  };

  if (!budget) return <section className="rounded-2xl border border-dashed border-[#B8C7D6] bg-white p-8 text-center"><WalletCards className="mx-auto h-8 w-8 text-[#175FC4]" /><h2 className="mt-4 text-xl font-bold text-[#081B36]">No project budget yet</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#617286]">Complete a guided estimate, then select “Use as project budget.” The estimate sections will become trackable budget envelopes.</p><button type="button" onClick={onBack} className="mt-5 rounded-xl bg-[#081B36] px-5 py-3 text-sm font-bold text-white">Return to project</button></section>;

  return <div className="space-y-5">
    <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-xs font-bold text-[#617286]"><ArrowLeft className="h-4 w-4" />Project workspace</button><div className="mt-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#087A50]">Simple project money management</p><h1 className="mt-1 text-2xl font-bold text-[#081B36]">{project.name} budget</h1><p className="mt-2 text-sm text-[#617286]">Record money available, future funding and what you spend—without accounting terminology.</p></div><div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-5">{[["Project budget", budget.estimatedTotal], ["Money in", totals.funds], ["Money spent", totals.spent], ["Available now", totals.cashLeft], ["Money needed to finish", totals.costToComplete]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-[#F6F8FB] p-3"><span className="text-[10px] text-[#617286]">{label}</span><strong className="mt-2 block text-sm text-[#081B36] md:text-lg">{money(Number(value), project.currency)}</strong></div>)}</div></section>

    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6"><div className="flex items-center gap-3"><CircleDollarSign className="h-5 w-5 text-[#175FC4]" /><h2 className="font-bold text-[#081B36]">Record money</h2></div><div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-[#F4F7FA] p-1.5">{(["expense", "fund"] as const).map((value) => <button key={value} type="button" onClick={() => setType(value)} className={`rounded-lg px-3 py-2.5 text-xs font-bold ${type === value ? "bg-white text-[#081B36] shadow-sm" : "text-[#617286]"}`}>{value === "expense" ? "Money spent" : "Money received"}</button>)}</div><div className="mt-4 grid gap-3"><label className="text-xs font-semibold text-[#526579]">Amount<input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="₦0" className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#526579]">{type === "expense" ? "What did you buy or pay for?" : "Where did the money come from?"}<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={type === "expense" ? "e.g. 50 bags of cement" : "e.g. Personal savings"} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-3 py-3 text-sm" /></label>{type === "expense" ? <><label className="text-xs font-semibold text-[#526579]">Who did you pay? (optional)<input value={payee} onChange={(event) => setPayee(event.target.value)} placeholder="Supplier or artisan" className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-3 py-3 text-sm" /></label><label className="text-xs font-semibold text-[#526579]">Part of the project<select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="mt-2 w-full rounded-xl border border-[#CAD5E0] bg-[#F8FAFC] px-3 py-3 text-sm"><option value="">General / not selected</option>{budget.sections.map((section) => <option key={section.id} value={section.id}>{section.label}</option>)}</select></label></> : null}<button type="button" onClick={addTransaction} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#081B36] px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" />Save {type === "expense" ? "expense" : "funds"}</button></div>
        <div className="mt-6 border-t border-[#E2E8EF] pt-5"><div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#B45B09]" /><h3 className="text-sm font-bold text-[#081B36]">Expected future funding</h3></div><div className="mt-3 grid grid-cols-2 gap-2"><input type="number" min="0" value={futureAmount} onChange={(event) => setFutureAmount(event.target.value)} placeholder="Amount" className="rounded-xl border border-[#CAD5E0] px-3 py-2.5 text-sm" /><input type="date" value={futureDate} onChange={(event) => setFutureDate(event.target.value)} className="rounded-xl border border-[#CAD5E0] px-3 py-2.5 text-sm" /></div><button type="button" onClick={addFutureFunding} className="mt-2 text-xs font-bold text-[#175FC4]">+ Add expected funds</button><p className="mt-3 text-xs text-[#617286]">Expected later: <strong className="text-[#081B36]">{money(totals.expected, project.currency)}</strong></p></div>{message ? <p className="mt-4 rounded-xl bg-[#FFF4E4] p-3 text-xs text-[#8A4A0A]">{message}</p> : null}</section>

      <div className="space-y-5"><section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6"><h2 className="font-bold text-[#081B36]">Budget by project section</h2><div className="mt-4 space-y-4">{budget.sections.map((section) => { const spent = budget.transactions.filter((item) => item.type === "expense" && item.sectionId === section.id).reduce((sum, item) => sum + item.amount, 0); const progress = section.budget ? spent / section.budget * 100 : 0; return <div key={section.id}><div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-[#081B36]">{section.label}</span><span className={progress > 100 ? "font-bold text-[#C8320A]" : "text-[#617286]"}>{money(spent, project.currency)} / {money(section.budget, project.currency)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7EDF3]"><span className={`block h-full rounded-full ${progress > 100 ? "bg-[#C8320A]" : "bg-[#16A36A]"}`} style={{ width: `${Math.min(100, progress)}%` }} /></div></div>; })}</div></section><section className="rounded-2xl border border-[#DCE4EC] bg-white p-4 md:p-6"><div className="flex items-center justify-between"><h2 className="font-bold text-[#081B36]">Recent activity</h2><ReceiptText className="h-5 w-5 text-[#617286]" /></div>{budget.transactions.length ? <div className="mt-4 divide-y divide-[#E5EBF1]">{budget.transactions.slice(0, 8).map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold text-[#081B36]">{item.description}</p><p className="mt-1 text-[10px] text-[#617286]">{item.payee || (item.type === "fund" ? "Money received" : "Project expense")} · {new Date(item.date).toLocaleDateString("en-NG")}</p></div><strong className={`text-sm ${item.type === "fund" ? "text-[#087A50]" : "text-[#C8320A]"}`}>{item.type === "fund" ? "+" : "-"}{money(item.amount, project.currency)}</strong></div>)}</div> : <p className="mt-5 rounded-xl bg-[#F8FAFC] p-5 text-center text-xs text-[#617286]">No money recorded yet.</p>}</section></div>
    </div>
  </div>;
}
