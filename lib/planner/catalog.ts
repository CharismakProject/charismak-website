import { AFRICA_PRICE_ITEMS } from "@/lib/pricing/africa-catalog";

/** Items a visitor can place in the Space Planner. Sizes in millimetres (w = width, d = depth, h = height). */
export type ItemCategory = "Furniture" | "Kitchen" | "Bathroom" | "Electrical" | "Plumbing";
export type Symbol = "worktop" | "hood" | "microwave" | "counter" | "box" | "chair" | "table" | "bed" | "sofa" | "wardrobe" | "tv" | "cabinet" | "cooker" | "fridge" | "sink" | "washer" | "wc" | "basin" | "shower" | "bath" | "bulb" | "socket" | "switch" | "ac" | "fan" | "tap" | "drain";

export type CatalogItem = {
  type: string;
  name: string;
  category: ItemCategory;
  w: number;
  d: number;
  h: number;
  symbol: Symbol;
  /** Market price list item that prices this, if one exists. */
  priceId?: string;
  /** Wall- or ceiling-mounted points drawn small and not resized much. */
  point?: boolean;
  /** Height of the item's underside above the floor, in mm (wall cabinets, AC, sockets, switches). */
  mount?: number;
  /** Fixed to the ceiling (bulbs, fans): left out of wall elevations. */
  ceiling?: boolean;
  /** Finishes offered for this item; the first is the default. */
  finishes?: Finish[];
};

export type Finish = "white-gloss" | "charcoal-matt" | "oak" | "stainless" | "white" | "light-grey" | "walnut";
export const FINISH_LABEL: Record<Finish, string> = { "white-gloss": "White gloss", "charcoal-matt": "Charcoal matt", oak: "Oak", stainless: "Stainless steel", white: "White", "light-grey": "Light grey stone", walnut: "Walnut" };
/** 3D colour for each finish (sRGB hex) and how shiny it is (0 = matt, 1 = mirror). */
export const FINISH_COLOUR: Record<Finish, { color: number; rough: number; metal?: number }> = {
  "white-gloss": { color: 0xf3f4f2, rough: 0.25 }, "charcoal-matt": { color: 0x3b4048, rough: 0.8 }, oak: { color: 0xc9a074, rough: 0.6 },
  stainless: { color: 0xb9bec4, rough: 0.35, metal: 0.6 }, white: { color: 0xf6f7f8, rough: 0.5 }, "light-grey": { color: 0xd9dcdf, rough: 0.4 }, walnut: { color: 0x7a5236, rough: 0.6 },
};
const CABINET: Finish[] = ["white-gloss", "charcoal-matt", "oak", "walnut"];

