import type { Rarity } from "@/lib/garden";
import type { Colors } from "./types";

export const PALETTE: Record<Rarity, Colors> = {
  common: { light: "oklch(0.84 0.15 148)", dark: "oklch(0.5 0.13 152)", accent: "oklch(0.93 0.08 110)", glow: "oklch(0.7 0.13 150)" },
  uncommon: { light: "oklch(0.86 0.19 145)", dark: "oklch(0.52 0.16 152)", accent: "oklch(0.9 0.17 130)", glow: "oklch(0.76 0.18 145)" },
  rare: { light: "oklch(0.85 0.15 185)", dark: "oklch(0.5 0.14 205)", accent: "oklch(0.85 0.18 220)", glow: "oklch(0.78 0.18 210)" },
  epic: { light: "oklch(0.83 0.16 165)", dark: "oklch(0.5 0.16 295)", accent: "oklch(0.8 0.2 308)", glow: "oklch(0.72 0.2 300)" },
  legendary: { light: "oklch(0.9 0.16 120)", dark: "oklch(0.62 0.16 105)", accent: "oklch(0.9 0.18 88)", glow: "oklch(0.86 0.2 90)" },
  mythic: { light: "oklch(0.84 0.22 12)", dark: "oklch(0.52 0.21 350)", accent: "oklch(0.82 0.24 8)", glow: "oklch(0.74 0.24 5)" },
  celestial: { light: "oklch(0.96 0.07 210)", dark: "oklch(0.62 0.16 250)", accent: "oklch(0.92 0.14 225)", glow: "oklch(0.88 0.18 220)" },
};

export const DEAD: Colors = { light: "oklch(0.6 0.04 80)", dark: "oklch(0.38 0.03 65)", accent: "oklch(0.5 0.03 60)", glow: "oklch(0.5 0.02 60)" };
