import type { Rarity } from "@/lib/garden";
import type { Colors, Frond, Head, Lobe, Petal, PlantModel } from "./types";
import { PALETTE, DEAD } from "./palette";
import { TAU, makeRng, cubic, shiftOklch } from "./geometry";

// archetype → render family + stem material. Duplicates bias the random pick.
export const ARCHES = [
  "round", "round", "oak", "conifer", "palm", "willow", "birch", "bonsai",
  "daisy", "daisy", "tulip", "spire", "bell", "sunflower", "lotus",
  "fern", "succulent", "bush", "cactus", "mushroom",
] as const;
export type Arch = (typeof ARCHES)[number];

const WOOD = new Set<Arch>(["round", "oak", "conifer", "palm", "willow", "birch", "bonsai"]);
const STRAIGHT = new Set<Arch>(["conifer", "palm", "birch", "spire", "sunflower", "cactus", "mushroom", "succulent", "fern", "bonsai"]);

export function buildPlant(seed: string, rawStage: number, dead: boolean, rarity: Rarity): PlantModel {
  const idRng = makeRng(`${seed}|id`);
  const arch: Arch = ARCHES[Math.floor(idRng() * ARCHES.length)]!;
  // per-plant overall size — some runts, some giants (rooted at the base)
  const scale = 0.68 + idRng() * 0.64; // 0.68 .. 1.32

  const base = dead ? DEAD : PALETTE[rarity];
  const colors: Colors = dead
    ? base
    : {
        light: shiftOklch(base.light, (idRng() - 0.5) * 0.06, 0, (idRng() - 0.5) * 16),
        dark: shiftOklch(base.dark, (idRng() - 0.5) * 0.05, 0, (idRng() - 0.5) * 16),
        accent: shiftOklch(base.accent, (idRng() - 0.5) * 0.05, 0, (idRng() - 0.5) * 12),
        glow: base.glow,
      };

  const stem: PlantModel["stem"] = arch === "cactus" ? "cactus" : arch === "mushroom" ? "shroom" : WOOD.has(arch) ? "wood" : "green";

  const rng = makeRng(`${seed}|${rawStage}|${dead ? "d" : "a"}`);
  const s = Math.max(0, Math.min(4, rawStage));
  const straight = STRAIGHT.has(arch);

  const baseX = 100;
  const baseY = 208;
  const short = arch === "cactus" || arch === "mushroom" || arch === "succulent" || arch === "bush";
  const lean = (rng() - 0.5) * (dead ? 34 : straight ? 10 : stem === "green" ? 18 : 26);
  const h = (30 + s * 32) * (dead ? 0.8 : 1) * (stem === "green" ? 0.94 : 1) * (short ? 0.55 : 1);

  const c1x = baseX + lean * 0.25;
  const c1y = baseY - h * 0.38;
  const c2x = baseX - lean * 0.35;
  const c2y = baseY - h * 0.72;
  const topX = baseX + lean + (dead ? lean * 0.5 + 10 : 0);
  const topY = baseY - h + (dead ? h * 0.22 : 0);
  const stemPath = `M${baseX} ${baseY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${topX.toFixed(1)} ${topY.toFixed(1)}`;
  const crown = { x: topX, y: topY, r: 11 + s * 7 };

  // stem leaves (sprout pair at stage 0). Bare-stem archetypes skip them.
  const bareStem = arch === "palm" || arch === "spire" || arch === "sunflower" || arch === "cactus" || arch === "mushroom" || arch === "fern" || arch === "succulent";
  const stemLeaves: PlantModel["stemLeaves"] = [];
  const lc = s === 0 ? 2 : bareStem ? 0 : Math.min(3, s);
  for (let i = 0; i < lc; i++) {
    const t = s === 0 ? 0.9 : 0.3 + (i / Math.max(1, lc)) * 0.42;
    const px = cubic(t, baseX, c1x, c2x, topX);
    const py = cubic(t, baseY, c1y, c2y, topY);
    const side = i % 2 === 0 ? -1 : 1;
    const rot = side * (38 + rng() * 26) + (dead ? side * 35 : 0);
    const scale = (s === 0 ? 0.72 : 0.45 + s * 0.07) * (0.8 + rng() * 0.4);
    stemLeaves.push({ x: px, y: py, rot, scale });
  }

  const head: Head = s === 0 ? { kind: "none" } : buildHead(arch, s, dead, crown, rng, { baseX, baseY, c1x, c1y, c2x, c2y, topX, topY }, trunkFor(arch, s));

  const sparkles: PlantModel["sparkles"] = [];
  if (!dead) {
    for (let i = 0; i < 8; i++) {
      const ang = rng() * TAU;
      const dist = crown.r * (1.0 + rng() * 0.5);
      sparkles.push({ x: crown.x + Math.cos(ang) * dist, y: crown.y + Math.sin(ang) * dist - 4, r: 1.3 + rng() * 1.5, delay: rng() * 2 });
    }
  }

  return { stem, stemPath, trunkW: trunkFor(arch, s), crown, stemLeaves, sparkles, head, colors, scale };
}

