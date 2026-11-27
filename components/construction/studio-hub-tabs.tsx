import Link from "next/link";
import { BookOpen, FolderUp, PencilRuler } from "lucide-react";

/** One Construction Studio, three tabs: learn (Explorer), design (Design Studio), your own project (drawing + BOQ). */
export const STUDIO_TABS = [
  { id: "learn", label: "Learn", hint: "3D lessons & stage costs", href: "/construction-explorer", icon: BookOpen },
  { id: "design", label: "Space Planner", hint: "Upload a plan, place items, get a priced report", href: "/construction-studio/design", icon: PencilRuler },
  { id: "project", label: "My project", hint: "Your drawing & BOQ", href: "/construction-studio", icon: FolderUp },
] as const;

export type StudioTabId = (typeof STUDIO_TABS)[number]["id"];

export default function StudioHubTabs({ active, compact = false }: { active: StudioTabId; compact?: boolean }) {
  return (
    <nav aria-label="Construction Studio" className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mb-6"}`}>
      {!compact ? <span className="mr-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[#D9B26A]">Construction Studio</span> : null}
      <span className="flex rounded-lg bg-white/[0.06] p-0.5 ring-1 ring-white/10">
        {STUDIO_TABS.map(({ id, label, hint, href, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            aria-current={active === id ? "page" : undefined}
            title={hint}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${active === id ? "bg-[#D9B26A] text-[#0A1A2F]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </Link>
        ))}
      </span>
    </nav>
  );
}
