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
import {
  BILL_UPDATED_EVENT,
  createNewBill,
  loadBill,
  loadBillById,
  saveBill,
  selectBill,
} from "@/lib/billing/store";
import type { UniversalProject } from "@/lib/projects/models";
import {
  loadActiveProject,
  loadProject,
  saveProject,
  setActiveProject as rememberActiveProject,
} from "@/lib/projects/store";
import {
  createRateEstimate,
  saveRateEstimate,
  selectRateEstimate,
} from "@/lib/pricing/store";
import { useBetaSession } from "../auth/beta-session";
import BillDrawer from "../bill/bill-drawer";
import EstimatesArchive from "../bill/estimates-archive";
import ReviewWorkspace from "../bill/review-workspace";
import BetaInsights from "../feedback/beta-insights";
import FeedbackPage from "../feedback/feedback-page";
import EstimateBuilder from "../pricing/estimate-builder";
import PriceLibrary from "../pricing/price-library";
import ProjectWorkspace from "../projects/project-workspace";
import BoqImportWorkspace from "../projects/boq-import-workspace";
import BudgetWorkspace from "../projects/budget-workspace";
import GuidedEstimator from "../projects/guided-estimator";
import PlanUploadWorkspace from "../projects/plan-upload-workspace";
import CalculatorShell from "./calculators/calculator-shell";
import EstimatorDashboard from "./dashboard";
import EstimatorMarketplaceWorkspace from "./marketplace-workspace";
import EstimateProvider, { useEstimate } from "./estimate-provider";
import { parseHash } from "./routing";
import Sidebar from "./sidebar";
import type { CalculatorKey, PageKey } from "./types";
import Workflow from "./workflow";

