import { FINISH_LABEL, catalogItem, itemFinish } from "./catalog";
import { itemMount } from "./elevation";
import type { DetectedRoom, Item, Plan } from "./model";

const mm = (n: number) => `${Math.round(n)}`;

/** A plain-English specification for an item, from its type, size, finish and height; the user can overwrite it. */
export function defaultSpec(it: Item): string {
  const c = catalogItem(it.type);
  const f = itemFinish(it.type, it.finish);
  const fin = f ? FINISH_LABEL[f].toLowerCase() : "";
  const m = itemMount(it), top = m + it.h;
  switch (c?.type) {
    case "base-cabinet": return `Base unit, ${it.w >= 700 ? "2 doors" : "1 door"}, marine plywood carcass, ${fin} fronts, 100 mm plinth, worktop at ${mm(it.h)}.`;
    case "wall-cabinet": return `Wall unit, ${Math.max(1, Math.round(it.w / 450))} door${Math.round(it.w / 450) > 1 ? "s" : ""}, ${fin}, ${mm(m)}–${mm(top)} above floor. LED strip under.`;
    case "worktop": return `Worktop, ${fin}, top at ${mm(top)} above floor.`;
    case "cooker": return `Freestanding 4-burner cooker with oven, ${fin}. Gas or electric supply to suit.`;
    case "hood": return `Chimney hood, ${fin}. Underside ${mm(m)} above floor (650–750 above the burners); chimney cover to the ceiling; ducted out through the external wall.`;
    case "microwave": return `Microwave, ${fin}, at ${mm(m)} above floor with 100 mm clear above.`;
    case "fold-counter": return `Fold-down counter, ${fin} top, on heavy-duty folding brackets at ${mm(top)} high.`;
    case "kitchen-sink": return `Sink base unit, 2 doors, ${fin} fronts; inset stainless bowl with drainer and mixer tap. Water and waste in the unit.`;
    case "fridge": return `Fridge space up to ${mm(it.w)} wide and ${mm(it.h)} high; finished end panel where exposed.`;
    case "washer": return `Washing machine space, front-load, ${mm(it.w)} × ${mm(it.d)} × ${mm(it.h)}; valve and waste connection beside it.`;
    case "wc": return "Close-coupled WC with soft-close seat; cold supply and 110 mm soil connection.";
    case "basin": return `Wash-hand basin on pedestal, rim at ${mm(top)}; mixer tap; hot and cold supply, 32 mm waste.`;
    case "shower": return "Shower tray with glass screen and mixer set; anti-slip floor finish; waterproofing to walls.";
    case "bath": return "Acrylic bath with panel and mixer; waterproofing to surrounding walls.";
    case "ac": return `Split air-conditioner, indoor unit at ${mm(m)} above floor; condensate drain and power by the unit.`;
    case "socket": return `Twin switched socket at ${mm(m)} above floor.`;
    case "switch": return `Light switch at ${mm(m)} above floor.`;
    case "bulb": return "Ceiling light point.";
    case "fan": return "Ceiling fan with regulator.";
    case "water-point": return `Water point at ${mm(m)} above floor with isolation valve.`;
    case "floor-drain": return "Stainless floor drain with trap.";
    default: return `${c?.name ?? it.type}, ${mm(it.w)} × ${mm(it.d)} × ${mm(it.h)}${fin ? `, ${fin}` : ""}.`;
  }
}

export const itemSpec = (it: Item) => (it.spec && it.spec.trim() ? it.spec.trim() : defaultSpec(it));

export type SpecRow = { name: string; size: string; spec: string; qty: number };

