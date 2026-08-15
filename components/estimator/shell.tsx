"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  FileSpreadsheet,
  FolderKanban,
  HelpCircle,
  Home,
  Menu,
  MoreHorizontal,
  Plus,
} from "lucide-react";

import type { Bill } from "@/lib/billing/models";
import { BILL_UPDATED_EVENT, loadBill } from "@/lib/billing/store";
import type { UniversalProject } from "@/lib/projects/models";
import { saveProject } from "@/lib/projects/store";
import { createRateEstimate, selectRateEstimate } from "@/lib/pricing/store";
import { useBetaSession } from "../auth/beta-session";
import BillDrawer from "../bill/bill-drawer";
import EstimatesArchive from "../bill/estimates-archive";
import ReviewWorkspace from "../bill/review-workspace";
import BetaInsights from "../feedback/beta-insights";
import FeedbackPage from "../feedback/feedback-page";
import EstimateBuilder from "../pricing/estimate-builder";
import PriceLibrary from "../pricing/price-library";
import ProjectWorkspace from "../projects/project-workspace";
import CalculatorShell from "./calculators/calculator-shell";
import EstimatorDashboard from "./dashboard";
import EstimateProvider, { useEstimate } from "./estimate-provider";
import { parseHash } from "./routing";
import Sidebar from "./sidebar";
import type { CalculatorKey, PageKey } from "./types";
import Workflow from "./workflow";

