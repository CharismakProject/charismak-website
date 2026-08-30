"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import SupplierPricePortal from "@/components/pricing/supplier-price-portal";
import SupplierReturningDashboard from "@/components/pricing/supplier-returning-dashboard";
import {
  getSupplierProfile,
  type SupplierProfile,
} from "@/lib/platform/supplier-profiles";

const PROFILE_TOKEN_KEY = "charismak:supplier-profile-token:v1";

export default function SupplierPriceExperience() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let knownToken = "";

    const sync = async () => {
      const token = window.localStorage.getItem(PROFILE_TOKEN_KEY) || "";

      if (!token) {
        knownToken = "";
        if (!cancelled) {
          setProfile(null);
          setShowBulk(false);
          setChecking(false);
        }
        return;
      }

      if (token === knownToken && profile) return;
      knownToken = token;

      try {
        const next = await getSupplierProfile(token);
        if (!cancelled) {
          setProfile(next);
          setChecking(false);
        }
      } catch {
        window.localStorage.removeItem(PROFILE_TOKEN_KEY);
        if (!cancelled) {
          setProfile(null);
          setShowBulk(false);
          setChecking(false);
        }
      }
    };

    void sync();
    const timer = window.setInterval(() => void sync(), 900);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [profile]);

  if (checking) {
    return (
      <div className="grid min-h-[260px] place-items-center rounded-[1.4rem] border border-[#DCE4EC] bg-white p-6 text-center sm:rounded-[2rem]">
        <div>
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0D3B66]" />
          <p className="mt-3 text-sm font-bold text-[#617286]">Checking supplier access…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <SupplierPricePortal />;
  }

  if (showBulk) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4EC] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">Bulk update mode</p>
            <p className="mt-1 text-sm leading-6 text-[#617286]">Use this only when you want to update several prices in one category.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowBulk(false)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#071E33] px-4 text-xs font-black text-white sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" /> Back to material search
          </button>
        </div>
        <SupplierPricePortal />
      </div>
    );
  }

  return (
    <SupplierReturningDashboard
      profile={profile}
      onBulkUpdate={() => setShowBulk(true)}
      onManageProfile={() => setShowBulk(true)}
    />
  );
}