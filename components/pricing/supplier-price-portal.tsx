"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  HardHat,
  Search,
  ShieldCheck,
  Store,
  Wrench,
  X,
} from "lucide-react";

import {
  SUPPLIER_ENTRY_FORM_URL,
  SUPPLIER_FORM_GROUPS,
  SUPPLIER_FORMS,
  type SupplierFormDefinition,
  type SupplierFormGroup,
} from "@/lib/pricing/supplier-forms";

type SupplierMode = "new" | "returning";
type GroupFilter = "All" | SupplierFormGroup;

const STORAGE_KEY = "charismak:supplier-price-categories:v1";
const COMPLETED_KEY = "charismak:supplier-price-completed:v1";

const groupIcons: Record<SupplierFormGroup, typeof Building2> = {
  "Core materials": Building2,
  "Finishes & envelope": Store,
  "MEP & building systems": ShieldCheck,
  "Civil, site & safety": HardHat,
  "Tools, plant & equipment": Wrench,
  "Labour & specialists": ClipboardCheck,
};

const embeddedUrl = (url: string) =>
  `${url}${url.includes("?") ? "&" : "?"}embedded=true`;

export default function SupplierPricePortal() {
  const [mode, setMode] = useState<SupplierMode>("returning");
  const [group, setGroup] = useState<GroupFilter>("All");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [activeForm, setActiveForm] = useState<
    SupplierFormDefinition | "ENTRY" | null
  >(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((id) =>
            SUPPLIER_FORMS.some((form) => form.id === id),
          );
          setSelectedIds(valid);
        }
      }
      const completed = window.localStorage.getItem(COMPLETED_KEY);
      if (completed) {
        const parsed = JSON.parse(completed) as string[];
        if (Array.isArray(parsed)) {
          setCompletedIds(
            parsed.filter((id) => SUPPLIER_FORMS.some((form) => form.id === id)),
          );
        }
      }
    } catch {
      // A supplier can still use the portal if browser storage is unavailable.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
      window.localStorage.setItem(COMPLETED_KEY, JSON.stringify(completedIds));
    } catch {
      // Browser storage is a convenience only, never a requirement.
    }
  }, [hydrated, selectedIds, completedIds]);

  const filteredForms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUPPLIER_FORMS.filter((form) => {
      const groupMatch = group === "All" || form.group === group;
      const text = [
        form.title,
        form.shortTitle,
        form.audience,
        ...form.keywords,
      ]
        .join(" ")
        .toLowerCase();
      return groupMatch && (!q || text.includes(q));
    });
  }, [group, query]);

  const selectedForms = selectedIds
    .map((id) => SUPPLIER_FORMS.find((form) => form.id === id))
    .filter((form): form is SupplierFormDefinition => Boolean(form));

  const toggleCategory = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const activeUrl =
    activeForm === "ENTRY"
      ? SUPPLIER_ENTRY_FORM_URL
      : activeForm?.formUrl || null;
  const activeTitle =
    activeForm === "ENTRY"
      ? "Supplier profile"
      : activeForm?.shortTitle || "Supplier price update";

  const nextPendingForm =
    activeForm && activeForm !== "ENTRY"
      ? selectedForms.find(
          (form) => form.id !== activeForm.id && !completedIds.includes(form.id),
        ) ?? null
      : null;

  const finishActiveForm = () => {
    if (!activeForm) return;
    if (activeForm === "ENTRY") {
      setActiveForm(null);
      return;
    }
    setCompletedIds((current) =>
      current.includes(activeForm.id) ? current : [...current, activeForm.id],
    );
    setActiveForm(nextPendingForm);
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#071E33] px-5 py-9 text-white shadow-[0_25px_70px_rgba(7,30,51,0.18)] md:px-9 md:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(200,164,93,0.24),transparent_28rem)]" />
        <div className="relative max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#F2B544]">
            <Store className="h-4 w-4" /> Supplier price update
          </span>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
            One link. Only the products you supply.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
            Choose your supply categories and update current prices without working through an unrelated catalogue. Returning suppliers can keep their usual categories saved on this device.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["1", "Choose what you sell"],
              ["2", "Update only those prices"],
              ["3", "Submit and return here"],
            ].map(([number, label]) => (
              <div
                key={number}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#C8A45D] text-xs font-black text-[#071E33]">
                  {number}
                </span>
                <span className="text-xs font-bold text-white/85">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-[#DCE4EC] bg-white p-5 shadow-[0_10px_35px_rgba(7,30,51,0.05)] md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">
              Step 1
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33]">
              Are you new or returning?
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F3F6F9] p-1.5 md:min-w-[390px]">
            <button
              type="button"
              onClick={() => setMode("new")}
              className={`min-h-11 rounded-xl px-4 text-sm font-black transition ${
                mode === "new"
                  ? "bg-white text-[#071E33] shadow-sm"
                  : "text-[#617286] hover:text-[#071E33]"
              }`}
            >
              New supplier
            </button>
            <button
              type="button"
              onClick={() => setMode("returning")}
              className={`min-h-11 rounded-xl px-4 text-sm font-black transition ${
                mode === "returning"
                  ? "bg-[#0D3B66] text-white shadow-sm"
                  : "text-[#617286] hover:text-[#071E33]"
              }`}
            >
              Returning supplier
            </button>
          </div>
        </div>

        {mode === "new" ? (
          <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#E6D6B4] bg-[#FFF9ED] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong className="block text-[#071E33]">First time with Charismak?</strong>
              <p className="mt-1 text-sm leading-6 text-[#617286]">
                Complete your short supplier profile once, then select the categories you want to price.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveForm("ENTRY")}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white transition hover:bg-[#8B1E00]"
            >
              Complete profile <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-[#DCE4EC] bg-[#F7F9FB] p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#197447]" />
              <div>
                <strong className="text-[#071E33]">Quick update</strong>
                <p className="mt-1 text-sm leading-6 text-[#617286]">
                  Your chosen categories stay saved on this device. Inside each category, you can confirm that your previous prices have not changed and submit immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[2rem] border border-[#DCE4EC] bg-white p-5 shadow-[0_10px_35px_rgba(7,30,51,0.05)] md:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">
              Step 2
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#071E33]">
              What do you supply?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#617286]">
              Select as many categories as apply. You will only open the price forms you choose.
            </p>
          </div>

          <label className="relative block w-full lg:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8B9E]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search roofing, PPR, cement, excavator..."
              className="min-h-12 w-full rounded-xl border border-[#DCE4EC] bg-white pl-11 pr-4 text-sm text-[#071E33] outline-none transition focus:border-[#0D3B66]"
            />
          </label>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setGroup("All")}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
              group === "All"
                ? "bg-[#071E33] text-white"
                : "border border-[#DCE4EC] bg-white text-[#617286] hover:border-[#C8A45D] hover:text-[#071E33]"
            }`}
          >
            All categories
          </button>
          {SUPPLIER_FORM_GROUPS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setGroup(value)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                group === value
                  ? "bg-[#0D3B66] text-white"
                  : "border border-[#DCE4EC] bg-white text-[#617286] hover:border-[#C8A45D] hover:text-[#071E33]"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredForms.map((form) => {
            const selected = selectedIds.includes(form.id);
            const completed = completedIds.includes(form.id);
            const Icon = groupIcons[form.group];
            return (
              <button
                key={form.id}
                type="button"
                onClick={() => toggleCategory(form.id)}
                className={`group flex min-h-[148px] items-start gap-4 rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-[#0D3B66] bg-[#F1F6FB] shadow-[inset_0_0_0_1px_#0D3B66]"
                    : "border-[#DCE4EC] bg-white hover:-translate-y-0.5 hover:border-[#C8A45D] hover:shadow-[0_12px_30px_rgba(7,30,51,0.07)]"
                }`}
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                    selected
                      ? "bg-[#0D3B66] text-[#F2B544]"
                      : "bg-[#F3F6F9] text-[#A82B05]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <strong className="text-sm leading-5 text-[#071E33]">
                      {form.shortTitle}
                    </strong>
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                        selected
                          ? "border-[#0D3B66] bg-[#0D3B66] text-white"
                          : "border-[#C8D3DE] text-transparent"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </span>
                  <span className="mt-2 block text-xs leading-5 text-[#6F7F90]">
                    {form.audience}
                  </span>
                  {completed ? (
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#197447]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Submitted this session
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        {!filteredForms.length ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#B8C7D6] bg-[#F8FAFC] p-8 text-center">
            <Search className="mx-auto h-6 w-6 text-[#8A99A9]" />
            <strong className="mt-3 block text-[#071E33]">No matching category</strong>
            <p className="mt-1 text-sm text-[#617286]">Try a broader product name.</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] bg-[#071E33] p-5 text-white md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F2B544]">
              Step 3
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {selectedForms.length
                ? `${selectedForms.length} categor${selectedForms.length === 1 ? "y" : "ies"} selected`
                : "Select at least one category above"}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
              Submit a form, use the Charismak bar below it to leave Google Forms, then continue to the next category.
            </p>
          </div>
          {selectedForms.length > 1 ? (
            <button
              type="button"
              onClick={() => {
                setSelectedIds([]);
                setCompletedIds([]);
              }}
              className="text-left text-xs font-bold text-white/60 underline underline-offset-4 hover:text-white md:text-right"
            >
              Clear selection
            </button>
          ) : null}
        </div>

        {selectedForms.length ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {selectedForms.map((form, index) => {
              const completed = completedIds.includes(form.id);
              return (
                <button
                  key={form.id}
                  type="button"
                  onClick={() => setActiveForm(form)}
                  className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-[#071E33] transition ${completed ? "bg-[#E9F8F1]" : "bg-white hover:bg-[#FFF9ED]"}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-black ${completed ? "bg-[#197447] text-white" : "bg-[#F2B544]"}`}>
                      {completed ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span className="text-sm font-black leading-5">{form.shortTitle}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#A82B05]" />
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      {activeUrl ? (
        <div className="fixed inset-0 z-[100] bg-[#071E33]/70 p-0 backdrop-blur-sm md:p-4">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl md:rounded-2xl">
            <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-[#DCE4EC] bg-white px-4 md:px-5">
              <div className="min-w-0">
                <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-[#A82B05]">
                  Charismak supplier update
                </span>
                <strong className="block truncate text-sm text-[#071E33] md:text-base">
                  {activeTitle}
                </strong>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden min-h-10 items-center gap-2 rounded-lg border border-[#DCE4EC] px-3 text-xs font-black text-[#0D3B66] hover:border-[#C8A45D] sm:inline-flex"
                >
                  Open separately <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setActiveForm(null)}
                  aria-label="Exit form and return to categories"
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#071E33] px-3 text-xs font-black text-white transition hover:bg-[#A82B05]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to categories</span>
                  <X className="h-4 w-4 sm:hidden" />
                </button>
              </div>
            </header>
            <iframe
              src={embeddedUrl(activeUrl)}
              title={activeTitle}
              className="min-h-0 flex-1 border-0 bg-[#F4F2FF]"
              loading="eager"
            />
            <footer className="shrink-0 border-t border-[#DCE4EC] bg-white px-3 py-3 shadow-[0_-8px_24px_rgba(7,30,51,0.08)] sm:px-5">
              <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] leading-5 text-[#617286] sm:text-xs">
                  After you tap <strong className="text-[#071E33]">Submit</strong> in Google Forms, use this button to leave the form and continue in Charismak.
                </p>
                <button
                  type="button"
                  onClick={finishActiveForm}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#A82B05] px-5 text-sm font-black text-white transition hover:bg-[#8B1E00]"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {activeForm === "ENTRY"
                    ? "Profile done — back to categories"
                    : nextPendingForm
                      ? "Done — next category"
                      : "Done — back to categories"}
                </button>
              </div>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
