import type { CalculatorKey, PageKey } from "./types";

const calculatorKeys: CalculatorKey[] = [
  "concrete",
  "blockwork",
  "reinforcement",
  "excavation",
  "formwork",
];

export function parseHash(
  hash: string,
): { page: PageKey; calculator: CalculatorKey | null } {
  const normalized = hash.replace(/^#/, "").toLowerCase();
  if (normalized.startsWith("calculators/")) {
    const calculator = normalized.split("/")[1] as CalculatorKey;
    return {
      page: "quick",
      calculator: calculatorKeys.includes(calculator) ? calculator : null,
    };
  }
  if (normalized === "calculators") return { page: "quick", calculator: null };
  if (normalized === "fence") return { page: "fence", calculator: null };
  if (normalized === "bill") return { page: "bill", calculator: null };
  if (normalized === "estimates") return { page: "estimates", calculator: null };
  if (normalized === "register") return { page: "register", calculator: null };
  if (normalized === "rates") return { page: "rates", calculator: null };
  if (normalized === "feedback") return { page: "feedback", calculator: null };
  if (normalized === "insights") return { page: "insights", calculator: null };
  if (normalized === "projects") return { page: "projects", calculator: null };
  if (normalized === "guided") return { page: "guided", calculator: null };
  if (normalized === "dimensions") return { page: "dimensions", calculator: null };
  if (normalized === "plan") return { page: "plan", calculator: null };
  if (normalized === "import") return { page: "import", calculator: null };
  if (normalized === "budget") return { page: "budget", calculator: null };
  if (normalized === "marketplace") return { page: "marketplace", calculator: null };
  return { page: "dashboard", calculator: null };
}
