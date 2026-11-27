"use client";

import { FINISH_COLOUR, catalogItem, itemFinish, type Finish } from "./catalog";
import type { Item } from "./model";

type THREE = typeof import("three");
type Group = import("three").Group;
type Material = import("three").Material;

/**
 * Detailed 3D models for Space Planner items, built from simple shapes (boxes, cylinders) in the style of the
 * CPNL drawing sets: cabinets with doors and handles, cooker with burners and oven door, washing machine drum,
 * sink with bowl and tap, fridge handles, hood with chimney, and so on.
 * Local frame: millimetres, origin on the floor (or the mounting height) at the item's centre, width along x,
 * depth along z, height up; the item's FRONT faces +z (the plan symbol's front edge).
 */
export function makeMaterials(T: THREE) {
  const cache = new Map<string, Material>();
  const get = (color: number, rough = 0.6, metal = 0, opacity = 1, emissive = 0) => {
    const key = `${color}-${rough}-${metal}-${opacity}-${emissive}`;
    if (!cache.has(key)) cache.set(key, new T.MeshStandardMaterial({ color, roughness: rough, metalness: metal, transparent: opacity < 1, opacity, emissive, emissiveIntensity: emissive ? 0.9 : 0 }));
    return cache.get(key)!;
  };
  const finish = (f: Finish | undefined, fallback = 0xe9e9e6) => { const c = f ? FINISH_COLOUR[f] : null; return c ? get(c.color, c.rough, c.metal ?? 0) : get(fallback); };
  return {
    get, finish,
    dark: get(0x2b2f36, 0.7), black: get(0x1b1e22, 0.3), glass: get(0x1f262e, 0.15, 0.2), clearGlass: get(0x9fc9ef, 0.05, 0, 0.35),
    handle: get(0x2a2d33, 0.4, 0.5), chrome: get(0xd5d9dd, 0.15, 0.9), steel: get(0xb9bec4, 0.35, 0.6), white: get(0xf7f8f8, 0.4),
    porcelain: get(0xfbfbfa, 0.15), fabric: get(0x7d8590, 0.95), cushion: get(0x9aa2ad, 0.95), mattress: get(0xf2f0eb, 0.9), wood: get(0xc9a074, 0.6),
    grout: get(0xcfc9be, 0.9), all: () => [...cache.values()],
  };
}
export type Mats = ReturnType<typeof makeMaterials>;

