"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Calculator,
  Check,
  HardHat,
  PackageCheck,
  Pencil,
  RotateCcw,
  ShieldCheck,
  Truck,
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
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value);

const percent = (value: number) => Number((value * 100).toFixed(3));

const categoryLabel: Record<RateCostLine["category"], string> = {
  material: "Material",
  consumable: "Consumable",
  labour: "Labour",
  plant: "Plant",
  logistics: "Logistics",
};

type Group = {
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof PackageCheck;
  lines: RateCostLine[];
};

export default function RateCalculator({ item }: { item: RateBankItem }) {
  const [editing, setEditing] = useState(false);
  const [workQuantity, setWorkQuantity] = useState(1);
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

  const safeWorkQuantity =
    Number.isFinite(workQuantity) && workQuantity > 0 ? workQuantity : 1;

  const hasBundledResource = useMemo(
    () =>
      lines.some(
        (line) =>
          (line.category === "material" || line.category === "consumable") &&
          /(allowance|materials allowance|materials$|material allowance|sundries$|accessories$)/i.test(
            line.label,
          ),
      ),
    [lines],
  );

  const groups: Group[] = useMemo(
    () => [
      {
        title: "Material quantities",
        eyebrow: "What you need to buy",
        description:
          "Quantities shown are for one unit of the measured work. The right-hand quantity scales automatically to the work quantity you enter.",
        icon: PackageCheck,
        lines: lines.filter(
          (line) => line.category === "material" || line.category === "consumable",
        ),
      },
      {
        title: "Labour build-up",
        eyebrow: "Workmanship",
        description:
          "Labour is shown as the crew, trade, gang-day, day or piecework quantity used to produce one unit of the measured work.",
        icon: HardHat,
        lines: lines.filter((line) => line.category === "labour"),
      },
      {
        title: "Plant & logistics",
        eyebrow: "Equipment and movement",
        description:
          "Plant, hire, fuel, support equipment and logistics are kept separate so they are not hidden inside the material or labour rate.",
        icon: Truck,
        lines: lines.filter(
          (line) => line.category === "plant" || line.category === "logistics",
        ),
      },
    ],
    [lines],
  );

  const reset = () => {
    setLines(item.lines.map((line) => ({ ...line })));
    setAllowances({ ...item.allowances });
    setWorkQuantity(1);
  };

  const updateLine = (
    id: string,
    field: "quantity" | "unitRate",
    value: number,
  ) => {
    setLines((current) =>
      current.map((line) =>
        line.id === id
          ? { ...line, [field]: Number.isFinite(value) ? value : 0 }
          : line,
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
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-[#071E33] p-5 text-white">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]">
            {item.status === "verified"
              ? "Charismak verified reference"
              : "Working reference — under validation"}
          </span>
          <strong className="mt-2 block text-3xl">
            {money(publicCalculation.total, item.currency)}
          </strong>
          <span className="mt-1 block text-xs text-white/65">
            per {item.unit} · O/P 0%
          </span>
        </div>

        <div className="rounded-2xl border border-[#DCE4EC] bg-white p-5">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#617286]">
            Direct execution cost
          </span>
          <strong className="mt-2 block text-2xl text-[#071E33]">
            {money(publicCalculation.directCost, item.currency)}
          </strong>
          <span className="mt-1 block text-xs text-[#617286]">
            Materials + labour + plant + logistics
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
            per {item.unit} · your edits stay private
          </span>
        </div>

        <div className="rounded-2xl border border-[#C8A45D]/45 bg-[#FFF9ED] p-5">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8A6200]">
            Total for your quantity
          </span>
          <strong className="mt-2 block text-2xl text-[#071E33]">
            {money(personalCalculation.total * safeWorkQuantity, item.currency)}
          </strong>
          <span className="mt-1 block text-xs text-[#617286]">
            {number(safeWorkQuantity)} {item.unit} × your current rate
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-[#DCE4EC] bg-white p-5 md:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">
              Quantity basis
            </p>
            <h2 className="mt-1 text-xl font-black text-[#071E33]">
              See exactly what makes up the rate
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#617286]">
              The rate is analysed for <strong>1 {item.unit}</strong> of work.
              Enter the quantity you actually want to execute and every material,
              labour and plant quantity below will scale without changing the public
              Charismak reference rate.
            </p>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-black text-[#071E33]">
              Work quantity ({item.unit})
            </span>
            <input
              type="number"
              min="0.0001"
              step="any"
              value={workQuantity}
              onChange={(event) => setWorkQuantity(Number(event.target.value))}
              className="h-12 w-full rounded-xl border border-[#C9D4DF] bg-white px-4 text-base font-black text-[#071E33] outline-none focus:border-[#0D3B66]"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/estimator/materials"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D6E0E9] px-4 text-xs font-black text-[#0D3B66] transition hover:border-[#C8A45D] hover:bg-[#FFF9ED]"
          >
            <Calculator className="h-4 w-4" />
            Open full Material Estimator
          </Link>
          <span className="inline-flex items-center rounded-xl bg-[#F6F8FA] px-4 text-xs font-bold text-[#617286]">
            Rate basis: 1 {item.unit}
          </span>
        </div>
      </section>

      {hasBundledResource ? (
        <section className="rounded-2xl border border-[#E7C75D] bg-[#FFF9E7] p-5 text-sm leading-6 text-[#6B5310]">
          <strong className="block text-[#5D4600]">Some resources are still bundled</strong>
          <span className="mt-1 block">
            This rate is still Under validation because at least one material line is a provisional bundled allowance. It will not be marked Verified until that allowance is decomposed into measurable resources such as bags, pieces, metres, litres or kilograms.
          </span>
        </section>
      ) : null}

      {groups.map((group) =>
        group.lines.length ? (
          <ResourceGroup
            key={group.title}
            group={group}
            item={item}
            editing={editing}
            workQuantity={safeWorkQuantity}
            updateLine={updateLine}
          />
        ) : null,
      )}

      <section className="rounded-2xl border border-[#DCE4EC] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#E5EBF0] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#A82B05]">
              Personal rate calculator
            </p>
            <h2 className="mt-1 text-xl font-black text-[#071E33]">
              Change quantities, prices and allowances
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
                  Reset to Charismak
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

        <div className="p-5 text-sm leading-6 text-[#617286]">
          {editing
            ? "Editing is active. Change any per-unit resource quantity or price in the breakdown tables above, then adjust the percentages below."
            : "Click Edit & calculate my rate to change the material quantities, material prices, labour input, plant/logistics and allowances. Your changes do not alter the rate shown to other visitors."}
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
                Cost additions
              </p>
              <h2 className="font-black text-[#071E33]">
                Fluctuation, risk and O/P
              </h2>
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
                  <span className="mb-2 block text-xs font-bold text-[#617286]">
                    {label}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      disabled={!editing}
                      value={percent(allowances[key])}
                      onChange={(event) =>
                        updateAllowance(key, Number(event.target.value))
                      }
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
            Physical wastage belongs in the resource quantity itself. Price
            fluctuation is a separate financial allowance. Risk is calculated on
            direct execution cost, while O/P is applied afterwards.
          </div>
        </div>

        <div className="rounded-2xl bg-[#071E33] p-5 text-white">
          <div className="flex items-center gap-2 text-[#F2B544]">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.14em]">
              Calculation summary
            </span>
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <SummaryRow
              label="Materials & consumables"
              value={personalCalculation.materialCost}
              currency={item.currency}
            />
            <SummaryRow
              label="Labour"
              value={personalCalculation.labourCost}
              currency={item.currency}
            />
            <SummaryRow
              label="Plant & logistics"
              value={
                personalCalculation.plantCost + personalCalculation.logisticsCost
              }
              currency={item.currency}
            />
            <div className="border-t border-white/10 pt-3">
              <SummaryRow
                label="Direct execution cost"
                value={personalCalculation.directCost}
                currency={item.currency}
                strong
              />
            </div>
            <SummaryRow
              label="Material fluctuation"
              value={personalCalculation.materialFluctuation}
              currency={item.currency}
            />
            <SummaryRow
              label="Labour fluctuation"
              value={personalCalculation.labourFluctuation}
              currency={item.currency}
            />
            <SummaryRow
              label="Plant/logistics fluctuation"
              value={personalCalculation.plantFluctuation}
              currency={item.currency}
            />
            <SummaryRow
              label="Risk"
              value={personalCalculation.risk}
              currency={item.currency}
            />
            <SummaryRow
              label="O/P"
              value={personalCalculation.op}
              currency={item.currency}
            />
          </div>

          <div className="mt-5 border-t border-white/15 pt-5">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]">
              {editing ? "Your calculated rate" : "Current calculation"}
            </span>
            <strong className="mt-1 block text-3xl">
              {money(personalCalculation.total, item.currency)}
            </strong>
            <span className="mt-1 block text-xs text-white/55">
              per {item.unit}
            </span>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#F2B544]">
              Total for {number(safeWorkQuantity)} {item.unit}
            </span>
            <strong className="mt-1 block text-2xl">
              {money(
                personalCalculation.total * safeWorkQuantity,
                item.currency,
              )}
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

function ResourceGroup({
  group,
  item,
  editing,
  workQuantity,
  updateLine,
}: {
  group: Group;
  item: RateBankItem;
  editing: boolean;
  workQuantity: number;
  updateLine: (
    id: string,
    field: "quantity" | "unitRate",
    value: number,
  ) => void;
}) {
  const Icon = group.icon;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#DCE4EC] bg-white">
      <div className="grid gap-4 border-b border-[#E5EBF0] p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EAF0F6] text-[#0D3B66]">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A82B05]">
              {group.eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-black text-[#071E33]">
              {group.title}
            </h2>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[#617286]">
              {group.description}
            </p>
          </div>
        </div>
        <span className="rounded-xl bg-[#F6F8FA] px-3 py-2 text-[11px] font-black text-[#617286]">
          Basis: 1 {item.unit}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse text-left">
          <thead>
            <tr className="bg-[#F6F8FA] text-[10px] font-black uppercase tracking-[0.12em] text-[#617286]">
              <th className="px-5 py-3">Resource</th>
              <th className="px-3 py-3">Type</th>
              <th className="px-3 py-3">
                Qty / 1 {item.unit}
              </th>
              <th className="px-3 py-3">Resource unit</th>
              <th className="px-3 py-3">
                Qty / {number(workQuantity)} {item.unit}
              </th>
              <th className="px-3 py-3">Unit price</th>
              <th className="px-5 py-3 text-right">Cost / {item.unit}</th>
            </tr>
          </thead>
          <tbody>
            {group.lines.map((line) => (
              <tr
                key={line.id}
                className="border-t border-[#EDF1F4] align-top"
              >
                <td className="px-5 py-4">
                  <strong className="block text-sm text-[#071E33]">
                    {line.label}
                  </strong>
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
                        updateLine(
                          line.id,
                          "quantity",
                          Number(event.target.value),
                        )
                      }
                      className="h-10 w-28 rounded-lg border border-[#C9D4DF] px-3 text-sm font-bold text-[#071E33] outline-none focus:border-[#0D3B66]"
                    />
                  ) : (
                    <span className="text-sm font-black text-[#071E33]">
                      {number(line.quantity)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-4 text-xs font-bold text-[#617286]">
                  {line.unit}
                </td>
                <td className="px-3 py-4 text-sm font-black text-[#0D3B66]">
                  {number(line.quantity * workQuantity)}
                </td>
                <td className="px-3 py-4">
                  {editing ? (
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={line.unitRate}
                      onChange={(event) =>
                        updateLine(
                          line.id,
                          "unitRate",
                          Number(event.target.value),
                        )
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
  );
}

function SummaryRow({
  label,
  value,
  currency,
  strong = false,
}: {
  label: string;
  value: number;
  currency: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 text-white/72">
      <span>{label}</span>
      <strong className={strong ? "text-[#F2B544]" : "text-white"}>
        {money(value, currency)}
      </strong>
    </div>
  );
}
