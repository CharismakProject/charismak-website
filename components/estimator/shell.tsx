"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Bill } from "@/lib/billing/models";
import { BILL_UPDATED_EVENT, loadBill } from "@/lib/billing/store";
import { useBetaSession } from "@/components/auth/beta-session";
import BetaInsights from "@/components/feedback/beta-insights";
import FeedbackPage from "@/components/feedback/feedback-page";
import BillDrawer from "../bill/bill-drawer";
import EstimatesArchive from "../bill/estimates-archive";
import ReviewWorkspace from "../bill/review-workspace";
import EstimateBuilder from "../pricing/estimate-builder";
import PriceLibrary from "../pricing/price-library";
import { DEFAULT_PRICE_ITEMS, DEFAULT_RATE_TEMPLATES } from "@/lib/pricing/defaults";
import CalculatorShell from "./calculators/calculator-shell";
import EstimateProvider, { useEstimate } from "./estimate-provider";
import { parseHash } from "./routing";
import Sidebar from "./sidebar";
import type { CalculatorKey, PageKey } from "./types";
import EmptyState from "./ui/empty-state";
import EstimatorLogo from "./ui/logo";
import ShellButton from "./ui/button";
import Workflow from "./workflow";
import WorkDiagram from "./visuals/work-diagram";

const pages: Array<{ key: PageKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "fence", label: "Fence Estimator" },
  { key: "quick", label: "Quick Calculators" },
  { key: "estimates", label: "Estimate Builder" },
  { key: "bill", label: "Bill / BOQ" },
  { key: "register", label: "Bill Register" },
  { key: "rates", label: "Price Library" },
  { key: "feedback", label: "Review & Feedback" },
  { key: "insights", label: "Beta Insights" },
];

const calculatorCards: Array<{
  key: CalculatorKey;
  number: string;
  title: string;
  description: string;
  unit: string;
}> = [
  { key: "concrete", number: "01", title: "Concrete", description: "Volume, cement, sand, aggregate and water.", unit: "m³" },
  { key: "blockwork", number: "02", title: "Blockwork", description: "Wall area, block quantity and mortar materials.", unit: "m²" },
  { key: "reinforcement", number: "03", title: "Reinforcement", description: "Cut lengths, steel weight and binding wire.", unit: "kg" },
  { key: "excavation", number: "04", title: "Excavation", description: "Trenches, pits, backfill and disposal volumes.", unit: "m³" },
  { key: "formwork", number: "05", title: "Formwork", description: "Contact area, sheet requirements and reuse.", unit: "m²" },
];

const visualModules = [
  { id: "concrete", title: "Concrete frame", type: "concrete", unit: "m³" },
  { id: "blockwork", title: "Block wall", type: "blockwork", unit: "m²" },
  { id: "electrical", title: "Electrical installation", type: "electrical", unit: "point" },
  { id: "mechanical", title: "Mechanical services", type: "mechanical", unit: "point" },
  { id: "roofing", title: "Roof covering", type: "roofing", unit: "m²" },
  { id: "fence", title: "Complete fence", type: "fence", unit: "m" },
] as const;

const pageHash: Record<PageKey, string> = {
  dashboard: "#dashboard",
  fence: "#fence",
  quick: "#calculators",
  bill: "#bill",
  estimates: "#estimates",
  register: "#register",
  rates: "#rates",
  feedback: "#feedback",
  insights: "#insights",
  projects: "#projects",
};

const money = (value: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0);

export default function EstimatorShell() {
  return (
    <EstimateProvider>
      <EstimatorShellContent />
    </EstimateProvider>
  );
}

