import type { RateCostLine } from "./defaults";

/**
 * Regional cost adjustments relative to the Abuja (FCT) basis, which is backed
 * by Charismak purchase records and priced bills. Every other state is a
 * PROVISIONAL planning assumption until local quotations or project costs
 * confirm it; edit the numbers here as evidence arrives.
 *
 * material — materials and consumables (haulage distance, local supply)
 * labour   — trades and labourers
 * plant    — plant, transport and logistics (fuel, distance, security)
 */
export type Zone = "FCT" | "North-Central" | "North-West" | "North-East" | "South-West" | "South-East" | "South-South";

export type RateLocation = {
  id: string; // matches @svg-maps/nigeria ids
  name: string;
  capital: string;
  zone: Zone;
  material: number;
  labour: number;
  plant: number;
  status: "base" | "provisional";
  note?: string;
};

export const BASE_LOCATION_ID = "fct";
export const LOCATIONS_REVIEWED = "2026-11-08";

const NC = { zone: "North-Central", material: 0.97, labour: 0.88, plant: 0.97 } as const;
const NW = { zone: "North-West", material: 1.03, labour: 0.83, plant: 1.0 } as const;
const NE = { zone: "North-East", material: 1.1, labour: 0.85, plant: 1.08 } as const;
const SE = { zone: "South-East", material: 1.03, labour: 1.0, plant: 1.0 } as const;

const P = "provisional" as const;

export const RATE_LOCATIONS: RateLocation[] = [
  { id: "fct", name: "FCT Abuja", capital: "Abuja", zone: "FCT", material: 1, labour: 1, plant: 1, status: "base", note: "Basis: Charismak purchase records and priced bills (2026)." },
  // North-Central / Middle Belt — close to Obajana cement and abundant quarries; lower labour cost.
  { id: "niger", name: "Niger", capital: "Minna", ...NC, status: P },
  { id: "kogi", name: "Kogi", capital: "Lokoja", ...NC, material: 0.95, status: P, note: "Near the Obajana cement plant." },
  { id: "kwara", name: "Kwara", capital: "Ilorin", ...NC, status: P },
  { id: "benue", name: "Benue", capital: "Makurdi", ...NC, material: 0.98, status: P },
  { id: "plateau", name: "Plateau", capital: "Jos", ...NC, material: 0.99, labour: 0.9, status: P },
  { id: "nassarawa", name: "Nasarawa", capital: "Lafia", ...NC, material: 0.97, labour: 0.86, status: P },
  // North-West — haulage adds to materials; lowest labour cost.
  { id: "kano", name: "Kano", capital: "Kano", ...NW, labour: 0.87, status: P },
  { id: "kaduna", name: "Kaduna", capital: "Kaduna", ...NW, material: 1.0, labour: 0.87, status: P },
  { id: "katsina", name: "Katsina", capital: "Katsina", ...NW, status: P },
  { id: "sokoto", name: "Sokoto", capital: "Sokoto", ...NW, material: 1.02, status: P, note: "Local cement production (Sokoto)." },
  { id: "kebbi", name: "Kebbi", capital: "Birnin Kebbi", ...NW, material: 1.05, status: P },
  { id: "zamfara", name: "Zamfara", capital: "Gusau", ...NW, material: 1.05, plant: 1.05, status: P, note: "Security and logistics premium." },
  { id: "jigawa", name: "Jigawa", capital: "Dutse", ...NW, material: 1.05, status: P },
  // North-East — long haulage; security/logistics premium in Borno and Yobe.
  { id: "bauchi", name: "Bauchi", capital: "Bauchi", ...NE, material: 1.07, status: P },
  { id: "gombe", name: "Gombe", capital: "Gombe", ...NE, material: 1.06, status: P, note: "Local cement production (Ashaka)." },
  { id: "adamawa", name: "Adamawa", capital: "Yola", ...NE, status: P },
  { id: "taraba", name: "Taraba", capital: "Jalingo", ...NE, material: 1.1, status: P },
  { id: "yobe", name: "Yobe", capital: "Damaturu", ...NE, material: 1.15, plant: 1.15, status: P, note: "Security and logistics premium." },
  { id: "borno", name: "Borno", capital: "Maiduguri", ...NE, material: 1.15, plant: 1.15, status: P, note: "Security and logistics premium." },
  // South-West
  { id: "lagos", name: "Lagos", capital: "Ikeja", zone: "South-West", material: 1.1, labour: 1.15, plant: 1.08, status: P, note: "Land, traffic and labour premium." },
  { id: "ogun", name: "Ogun", capital: "Abeokuta", zone: "South-West", material: 1.0, labour: 1.02, plant: 1.0, status: P, note: "Cement plants at Ewekoro and Ibese." },
  { id: "oyo", name: "Oyo", capital: "Ibadan", zone: "South-West", material: 0.98, labour: 0.95, plant: 0.98, status: P },
  { id: "osun", name: "Osun", capital: "Osogbo", zone: "South-West", material: 0.98, labour: 0.92, plant: 0.98, status: P },
  { id: "ondo", name: "Ondo", capital: "Akure", zone: "South-West", material: 0.98, labour: 0.92, plant: 0.98, status: P },
  { id: "ekiti", name: "Ekiti", capital: "Ado-Ekiti", zone: "South-West", material: 0.99, labour: 0.92, plant: 0.99, status: P },
  // South-East
  { id: "abia", name: "Abia", capital: "Umuahia", ...SE, status: P },
  { id: "anambra", name: "Anambra", capital: "Awka", ...SE, labour: 1.02, status: P },
  { id: "ebonyi", name: "Ebonyi", capital: "Abakaliki", ...SE, material: 1.0, labour: 0.97, status: P },
  { id: "enugu", name: "Enugu", capital: "Enugu", ...SE, status: P },
  { id: "imo", name: "Imo", capital: "Owerri", ...SE, material: 1.04, status: P },
  // South-South — riverine logistics, especially Bayelsa.
  { id: "rivers", name: "Rivers", capital: "Port Harcourt", zone: "South-South", material: 1.1, labour: 1.1, plant: 1.1, status: P },
  { id: "bayelsa", name: "Bayelsa", capital: "Yenagoa", zone: "South-South", material: 1.22, labour: 1.12, plant: 1.22, status: P, note: "Riverine access and logistics premium." },
  { id: "delta", name: "Delta", capital: "Asaba", zone: "South-South", material: 1.07, labour: 1.05, plant: 1.06, status: P },
  { id: "akwa-ibom", name: "Akwa Ibom", capital: "Uyo", zone: "South-South", material: 1.08, labour: 1.05, plant: 1.06, status: P },
  { id: "cross-river", name: "Cross River", capital: "Calabar", zone: "South-South", material: 1.06, labour: 1.02, plant: 1.05, status: P },
  { id: "edo", name: "Edo", capital: "Benin City", zone: "South-South", material: 1.02, labour: 1.0, plant: 1.02, status: P },
];

