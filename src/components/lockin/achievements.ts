import type { LucideIcon } from "lucide-react";
import { Flame, Sparkles, Leaf, Crown, Moon, Sun, Zap, Trophy, Shield, Heart } from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  rarity: "common" | "rare" | "legendary";
  progress?: { current: number; target: number };
}

export interface AchievementContext {
  streak: number;
  xp: number;
  totalSessions: number;
  aliveCount: number;
  deadCount: number;
  longestSessionMin: number;
}

export function buildAchievements(ctx: AchievementContext): Achievement[] {
  return [
    {
      id: "first-bloom",
      name: "First Bloom",
      description: "Complete your first focus session.",
      icon: Leaf,
      rarity: "common",
      unlocked: ctx.totalSessions >= 1,
      progress: { current: Math.min(1, ctx.totalSessions), target: 1 },
    },
    {
      id: "spark",
      name: "Spark",
      description: "Reach a 3-day streak.",
      icon: Sparkles,
      rarity: "common",
      unlocked: ctx.streak >= 3,
      progress: { current: Math.min(3, ctx.streak), target: 3 },
    },
    {
      id: "weekly-bloom",
      name: "7 Day Bloom",
      description: "Maintain a 7-day streak.",
      icon: Flame,
      rarity: "rare",
      unlocked: ctx.streak >= 7,
      progress: { current: Math.min(7, ctx.streak), target: 7 },
    },
    {
      id: "deep-diver",
      name: "Deep Diver",
      description: "Complete a 60+ minute session.",
      icon: Moon,
      rarity: "rare",
      unlocked: ctx.longestSessionMin >= 60,
      progress: { current: Math.min(60, ctx.longestSessionMin), target: 60 },
    },
    {
      id: "gardener",
      name: "Gardener",
      description: "Grow 10 living plants.",
      icon: Heart,
      rarity: "rare",
      unlocked: ctx.aliveCount >= 10,
      progress: { current: Math.min(10, ctx.aliveCount), target: 10 },
    },
    {
      id: "xp-rush",
      name: "Power Surge",
      description: "Earn 1,000 Focus XP.",
      icon: Zap,
      rarity: "rare",
      unlocked: ctx.xp >= 1000,
      progress: { current: Math.min(1000, ctx.xp), target: 1000 },
    },
    {
      id: "resilient",
      name: "Resilient",
      description: "Lose 3 plants. Keep going.",
      icon: Shield,
      rarity: "common",
      unlocked: ctx.deadCount >= 3,
      progress: { current: Math.min(3, ctx.deadCount), target: 3 },
    },
    {
      id: "monthly-forest",
      name: "30 Day Forest",
      description: "Maintain a 30-day streak.",
      icon: Crown,
      rarity: "legendary",
      unlocked: ctx.streak >= 30,
      progress: { current: Math.min(30, ctx.streak), target: 30 },
    },
    {
      id: "sun-keeper",
      name: "Sun Keeper",
      description: "Complete 50 sessions.",
      icon: Sun,
      rarity: "legendary",
      unlocked: ctx.totalSessions >= 50,
      progress: { current: Math.min(50, ctx.totalSessions), target: 50 },
    },
    {
      id: "sanctuary",
      name: "100 Day Sanctuary",
      description: "Reach the 100-day milestone.",
      icon: Trophy,
      rarity: "legendary",
      unlocked: ctx.streak >= 100,
      progress: { current: Math.min(100, ctx.streak), target: 100 },
    },
  ];
}

/** Streak-based Lockie cosmetic tier. */
export type LockieSkin = "none" | "glow" | "crown" | "halo";
export function streakSkin(streak: number): LockieSkin {
  if (streak >= 30) return "halo";
  if (streak >= 14) return "crown";
  if (streak >= 7) return "glow";
  return "none";
}
export function streakSkinLabel(skin: LockieSkin): string | null {
  switch (skin) {
    case "halo":
      return "Sanctuary halo";
    case "crown":
      return "Bloom crown";
    case "glow":
      return "Spark aura";
    default:
      return null;
  }
}