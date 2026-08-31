"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SUPPLIER_FORM_GROUPS, SUPPLIER_FORMS } from "@/lib/pricing/supplier-forms";

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  compact?: boolean;
};

export default function SupplierCategoryPicker({ value, onChange, required = false, compact = false }: Props) {
  const [query, setQuery] = useState("");
  const selected = new Set(value);
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => SUPPLIER_FORM_GROUPS.map((group) => ({
    group,
    items: SUPPLIER_FORMS.filter((form) => form.group === group).filter((form) => {
      if (!q) return true;
      return `${form.shortTitle} ${form.audience} ${form.keywords.join(" ")}`.toLowerCase().includes(q);
    }),
  })).filter((entry) => entry.items.length), [q]);

  const toggle = (id: string) => {
    const next = new Set(value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  return (
    <section className="rounded-2xl border border-[#DCE4EC] bg-[#F8FAFC] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-[#071E33]">Supply categories</h3>
            {required ? <span className="text-xs font-black text-[#A82B05]">*</span> : null}
          </div>
          <p className="mt-1 text-xs leading-5 text-[#617286]">Materials, equipment and specialist trades.</p>
        </div>
        <span className="text-xs font-bold text-[#0D3B66]">{value.length} selected</span>
      </div>

      <label className="relative mt-4 block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8190A0]" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cement, steel, plumbing, tiles..." className="min-h-11 w-full rounded-xl border border-[#CBD7E2] bg-white pl-10 pr-3 text-sm text-[#071E33] outline-none focus:border-[#0D3B66]" />
      </label>

      <div className={`mt-4 ${compact ? "max-h-[330px] overflow-y-auto pr-1" : ""}`}>
        {groups.map(({ group, items }) => (
          <div key={group} className="border-t border-[#E4EAF0] py-4 first:border-t-0 first:pt-0">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.13em] text-[#7A8B9E]">{group}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((form) => {
                const active = selected.has(form.id);
                return (
                  <button key={form.id} type="button" onClick={() => toggle(form.id)} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${active ? "border-[#0D3B66] bg-[#0D3B66] text-white" : "border-[#D5DEE7] bg-white text-[#42576D] hover:border-[#C8A45D]"}`}>
                    {active ? <Check className="h-3.5 w-3.5 shrink-0 text-[#F2B544]" /> : null}
                    {form.shortTitle}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {!groups.length ? <p className="py-6 text-center text-sm text-[#617286]">No matching category.</p> : null}
      </div>
    </section>
  );
}
