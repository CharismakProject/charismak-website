"use client";

import { useEffect, useState } from "react";
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

export default function Sidebar({
  activePage,
  onSelectPage,
  isAdmin = false,
  userEmail,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  useEffect(() => {
    setMobileOpen(false);
  }, [activePage]);

  const selectMobilePage = (page: PageKey) => {
    setMobileOpen(false);
    onSelectPage(page);
  };

  return (
    <>
      <aside className="hidden w-[300px] shrink-0 flex-col bg-[#071E33] px-6 py-8 text-white lg:flex">
        <div className="mb-8 rounded-[26px] border border-white/10 bg-white p-2 shadow-[0_28px_48px_rgba(0,0,0,0.18)]">
          <EstimatorLogo />
        </div>
        <nav className="flex flex-1 flex-col gap-2">
          {visibleItems.map((item) => {
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
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-[#E7B34B]">Estimator workspace</p>
          {userEmail ? <p className="mt-3 truncate text-[11px] text-white/55">{userEmail}</p> : null}
        </div>
      </aside>

      <button
        type="button"
        aria-label="Open estimator menu"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-[86px] z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-[#D6DFE9] bg-white text-[#071E33] shadow-[0_10px_28px_rgba(7,30,51,0.18)] lg:hidden"
      >
        <span className="flex flex-col gap-1.5" aria-hidden="true">
          <span className="block h-0.5 w-5 rounded bg-current" />
          <span className="block h-0.5 w-5 rounded bg-current" />
          <span className="block h-0.5 w-5 rounded bg-current" />
        </span>
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label="Estimator menu">
          <button
            type="button"
            aria-label="Close estimator menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-[#071E33]/55 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[86%] max-w-[330px] flex-col bg-[#071E33] px-5 pb-6 pt-5 text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 rounded-2xl bg-white p-2">
                <EstimatorLogo small />
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-2xl leading-none text-white"
              >
                ×
              </button>
            </div>

            <p className="mt-6 px-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#E7B34B]">Navigation</p>
            <nav className="mt-3 flex flex-1 flex-col gap-1 overflow-y-auto pb-4">
              {visibleItems.map((item) => {
                const active = activePage === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => selectMobilePage(item.key)}
                    className={`rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition ${
                      active
                        ? "bg-[#0D3B66] text-white"
                        : "text-[#D9E6FF] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold text-white">Estimator workspace</p>
              {userEmail ? <p className="mt-2 truncate text-[11px] text-white/55">{userEmail}</p> : null}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
