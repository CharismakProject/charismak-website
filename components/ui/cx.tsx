import type { ReactNode } from "react";

/** Small label above a heading, e.g. "— WHAT WE DO". */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`cx-eyebrow mb-6 ${className}`}>{children}</p>;
}

/** A full-width dark section with consistent spacing. */
export function CxSection({ children, id, alt = false, grid = false, className = "" }: { children: ReactNode; id?: string; alt?: boolean; grid?: boolean; className?: string }) {
  return (
    <section id={id} className={`cx-section ${alt ? "cx-alt" : ""} ${grid ? "cx-grid-bg" : ""} ${className}`}>
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  );
}

/** Big technical figure with a caption, for honest facts (counts, places). */
export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="border-l border-white/15 pl-5">
      <div className="cx-mono text-3xl font-medium tracking-tight text-white md:text-4xl">{value}</div>
      <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">{label}</div>
    </div>
  );
}
