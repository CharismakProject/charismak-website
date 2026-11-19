/**
 * "Play construction": the order a Charismak site builds in, applied to a Quick design scene graph.
 * Pure functions: each stage returns a copy of the scene with later work hidden, walls cut down to
 * the height reached, and finishes held back until the finishing stage.
 */

type Node = { id: string; type: string; parentId: string | null; visible?: boolean; [key: string]: unknown };

export const BUILD_STAGES = [
  { title: "Site clearing & perimeter fence", note: "Clear the plot, peg the boundary and put up the fence/hoarding." },
  { title: "Setting out, foundations & ground slab", note: "Excavate trenches, blinding, strip footing, blockwork to DPC, hardcore, DPM and the ground floor slab. Septic tank and soakaway dug." },
  { title: "Blockwork to lintel level", note: "Sandcrete blockwork raised in lifts to window-head height, openings left for doors and windows." },
  { title: "Lintels, upper floor & walls to roof level", note: "Lintels cast, walls completed to wall-plate level; on a duplex the first floor slab, staircase and upper walls." },
  { title: "Roofing", note: "Roof carcass and long-span aluminium covering, fascia and ridge." },
  { title: "Doors, windows, ceilings & finishes", note: "Frames and windows fixed, POP ceilings, plaster, floor tiles and painting." },
  { title: "Fittings, furniture & external works", note: "Sanitary fittings, kitchen, furniture, driveway, walkway and landscaping. Ready for handover." },
] as const;

export const LAST_STAGE = BUILD_STAGES.length - 1;

const LOW_WALL = 0.9; // foundation blockwork above ground, to DPC
const LINTEL_WALL = 2.1;
const BARE = "library:concrete-stucco";
const BARE_FLOOR = "library:concrete-polished";

/** The scene as it stands at the end of `stage` (0 … LAST_STAGE). */
export function stageNodes<N extends Node>(nodes: Record<string, N>, stage: number, half: { width: number; length: number }): Record<string, N> {
  if (stage >= LAST_STAGE) return nodes;
  const levelOf = (node: N | undefined): number => {
    for (let guard = 0; node && guard < 12; guard += 1) {
      if (node.type === "level") return Number(node.level ?? 0);
      node = node.parentId ? nodes[node.parentId] : undefined;
    }
    return 0;
  };
  const finished = stage >= 5;
  const out: Record<string, N> = {};
  for (const [id, node] of Object.entries(nodes)) {
    const level = levelOf(node);
    const hide = () => ({ ...node, visible: false });
    let next: N = node;
    switch (node.type) {
      case "wall": {
        if (node.wallType === "railing") { next = finished ? node : hide(); break; }
        const height = Number(node.height ?? 3);
        if (level > 0) { next = stage >= 3 ? node : hide(); }
        else if (stage === 0) next = hide();
        else if (stage === 1) next = { ...node, height: Math.min(height, LOW_WALL) };
        else if (stage === 2) next = { ...node, height: Math.min(height, LINTEL_WALL) };
        if (!finished && next.visible !== false) {
          next = { ...next, ...(node.exteriorMaterialPreset ? { exteriorMaterialPreset: BARE, interiorMaterialPreset: BARE } : {}), ...(node.materialPreset ? { materialPreset: BARE } : {}) };
        }
        break;
      }
      case "door":
      case "window":
        next = finished ? node : hide();
        break;
      case "slab": {
        const meta = (node.metadata ?? {}) as { external?: boolean; name?: string };
        if (meta.external) {
          const early = /septic|soakaway|porch|steps|terrace/i.test(String(meta.name));
          next = (early ? stage >= 1 : false) ? node : hide();
        } else {
          next = stage >= (level > 0 ? 3 : 1) ? (finished ? node : { ...node, materialPreset: BARE_FLOOR }) : hide();
        }
        break;
      }
      case "stair":
        next = stage >= 3 ? node : hide();
        break;
      case "roof":
      case "roof-segment":
        next = stage >= 4 ? node : hide();
        break;
      case "ceiling":
      case "zone":
        next = hide(); // ceilings and room overlays appear with the finished building
        break;
      case "item": {
        const [x = 0, , z = 0] = (node.position as number[] | undefined) ?? [];
        const outdoor = Math.abs(x) > half.width || Math.abs(z) > half.length;
        const asset = String((node.asset as { id?: string } | undefined)?.id ?? "");
        const existingPlanting = outdoor && /palm|tree|bush/.test(asset);
        next = existingPlanting ? node : hide();
        break;
      }
      default:
        break;
    }
    out[id] = next;
  }
  return out;
}

/** Which stage a priced line is spent in, for the running cost. */
export function lineStage(line: { group: string; slug: string }): number {
  if (/plaster|paint|tiling|tile|screed/.test(line.slug) || line.group === "Ceilings" || line.group === "Doors & windows") return 5;
  if (line.group === "Roof") return 4;
  if (line.group === "Walls") return 3; // blockwork, split 2/3 below
  return 1; // substructure, slabs, concrete, mesh, formwork
}

export function costToStage(lines: { group: string; slug: string; amount: number }[], stage: number) {
  return lines.reduce((sum, line) => {
    const s = lineStage(line);
    if (s === 3 && stage === 2) return sum + line.amount * 0.6; // blockwork to lintel ≈ 60% of the wall
    return s <= stage ? sum + line.amount : sum;
  }, 0);
}