function trunkFor(arch: Arch, s: number) {
  if (arch === "cactus") return 11 + s * 2.6;
  if (arch === "mushroom") return 6 + s * 2.2;
  if (WOOD.has(arch)) return 3 + s * 1.7;
  return 1.8 + s * 0.8;
}

interface Stem {
  baseX: number; baseY: number; c1x: number; c1y: number; c2x: number; c2y: number; topX: number; topY: number;
}

function buildHead(arch: Arch, s: number, dead: boolean, crown: { x: number; y: number; r: number }, rng: () => number, stem: Stem, trunkW: number): Head {
  switch (arch) {
    case "round":
    case "oak":
    case "bush":
    case "birch": {
      const spreadX = arch === "birch" ? 0.55 : arch === "bush" ? 1.5 : 1;
      const spreadY = arch === "birch" ? 1.5 : arch === "bush" ? 0.5 : 0.8;
      const rMul = arch === "bush" ? 0.9 : 1;
      const lobes = roundLobes(crown, s, rng, spreadX, spreadY, rMul);
      const blooms: { x: number; y: number; r: number }[] = [];
      const k = arch === "oak" ? 5 + Math.round(rng() * 4) : s >= 3 ? 3 + Math.round(rng() * 3) : 0;
      if (!dead) {
        for (let i = 0; i < k; i++) {
          const ang = rng() * TAU;
          const dist = crown.r * (0.2 + rng() * 0.7);
          blooms.push({ x: crown.x + Math.cos(ang) * dist * spreadX, y: crown.y + Math.sin(ang) * dist * spreadY, r: 3 + rng() * 2.2 });
        }
      }
      return { kind: "round", lobes, blooms };
    }
    case "bonsai": {
      const pads: { x: number; y: number; rx: number; ry: number }[] = [];
      const n = Math.min(3, 1 + s);
      for (let i = 0; i < n; i++) {
        const ox = (i - (n - 1) / 2) * crown.r * 0.9;
        pads.push({ x: crown.x + ox, y: crown.y + i * 4 - 2, rx: crown.r * (0.7 - i * 0.12), ry: crown.r * 0.4 });
      }
      return { kind: "pads", pads };
    }
    case "conifer": {
      const tiers: { cx: number; cy: number; w: number; h: number }[] = [];
      const n = 2 + s;
      const step = (crown.r * 1.7 * 0.9) / n;
      for (let i = 0; i < n; i++) {
        const cy = crown.y + i * step + 6;
        const w = crown.r * 0.5 + ((i + 1) * (crown.r * 0.55)) / n + 3;
        tiers.push({ cx: crown.x, cy, w, h: step + crown.r * 0.5 });
      }
      return { kind: "conifer", tiers: tiers.reverse() };
    }
    case "palm":
      return { kind: "fan", fronds: fan(crown, rng, 3 + s, -90, 140, crown.r * 1.5, 0.16, 12) };
    case "fern":
      return { kind: "fan", fronds: fan(crown, rng, 5 + s, -90, 180, crown.r * 1.7, 0.1, 10) };
    case "succulent":
      return { kind: "fan", fronds: fan(crown, rng, 6 + s, -90, 320, crown.r * 0.9, 0.42, 6) };
    case "willow": {
      const lobes = roundLobes(crown, s, rng, 1, 0.8, 0.8);
      const strands: { x: number; y: number; len: number; bend: number }[] = [];
      const n = 3 + s;
      for (let i = 0; i < n; i++) {
        const ang = Math.PI * (0.15 + (i / Math.max(1, n - 1)) * 0.7);
        strands.push({ x: crown.x + Math.cos(ang) * crown.r * 0.9, y: crown.y + Math.abs(Math.sin(ang)) * crown.r * 0.4 + 4, len: crown.r * (0.8 + rng() * 0.8), bend: (rng() - 0.5) * 6 });
      }
      return { kind: "willow", lobes, strands };
    }
    case "tulip": {
      const petals: Petal[] = [];
      const n = 3 + (s >= 4 ? 1 : 0);
      const len = 10 + s * 4;
      for (let i = 0; i < n; i++) petals.push({ ang: (i - (n - 1) / 2) * 16, len: len * (0.9 + rng() * 0.2), w: len * 0.34 });
      return { kind: "tulip", cx: crown.x, cy: crown.y, petals };
    }
    case "spire": {
      const blossoms: { x: number; y: number; r: number }[] = [];
      const n = 4 + s * 2;
      for (let i = 0; i < n; i++) {
        const t = 0.5 + (i / n) * 0.5;
        const px = cubic(t, stem.baseX, stem.c1x, stem.c2x, stem.topX) + (i % 2 === 0 ? -1 : 1) * (2 + rng() * 3);
        const py = cubic(t, stem.baseY, stem.c1y, stem.c2y, stem.topY);
        blossoms.push({ x: px, y: py, r: 2.4 + (1 - t) * 2.5 });
      }
      return { kind: "spire", blossoms };
    }
    case "bell": {
      const bells: { x: number; y: number; w: number; h: number }[] = [];
      const n = s === 1 ? 1 : Math.min(3, s);
      for (let i = 0; i < n; i++) bells.push({ x: crown.x + (i - (n - 1) / 2) * crown.r * 0.7, y: crown.y + 2 + rng() * 3, w: 4 + s * 1.4, h: 8 + s * 2.4 });
      return { kind: "bell", bells };
    }
    case "sunflower": {
      const petals: Petal[] = [];
      const n = 12 + s * 2;
      const len = 6 + s * 2.2;
      for (let i = 0; i < n; i++) petals.push({ ang: (i / n) * 360, len: len * (0.9 + rng() * 0.2), w: len * 0.28 });
      return { kind: "daisy", cx: crown.x, cy: crown.y, petals, centerR: crown.r * 0.55, bud: s === 1, budLen: 9 + s * 2 };
    }
    case "lotus": {
      const petals: Petal[] = [];
      const n = 7 + s;
      const len = 7 + s * 3;
      for (let i = 0; i < n; i++) petals.push({ ang: (i / n) * 360 + (rng() - 0.5) * 6, len: len * (0.85 + rng() * 0.2), w: len * 0.6 });
      return { kind: "daisy", cx: crown.x, cy: crown.y, petals, centerR: 2 + s, bud: s === 1, budLen: 8 + s * 2 };
    }
    case "cactus": {
      const arms: { x: number; y: number; dir: number; out: number; up: number }[] = [];
      const armN = s >= 2 ? Math.min(2, s - 1) : 0;
      for (let i = 0; i < armN; i++) {
        const dir = i % 2 === 0 ? -1 : 1;
        const ay = crown.y + crown.r * (0.7 + i * 0.5);
        arms.push({ x: crown.x, y: ay, dir, out: 5 + s, up: 8 + s * 3 });
      }
      const spines: { x: number; y: number }[] = [];
      const sN = 4 + s * 2;
      for (let i = 0; i < sN; i++) {
        const t = i / sN;
        spines.push({ x: crown.x + (i % 2 === 0 ? -1 : 1) * (trunkW * 0.45), y: crown.y + 4 + t * (crown.r * 2.4) });
      }
      const flower = !dead && s >= 3 ? { x: crown.x, y: crown.y - 2, r: 3 + rng() * 2 } : null;
      return { kind: "cactus", arms, spines, flower };
    }
    case "mushroom":
    default: {
      const rx = crown.r * (1.1 + s * 0.05);
      const cap = { cx: crown.x, cy: crown.y + 2, rx, ry: crown.r * 0.8 };
      const spots: { x: number; y: number; r: number }[] = [];
      const n = 2 + s;
      for (let i = 0; i < n; i++) spots.push({ x: cap.cx + (rng() - 0.5) * rx * 1.2, y: cap.cy - cap.ry * (0.3 + rng() * 0.8), r: 1.2 + rng() * 1.8 });
      return { kind: "mushroom", cap, spots };
    }
  }
}

