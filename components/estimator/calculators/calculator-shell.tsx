"use client";

import { useMemo } from "react";
import type { CalculatorKey } from "../types";
import ShellButton from "../ui/button";
import Card from "../ui/card";
import EmptyState from "../ui/empty-state";
import ConcreteCalculator from "./concrete-calculator";
import BlockworkCalculator from "./blockwork-calculator";
import ReinforcementCalculator from "./reinforcement-calculator";
import ExcavationCalculator from "./excavation-calculator";
import FormworkCalculator from "./formwork-calculator";

const calculators: Array<{ key: CalculatorKey; title: string; description: string; accent: string }> = [
  {
    key: "concrete",
    title: "Concrete",
    description: "Volume and mix materials for concrete foundations, columns and slabs.",
    accent: "bg-[#0D3B66]",
  },
  {
    key: "blockwork",
    title: "Blockwork",
    description: "Block quantities and mortar requirements for wall panels and columns.",
    accent: "bg-[#C8320A]",
  },
  {
    key: "reinforcement",
    title: "Reinforcement",
    description: "Rebar length, weights, stock bar planning and binding wire requirements.",
    accent: "bg-[#E7B34B] text-[#071E33]",
  },
  {
    key: "excavation",
    title: "Excavation & Earthworks",
    description: "Excavation volumes, over-excavation, backfill and disposal planning.",
    accent: "bg-[#071E33]",
  },
  {
    key: "formwork",
    title: "Formwork",
    description: "Formwork area, sheet layout and expected reuse for wall and column formwork.",
    accent: "bg-[#0D3B66]",
  },
];

type CalculatorShellProps = {
  activeCalculator: CalculatorKey | null;
  onSelectCalculator: (calculator: CalculatorKey | null) => void;
  onOpenBill: () => void;
};

export default function CalculatorShell({
  activeCalculator,
  onSelectCalculator,
  onOpenBill,
}: CalculatorShellProps) {

  const content = useMemo(() => {
    switch (activeCalculator) {
      case "concrete":
        return <ConcreteCalculator onBack={() => onSelectCalculator(null)} onOpenBill={onOpenBill} />;
      case "blockwork":
        return <BlockworkCalculator onBack={() => onSelectCalculator(null)} onOpenBill={onOpenBill} />;
      case "reinforcement":
        return <ReinforcementCalculator onBack={() => onSelectCalculator(null)} onOpenBill={onOpenBill} />;
      case "excavation":
        return <ExcavationCalculator onBack={() => onSelectCalculator(null)} onOpenBill={onOpenBill} />;
      case "formwork":
        return <FormworkCalculator onBack={() => onSelectCalculator(null)} onOpenBill={onOpenBill} />;
      default:
        return (
          <div className="space-y-6">
            <Card title="Quick calculators">
              <p className="text-sm leading-7 text-[#4B5B72]">
                Choose a working calculator for concrete, blockwork, reinforcement, excavation and formwork. These forms connect directly to the existing estimator engine.
              </p>
            </Card>
            <div className="grid auto-cols-[86%] grid-flow-col gap-4 overflow-x-auto pb-3 snap-x snap-mandatory md:auto-cols-auto md:grid-flow-row md:grid-cols-2 md:overflow-visible">
              {calculators.map((item) => (
                <Card key={item.key} className="relative snap-start overflow-hidden">
                  <div className={`absolute right-5 top-5 h-12 w-12 rounded-3xl ${item.accent}`} />
                  <div className="relative">
                    <h3 className="text-xl font-semibold text-[#0B2942]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#556475]">{item.description}</p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                      <ShellButton onClick={() => onSelectCalculator(item.key)}>Open calculator</ShellButton>
                      <span className="text-xs uppercase tracking-[0.2em] text-[#0D3B66]/80">Live</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="hidden md:block"><EmptyState
              title="Calculator workspace"
              description="Select a calculator to start working with the estimator engine. Each calculator uses full calculation types from the fence library."
            /></div>
          </div>
        );
    }
  }, [activeCalculator, onOpenBill, onSelectCalculator]);

  return <div className="space-y-6">{content}</div>;
}