export const CATALOG: CatalogItem[] = [
  { type: "chair", name: "Chair", category: "Furniture", w: 450, d: 500, h: 900, symbol: "chair" },
  { type: "table", name: "Dining table", category: "Furniture", w: 1600, d: 900, h: 750, symbol: "table", finishes: ["oak", "walnut", "white"] },
  { type: "desk", name: "Desk", category: "Furniture", w: 1200, d: 600, h: 750, symbol: "table", finishes: ["oak", "walnut", "white"] },
  { type: "bed", name: "Bed (double)", category: "Furniture", w: 1500, d: 2000, h: 500, symbol: "bed" },
  { type: "sofa", name: "Sofa (3-seat)", category: "Furniture", w: 2100, d: 900, h: 850, symbol: "sofa" },
  { type: "wardrobe", name: "Wardrobe", category: "Furniture", w: 1800, d: 600, h: 2100, symbol: "wardrobe", finishes: CABINET },
  { type: "tv-unit", name: "TV unit", category: "Furniture", w: 1800, d: 450, h: 500, symbol: "tv", finishes: ["walnut", "oak", "white-gloss", "charcoal-matt"] },
  { type: "base-cabinet", name: "Base cabinet", category: "Kitchen", w: 600, d: 600, h: 900, symbol: "cabinet", finishes: ["charcoal-matt", "white-gloss", "oak", "walnut"] },
  { type: "wall-cabinet", name: "Wall cabinet", category: "Kitchen", w: 600, d: 350, h: 700, symbol: "cabinet", mount: 1450, finishes: CABINET },
  { type: "worktop", name: "Worktop", category: "Kitchen", w: 1300, d: 620, h: 30, symbol: "worktop", mount: 870, finishes: ["light-grey", "white", "oak", "charcoal-matt"] },
  { type: "hood", name: "Chimney hood", category: "Kitchen", w: 600, d: 500, h: 150, symbol: "hood", mount: 1600, finishes: ["stainless"] },
  { type: "microwave", name: "Microwave", category: "Kitchen", w: 500, d: 400, h: 300, symbol: "microwave", finishes: ["charcoal-matt", "white"] },
  { type: "fold-counter", name: "Fold-down counter", category: "Kitchen", w: 1000, d: 400, h: 30, symbol: "counter", mount: 870, finishes: ["oak", "walnut", "white"] },
  { type: "cooker", name: "Cooker", category: "Kitchen", w: 600, d: 600, h: 900, symbol: "cooker", finishes: ["stainless", "white"] },
  { type: "fridge", name: "Fridge", category: "Kitchen", w: 600, d: 650, h: 1800, symbol: "fridge", finishes: ["light-grey", "stainless", "white"] },
  { type: "kitchen-sink", name: "Kitchen sink", category: "Kitchen", w: 1000, d: 600, h: 900, symbol: "sink", finishes: ["charcoal-matt", "white-gloss", "oak"] },
  { type: "washer", name: "Washing machine", category: "Kitchen", w: 600, d: 600, h: 850, symbol: "washer", finishes: ["white", "stainless"] },
  { type: "wc", name: "WC", category: "Bathroom", w: 380, d: 680, h: 780, symbol: "wc", priceId: "wc-set" },
  { type: "basin", name: "Wash-hand basin", category: "Bathroom", w: 550, d: 450, h: 200, symbol: "basin", priceId: "wash-hand-basin", mount: 650 },
  { type: "shower", name: "Shower", category: "Bathroom", w: 900, d: 900, h: 2100, symbol: "shower", priceId: "shower-mixer" },
  { type: "bath", name: "Bath tub", category: "Bathroom", w: 1700, d: 750, h: 550, symbol: "bath" },
  { type: "bulb", name: "Light bulb", category: "Electrical", w: 250, d: 250, h: 100, symbol: "bulb", priceId: "led-light", point: true, ceiling: true },
  { type: "socket", name: "Socket outlet", category: "Electrical", w: 150, d: 120, h: 90, symbol: "socket", point: true, mount: 300 },
  { type: "switch", name: "Light switch", category: "Electrical", w: 90, d: 120, h: 90, symbol: "switch", priceId: "lighting-switch", point: true, mount: 1200 },
  { type: "ac", name: "Air conditioner (1.5 HP)", category: "Electrical", w: 900, d: 250, h: 300, symbol: "ac", priceId: "split-ac-1-5hp", mount: 2100 },
  { type: "fan", name: "Ceiling fan", category: "Electrical", w: 1200, d: 1200, h: 400, symbol: "fan", ceiling: true },
  { type: "water-point", name: "Water point", category: "Plumbing", w: 100, d: 100, h: 100, symbol: "tap", point: true, mount: 500 },
  { type: "floor-drain", name: "Floor drain", category: "Plumbing", w: 200, d: 200, h: 50, symbol: "drain", priceId: "floor-drain", point: true, ceiling: false },
];

export const CATEGORIES: ItemCategory[] = ["Furniture", "Kitchen", "Bathroom", "Electrical", "Plumbing"];

export const catalogItem = (type: string) => CATALOG.find((item) => item.type === type);
/** The finish an item uses: its own choice, else the catalogue default. */
export const itemFinish = (type: string, own?: string): Finish | undefined => (own as Finish) ?? catalogItem(type)?.finishes?.[0];

/** Market price (₦) and its description, when the price list has this item. */
export function marketPrice(priceId?: string): { rate: number; label: string } | null {
  if (!priceId) return null;
  const found = AFRICA_PRICE_ITEMS.find((item) => item.id === priceId);
  const rate = found?.rate ?? found?.defaultRate ?? null;
  return found && rate !== null ? { rate, label: found.description } : null;
}

/** Doors and windows priced from the market list when possible. */
export const DOOR_PRICE_ID = "flush-door";
export const WINDOW_PRICE_ID = "aluminium-window"; // per m²
export const WINDOW_HEIGHT = 1200;
export const WINDOW_SILL = 900;
export const DOOR_HEIGHT = 2100;
