import { CheckCircle2, CircleDot, PauseCircle } from "lucide-react";

/** Shows the project status exactly as recorded, with a colour cue for common states. */
export default function ProjectStatusBadge({ status, tone = "light" }: { status: string; tone?: "light" | "dark" }) {
  const value = status.trim() || "Status not recorded";
  const lower = value.toLowerCase();
  const kind = lower.includes("ongoing") || lower.includes("in progress") ? "ongoing" : lower.includes("hold") ? "hold" : lower.includes("complet") ? "completed" : "other";
  const Icon = kind === "ongoing" ? CircleDot : kind === "hold" ? PauseCircle : CheckCircle2;
  const styles = {
    ongoing: tone === "dark" ? "bg-[#F2B544] text-[#071E33]" : "bg-[#FFF6DD] text-[#7C5C08]",
    completed: tone === "dark" ? "bg-white/90 text-[#197447]" : "bg-[#EAF7EF] text-[#197447]",
    hold: "bg-[#FDECEA] text-[#8B1E00]",
    other: tone === "dark" ? "bg-white/85 text-[#3A4653]" : "bg-[#EEF2F6] text-[#3A4653]",
  }[kind];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${styles}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {value}
    </span>
  );
}