export function buildItem(T: THREE, M: Mats, it: Item, ceiling: number): Group {
  const g = new T.Group();
  const w = it.w, d = it.d, h = it.h;
  const c = catalogItem(it.type);
  const fin = M.finish(itemFinish(it.type, it.finish));
  const box = (bw: number, bh: number, bd: number, mat: Material, x: number, y: number, z: number, rotY = 0) => {
    if (bw <= 0 || bh <= 0 || bd <= 0) return;
    const m = new T.Mesh(new T.BoxGeometry(bw, bh, bd), mat);
    m.position.set(x, y + bh / 2, z); m.rotation.y = rotY; g.add(m); return m;
  };
  const cyl = (rt: number, rb: number, ch: number, mat: Material, x: number, y: number, z: number, seg = 24, axis: "y" | "z" | "x" = "y") => {
    const m = new T.Mesh(new T.CylinderGeometry(rt, rb, ch, seg), mat);
    if (axis === "z") { m.rotation.x = Math.PI / 2; m.position.set(x, y, z); } else if (axis === "x") { m.rotation.z = Math.PI / 2; m.position.set(x, y, z); } else m.position.set(x, y + ch / 2, z);
    g.add(m); return m;
  };
  const front = d / 2;
  /** Cabinet doors across the front: n doors from y0 to y1, handles at the top or bottom. */
  const doors = (n: number, y0: number, y1: number, mat: Material, handleAt: "top" | "bottom" | "middle") => {
    const gap = 4, dw = (w - gap * (n + 1)) / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + gap + dw / 2 + i * (dw + gap);
      box(dw, y1 - y0 - gap * 2, 18, mat, x, y0 + gap, front + 9);
      const hx = x + (i % 2 === 0 ? 1 : -1) * (n > 1 ? dw / 2 - 40 : dw / 2 - 40) * (n > 1 ? 1 : 1);
      const hy = handleAt === "top" ? y1 - 180 : handleAt === "bottom" ? y0 + 40 : (y0 + y1) / 2 - 70;
      box(12, 140, 14, M.handle, n === 1 ? w / 2 - 50 : hx, hy, front + 25);
    }
  };

  switch (c?.symbol) {
    case "cabinet": {
      if ((c.mount ?? 0) > 0 || (it.mount ?? 0) > 1000) { // wall cabinet
        box(w, h, d - 18, fin, 0, 0, -9);
        doors(Math.max(1, Math.round(w / 450)), 0, h, fin, "bottom");
      } else {
        box(w - 40, 100, d - 60, M.dark, 0, 0, -30);
        box(w, h - 130, d - 18, fin, 0, 100, -9);
        doors(w >= 700 ? 2 : 1, 100, h - 30, fin, "top");
        box(w, 30, d + 20, M.finish("light-grey"), 0, h - 30, 10);
      }
      break;
    }
    case "worktop": box(w, h, d, fin, 0, 0, 0); break;
    case "cooker": {
      box(w, h - 40, d, fin, 0, 0, 0);
      box(w, 40, d, M.black, 0, h - 40, 0);
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cyl(w * 0.1, w * 0.11, 12, M.dark, a * w * 0.22, h, b * d * 0.2);
      box(w - 80, h - 360, 10, M.glass, 0, 120, front + 5);
      box(w - 140, 20, 30, M.chrome, 0, h - 230, front + 20);
      for (let i = 0; i < 4; i++) cyl(18, 18, 24, M.dark, -w * 0.3 + i * w * 0.2, h - 90, front + 12, 16, "z");
      box(w, 100, 4, M.black, 0, 0, front + 2);
      break;
    }
    case "washer": {
      box(w, h, d, fin, 0, 0, 0);
      box(w - 20, 90, 6, M.get(0xe1e4e8, 0.4), 0, h - 100, front + 3);
      const r = Math.min(w, h) * 0.3, cy = h * 0.45;
      cyl(r, r, 40, M.get(0x9aa1a9, 0.3, 0.4), 0, cy, front + 20, 32, "z");
      cyl(r * 0.78, r * 0.78, 46, M.glass, 0, cy, front + 23, 32, "z");
      break;
    }
    case "fridge": {
      box(w, h, d, fin, 0, 0, 0);
      box(w + 2, 8, 6, M.dark, 0, h * 0.62, front + 3);
      box(18, Math.min(500, h * 0.25), 30, M.handle, w / 2 - 60, h * 0.68, front + 15);
      box(18, Math.min(700, h * 0.35), 30, M.handle, w / 2 - 60, h * 0.18, front + 15);
      break;
    }
    case "microwave": {
      box(w, h, d, fin, 0, 0, 0);
      box(w * 0.6, h * 0.7, 6, M.glass, -w * 0.15, h * 0.15, front + 3);
      box(w * 0.22, h * 0.7, 6, M.get(0x30353c, 0.5), w * 0.33, h * 0.15, front + 3);
      break;
    }
    case "hood": {
      const canopy = 300;
      box(w, h, d, M.steel, 0, 0, 0);
      // Square frustum: a 4-sided cylinder turned 45° so its base is a unit square, then stretched to w × canopy × d.
      const m = new T.Mesh(new T.CylinderGeometry(0.36, 0.7071, 1, 4, 1), M.steel);
      m.rotation.y = Math.PI / 4; m.position.y = 0.5;
      const holder = new T.Group(); holder.add(m); holder.scale.set(w, canopy, d); holder.position.set(0, h, 0); g.add(holder);
      const top = (it.mount ?? c.mount ?? 1600) + h + canopy;
      box(w * 0.32, Math.max(0, ceiling - top), d * 0.4, M.steel, 0, h + canopy, -d * 0.2);
      break;
    }
    case "counter": {
      box(w, h, d, fin, 0, 0, 0);
      for (const sx of [-1, 1]) { box(30, 30, d * 0.9, M.dark, sx * (w / 2 - 120), -40, -d * 0.05); box(30, 280, 30, M.dark, sx * (w / 2 - 120), -300, -d / 2 + 30); }
      break;
    }
    case "sink": {
      box(w - 40, 100, d - 60, M.dark, 0, 0, -30);
      box(w, h - 130, d - 18, fin, 0, 100, -9);
      doors(2, 100, h - 30, fin, "top");
      box(w, 30, d + 20, M.finish("light-grey"), 0, h - 30, 10);
      box(w * 0.5, 4, d * 0.62, M.steel, -w * 0.18, h, 10);
      box(w * 0.42, 6, d * 0.5, M.get(0x7f868e, 0.35, 0.5), -w * 0.18, h + 1, 10);
      box(w * 0.3, 4, d * 0.62, M.steel, w * 0.27, h, 10);
      for (let i = 0; i < 4; i++) box(4, 6, d * 0.5, M.get(0x8d949b, 0.4, 0.5), w * 0.17 + i * 30, h + 2, 10);
      cyl(14, 16, 260, M.chrome, -w * 0.18, h, -d / 2 + 70);
      const spout = cyl(10, 10, 180, M.chrome, -w * 0.18, h + 250, -d / 2 + 155, 16, "z"); void spout;
      break;
    }
    case "chair": {
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(35, 430, 35, fin, a * (w / 2 - 30), 0, b * (d / 2 - 30));
      box(w, 40, d, fin, 0, 430, 0);
      box(w, h - 470, 30, fin, 0, 470, -d / 2 + 15);
      break;
    }
    case "table": {
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(60, h - 30, 60, fin, a * (w / 2 - 70), 0, b * (d / 2 - 70));
      box(w, 30, d, fin, 0, h - 30, 0);
      break;
    }
    case "bed": {
      box(w, 300, d, M.wood, 0, 0, 0);
      box(w - 40, 220, d - 80, M.mattress, 0, 300, 20);
      box(w, 1000, 60, M.wood, 0, 0, -d / 2 + 30);
      for (const sx of [-1, 1]) box(w * 0.38, 120, 380, M.white, sx * w * 0.22, 520, -d / 2 + 280);
      break;
    }
    case "sofa": {
      box(w, 420, d, M.fabric, 0, 0, 0);
      box(w, h - 420, 220, M.fabric, 0, 420, -d / 2 + 110);
      for (const sx of [-1, 1]) box(180, 230, d, M.fabric, sx * (w / 2 - 90), 420, 0);
      const seats = Math.max(1, Math.round((w - 360) / 600)), sw = (w - 360) / seats;
      for (let i = 0; i < seats; i++) box(sw - 20, 120, d - 260, M.cushion, -w / 2 + 180 + sw / 2 + i * sw, 420, 110);
      break;
    }
    case "wardrobe": {
      box(w, h, d - 18, fin, 0, 0, -9);
      doors(Math.max(2, Math.round(w / 600)), 0, h, fin, "middle");
      break;
    }
    case "tv": {
      box(w, h, d, fin, 0, 0, 0);
      box(Math.min(w * 0.75, 1450), 820, 50, M.black, 0, h + 80, -d / 4);
      box(250, 80, 180, M.dark, 0, h, -d / 4);
      break;
    }
    case "wc": {
      box(w * 0.95, 400, 180, M.porcelain, 0, 380, -d / 2 + 90);
      const bowl = cyl(w / 2, w * 0.42, 400, M.porcelain, 0, 0, d * 0.08, 32); bowl.scale.z = (d * 0.62) / w;
      const seat = cyl(w / 2, w / 2, 20, M.white, 0, 400, d * 0.08, 32); seat.scale.z = (d * 0.62) / w;
      break;
    }
    case "basin": {
      const bowl = cyl(w / 2, w * 0.35, h, M.porcelain, 0, 0, 0, 32); bowl.scale.z = d / w;
      cyl(70, 90, it.mount ?? c.mount ?? 650, M.porcelain, 0, -(it.mount ?? c.mount ?? 650), -d * 0.1);
      cyl(12, 14, 160, M.chrome, 0, h, -d / 2 + 50);
      break;
    }
    case "shower": {
      box(w, 50, d, M.porcelain, 0, 0, 0);
      box(w, 1900, 10, M.clearGlass, 0, 50, d / 2 - 5);
      box(10, 1900, d, M.clearGlass, w / 2 - 5, 50, 0);
      cyl(15, 15, 1900, M.chrome, -w / 2 + 60, 0, -d / 2 + 60);
      cyl(90, 90, 20, M.chrome, -w / 2 + 160, 1950, -d / 2 + 120);
      break;
    }
    case "bath": {
      box(w, h, d, M.porcelain, 0, 0, 0);
      box(w - 120, 30, d - 120, M.get(0xe6ebef, 0.2), 0, h - 25, 0);
      break;
    }
    case "ac": {
      box(w, h, d, M.white, 0, 0, 0);
      box(w - 60, 20, 8, M.get(0x8a919a, 0.5), 0, 40, front + 4);
      break;
    }
    case "fan": {
      const y0 = ceiling - (it.mount ?? 0);
      cyl(60, 60, 60, M.white, 0, y0 - 400, 0);
      cyl(12, 12, 340, M.white, 0, y0 - 340, 0);
      for (const a of [0, 120, 240]) box(w / 2 - 60, 8, 120, M.wood, 0, y0 - 380, 0, (a * Math.PI) / 180)!.position.set(Math.cos((a * Math.PI) / 180) * (w / 4), y0 - 376, -Math.sin((a * Math.PI) / 180) * (w / 4));
      break;
    }
    case "bulb": {
      const y0 = ceiling - (it.mount ?? 0);
      cyl(60, 60, 20, M.white, 0, y0 - 20, 0);
      const s = new T.Mesh(new T.SphereGeometry(55, 20, 14), M.get(0xfff5d6, 0.3, 0, 1, 0xfff1c0)); s.position.set(0, y0 - 110, 0); g.add(s);
      break;
    }
    case "socket": case "switch": {
      box(Math.max(86, w * 0.6), 86, 12, M.white, 0, 0, 0);
      box(30, 30, 4, M.get(0x9aa0a6), 0, 28, 8);
      break;
    }
    case "tap": cyl(12, 12, 120, M.chrome, 0, 0, 0); break;
    case "drain": box(w, 6, d, M.steel, 0, 0, 0); break;
    default: box(w, h, d, fin, 0, 0, 0);
  }
  return g;
}
