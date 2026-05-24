import type { Rarity } from "@/lib/garden";

export interface PlantProps {
  stage?: number; // 0..4 growth
  health?: number; // 0..1 (below 0.5 = withered/dead)
  size?: number; // px
  excited?: boolean;
  seed?: string;
  rarity?: Rarity;
}

export interface Colors {
  light: string;
  dark: string;
  accent: string;
  glow: string;
}

export type Lobe = { x: number; y: number; r: number; t: number };
export type Petal = { ang: number; len: number; w: number };
export type Frond = { x: number; y: number; ang: number; len: number; wRatio: number };

export type Head =
  | { kind: "none" }
  | { kind: "round"; lobes: Lobe[]; blooms: { x: number; y: number; r: number }[] }
  | { kind: "pads"; pads: { x: number; y: number; rx: number; ry: number }[] }
  | { kind: "conifer"; tiers: { cx: number; cy: number; w: number; h: number }[] }
  | { kind: "fan"; fronds: Frond[] }
  | { kind: "willow"; lobes: Lobe[]; strands: { x: number; y: number; len: number; bend: number }[] }
  | { kind: "daisy"; cx: number; cy: number; petals: Petal[]; centerR: number; bud: boolean; budLen: number }
  | { kind: "tulip"; cx: number; cy: number; petals: Petal[] }
  | { kind: "spire"; blossoms: { x: number; y: number; r: number }[] }
  | { kind: "bell"; bells: { x: number; y: number; w: number; h: number }[] }
  | { kind: "cactus"; arms: { x: number; y: number; dir: number; out: number; up: number }[]; spines: { x: number; y: number }[]; flower: { x: number; y: number; r: number } | null }
  | { kind: "mushroom"; cap: { cx: number; cy: number; rx: number; ry: number }; spots: { x: number; y: number; r: number }[] };

export interface PlantModel {
  stem: "wood" | "green" | "cactus" | "shroom";
  stemPath: string;
  trunkW: number;
  crown: { x: number; y: number; r: number };
  stemLeaves: { x: number; y: number; rot: number; scale: number }[];
  sparkles: { x: number; y: number; r: number; delay: number }[];
  head: Head;
  colors: Colors;
  scale: number; // per-plant size, rooted at the base
}
