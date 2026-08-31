"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import SupplierAccountAccess from "@/components/pricing/supplier-account-access";
import SupplierPricePortal from "@/components/pricing/supplier-price-portal";
import SupplierProfileManager from "@/components/pricing/supplier-profile-manager";
import SupplierReturningDashboard from "@/components/pricing/supplier-returning-dashboard";
import { getSupplierProfile, type SupplierProfile } from "@/lib/platform/supplier-profiles";

const PROFILE_TOKEN_KEY = "charismak:supplier-profile-token:v1";

export default function SupplierPriceExperience() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [showBulk, setShowBulk] = useState(false);
  const [showGuest, setShowGuest] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const knownTokenRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    const sync = async () => {
      const token = window.localStorage.getItem(PROFILE_TOKEN_KEY) || "";
      if (!token) {
        knownTokenRef.current = "";
        if (!cancelled) { setProfile(null); setShowBulk(false); setShowManage(false); setChecking(false); }
        return;
      }
      if (token === knownTokenRef.current && profile) return;
      knownTokenRef.current = token;
      try {
        const next = await getSupplierProfile(token);
        if (!cancelled) { setProfile(next); setChecking(false); setShowGuest(false); }
      } catch {
        window.localStorage.removeItem(PROFILE_TOKEN_KEY);
        knownTokenRef.current = "";
        if (!cancelled) { setProfile(null); setShowBulk(false); setShowManage(false); setChecking(false); }
      }
    };
    void sync();
    const onReady = () => { knownTokenRef.current = ""; void sync(); };
    window.addEventListener("charismak:supplier-account-ready", onReady);
    const timer = window.setInterval(() => void sync(), 1500);
    return () => { cancelled = true; window.clearInterval(timer); window.removeEventListener("charismak:supplier-account-ready", onReady); };
  }, [profile]);

  if (checking) return <div className="grid min-h-[260px] place-items-center rounded-[1.4rem] border border-[#DCE4EC] bg-white p-6 text-center sm:rounded-[2rem]"><div><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0D3B66]" /><p className="mt-3 text-sm font-bold text-[#617286]">Checking supplier account…</p></div></div>;

  if (!profile && !showGuest) return <SupplierAccountAccess onReady={(next) => { setProfile(next); setShowGuest(false); }} onGuest={() => setShowGuest(true)} />;

  if ((!profile && showGuest) || showBulk) return <div className="space-y-4 sm:space-y-6"><div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4EC] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">{showBulk ? "Bulk update mode" : "One-off price update"}</p><p className="mt-1 text-sm leading-6 text-[#617286]">{showBulk ? "Use this when several prices in one category changed." : "You can submit without an account. Creating an account makes future updates much faster."}</p></div><button type="button" onClick={() => { setShowBulk(false); setShowGuest(false); }} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#071E33] px-4 text-xs font-black text-white sm:w-auto"><ArrowLeft className="h-4 w-4" />Back to supplier account</button></div><SupplierPricePortal /></div>;

  if (!profile) return null;
  if (showManage) return <SupplierProfileManager profile={profile} onDone={(next) => { setProfile(next); setShowManage(false); }} onSignOut={() => { setProfile(null); setShowManage(false); setChecking(false); }} />;

  return <SupplierReturningDashboard profile={profile} onBulkUpdate={() => setShowBulk(true)} onManageProfile={() => setShowManage(true)} />;
}
