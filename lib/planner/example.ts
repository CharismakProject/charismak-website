import type { Plan } from "./model";

/**
 * Example plan: a version of the CPNL Mpape kitchen (Rev C). Walls are drawn on their centre-lines around a
 * 3000 × 1800 kitchen with an angled corner by the lobby, a 700 window over the sink, an 800 back door and a
 * 900 hall door. Loaded from the "Load example" button so visitors can see how the Space Planner works.
 */
export function examplePlan(): Plan {
  const w = (id: string, ax: number, ay: number, bx: number, by: number) => ({ id: `ex-${id}`, a: { x: ax, y: ay }, b: { x: bx, y: by }, thickness: 150 });
  return {
    version: 1,
    title: "Kitchen — 2-bedroom apartment, Mpape",
    height: 3000,
    walls: [
      w("top", 0, 0, 3000, 0),
      w("right", 3000, 0, 3000, 1250),
      w("angle", 3000, 1250, 2550, 1800),
      w("bottom", 2550, 1800, 0, 1800),
      w("left", 0, 1800, 0, 0),
    ],
    tags: [{ id: "ex-tag", name: "Kitchen", x: 1500, y: 1100 }],
    openings: [
      { id: "ex-window", wallId: "ex-top", kind: "window", t: 1600 / 3000, width: 700 },
      { id: "ex-back", wallId: "ex-left", kind: "door", t: 0.5, width: 800, swing: -1 },
      { id: "ex-hall", wallId: "ex-right", kind: "door", t: 0.5, width: 900, swing: -1 },
    ],
    items: [
      { id: "ex-cooker", type: "cooker", x: 425, y: 375, w: 600, d: 600, h: 900, rot: 0, label: "Gas cooker" },
      { id: "ex-washer", type: "washer", x: 1025, y: 375, w: 600, d: 600, h: 850, rot: 0, label: "Washing machine" },
      { id: "ex-sink", type: "kitchen-sink", x: 1675, y: 375, w: 700, d: 600, h: 900, rot: 0, label: "Sink unit" },
      { id: "ex-fridge", type: "fridge", x: 2325, y: 400, w: 600, d: 650, h: 1700, rot: 0, label: "Fridge" },
      { id: "ex-wallunit", type: "wall-cabinet", x: 1025, y: 250, w: 600, d: 350, h: 900, rot: 0, label: "Wall unit", mount: 1500 },
      { id: "ex-cabinets", type: "wall-cabinet", x: 1300, y: 1550, w: 2000, d: 350, h: 900, rot: 180, label: "Wall cabinets, 4 doors", mount: 1500 },
      { id: "ex-counter", type: "desk", x: 1500, y: 1525, w: 1000, d: 400, h: 30, rot: 180, label: "Fold-down counter", mount: 870 },
      { id: "ex-socket1", type: "socket", x: 1200, y: 1680, w: 150, d: 120, h: 90, rot: 0, mount: 1000 },
      { id: "ex-socket2", type: "socket", x: 1800, y: 1680, w: 150, d: 120, h: 90, rot: 0, mount: 1000 },
      { id: "ex-light", type: "bulb", x: 1500, y: 900, w: 250, d: 250, h: 100, rot: 0 },
    ],
    backdrop: null,
  };
}