const pages: Array<{ key: PageKey; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "projects", label: "Projects" },
  { key: "guided", label: "Guided Estimate" },
  { key: "dimensions", label: "Project Dimensions" },
  { key: "plan", label: "Plan Review" },
  { key: "import", label: "Import BOQ" },
  { key: "budget", label: "Project Budget" },
  { key: "marketplace", label: "Supplier & Artisan Matches" },
  { key: "fence", label: "Fence / Boundary" },
  { key: "quick", label: "Quick Calculators" },
  { key: "estimates", label: "Estimate Builder" },
  { key: "bill", label: "Bill / BOQ" },
  { key: "register", label: "Bill Register" },
  { key: "rates", label: "Material & Labour Price List" },
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
  guided: "#guided",
  dimensions: "#dimensions",
  plan: "#plan",
  import: "#import",
  budget: "#budget",
  marketplace: "#marketplace",
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
  const [activeProject, setActiveProject] = useState<UniversalProject | null>(null);

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
    setActiveProject(loadActiveProject());
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

  const prepareProjectCosting = useCallback((project: UniversalProject) => {
    let linkedEstimate;
    if (project.linkedEstimateId) {
      try {
        linkedEstimate = selectRateEstimate(project.linkedEstimateId);
      } catch {
        linkedEstimate = null;
      }
    }

    if (!linkedEstimate) {
      linkedEstimate = createRateEstimate({
        projectId: project.id,
        title: `${project.name} Estimate`,
        projectName: project.name,
        clientName: project.clientName,
        location: project.location,
        currency: project.currency,
      });
    } else if (linkedEstimate.projectId !== project.id) {
      linkedEstimate = saveRateEstimate({
        ...linkedEstimate,
        projectId: project.id,
        projectName: linkedEstimate.projectName || project.name,
        clientName: linkedEstimate.clientName || project.clientName,
        location: linkedEstimate.location || project.location,
        priceBasisAt: linkedEstimate.priceBasisAt ?? linkedEstimate.createdAt,
      });
    }

    let linkedBill = project.linkedBillId
      ? loadBillById(project.linkedBillId)
      : null;

    if (!linkedBill) {
      linkedBill = createNewBill({
        title: `${project.name} — Bill of Quantities`,
        projectName: project.name,
        clientName: project.clientName,
        location: project.location,
        currency: project.currency,
      });
      linkedBill.projectId = project.id;
      linkedBill.priceBasisAt = linkedEstimate.priceBasisAt ?? linkedEstimate.createdAt;
      linkedBill = saveBill(linkedBill);
    } else {
      selectBill(linkedBill.id);
      if (linkedBill.status === "draft" && linkedBill.projectId !== project.id) {
        linkedBill.projectId = project.id;
        linkedBill.priceBasisAt ??= linkedEstimate.priceBasisAt ?? linkedEstimate.createdAt;
        linkedBill = saveBill(linkedBill);
      }
    }

    if (
      project.linkedEstimateId !== linkedEstimate.id ||
      project.linkedBillId !== linkedBill.id
    ) {
      return saveProject({
        ...project,
        linkedEstimateId: linkedEstimate.id,
        linkedBillId: linkedBill.id,
      });
    }

    return project;
  }, []);

  const navigate = useCallback((page: PageKey, calculator: CalculatorKey | null = null) => {
    setActivePage(page);
    setActiveCalculator(page === "quick" ? calculator : null);
    setMobileMenuOpen(false);
    const hash = page === "quick" && calculator ? `#calculators/${calculator}` : pageHash[page];
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const openEstimateWorkspace = useCallback((project?: UniversalProject | null) => {
    const target = project ?? activeProject ?? loadActiveProject();
    if (target) {
      const prepared = prepareProjectCosting(target);
      rememberActiveProject(prepared);
      setActiveProject(prepared);
    }
    navigate("estimates");
  }, [activeProject, navigate, prepareProjectCosting]);

  const openConcrete = useCallback(() => navigate("quick", "concrete"), [navigate]);
  const openBlockwork = useCallback(() => navigate("quick", "blockwork"), [navigate]);
  const openBill = useCallback(() => navigate("bill"), [navigate]);
  const startFence = useCallback(() => {
    if (estimate.startNewEstimate()) navigate("fence");
  }, [estimate, navigate]);

  const continueUniversalProject = useCallback((project: UniversalProject) => {
    rememberActiveProject(project);
    setActiveProject(project);
    if (project.projectType === "fence-boundary") {
      const started = estimate.startNewEstimate({
        projectId: project.id,
        projectName: project.name,
        clientName: project.clientName,
        location: project.location,
        currency: project.currency,
        measurement: project.measurementSystem === "metric" ? "Metric" : "Imperial",
        estimateBillId: project.linkedBillId ?? null,
      });
      if (started) navigate("fence");
      return;
    }

    if (project.entryRoute === "guided-questions") return navigate("guided");
    if (project.entryRoute === "upload-plan") return navigate("plan");
    if (project.entryRoute === "enter-dimensions") return navigate("dimensions");
    if (project.entryRoute === "import-boq") return navigate("import");
    if (project.entryRoute === "drawing-takeoff") return navigate("plan");

    openEstimateWorkspace(project);
  }, [estimate, navigate, openEstimateWorkspace]);

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
          onOpenBill={openBill}
          onOpenRates={() => navigate("rates")}
        />;
      case "projects": return <ProjectWorkspace onContinueProject={continueUniversalProject} />;
      case "guided": return activeProject ? <GuidedEstimator project={activeProject} mode="guided" onBack={() => navigate("projects")} onOpenBill={openBill} onOpenBudget={() => navigate("budget")} /> : <ProjectWorkspace onContinueProject={continueUniversalProject} />;
      case "dimensions": return activeProject ? <GuidedEstimator project={activeProject} mode="dimensions" onBack={() => navigate("projects")} onOpenBill={openBill} onOpenBudget={() => navigate("budget")} /> : <ProjectWorkspace onContinueProject={continueUniversalProject} />;
      case "plan": return activeProject ? <PlanUploadWorkspace project={activeProject} professional={activeProject.entryRoute === "drawing-takeoff"} onBack={() => navigate("projects")} onContinue={() => { const refreshed = loadProject(activeProject.id); if (refreshed) { setActiveProject(refreshed); if (activeProject.entryRoute === "drawing-takeoff") return openEstimateWorkspace(refreshed); } navigate("guided"); }} /> : <ProjectWorkspace onContinueProject={continueUniversalProject} />;
      case "import": return activeProject ? <BoqImportWorkspace project={activeProject} onBack={() => navigate("projects")} onOpenBill={openBill} /> : <ProjectWorkspace onContinueProject={continueUniversalProject} />;
      case "budget": return activeProject ? <BudgetWorkspace project={activeProject} onBack={() => navigate(activeProject.entryRoute === "enter-dimensions" ? "dimensions" : "guided")} /> : <ProjectWorkspace onContinueProject={continueUniversalProject} />;
      case "fence": return <Workflow onOpenConcrete={openConcrete} onOpenBlockwork={openBlockwork} onOpenBill={openBill} onOpenEstimates={() => navigate("register")} />;
      case "quick": return <CalculatorShell activeCalculator={activeCalculator} onSelectCalculator={(calculator) => navigate("quick", calculator)} onOpenBill={openBill} />;
      case "bill": return <ReviewWorkspace onOpenConcrete={openConcrete} onOpenBlockwork={openBlockwork} onStartFence={startFence} onOpenEstimates={() => navigate("register")} />;
      case "estimates": return <EstimateBuilder onOpenRates={() => navigate("rates")} onOpenBill={openBill} />;
      case "register": return <EstimatesArchive onOpenBill={openBill} onStartFence={startFence} />;
      case "rates": return <PriceLibrary onOpenEstimate={() => openEstimateWorkspace()} />;
      case "feedback": return <FeedbackPage onBack={() => navigate("dashboard")} />;
      case "insights": return betaSession.isAdmin ? <BetaInsights /> : <FeedbackPage onBack={() => navigate("dashboard")} />;
      case "marketplace": return <EstimatorMarketplaceWorkspace project={activeProject} bill={bill} />;
    }
  };

  const signOut = () => void betaSession.signOut();
  const moreActive = !["dashboard", "projects", "bill"].includes(activePage);
  const selectPage = (page: PageKey) => {
    if (page === "estimates") openEstimateWorkspace();
    else navigate(page);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#081B36]">
      <div className="flex min-h-screen">
        <Sidebar
          activePage={activePage}
          onSelectPage={selectPage}
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
              onSelectPage={selectPage}
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
