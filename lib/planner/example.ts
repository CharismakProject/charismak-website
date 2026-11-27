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
      w("top", -75, -75, 3075, -75),
      w("right", 3075, -75, 3075, 1250),
      w("angle", 3075, 1250, 2600, 1875),
      w("bottom", 2600, 1875, -75, 1875),
      w("left", -75, 1875, -75, -75),
    ],
    tags: [{ id: "ex-tag", name: "Kitchen", x: 1500, y: 1100 }],
    openings: [
      { id: "ex-window", wallId: "ex-top", kind: "window", t: (1600 + 75) / 3150, width: 700 },
      { id: "ex-back", wallId: "ex-left", kind: "door", t: 0.5, width: 800, swing: -1 },
      { id: "ex-hall", wallId: "ex-right", kind: "door", t: (550 + 75) / 1325, width: 900, swing: -1 },
    ],
    // The run along the window wall, from the back-door end: 50 gap, 600 cooker, 600 washing machine, 700 sink, 600 fridge.
    items: [
      { id: "ex-cooker", type: "cooker", x: 350, y: 300, w: 600, d: 600, h: 900, rot: 0, label: "Gas cooker" },
      { id: "ex-washer", type: "washer", x: 950, y: 300, w: 600, d: 600, h: 850, rot: 0, label: "Washing machine" },
      { id: "ex-sink", type: "kitchen-sink", x: 1600, y: 300, w: 700, d: 600, h: 900, rot: 0, label: "Sink unit" },
      { id: "ex-worktop", type: "worktop", x: 1300, y: 310, w: 1300, d: 620, h: 30, rot: 0, label: "Worktop" },
      { id: "ex-fridge", type: "fridge", x: 2250, y: 325, w: 600, d: 650, h: 1700, rot: 0, label: "Fridge" },
      { id: "ex-hood", type: "hood", x: 350, y: 250, w: 600, d: 500, h: 150, rot: 0, label: "Chimney hood" },
      { id: "ex-micro", type: "microwave", x: 2250, y: 250, w: 500, d: 400, h: 300, rot: 0, label: "Microwave", mount: 1700 },
      { id: "ex-wallunit", type: "wall-cabinet", x: 950, y: 175, w: 600, d: 350, h: 900, rot: 0, label: "Wall unit", mount: 1500 },
      { id: "ex-unitover", type: "wall-cabinet", x: 2250, y: 175, w: 600, d: 350, h: 300, rot: 0, label: "Unit over fridge", mount: 2100 },
      { id: "ex-cabinets", type: "wall-cabinet", x: 1400, y: 1625, w: 2000, d: 350, h: 900, rot: 180, label: "Wall cabinets, 4 doors", mount: 1500 },
      { id: "ex-counter", type: "fold-counter", x: 1200, y: 1600, w: 1000, d: 400, h: 30, rot: 180, label: "Fold-down counter" },
      { id: "ex-socket1", type: "socket", x: 1000, y: 1740, w: 150, d: 120, h: 90, rot: 0, mount: 1000 },
      { id: "ex-socket2", type: "socket", x: 1400, y: 1740, w: 150, d: 120, h: 90, rot: 0, mount: 1000 },
      { id: "ex-light", type: "bulb", x: 1500, y: 900, w: 250, d: 250, h: 100, rot: 0 },
    ],
    backdrop: null,
    info: { project: "2-bedroom apartment", location: "Mpape, Abuja", revision: "C", notes: "Hall door re-hung to open out into the lobby, resting against the lobby wall with a door stop." },
    sections: [{ id: "ex-cut", label: "", a: { x: 1500, y: -700 }, b: { x: 1500, y: 2500 } }],
  };
}
