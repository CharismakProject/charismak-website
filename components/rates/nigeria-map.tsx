"use client";

import nigeria from "@svg-maps/nigeria";
import { useState } from "react";

import { blendedIndex, getLocation } from "@/lib/rates/locations";

type MapData = { viewBox: string; locations: Array<{ id: string; name: string; path: string }> };
const map = nigeria as unknown as MapData;

/** Cost-heat colour: cheaper than Abuja → teal, dearer → amber/red. */
function heat(index: number) {
  const t = Math.max(-1, Math.min(1, (index - 1) / 0.15));
  if (t < 0) return `rgba(56, 189, 168, ${0.25 + -t * 0.55})`;
  return `rgba(242, 150, 68, ${0.25 + t * 0.6})`;
}

export default function NigeriaMap({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const shown = getLocation(hover ?? selected);
  const index = blendedIndex(shown);

  return (
    <div className="relative">
      <svg viewBox={map.viewBox} role="group" aria-label="Map of Nigeria: choose a state" className="h-auto w-full">
        {map.locations.map((region) => {
          const location = getLocation(region.id);
          const active = region.id === selected;
          return (
            <path
              key={region.id}
              d={region.path}
              role="button"
              tabIndex={0}
              aria-label={`${location.name}${active ? " (selected)" : ""}`}
              aria-pressed={active}
              onClick={() => onSelect(region.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(region.id);
                }
              }}
              onMouseEnter={() => setHover(region.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(region.id)}
              onBlur={() => setHover(null)}
              fill={active ? "#F2B544" : heat(blendedIndex(location))}
              stroke={active ? "#FFF6DD" : "rgba(255,255,255,0.35)"}
              strokeWidth={active ? 2.2 : 0.8}
              className="cursor-pointer outline-none transition-[fill,stroke] duration-200 hover:brightness-125 focus-visible:stroke-white"
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute left-2 top-2 rounded-xl bg-[#04121F]/80 px-3 py-2 text-xs text-white backdrop-blur">
        <strong className="block text-sm">{shown.name}</strong>
        <span className="text-white/70">
          {shown.id === "fct" ? "Base rates (verified)" : `about ${index >= 1 ? "+" : ""}${Math.round((index - 1) * 100)}% vs Abuja overall · provisional`}
        </span>
      </div>
    </div>
  );
}