const pages: Array<{ key: PageKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "projects", label: "Projects" },
  { key: "fence", label: "Fence / Boundary" },
  { key: "quick", label: "Quick Calculators" },
  { key: "estimates", label: "Estimate Builder" },
  { key: "bill", label: "Bill / BOQ" },
  { key: "register", label: "Bill Register" },
  { key: "rates", label: "Prices & Rates" },
  { key: "feedback", label: "Review & Feedback" },
  { key: "insights", label: "Beta Insights" },
];

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bill, setBill] = useState<Bill | null>(null);

  useEffect(() => {
    const syncRoute = () => {
      const route = parseHash(window.location.hash);
      setActivePage(route.page);
      setActiveCalculator(route.calculator);
      setMobileMenuOpen(false);
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

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const navigate = useCallback((page: PageKey, calculator: CalculatorKey | null = null) => {
    setActivePage(page);
    setActiveCalculator(page === "quick" ? calculator : null);
    setMobileMenuOpen(false);
    const hash = page === "quick" && calculator ? `#calculators/${calculator}` : pageHash[page];
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openConcrete = useCallback(() => navigate("quick", "concrete"), [navigate]);
  const openBlockwork = useCallback(() => navigate("quick", "blockwork"), [navigate]);
  const openBill = useCallback(() => navigate("bill"), [navigate]);
  const startFence = useCallback(() => {
    if (estimate.startNewEstimate()) navigate("fence");
  }, [estimate, navigate]);

  const continueUniversalProject = useCallback((project: UniversalProject) => {
    if (project.projectType === "fence-boundary") {
      const started = estimate.startNewEstimate({
        projectName: project.name,
        clientName: project.clientName,
        location: project.location,
        currency: project.currency,
        measurement: project.measurementSystem === "metric" ? "Metric" : "Imperial",
      });
      if (started) navigate("fence");
      return;
    }

    if (project.entryRoute === "enter-dimensions") {
      navigate("quick");
      return;
    }

    try {
      if (project.linkedEstimateId) {
        selectRateEstimate(project.linkedEstimateId);
      } else {
        const linkedEstimate = createRateEstimate({
          title: `${project.name} Estimate`,
          projectName: project.name,
          clientName: project.clientName,
          location: project.location,
          currency: project.currency,
        });
        saveProject({ ...project, linkedEstimateId: linkedEstimate.id });
      }
    } catch {
      const linkedEstimate = createRateEstimate({
        title: `${project.name} Estimate`,
        projectName: project.name,
        clientName: project.clientName,
        location: project.location,
        currency: project.currency,
      });
      saveProject({ ...project, linkedEstimateId: linkedEstimate.id });
    }
    navigate("estimates");
  }, [estimate, navigate]);

  const itemCount = useMemo(
    () => bill?.sections.reduce((total, section) => total + section.items.length, 0) ?? 0,
    [bill],
  );
  const activePageLabel = pages.find((page) => page.key === activePage)?.label ?? "Dashboard";
  const metadata = betaSession.user?.user_metadata as Record<string, unknown> | undefined;
  const displayName = typeof metadata?.full_name === "string"
    ? metadata.full_name
    : typeof metadata?.name === "string"
      ? metadata.name
      : null;

  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <EstimatorDashboard
          displayName={displayName}
          bill={bill}
          billItemCount={itemCount}
          onNewProject={() => navigate("projects")}
          onContinueProject={continueUniversalProject}
          onStartFence={startFence}
          onOpenCalculator={(calculator) => navigate("quick", calculator)}
          onOpenEstimateBuilder={() => navigate("estimates")}
          onOpenBill={openBill}
          onOpenRates={() => navigate("rates")}
        />;
      case "projects": return <ProjectWorkspace onContinueProject={continueUniversalProject} />;
      case "fence": return <Workflow onOpenConcrete={openConcrete} onOpenBlockwork={openBlockwork} onOpenBill={openBill} onOpenEstimates={() => navigate("register")} />;
      case "quick": return <CalculatorShell activeCalculator={activeCalculator} onSelectCalculator={(calculator) => navigate("quick", calculator)} onOpenBill={openBill} />;
      case "bill": return <ReviewWorkspace onOpenConcrete={openConcrete} onOpenBlockwork={openBlockwork} onStartFence={startFence} onOpenEstimates={() => navigate("register")} />;
      case "estimates": return <EstimateBuilder onOpenRates={() => navigate("rates")} onOpenBill={openBill} />;
      case "register": return <EstimatesArchive onOpenBill={openBill} onStartFence={startFence} />;
      case "rates": return <PriceLibrary onOpenEstimate={() => navigate("estimates")} />;
      case "feedback": return <FeedbackPage onBack={() => navigate("dashboard")} />;
      case "insights": return betaSession.isAdmin ? <BetaInsights /> : <FeedbackPage onBack={() => navigate("dashboard")} />;
    }
  };

  const signOut = () => void betaSession.signOut();
  const moreActive = !["dashboard", "projects", "bill"].includes(activePage);

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#081B36]">
      <div className="flex min-h-screen">
        <Sidebar
          activePage={activePage}
          onSelectPage={(page) => navigate(page)}
          isAdmin={betaSession.isAdmin}
          email={betaSession.email}
          onSignOut={signOut}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 hidden min-h-[72px] items-center justify-between border-b border-[#DCE4EC] bg-white/95 px-6 backdrop-blur-xl lg:flex">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A8B9E]">Charismak Estimator</p>
              <h1 className="mt-0.5 text-lg font-bold text-[#081B36]">{activePageLabel}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => navigate("feedback")} className="grid h-10 w-10 place-items-center rounded-xl border border-[#DCE4EC] text-[#617286] transition hover:bg-[#F5F7FA]" aria-label="Help and feedback"><HelpCircle className="h-[18px] w-[18px]" /></button>
              <button type="button" onClick={() => setBillOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#DCE4EC] text-[#617286] transition hover:bg-[#F5F7FA]" aria-label="Current bill"><Bell className="h-[18px] w-[18px]" />{itemCount ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#C8320A] px-1 text-[9px] font-bold text-white">{itemCount}</span> : null}</button>
              <button type="button" onClick={() => navigate("projects")} className="ml-1 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#081B36] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#173B62]"><Plus className="h-4 w-4" /> New Project</button>
            </div>
          </header>

          <header className="sticky top-0 z-40 flex min-h-[64px] items-center justify-between border-b border-[#DCE4EC] bg-white/95 px-3.5 backdrop-blur-xl lg:hidden">
            <div className="flex min-w-0 items-center gap-2.5">
              <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#DCE4EC] text-[#081B36]"><Menu className="h-5 w-5" /></button>
              <div className="min-w-0"><p className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-[#C8320A]">Charismak</p><h1 className="truncate text-sm font-bold text-[#081B36]">{activePageLabel}</h1></div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setBillOpen(true)} className="relative grid h-10 w-10 place-items-center rounded-xl border border-[#DCE4EC] text-[#081B36]" aria-label="Open current BOQ"><FileSpreadsheet className="h-[18px] w-[18px]" />{itemCount ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#C8320A] px-1 text-[9px] font-bold text-white">{itemCount}</span> : null}</button>
              <button type="button" onClick={() => navigate("projects")} className="grid h-10 w-10 place-items-center rounded-xl bg-[#081B36] text-white" aria-label="New project"><Plus className="h-5 w-5" /></button>
            </div>
          </header>

          <main className="flex-1 px-3.5 py-4 sm:px-5 md:py-5 lg:px-6 xl:px-8">
            <div className="mx-auto w-full max-w-[1480px] pb-24 lg:pb-6">{renderContent()}</div>
          </main>
        </div>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[80] flex lg:hidden" role="dialog" aria-modal="true" aria-label="Estimator navigation menu">
          <button type="button" className="absolute inset-0 bg-[#020B16]/65 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" />
          <div className="estimator-mobile-drawer relative h-full">
            <Sidebar
              activePage={activePage}
              onSelectPage={(page) => navigate(page)}
              isAdmin={betaSession.isAdmin}
              mobile
              email={betaSession.email}
              onClose={() => setMobileMenuOpen(false)}
              onSignOut={signOut}
            />
          </div>
        </div>
      ) : null}

      <nav aria-label="Mobile navigation" className="estimator-mobile-nav fixed inset-x-2 bottom-2 z-50 mx-auto grid max-w-md grid-cols-5 rounded-2xl border border-[#D8E1EA] bg-white/96 p-1.5 shadow-[0_16px_45px_rgba(8,27,54,0.2)] backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => navigate("dashboard")} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold ${activePage === "dashboard" ? "bg-[#EAF2FF] text-[#175FC4]" : "text-[#6B7D90]"}`}><Home className="h-[18px] w-[18px]" />Home</button>
        <button type="button" onClick={() => navigate("projects")} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold ${activePage === "projects" ? "bg-[#EAF2FF] text-[#175FC4]" : "text-[#6B7D90]"}`}><FolderKanban className="h-[18px] w-[18px]" />Projects</button>
        <button type="button" onClick={() => navigate("projects")} aria-label="Create a new project" className="relative -mt-5 flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl bg-[#081B36] text-[10px] font-bold text-white shadow-[0_10px_25px_rgba(8,27,54,0.28)]"><Plus className="h-6 w-6" />New</button>
        <button type="button" onClick={openBill} className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold ${activePage === "bill" ? "bg-[#FFF0EB] text-[#C8320A]" : "text-[#6B7D90]"}`}><FileSpreadsheet className="h-[18px] w-[18px]" />BOQ{itemCount ? <span className="absolute right-2 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#C8320A] px-1 text-[8px] font-bold text-white">{itemCount}</span> : null}</button>
        <button type="button" onClick={() => setMobileMenuOpen(true)} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold ${moreActive ? "bg-[#EAF2FF] text-[#175FC4]" : "text-[#6B7D90]"}`}><MoreHorizontal className="h-[18px] w-[18px]" />Menu</button>
      </nav>

      <BillDrawer open={billOpen} onClose={() => setBillOpen(false)} onOpenBill={openBill} />
    </div>
  );
}
