export type PlantStatus = "alive" | "dead";

export interface GardenPlant {
  id: string;
  name: string;
  stage: number;
  status: PlantStatus;
  days: number;
  subject: string;
  /** Length of the focus session that grew this plant — drives its rarity. */
  minutes: number;
}

export const INITIAL_GARDEN: GardenPlant[] = [
  { id: "p1", name: "Aurora", stage: 4, status: "alive", days: 23, subject: "Coding", minutes: 95 },
  { id: "p2", name: "Sprig", stage: 3, status: "alive", days: 14, subject: "Math", minutes: 50 },
  { id: "p3", name: "Ember", stage: 2, status: "alive", days: 7, subject: "Reading", minutes: 25 },
  { id: "p4", name: "Mossy", stage: 0, status: "dead", days: 2, subject: "Writing", minutes: 10 },
  { id: "p5", name: "Vine", stage: 1, status: "dead", days: 4, subject: "Exam Prep", minutes: 65 },
  { id: "p6", name: "Lumen", stage: 2, status: "dead", days: 9, subject: "Coding", minutes: 30 },
];

/* ============ RARITY ============ */

export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "celestial";

export const RARITY_ORDER: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
  celestial: 6,
};

export const RARITY_META: Record<Rarity, { label: string; color: string }> = {
  common: { label: "Common", color: "oklch(0.74 0.03 150)" },
  uncommon: { label: "Uncommon", color: "oklch(0.8 0.18 150)" },
  rare: { label: "Rare", color: "oklch(0.78 0.17 220)" },
  epic: { label: "Epic", color: "oklch(0.74 0.2 305)" },
  legendary: { label: "Legendary", color: "oklch(0.86 0.18 88)" },
  mythic: { label: "Mythic", color: "oklch(0.72 0.23 5)" },
  celestial: { label: "Celestial", color: "oklch(0.9 0.15 215)" },
};

/** Longer lock-ins grow rarer plants. */
export function rarityForMinutes(minutes: number): Rarity {
  if (minutes >= 120) return "celestial";
  if (minutes >= 90) return "mythic";
  if (minutes >= 60) return "legendary";
  if (minutes >= 45) return "epic";
  if (minutes >= 30) return "rare";
  if (minutes >= 15) return "uncommon";
  return "common";
}

export const PLANT_NAMES = [
  "Aurora",
  "Sprig",
  "Ember",
  "Mossy",
  "Vine",
  "Lumen",
  "Fern",
  "Sage",
  "Iris",
  "Juno",
  "Rhea",
  "Zephyr",
  "Orin",
  "Sol",
  "Nova",
  "Bloom",
];

export function randomPlantName(existing: string[] = []): string {
  const taken = new Set(existing.map((n) => n.toLowerCase()));
  const pool = PLANT_NAMES.filter((n) => !taken.has(n.toLowerCase()));
  const pick = pool.length ? pool : PLANT_NAMES;
  return pick[Math.floor(Math.random() * pick.length)]!;
}

/** Use the user's name when provided; otherwise pick one the app hasn't used yet. */
export function resolvePlantName(input: string | null | undefined, existing: string[] = []): string {
  const trimmed = input?.trim();
  if (trimmed) return trimmed.slice(0, 32);
  return randomPlantName(existing);
}

export function createPlantId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