/** Specification schedule: items grouped by name, size and wording. */
export function specSchedule(plan: Plan): SpecRow[] {
  const rows = new Map<string, SpecRow>();
  for (const it of plan.items) {
    const c = catalogItem(it.type);
    const name = it.label || c?.name || it.type;
    const size = c?.point ? "—" : `${mm(it.w)} × ${mm(it.d)} × ${mm(it.h)}`;
    const spec = itemSpec(it);
    const k = `${name}|${size}|${spec}`;
    const r = rows.get(k) ?? { name, size, spec, qty: 0 };
    r.qty += 1;
    rows.set(k, r);
  }
  for (const o of plan.openings) {
    const name = o.kind === "door" ? "Door" : "Window";
    const size = o.kind === "door" ? `${mm(o.width)} leaf` : `${mm(o.width)} × 1200`;
    const spec = o.kind === "door" ? "Flush door leaf in frame with lever handle and stop." : "Aluminium framed window, 1200 high on a 900 sill.";
    const k = `${name}|${size}|${spec}`;
    const r = rows.get(k) ?? { name, size, spec, qty: 0 };
    r.qty += 1; rows.set(k, r);
  }
  return [...rows.values()];
}

/** Services the layout needs, worked out from what is placed. */
export function servicesProvision(plan: Plan): string[] {
  const has = (...types: string[]) => plan.items.filter((i) => types.includes(i.type));
  const out: string[] = [];
  const wet = has("kitchen-sink", "washer", "wc", "basin", "shower", "bath", "water-point");
  if (wet.length) out.push(`Water: supplies to ${[...new Set(wet.map((i) => (catalogItem(i.type)?.name ?? i.type).toLowerCase()))].join(", ")}, each with an isolation valve.`);
  const waste = has("kitchen-sink", "washer", "basin", "shower", "bath", "floor-drain");
  if (waste.length) out.push(`Waste: connections for ${[...new Set(waste.map((i) => (catalogItem(i.type)?.name ?? i.type).toLowerCase()))].join(", ")}${has("wc").length ? "; 110 mm soil for the WC" : ""}.`);
  else if (has("wc").length) out.push("Waste: 110 mm soil connection for the WC.");
  const appliances = has("fridge", "washer", "microwave", "ac", "hood");
  const sockets = has("socket").length;
  if (appliances.length || sockets) out.push(`Power: ${sockets ? `${sockets} socket outlet${sockets > 1 ? "s" : ""} as drawn` : "socket outlets to suit"}${appliances.length ? `; dedicated points for ${[...new Set(appliances.map((i) => (i.label || catalogItem(i.type)?.name || i.type).toLowerCase()))].join(", ")}` : ""}.`);
  if (has("cooker").length) out.push("Gas: cooker supply — cylinder outside in a ventilated cage with an approved hose and isolation valve (or an electric cooker circuit).");
  const lights = has("bulb", "fan").length;
  if (lights) out.push(`Lighting: ${has("bulb").length} ceiling light point${has("bulb").length === 1 ? "" : "s"}${has("fan").length ? ` and ${has("fan").length} ceiling fan point${has("fan").length > 1 ? "s" : ""}` : ""}, switched at the door.`);
  if (has("hood").length) out.push("Ventilation: hood ducted out through the external wall.");
  return out;
}

/** Key sizes for the schedule page. */
export function keySizes(plan: Plan, rooms: DetectedRoom[], walkway?: number | null): string[] {
  const out: string[] = [];
  for (const r of rooms) {
    const xs = r.inner.map((p) => p.x), ys = r.inner.map((p) => p.y);
    out.push(`${r.name}: ${mm(Math.max(...xs) - Math.min(...xs))} × ${mm(Math.max(...ys) - Math.min(...ys))} internal, ${r.area.toFixed(1)} m², ${mm(plan.height)} floor to ceiling.`);
  }
  const base = plan.items.filter((i) => ["base-cabinet", "kitchen-sink", "cooker", "worktop"].includes(i.type));
  if (base.length) out.push(`Worktop ${mm(Math.max(...base.map((i) => itemMount(i) + i.h)))} high.`);
  const wallUnits = plan.items.filter((i) => i.type === "wall-cabinet");
  if (wallUnits.length) out.push(`Wall units ${mm(Math.min(...wallUnits.map(itemMount)))} to ${mm(Math.max(...wallUnits.map((i) => itemMount(i) + i.h)))} above floor.`);
  if (walkway) out.push(`Walkway ${mm(walkway)} clear (section).`);
  const doors = plan.openings.filter((o) => o.kind === "door").map((o) => mm(o.width));
  if (doors.length) out.push(`Doors: ${doors.join(", ")} mm leaves, 2100 high.`);
  return out;
}
