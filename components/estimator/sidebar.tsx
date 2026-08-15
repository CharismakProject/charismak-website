import {
  BarChart3,
  Calculator,
  FileSpreadsheet,
  FolderKanban,
  Gauge,
  HardHat,
  ListChecks,
  LogOut,
  MessageSquareText,
  PackageSearch,
  Ruler,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";

import type { PageKey } from "./types";

type SidebarProps = {
  activePage: PageKey;
  onSelectPage: (page: PageKey) => void;
  isAdmin?: boolean;
  mobile?: boolean;
  email?: string | null;
  onClose?: () => void;
  onSignOut?: () => void;
};

const navItems: Array<{ key: PageKey; label: string; icon: LucideIcon; section?: "workspace" | "resources" }> = [
  { key: "dashboard", label: "Dashboard", icon: Gauge, section: "workspace" },
  { key: "projects", label: "Projects", icon: FolderKanban, section: "workspace" },
  { key: "estimates", label: "Estimate Builder", icon: Calculator, section: "workspace" },
  { key: "bill", label: "Bill / BOQ", icon: FileSpreadsheet, section: "workspace" },
  { key: "quick", label: "Quick Calculators", icon: Ruler, section: "workspace" },
  { key: "fence", label: "Fence / Boundary", icon: ShieldCheck, section: "workspace" },
  { key: "rates", label: "Prices & Rates", icon: PackageSearch, section: "resources" },
  { key: "register", label: "Bill Register", icon: ListChecks, section: "resources" },
  { key: "feedback", label: "Review & Feedback", icon: MessageSquareText, section: "resources" },
];

function EstimatorBrand() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm">
        <img src="/branding/charismak-logo.png" alt="Charismak" width={28} height={28} className="h-7 w-7 object-contain" />
      </span>
      <span className="min-w-0">
        <strong className="block truncate text-sm font-black uppercase tracking-[0.14em] text-white">Charismak</strong>
        <span className="mt-0.5 block text-[10px] font-medium tracking-[0.08em] text-[#AFC3D8]">Construction Estimator</span>
      </span>
    </div>
  );
}

export default function Sidebar({
  activePage,
  onSelectPage,
  isAdmin = false,
  mobile = false,
  email,
  onClose,
  onSignOut,
}: SidebarProps) {
  const items = isAdmin
    ? [...navItems, { key: "insights" as PageKey, label: "Beta Insights", icon: BarChart3, section: "resources" as const }]
    : navItems;

  const select = (page: PageKey) => {
    onSelectPage(page);
    onClose?.();
  };

  return (
    <aside className={mobile
      ? "flex h-full w-[min(86vw,320px)] flex-col bg-[#081B36] text-white shadow-2xl"
      : "sticky top-0 hidden h-dvh w-[270px] shrink-0 flex-col bg-[#081B36] text-white lg:flex"
    }>
      <div className="flex min-h-[72px] items-center justify-between border-b border-white/10 px-5">
        <EstimatorBrand />
        {mobile ? <button type="button" onClick={onClose} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></button> : null}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        {(["workspace", "resources"] as const).map((section) => (
          <div key={section} className={section === "resources" ? "mt-6" : ""}>
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#7890A9]">{section === "workspace" ? "Workspace" : "Resources"}</p>
            <nav className="space-y-1" aria-label={section === "workspace" ? "Estimator workspace" : "Estimator resources"}>
              {items.filter((item) => item.section === section).map((item) => {
                const Icon = item.icon;
                const active = activePage === item.key;
                return (
                  <button key={item.key} type="button" onClick={() => select(item.key)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition ${active ? "bg-[#173B62] text-white shadow-[inset_3px_0_0_#E7B34B]" : "text-[#C3D1DF] hover:bg-white/8 hover:text-white"}`}>
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#E7B34B]" : "text-[#8FA6BE]"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        ))}

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
          <div className="flex items-center gap-3"><HardHat className="h-5 w-5 text-[#E7B34B]" /><div><p className="text-xs font-bold text-white">Platform workspace</p><p className="mt-0.5 text-[10px] text-[#8FA6BE]">More construction modules will connect here.</p></div></div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.05] p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E7B34B] text-xs font-black text-[#081B36]">{email?.slice(0, 1).toUpperCase() || "C"}</span>
          <span className="min-w-0 flex-1"><strong className="block truncate text-xs text-white">{email || "Estimator user"}</strong><span className="mt-0.5 block text-[10px] text-[#8FA6BE]">Secure beta workspace</span></span>
          {onSignOut ? <button type="button" onClick={onSignOut} aria-label="Sign out" className="grid h-9 w-9 place-items-center rounded-lg text-[#8FA6BE] hover:bg-white/10 hover:text-white"><LogOut className="h-4 w-4" /></button> : null}
        </div>
      </div>
    </aside>
  );
}