export const ZONES: Zone[] = ["FCT", "North-Central", "North-West", "North-East", "South-West", "South-East", "South-South"];

export const getLocation = (id: string | null | undefined): RateLocation =>
  RATE_LOCATIONS.find((location) => location.id === id) ?? RATE_LOCATIONS[0];

const indexFor = (location: RateLocation, category: RateCostLine["category"]) =>
  category === "labour" ? location.labour : category === "plant" || category === "logistics" ? location.plant : location.material;

/** Re-price a build-up for a location: each line's unit rate × its category index. */
export function localiseLines(lines: RateCostLine[], location: RateLocation): RateCostLine[] {
  if (location.id === BASE_LOCATION_ID) return lines.map((line) => ({ ...line }));
  return lines.map((line) => ({ ...line, unitRate: Math.round(line.unitRate * indexFor(location, line.category) * 100) / 100 }));
}

/** One overall index for whole-project figures (typical building cost split). */
export const blendedIndex = (location: RateLocation) => 0.6 * location.material + 0.3 * location.labour + 0.1 * location.plant;

/** Average index for each zone (used for the zone comparison chart). */
export function zoneLocations(zone: Zone) {
  return RATE_LOCATIONS.filter((location) => location.zone === zone);
}

/**
 * Estimator location factor. The estimator's benchmarks treat Abuja as 1.08 of
 * the national base, so a state is 1.08 × its blended index; free text that
 * does not name a state keeps the previous city keywords.
 */
export function estimateLocationFactor(text: string): number {
  const value = text.toLowerCase();
  if (value.includes("lekki") || value.includes("ikoyi") || value.includes("victoria island")) return 1.22;
  const match =
    RATE_LOCATIONS.find((location) => value.includes(location.name.toLowerCase()) || value.includes(location.capital.toLowerCase())) ??
    (value.includes("abuja") || value.includes("fct") ? RATE_LOCATIONS[0] : value.includes("port harcourt") ? getLocation("rivers") : undefined);
  return match ? Math.round(1.08 * blendedIndex(match) * 1000) / 1000 : 1;
}
