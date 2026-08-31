"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Layers3, Loader2, Search, Store, X } from "lucide-react";

import type { SupplierProfile } from "@/lib/platform/supplier-profiles";
import {
  SUPPLIER_FORM_GROUPS,
  SUPPLIER_FORMS,
  type SupplierFormDefinition,
  type SupplierFormGroup,
} from "@/lib/pricing/supplier-forms";

type GroupFilter = "All" | SupplierFormGroup;
type Scope = "mine" | "all";

const embeddedUrl = (url: string) => `${url}${url.includes("?") ? "&" : "?"}embedded=true`;

export default function SupplierBulkPriceUpdate({ profile }: { profile?: SupplierProfile | null }) {
  const hasSavedCategories = Boolean(profile?.categories.length);
  const [scope, setScope] = useState<Scope>(hasSavedCategories ? "mine" : "all");
  const [group, setGroup] = useState<GroupFilter>("All");
  const [query, setQuery] = useState("");
  const [activeForm, setActiveForm] = useState<SupplierFormDefinition | null>(null);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);

  const savedCategoryIds = useMemo(() => new Set(profile?.categories ?? []), [profile?.categories]);

  const baseForms = useMemo(() => {
    if (scope === "mine" && hasSavedCategories) {
      return SUPPLIER_FORMS.filter((form) => savedCategoryIds.has(form.id));
    }
    return SUPPLIER_FORMS;
  }, [hasSavedCategories, savedCategoryIds, scope]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return baseForms.filter((form) => {
      const groupMatch = group === "All" || form.group === group;
      const searchText = [form.title, form.shortTitle, form.audience, ...form.keywords].join(" ").toLowerCase();
      return groupMatch && (!q || searchText.includes(q));
    });
  }, [baseForms, group, query]);

  const openForm = async (form: SupplierFormDefinition) => {
    setActiveForm(form);
    setActiveUrl(null);
    setLoadingForm(true);

    if (!profile) {
      setActiveUrl(form.formUrl);
      setLoadingForm(false);
      return;
    }

    try {
      const response = await fetch("/api/supplier-form-prefill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: form.id,
          businessName: profile.businessName,
          phone: profile.phone,
          location: profile.location,
        }),
      });
      const data = await response.json() as { url?: string };
      setActiveUrl(data.url || form.formUrl);
    } catch {
      setActiveUrl(form.formUrl);
    } finally {
      setLoadingForm(false);
    }
  };

  const markCompleted = () => {
    if (activeForm) {
      setCompleted((current) => current.includes(activeForm.id) ? current : [...current, activeForm.id]);
    }
    setActiveForm(null);
    setActiveUrl(null);
  };

  const switchScope = (next: Scope) => {
    setScope(next);
    setGroup("All");
    setQuery("");
  };

  return (
    <section className="rounded-[1.5rem] border border-[#DCE4EC] bg-white p-4 shadow-[0_10px_35px_rgba(7,30,51,0.05)] sm:rounded-[2rem] sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">Bulk pricing</p>
          <h2 className="mt-2 text-2xl font-black text-[#071E33]">
            {scope === "mine" && hasSavedCategories ? "Choose one of your supply categories." : "Choose a pricing category."}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#617286]">
            {scope === "mine" && hasSavedCategories
              ? "These are the categories saved on your supplier profile. Open each one you sell, add your current prices and submit."
              : profile
                ? "Choose any additional category you supply, add your current prices and submit."
                : "Choose what you supply, enter your details and current prices, then submit."}
          </p>
        </div>
        {profile && hasSavedCategories ? (
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[#F3F6F9] p-1.5">
            <button
              type="button"
              onClick={() => switchScope("mine")}
              className={`min-h-10 rounded-lg px-3 text-xs font-black ${scope === "mine" ? "bg-[#071E33] text-white shadow-sm" : "text-[#617286]"}`}
            >
              My categories ({profile.categories.length})
            </button>
            <button
              type="button"
              onClick={() => switchScope("all")}
              className={`min-h-10 rounded-lg px-3 text-xs font-black ${scope === "all" ? "bg-white text-[#071E33] shadow-sm" : "text-[#617286]"}`}
            >
              View all
            </button>
          </div>
        ) : null}
      </div>

      {scope === "mine" && hasSavedCategories ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#CFE0EF] bg-[#F2F7FC] p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#0D3B66] shadow-sm">
            <Layers3 className="h-4 w-4" />
          </span>
          <div>
            <strong className="block text-sm text-[#071E33]">Start with the products you selected when creating your profile.</strong>
            <p className="mt-1 text-xs leading-5 text-[#617286]">You do not need to fill forms for products you do not sell.</p>
          </div>
        </div>
      ) : null}

      {scope === "all" ? (
        <>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {(["All", ...SUPPLIER_FORM_GROUPS] as GroupFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setGroup(value)}
                className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-black ${group === value ? "bg-[#071E33] text-white" : "bg-[#F3F6F9] text-[#526579]"}`}
              >
                {value}
              </button>
            ))}
          </div>

          <label className="relative mt-4 block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cement, steel, tiles, plumbing, electrical, labour…"
              className="min-h-12 w-full rounded-xl border border-[#CBD7E2] pl-11 pr-4 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]"
            />
          </label>
        </>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {filtered.map((form) => {
          const done = completed.includes(form.id);
          return (
            <button
              key={form.id}
              type="button"
              onClick={() => void openForm(form)}
              className="flex min-h-[112px] items-start gap-4 rounded-2xl border border-[#DCE4EC] p-4 text-left transition hover:border-[#C8A45D] hover:bg-[#FFFDF8]"
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${done ? "bg-[#EAF8F0] text-[#197447]" : "bg-[#EEF4FA] text-[#0D3B66]"}`}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : <Store className="h-5 w-5" />}
              </span>
              <span className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-[0.12em] text-[#A82B05]">{form.group}</span>
                <strong className="mt-1 block text-sm leading-5 text-[#071E33]">{form.shortTitle}</strong>
                <span className="mt-1.5 block text-xs leading-5 text-[#617286]">{form.audience}</span>
                <span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase ${done ? "text-[#197447]" : "text-[#0D3B66]"}`}>
                  {done ? "Submitted" : "Open pricing form"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!filtered.length ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#CBD7E2] bg-[#F8FAFC] p-6 text-center text-sm text-[#617286]">
          {scope === "mine" ? "No saved pricing category was found. Use “View all” to choose one." : "No category matches this search."}
        </div>
      ) : null}

      {activeForm ? (
        <div className="fixed inset-0 z-[180] overflow-y-auto bg-[#020B16]/75 p-2 backdrop-blur-sm sm:p-4">
          <section className="mx-auto my-2 flex min-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-2xl sm:my-4 sm:rounded-[1.75rem]">
            <header className="flex items-start justify-between gap-4 border-b border-[#DCE4EC] p-4 sm:p-5">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#A82B05]">{activeForm.group}</p>
                <h3 className="mt-1 text-lg font-black text-[#071E33] sm:text-xl">{activeForm.title}</h3>
              </div>
              <button type="button" onClick={() => { setActiveForm(null); setActiveUrl(null); }} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#071E33] text-white"><X className="h-5 w-5" /></button>
            </header>

            <div className="relative min-h-[70vh] flex-1 bg-[#F5F7FA]">
              {loadingForm || !activeUrl ? (
                <div className="grid min-h-[70vh] place-items-center text-center"><div><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#0D3B66]" /><p className="mt-3 text-sm font-bold text-[#617286]">Opening price form…</p></div></div>
              ) : (
                <iframe title={activeForm.title} src={embeddedUrl(activeUrl)} className="h-[72vh] w-full border-0 bg-white" />
              )}
            </div>

            <footer className="flex flex-col gap-2 border-t border-[#DCE4EC] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              {activeUrl ? <a href={activeUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] px-4 text-xs font-black text-[#0D3B66]"><ExternalLink className="h-4 w-4" />Open in new tab</a> : <span />}
              <button type="button" onClick={markCompleted} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#197447] px-4 text-xs font-black text-white"><CheckCircle2 className="h-4 w-4" />I submitted this form</button>
            </footer>
          </section>
        </div>
      ) : null}
    </section>
  );
}
