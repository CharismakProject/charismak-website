import { AFRICA_PRICE_ITEMS } from "@/lib/pricing/africa-catalog";

/** Items a visitor can place in the Space Planner. Sizes in millimetres (w = width, d = depth, h = height). */
export type ItemCategory = "Furniture" | "Kitchen" | "Bathroom" | "Electrical" | "Plumbing";
export type Symbol = "box" | "chair" | "table" | "bed" | "sofa" | "wardrobe" | "tv" | "cabinet" | "cooker" | "fridge" | "sink" | "washer" | "wc" | "basin" | "shower" | "bath" | "bulb" | "socket" | "switch" | "ac" | "fan" | "tap" | "drain";

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
};

export const CATALOG: CatalogItem[] = [
  { type: "chair", name: "Chair", category: "Furniture", w: 450, d: 500, h: 900, symbol: "chair" },
  { type: "table", name: "Dining table", category: "Furniture", w: 1600, d: 900, h: 750, symbol: "table" },
  { type: "desk", name: "Desk", category: "Furniture", w: 1200, d: 600, h: 750, symbol: "table" },
  { type: "bed", name: "Bed (double)", category: "Furniture", w: 1500, d: 2000, h: 500, symbol: "bed" },
  { type: "sofa", name: "Sofa (3-seat)", category: "Furniture", w: 2100, d: 900, h: 850, symbol: "sofa" },
  { type: "wardrobe", name: "Wardrobe", category: "Furniture", w: 1800, d: 600, h: 2100, symbol: "wardrobe" },
  { type: "tv-unit", name: "TV unit", category: "Furniture", w: 1800, d: 450, h: 500, symbol: "tv" },
  { type: "base-cabinet", name: "Base cabinet", category: "Kitchen", w: 600, d: 600, h: 900, symbol: "cabinet" },
  { type: "wall-cabinet", name: "Wall cabinet", category: "Kitchen", w: 600, d: 350, h: 700, symbol: "cabinet", mount: 1450 },
  { type: "cooker", name: "Cooker", category: "Kitchen", w: 600, d: 600, h: 900, symbol: "cooker" },
  { type: "fridge", name: "Fridge", category: "Kitchen", w: 600, d: 650, h: 1800, symbol: "fridge" },
  { type: "kitchen-sink", name: "Kitchen sink", category: "Kitchen", w: 1000, d: 600, h: 900, symbol: "sink" },
  { type: "washer", name: "Washing machine", category: "Kitchen", w: 600, d: 600, h: 850, symbol: "washer" },
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
