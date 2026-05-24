export type PlantStatus = "alive" | "dead";

export interface GardenPlant {
  id: string;
  name: string;
  stage: number;
  status: PlantStatus;
  days: number;
  subject: string;
}

const STORAGE_KEY = "lockin.garden";

export const INITIAL_GARDEN: GardenPlant[] = [
  { id: "p1", name: "Aurora", stage: 4, status: "alive", days: 23, subject: "Coding" },
  { id: "p2", name: "Sprig", stage: 3, status: "alive", days: 14, subject: "Math" },
  { id: "p3", name: "Ember", stage: 2, status: "alive", days: 7, subject: "Reading" },
  { id: "p4", name: "Mossy", stage: 0, status: "dead", days: 2, subject: "Writing" },
  { id: "p5", name: "Vine", stage: 1, status: "dead", days: 4, subject: "Exam Prep" },
  { id: "p6", name: "Lumen", stage: 2, status: "dead", days: 9, subject: "Coding" },
];

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

export function loadGarden(): GardenPlant[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isGardenPlant);
  } catch {
    return null;
  }
}

export function saveGarden(plants: GardenPlant[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
  } catch {
    /* localStorage may be unavailable */
  }
}

function isGardenPlant(value: unknown): value is GardenPlant {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.stage === "number" &&
    (p.status === "alive" || p.status === "dead") &&
    typeof p.days === "number" &&
    typeof p.subject === "string"
  );
}