function EstimatorShellContent() {
  const estimate = useEstimate();
  const betaSession = useBetaSession();
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [activeCalculator, setActiveCalculator] = useState<CalculatorKey | null>(null);
  const [billOpen, setBillOpen] = useState(false);
  const [bill, setBill] = useState<Bill | null>(null);
  const [visualModuleId, setVisualModuleId] = useState<(typeof visualModules)[number]["id"]>("concrete");

  useEffect(() => {
    const syncRoute = () => {
      const route = parseHash(window.location.hash);
      setActivePage(route.page);
      setActiveCalculator(route.calculator);
    };
    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  useEffect(() => {
    setBill(loadBill());
    const syncBill = () => setBill(loadBill());
    window.addEventListener(BILL_UPDATED_EVENT, syncBill);
    return () => window.removeEventListener(BILL_UPDATED_EVENT, syncBill);
  }, []);

  const navigate = useCallback((page: PageKey, calculator: CalculatorKey | null = null) => {
    setActivePage(page);
    setActiveCalculator(page === "quick" ? calculator : null);
    const hash = page === "quick" && calculator ? `#calculators/${calculator}` : pageHash[page];
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openConcrete = useCallback(() => navigate("quick", "concrete"), [navigate]);
  const openBlockwork = useCallback(() => navigate("quick", "blockwork"), [navigate]);
  const openBill = useCallback(() => navigate("bill"), [navigate]);
  const startFence = useCallback(() => {
    estimate.startNewEstimate();
    navigate("fence");
  }, [estimate, navigate]);

  const itemCount = useMemo(
    () => bill?.sections.reduce((total, section) => total + section.items.length, 0) ?? 0,
    [bill],
  );
  const activePageLabel = pages.find((page) => page.key === activePage)?.label ?? "Dashboard";
  const visualModule = visualModules.find((item) => item.id === visualModuleId) ?? visualModules[0];

  const renderDashboard = () => (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] bg-[#071E33] text-white shadow-[0_28px_90px_rgba(7,30,51,0.22)]">
        <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
          <div className="flex flex-col justify-center p-7 md:p-10">
            <span className="w-fit rounded-full bg-[#E7B34B]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#E7B34B]">Built for real construction work</span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">Measure. Price. Export.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/72 md:text-base">Build rate analyses and complete project estimates across building, civil, electrical and mechanical work—then issue professional BOQs without rebuilding calculations in spreadsheets.</p>
            <div className="mt-7 flex flex-wrap gap-3"><ShellButton onClick={() => navigate("estimates")}>Start Project Estimate</ShellButton><button type="button" onClick={startFence} className="rounded-full border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Specialist Fence Estimate</button></div>
            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/12 pt-6"><div><strong className="block text-xl">{DEFAULT_RATE_TEMPLATES.length}</strong><span className="text-xs text-white/55">Rate templates</span></div><div><strong className="block text-xl">{DEFAULT_PRICE_ITEMS.length}</strong><span className="text-xs text-white/55">Price resources</span></div><div><strong className="block text-xl">2</strong><span className="text-xs text-white/55">BOQ exports</span></div></div>
          </div>
          <div className="relative hidden min-h-[330px] items-center bg-[#0D3B66] p-4 md:p-8 lg:flex"><div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(231,179,75,0.18),transparent_34%)]" /><div className="relative w-full"><WorkDiagram type={visualModule.type} title={visualModule.title} unit={visualModule.unit} /><div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">{visualModules.map((item) => <button key={item.id} type="button" onClick={() => setVisualModuleId(item.id)} className={`rounded-full px-3 py-2 transition ${item.id === visualModule.id ? "bg-[#E7B34B] text-[#071E33]" : "bg-white/10 text-white hover:bg-white/20"}`}>{item.id}</button>)}</div><p className="mt-3 text-xs text-white/55">Choose a work module to preview its measured-work diagram.</p></div></div>
        </div>
      </section>

      <section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8320A]">Quick start</p><h2 className="mt-1 text-2xl font-bold text-[#071E33]">What do you want to calculate?</h2></div><p className="max-w-md text-sm text-[#526579]">Essential inputs first. Detailed assumptions stay available when you need them.</p></div>
        <div className="mt-5 grid auto-cols-[86%] grid-flow-col gap-4 overflow-x-auto pb-3 snap-x snap-mandatory md:auto-cols-auto md:grid-flow-row md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
          <button type="button" onClick={() => navigate("estimates")} className="group relative snap-start overflow-hidden rounded-[28px] bg-[#C8320A] p-6 text-left text-white shadow-[0_18px_45px_rgba(200,50,10,0.2)] transition hover:-translate-y-1"><span className="text-xs font-bold tracking-[0.2em] text-white/65">PRIMARY TOOL</span><h3 className="mt-8 text-2xl font-bold">Project Estimate</h3><p className="mt-2 text-sm leading-6 text-white/75">Building, civil, electrical, mechanical and custom work items with analysed rates.</p><span className="mt-6 inline-flex text-sm font-bold">Build estimate →</span></button>
          <button type="button" onClick={startFence} className="group snap-start rounded-[28px] bg-[#0D3B66] p-6 text-left text-white shadow-[0_18px_45px_rgba(13,59,102,0.18)] transition hover:-translate-y-1"><span className="text-xs font-bold tracking-[0.2em] text-[#E7B34B]">SPECIALIST MODULE</span><h3 className="mt-8 text-2xl font-bold">Complete Fence</h3><p className="mt-2 text-sm leading-6 text-white/70">Sections, gates, columns, grills, finishes and consolidated measured work.</p><span className="mt-6 inline-flex text-sm font-bold">Start fence →</span></button>
          {calculatorCards.map((calculator) => <button key={calculator.key} type="button" onClick={() => navigate("quick", calculator.key)} className="group snap-start rounded-[28px] border border-[#d6dfe9] bg-white p-6 text-left shadow-[0_12px_35px_rgba(7,30,51,0.05)] transition hover:-translate-y-1 hover:border-[#0D3B66]"><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[0.18em] text-[#0D3B66]/55">{calculator.number}</span><span className="rounded-full bg-[#EEF3F8] px-3 py-1 text-xs font-bold text-[#0D3B66]">{calculator.unit}</span></div><h3 className="mt-8 text-xl font-bold text-[#071E33]">{calculator.title}</h3><p className="mt-2 text-sm leading-6 text-[#526579]">{calculator.description}</p><span className="mt-5 inline-flex text-sm font-bold text-[#C8320A]">Open calculator →</span></button>)}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_0.58fr]">
        <div className="rounded-[30px] border border-[#d6dfe9] bg-white p-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0D3B66]/60">One connected workflow</p><h2 className="mt-2 text-2xl font-bold">Every calculation can become a bill.</h2><div className="mt-6 grid gap-3 sm:grid-cols-4">{["Calculate", "Add to bill", "Enter rates", "Export BOQ"].map((step, index) => <div key={step} className="rounded-2xl bg-[#F4F7FA] p-4"><span className="text-xs font-bold text-[#C8320A]">0{index + 1}</span><p className="mt-3 text-sm font-semibold">{step}</p></div>)}</div></div>
        <button type="button" onClick={openBill} className="rounded-[30px] bg-[#0D3B66] p-6 text-left text-white"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E7B34B]">Current bill</p><strong className="mt-4 block text-4xl">{itemCount}</strong><span className="text-sm text-white/65">BOQ item{itemCount === 1 ? "" : "s"}</span><p className="mt-6 text-xl font-bold">{money(bill?.totals?.grandTotal ?? 0, bill?.currency)}</p><span className="mt-5 inline-flex text-sm font-bold">Open bill workspace →</span></button>
      </section>
    </div>
  );

  const renderContent = () => {
    switch (activePage) {
      case "dashboard": return renderDashboard();
      case "fence": return <Workflow onOpenConcrete={openConcrete} onOpenBlockwork={openBlockwork} onOpenBill={openBill} onOpenEstimates={() => navigate("register")} />;
      case "quick": return <CalculatorShell activeCalculator={activeCalculator} onSelectCalculator={(calculator) => navigate("quick", calculator)} onOpenBill={openBill} />;
      case "bill": return <ReviewWorkspace onOpenConcrete={openConcrete} onOpenBlockwork={openBlockwork} onStartFence={startFence} onOpenEstimates={() => navigate("register")} />;
      case "estimates": return <EstimateBuilder onOpenRates={() => navigate("rates")} onOpenBill={openBill} />;
      case "register": return <EstimatesArchive onOpenBill={openBill} onStartFence={startFence} />;
      case "rates": return <PriceLibrary onOpenEstimate={() => navigate("estimates")} />;
      case "feedback": return <FeedbackPage onBack={() => navigate("dashboard")} />;
      case "insights": return <BetaInsights />;
      case "projects": return <EmptyState title="Project workspace" description="Project portfolio features will follow the working estimate and export workflow." action={<ShellButton variant="secondary" onClick={startFence}>Start fence estimate</ShellButton>} />;
    }
  };

  return (
    <div className="app-backdrop min-h-screen bg-[#F4F7FA] text-[#071E33]">
      <div className="mx-auto flex min-h-screen max-w-[1800px] overflow-hidden">
        <Sidebar activePage={activePage} onSelectPage={(page) => navigate(page)} isAdmin={betaSession.isAdmin} userEmail={betaSession.email} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/60 bg-white/85 px-4 py-2 shadow-sm backdrop-blur-xl lg:hidden"><div className="flex items-center justify-between gap-3"><EstimatorLogo small /><div className="flex items-center gap-2"><span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-[#6C7D8D] min-[390px]:inline">{activePageLabel}</span><button type="button" onClick={() => setBillOpen(true)} className="rounded-full border border-[#0D3B66] px-3 py-2 text-xs font-bold text-[#0D3B66]">BOQ · {itemCount}</button></div></div></header>

          <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-6 pb-28 lg:pb-10">
              <div className="hidden items-center justify-between gap-6 rounded-[30px] border border-[#d6dfe9] bg-white px-6 py-4 shadow-sm lg:flex"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0D3B66]/60">{activePageLabel}</p><h1 className="mt-1 text-2xl font-bold">Charismak Construction Estimator</h1></div><div className="flex flex-wrap items-center gap-2"><ShellButton onClick={() => navigate("estimates")}>New Project Estimate</ShellButton><ShellButton variant="secondary" onClick={startFence}>Fence Module</ShellButton><ShellButton variant="secondary" onClick={() => navigate("quick")}>Quick Calculator</ShellButton><button type="button" onClick={() => navigate("feedback")} className="rounded-full px-4 py-3 text-sm font-bold text-[#0D3B66] hover:bg-[#EEF3F8]">Review</button><button type="button" onClick={() => void betaSession.signOut()} className="rounded-full px-4 py-3 text-sm font-bold text-[#526579] hover:bg-[#EEF3F8]">Sign out</button><button type="button" onClick={() => setBillOpen(true)} className="rounded-full border border-[#0D3B66] px-4 py-3 text-sm font-bold text-[#0D3B66]">Bill ({itemCount}){itemCount > 0 ? ` · ${money(bill?.totals?.grandTotal ?? 0, bill?.currency)}` : ""}</button></div></div>
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
      <nav aria-label="Mobile navigation" className="estimator-mobile-nav fixed inset-x-2 bottom-2 z-50 mx-auto grid h-[58px] max-w-md grid-cols-5 gap-1 rounded-2xl border border-white/60 bg-[#071E33]/95 p-1.5 text-white shadow-[0_14px_38px_rgba(7,30,51,0.32)] backdrop-blur-xl lg:hidden">
        {[
          { label: "Home", page: "dashboard" as PageKey, action: () => navigate("dashboard") },
          { label: "Estimate", page: "estimates" as PageKey, action: () => navigate("estimates") },
          { label: "Tools", page: "quick" as PageKey, action: () => navigate("quick") },
          { label: "Review", page: "feedback" as PageKey, action: () => navigate("feedback") },
          { label: `BOQ ${itemCount}`, page: "bill" as PageKey, action: openBill },
        ].map((item) => <button key={item.label} type="button" onClick={item.action} className={`rounded-xl px-1 py-2 text-center text-[10px] font-bold transition ${activePage === item.page ? "bg-[#E7B34B] text-[#071E33]" : "text-white/72"}`}>{item.label}</button>)}
      </nav>
      <BillDrawer open={billOpen} onClose={() => setBillOpen(false)} onOpenBill={openBill} />
    </div>
  );
}
