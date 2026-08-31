"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Layers3,
  Loader2,
  MapPin,
  MessageCircle,
  PackagePlus,
  UserRound,
} from "lucide-react";

import SupplierAccountAccess from "@/components/pricing/supplier-account-access";
import SupplierBulkPriceUpdate from "@/components/pricing/supplier-bulk-price-update";
import SupplierProfileManager from "@/components/pricing/supplier-profile-manager";
import SupplierReturningDashboard from "@/components/pricing/supplier-returning-dashboard";
import { getSupplierProfile, type SupplierProfile } from "@/lib/platform/supplier-profiles";

const PROFILE_TOKEN_KEY = "charismak:supplier-profile-token:v1";

export default function SupplierPriceExperience() {
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [checking, setChecking] = useState(true);
  const [showBulk, setShowBulk] = useState(false);
  const [showSingle, setShowSingle] = useState(false);
  const [showGuest, setShowGuest] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showWhatsAppAccess, setShowWhatsAppAccess] = useState(false);
  const knownTokenRef = useRef("");

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const token = window.localStorage.getItem(PROFILE_TOKEN_KEY) || "";
      if (!token) {
        knownTokenRef.current = "";
        if (!cancelled) {
          setProfile(null);
          setShowBulk(false);
          setShowSingle(false);
          setShowManage(false);
          setChecking(false);
        }
        return;
      }
      if (token === knownTokenRef.current) return;
      knownTokenRef.current = token;

      try {
        const next = await getSupplierProfile(token);
        if (!cancelled) {
          setProfile(next);
          setChecking(false);
          setShowGuest(false);
        }
      } catch {
        window.localStorage.removeItem(PROFILE_TOKEN_KEY);
        knownTokenRef.current = "";
        if (!cancelled) {
          setProfile(null);
          setShowBulk(false);
          setShowSingle(false);
          setShowManage(false);
          setChecking(false);
        }
      }
    };

    const onReady = () => {
      knownTokenRef.current = "";
      void sync();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === PROFILE_TOKEN_KEY) onReady();
    };

    void sync();
    window.addEventListener("charismak:supplier-account-ready", onReady);
    window.addEventListener("storage", onStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("charismak:supplier-account-ready", onReady);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (checking) {
    return (
      <div className="grid min-h-[260px] place-items-center rounded-[1.4rem] border border-[#DCE4EC] bg-white p-6 text-center sm:rounded-[2rem]">
        <div>
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0D3B66]" />
          <p className="mt-3 text-sm font-bold text-[#617286]">Checking supplier account…</p>
        </div>
      </div>
    );
  }

  if (!profile && !showGuest) {
    return (
      <SupplierAccountAccess
        onReady={(next, created) => {
          knownTokenRef.current = next.accessToken;
          setProfile(next);
          setShowGuest(false);
          setShowBulk(false);
          setShowSingle(false);
          setShowWhatsAppAccess(Boolean(created));
        }}
        onGuest={() => setShowGuest(true)}
      />
    );
  }

  if ((!profile && showGuest) || showBulk) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4EC] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">
              {showBulk ? "Bulk pricing" : "One-off price update"}
            </p>
            <p className="mt-1 text-sm leading-6 text-[#617286]">
              {showBulk
                ? "Add or update several products together."
                : "Submit a price without creating a supplier account."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowBulk(false);
              setShowSingle(false);
              setShowGuest(false);
            }}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#071E33] px-4 text-xs font-black text-white sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" /> Back to pricing options
          </button>
        </div>
        <SupplierBulkPriceUpdate profile={profile} />
      </div>
    );
  }

  if (!profile) return null;

  if (showManage) {
    return (
      <SupplierProfileManager
        profile={profile}
        onDone={(next) => {
          knownTokenRef.current = next.accessToken;
          setProfile(next);
          setShowManage(false);
        }}
        onSignOut={() => {
          knownTokenRef.current = "";
          setProfile(null);
          setShowBulk(false);
          setShowSingle(false);
          setShowManage(false);
          setChecking(false);
        }}
      />
    );
  }

  if (!showSingle) {
    return (
      <SupplierPricingStart
        profile={profile}
        newlyCreated={showWhatsAppAccess}
        onBulk={() => setShowBulk(true)}
        onSingle={() => setShowSingle(true)}
        onManage={() => setShowManage(true)}
        onSavedWhatsApp={() => setShowWhatsAppAccess(false)}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-[#DCE4EC] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#0D3B66]">Single pricing</p>
          <p className="mt-1 text-sm leading-6 text-[#617286]">Add or change one product price at a time.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowSingle(false)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#CBD7E2] bg-white px-4 text-xs font-black text-[#071E33] sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" /> Pricing options
        </button>
      </div>
      <SupplierReturningDashboard
        profile={profile}
        showWhatsAppAccess={showWhatsAppAccess}
        onDismissWhatsAppAccess={() => setShowWhatsAppAccess(false)}
        onBulkUpdate={() => {
          setShowSingle(false);
          setShowBulk(true);
        }}
        onManageProfile={() => setShowManage(true)}
      />
    </div>
  );
}

function SupplierPricingStart({
  profile,
  newlyCreated,
  onBulk,
  onSingle,
  onManage,
  onSavedWhatsApp,
}: {
  profile: SupplierProfile;
  newlyCreated: boolean;
  onBulk: () => void;
  onSingle: () => void;
  onManage: () => void;
  onSavedWhatsApp: () => void;
}) {
  const whatsappHref = supplierWhatsAppAccessHref(profile);

  return (
    <div className="space-y-5 sm:space-y-7">
      {newlyCreated ? (
        <section className="rounded-[1.5rem] border border-[#BFE2CD] bg-[#F0FAF4] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#197447] shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#197447]">Profile created</p>
              <h1 className="mt-1 text-xl font-black text-[#071E33]">Your supplier profile is ready.</h1>
              <p className="mt-2 text-sm leading-6 text-[#526579]">Next, add the prices buyers should see.</p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[1.5rem] border border-[#DCE4EC] bg-white shadow-[0_18px_55px_rgba(7,30,51,0.08)] sm:rounded-[2rem]">
        <div className="border-b border-[#E5EBF0] bg-[#071E33] p-5 text-white sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]">
                <UserRound className="h-4 w-4" /> {profile.supplierCode}
              </span>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">{profile.businessName}</h2>
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-white/65">
                <MapPin className="h-3.5 w-3.5 text-[#F2B544]" /> {profile.location}
              </p>
            </div>
            <button
              type="button"
              onClick={onManage}
              className="min-h-11 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-black text-white"
            >
              Edit profile
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Add your prices</p>
            <h3 className="mt-2 text-2xl font-black text-[#071E33]">How would you like to add prices?</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">
              Bulk pricing is the main option for suppliers with several products. Use single pricing when you only need to add or change one item.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
            <button
              type="button"
              onClick={onBulk}
              className="group rounded-[1.4rem] border-2 border-[#0D3B66] bg-[#F2F7FC] p-5 text-left transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(13,59,102,0.12)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#0D3B66] text-white">
                  <Layers3 className="h-6 w-6" />
                </span>
                <span className="rounded-full bg-[#F2B544] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#071E33]">Recommended</span>
              </div>
              <h4 className="mt-5 text-xl font-black text-[#071E33]">Bulk Pricing</h4>
              <p className="mt-2 text-sm leading-6 text-[#526579]">Add or update several products from your price list.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#0D3B66]">Start bulk pricing <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </button>

            <button
              type="button"
              onClick={onSingle}
              className="group rounded-[1.4rem] border border-[#D8E1E8] bg-white p-5 text-left transition hover:border-[#C8A45D] sm:p-6"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#F3F6F9] text-[#0D3B66]">
                <PackagePlus className="h-6 w-6" />
              </span>
              <h4 className="mt-5 text-xl font-black text-[#071E33]">Single Pricing</h4>
              <p className="mt-2 text-sm leading-6 text-[#617286]">Add or update one product at a time.</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#526579]">Add one price <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </button>
          </div>

          {newlyCreated ? (
            <div className="mt-6 border-t border-[#E5EBF0] pt-5">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                onClick={onSavedWhatsApp}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#BFE2CD] bg-[#F0FAF4] px-4 text-xs font-black text-[#197447]"
              >
                <MessageCircle className="h-4 w-4" /> Save supplier access on WhatsApp
              </a>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function supplierWhatsAppAccessHref(profile: SupplierProfile) {
  const raw = profile.whatsapp || profile.phone;
  const digits = raw.replace(/\D/g, "").replace(/^0/, "234");
  const returnUrl = typeof window === "undefined"
    ? "https://www.charismakproject.com/supplier-prices"
    : `${window.location.origin}/supplier-prices`;
  const message = [
    "Charismak supplier account",
    `Business: ${profile.businessName}`,
    `Supplier code: ${profile.supplierCode}`,
    `Price update link: ${returnUrl}`,
    "Keep your PIN private.",
  ].join("\n");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