function fan(crown: { x: number; y: number; r: number }, rng: () => number, n: number, baseAng: number, spreadDeg: number, len: number, wRatio: number, jitter: number): Frond[] {
  const fronds: Frond[] = [];
  for (let i = 0; i < n; i++) {
    const ang = baseAng + (i - (n - 1) / 2) * (spreadDeg / n) + (rng() - 0.5) * jitter;
    fronds.push({ x: crown.x, y: crown.y, ang, len: len * (0.8 + rng() * 0.4), wRatio });
  }
  return fronds;
}

function roundLobes(crown: { x: number; y: number; r: number }, s: number, rng: () => number, spreadX: number, spreadY: number, rMul: number): Lobe[] {
  const lobes: Lobe[] = [];
  lobes.push({ x: crown.x, y: crown.y - crown.r * 0.2 * spreadY, r: crown.r * 0.85 * rMul, t: rng() });
  const n = 4 + s * 2;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU + rng() * 0.5;
    const dist = crown.r * (0.3 + rng() * 0.55);
    lobes.push({ x: crown.x + Math.cos(ang) * dist * spreadX, y: crown.y + Math.sin(ang) * dist * spreadY, r: crown.r * (0.4 + rng() * 0.35) * rMul, t: rng() });
  }
  return lobes;
}
