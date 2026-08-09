import EstimatorLogo from "./ui/logo";
import type { PageKey } from "./types";

type SidebarProps = {
  activePage: PageKey;
  onSelectPage: (page: PageKey) => void;
  isAdmin?: boolean;
  userEmail?: string | null;
};

const navItems: Array<{ key: PageKey; label: string; adminOnly?: boolean }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "fence", label: "Fence Estimator" },
  { key: "quick", label: "Quick Calculators" },
  { key: "estimates", label: "Estimate Builder" },
  { key: "bill", label: "Bill / BOQ" },
  { key: "register", label: "Bill Register" },
  { key: "rates", label: "Price Library" },
  { key: "feedback", label: "Review & Feedback" },
  { key: "insights", label: "Beta Insights", adminOnly: true },
];

export default function Sidebar({ activePage, onSelectPage, isAdmin = false, userEmail }: SidebarProps) {
  return (
    <aside className="hidden w-[300px] shrink-0 flex-col bg-[#071E33] px-6 py-8 text-white lg:flex">
      <div className="mb-8 rounded-[26px] border border-white/10 bg-white p-2 shadow-[0_28px_48px_rgba(0,0,0,0.18)]">
        <EstimatorLogo />
      </div>
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
          const active = activePage === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectPage(item.key)}
              className={`flex items-center justify-between rounded-3xl px-5 py-4 text-left text-sm font-semibold transition ${
                active
                  ? "bg-[#0D3B66] shadow-[0_18px_32px_rgba(13,59,102,0.24)]"
                  : "text-[#D9E6FF] hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-8 rounded-[28px] border border-white/10 bg-[#0D3B66]/90 p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#F8FAFC]">Abiodun Akinola</p>
        <p className="mt-2 text-xs text-[#E7B34B] uppercase tracking-[0.24em]">Estimator workspace</p>
        {userEmail ? <p className="mt-3 truncate text-[11px] text-white/55">{userEmail}</p> : null}
      </div>
    </aside>
  );
}
