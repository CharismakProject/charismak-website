"use client";

import { useMemo, useState } from "react";
import {
  Calculator,
  Check,
  Pencil,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

import {
  calculateRate,
  type RateBankItem,
  type RateCostLine,
} from "@/lib/rates/defaults";

const money = (value: number, currency = "NGN") =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const number = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    maximumFractionDigits: 4,
  }).format(value);

const percent = (value: number) => Number((value * 100).toFixed(3));

const categoryLabel: Record<RateCostLine["category"], string> = {
  material: "Material",
  consumable: "Consumable",
  labour: "Labour",
  plant: "Plant",
  logistics: "Logistics",
};

export default function RateCalculator({ item }: { item: RateBankItem }) {
  const [editing, setEditing] = useState(false);
  const [lines, setLines] = useState<RateCostLine[]>(() =>
    item.lines.map((line) => ({ ...line })),
  );
  const [allowances, setAllowances] = useState(() => ({ ...item.allowances }));

  const publicCalculation = useMemo(
    () => calculateRate(item.lines, item.allowances),
    [item],
  );
  const personalCalculation = useMemo(
    () => calculateRate(lines, allowances),
    [lines, allowances],
  );

  const reset = () => {
    setLines(item.lines.map((line) => ({ ...line })));
    setAllowances({ ...item.allowances });
  };

  const updateLine = (
    id: string,
    field: "quantity" | "unitRate",
    value: number,
  ) => {
    setLines((current) =>
      current.map((line) =>
        line.id === id ? { ...line, [field]: Number.isFinite(value) ? value : 0 } : line,
      ),
    );
  };

  const updateAllowance = (
    field: keyof RateBankItem["allowances"],
    valuePercent: number,
  ) => {
    const value = Number.isFinite(valuePercent) ? valuePercent / 100 : 0;
    setAllowances((current) => ({ ...current, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-[#071E33] p-5 text-white">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]">
            Charismak reference
          </span>
          <strong className="mt-2 block text-3xl">
            {money(publicCalculation.total, item.currency)}
          </strong>
          <span className="mt-1 block text-xs text-white/65">per {item.unit} · O/P 0%</span>
        </div>

        <div className="rounded-2xl border border-[#DCE4EC] bg-white p-5">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#617286]">
            Direct execution cost
          </span>
          <strong className="mt-2 block text-2xl text-[#071E33]">
            {money(publicCalculation.directCost, item.currency)}
          </strong>
          <span className="mt-1 block text-xs text-[#617286]">
            Before fluctuation, risk and O/P
          </span>
        </div>

        <div
          className={
            "rounded-2xl border p-5 " +
            (editing
              ? "border-[#C8A45D] bg-[#FFF9ED]"
              : "border-[#DCE4EC] bg-white")
          }
        >
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">
            {editing ? "Your working rate" : "Private calculator"}
          </span>
          <strong className="mt-2 block text-2xl text-[#071E33]">
            {money(personalCalculation.total, item.currency)}
          </strong>
          <span className="mt-1 block text-xs text-[#617286]">
            Your changes are local to this calculator only
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#E5EBF0] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">
              Rate build-up
            </p>
            <h2 className="mt-1 text-xl font-black text-[#071E33]">
              Resource calculation
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#DCE4EC] px-4 text-xs font-black text-[#0D3B66] transition hover:border-[#C8A45D]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#071E33] px-4 text-xs font-black text-white"
                >
                  <Check className="h-4 w-4" />
                  Finish editing
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0D3B66] px-4 text-xs font-black text-white transition hover:bg-[#071E33]"
              >
                <Pencil className="h-4 w-4" />
                Edit & calculate my rate
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="bg-[#F6F8FA] text-[10px] font-black uppercase tracking-[0.12em] text-[#617286]">
                <th className="px-5 py-3">Resource</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Quantity</th>
                <th className="px-3 py-3">Unit</th>
                <th className="px-3 py-3">Unit price</th>
                <th className="px-5 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-t border-[#EDF1F4] align-top">
                  <td className="px-5 py-4">
                    <strong className="block text-sm text-[#071E33]">{line.label}</strong>
                    {line.note ? (
                      <span className="mt-1 block max-w-xl text-[11px] leading-5 text-[#708093]">
                        {line.note}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 text-xs font-bold text-[#617286]">
                    {categoryLabel[line.category]}
                  </td>
                  <td className="px-3 py-4">
                    {editing ? (
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(line.id, "quantity", Number(event.target.value))
                        }
                        className="h-10 w-28 rounded-lg border border-[#C9D4DF] px-3 text-sm font-bold text-[#071E33] outline-none focus:border-[#0D3B66]"
                      />
                    ) : (
                      <span className="text-sm font-bold text-[#071E33]">{number(line.quantity)}</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-xs text-[#617286]">{line.unit}</td>
                  <td className="px-3 py-4">
                    {editing ? (
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={line.unitRate}
                        onChange={(event) =>
                          updateLine(line.id, "unitRate", Number(event.target.value))
                        }
                        className="h-10 w-36 rounded-lg border border-[#C9D4DF] px-3 text-sm font-bold text-[#071E33] outline-none focus:border-[#0D3B66]"
                      />
                    ) : (
                      <span className="text-sm font-bold text-[#071E33]">
                        {money(line.unitRate, item.currency)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-black text-[#071E33]">
                    {money(line.quantity * line.unitRate, item.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-[#DCE4EC] bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EAF0F6] text-[#0D3B66]">
              <Calculator className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#617286]">
                Allowances
              </p>
              <h2 className="font-black text-[#071E33]">Adjust percentages</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[
              ["materialFluctuation", "Material fluctuation"],
              ["labourFluctuation", "Labour fluctuation"],
              ["plantFluctuation", "Plant / logistics fluctuation"],
              ["risk", "Risk allowance"],
              ["op", "O/P / profit"],
            ].map(([field, label]) => {
              const key = field as keyof RateBankItem["allowances"];
              return (
                <label key={field} className="block">
                  <span className="mb-2 block text-xs font-bold text-[#617286]">{label}</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      disabled={!editing}
                      value={percent(allowances[key])}
                      onChange={(event) => updateAllowance(key, Number(event.target.value))}
                      className="h-11 w-full rounded-xl border border-[#C9D4DF] bg-white px-3 pr-9 text-sm font-black text-[#071E33] outline-none disabled:bg-[#F6F8FA] disabled:text-[#7A8B9E] focus:border-[#0D3B66]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-[#617286]">
                      %
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl bg-[#F6F8FA] p-4 text-xs leading-6 text-[#617286]">
            Physical wastage already included in a resource quantity is separate from price fluctuation. Risk is calculated on direct execution cost. O/P is applied after direct cost, fluctuation and risk.
          </div>
        </div>

        <div className="rounded-2xl bg-[#071E33] p-5 text-white">
          <div className="flex items-center gap-2 text-[#F2B544]">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.14em]">Calculation summary</span>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 text-white/72">
              <span>Materials & consumables</span>
              <strong className="text-white">{money(personalCalculation.materialCost, item.currency)}</strong>
            </div>
            <div className="flex justify-between gap-4 text-white/72">
              <span>Labour</span>
              <strong className="text-white">{money(personalCalculation.labourCost, item.currency)}</strong>
            </div>
            <div className="flex justify-between gap-4 text-white/72">
              <span>Plant & logistics</span>
              <strong className="text-white">
                {money(personalCalculation.plantCost + personalCalculation.logisticsCost, item.currency)}
              </strong>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between gap-4 text-white/72">
                <span>Direct execution cost</span>
                <strong className="text-white">{money(personalCalculation.directCost, item.currency)}</strong>
              </div>
            </div>
            <div className="flex justify-between gap-4 text-white/72">
              <span>Material fluctuation</span>
              <strong className="text-white">{money(personalCalculation.materialFluctuation, item.currency)}</strong>
            </div>
            <div className="flex justify-between gap-4 text-white/72">
              <span>Labour fluctuation</span>
              <strong className="text-white">{money(personalCalculation.labourFluctuation, item.currency)}</strong>
            </div>
            <div className="flex justify-between gap-4 text-white/72">
              <span>Plant/logistics fluctuation</span>
              <strong className="text-white">{money(personalCalculation.plantFluctuation, item.currency)}</strong>
            </div>
            <div className="flex justify-between gap-4 text-white/72">
              <span>Risk</span>
              <strong className="text-white">{money(personalCalculation.risk, item.currency)}</strong>
            </div>
            <div className="flex justify-between gap-4 text-white/72">
              <span>O/P</span>
              <strong className="text-white">{money(personalCalculation.op, item.currency)}</strong>
            </div>
          </div>

          <div className="mt-5 border-t border-white/15 pt-5">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]">
              {editing ? "Your calculated rate" : "Current calculation"}
            </span>
            <strong className="mt-1 block text-3xl">
              {money(personalCalculation.total, item.currency)}
            </strong>
            <span className="mt-1 block text-xs text-white/55">per {item.unit}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
