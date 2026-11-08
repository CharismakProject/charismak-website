"use client";

import { MapPin } from "lucide-react";

import NigeriaMap from "@/components/rates/nigeria-map";
import { LOCATIONS_REVIEWED, RATE_LOCATIONS, ZONES, blendedIndex, type RateLocation } from "@/lib/rates/locations";

/** State selector: interactive map (larger screens) plus an accessible dropdown. */
export default function LocationPicker({
  location,
  onChange,
  showMap = true,
}: {
  location: RateLocation;
  onChange: (id: string) => void;
  showMap?: boolean;
}) {
  const index = blendedIndex(location);
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#F2B544]">
          <MapPin className="h-3.5 w-3.5" /> Price for state
        </span>
        <select
          value={location.id}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white outline-none backdrop-blur focus:border-[#F2B544] [&>optgroup]:text-[#071E33] [&>option]:text-[#071E33] bg-white/10! text-white! border-white/15! placeholder:text-white/40! focus:border-[#F2B544]! [&_option]:bg-[#071E33] [&_optgroup]:bg-[#071E33]"
        >
          {ZONES.map((zone) => (
            <optgroup key={zone} label={zone}>
              {RATE_LOCATIONS.filter((item) => item.zone === zone).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.capital})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      {showMap ? (
        <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2 sm:block">
          <NigeriaMap selected={location.id} onSelect={onChange} />
          <div className="mt-1 flex items-center justify-between px-1 text-[10px] text-white/55">
            <span className="flex items-center gap-1.5"><i className="h-2 w-4 rounded bg-[rgba(56,189,168,0.75)]" /> cheaper</span>
            <span>Abuja = base</span>
            <span className="flex items-center gap-1.5">dearer <i className="h-2 w-4 rounded bg-[rgba(242,150,68,0.8)]" /></span>
          </div>
          <p className="mt-1 px-1 text-[9px] text-white/35">Map: @svg-maps/nigeria by Michael Chukwu, CC BY 4.0</p>
        </div>
      ) : null}
      <p className={`rounded-xl px-3 py-2 text-[11px] leading-5 ${location.status === "base" ? "bg-[#0E3B2E] text-[#9BE7C4]" : "bg-[#3A2A0B] text-[#F7D58C]"}`}>
        {location.status === "base"
          ? `Abuja base rates · market prices checked ${new Date(LOCATIONS_REVIEWED).toLocaleDateString("en-NG", { month: "short", year: "numeric" })}.`
          : `Provisional: Abuja rates adjusted for ${location.name} (materials ×${location.material.toFixed(2)}, labour ×${location.labour.toFixed(2)}, plant ×${location.plant.toFixed(2)}; about ${index >= 1 ? "+" : ""}${Math.round((index - 1) * 100)}% overall). Confirm local prices before tendering.`}
        {location.note && location.status !== "base" ? ` ${location.note}` : ""}
      </p>
    </div>
  );
}
