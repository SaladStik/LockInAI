import { useId, useMemo } from "react";
import { motion } from "motion/react";
import { RARITY_ORDER } from "@/lib/garden";
import type { PlantProps } from "./types";
import { buildPlant } from "./model";
import { renderHead } from "./head";

/**
 * Procedural plant. Each id seeds a unique plant: an archetype (one of ~18 —
 * trees, flowers, cactus, mushroom, fern, succulent…), jittered colours, shape
 * and size. Growth stage and rarity (from saved minutes) layer on top. The look
 * derives purely from saved fields, so it reproduces exactly.
 */
export function Plant({
  stage = 1,
  health = 1,
  size = 160,
  excited = false,
  seed = "seed",
  rarity = "common",
}: PlantProps) {
  const dead = health < 0.5;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const tier = RARITY_ORDER[rarity];

  const model = useMemo(() => buildPlant(seed, stage, dead, rarity), [seed, stage, dead, rarity]);
  const pal = model.colors;

  const glowBlur = dead ? 0 : 2 + tier * 2.2;
  const showAura = !dead && tier >= 3;
  const haloOpacity = dead ? 0.12 : 0.32 + tier * 0.11;
  const sparkles = dead || tier < 2 ? [] : model.sparkles.slice(0, tier);

  const stemStroke =
    model.stem === "wood"
      ? `url(#trunk-${uid})`
      : model.stem === "cactus"
        ? `url(#cactus-${uid})`
        : model.stem === "shroom"
          ? `url(#shroom-${uid})`
          : `url(#fstem-${uid})`;

  return (
    <motion.div
      className="relative inline-flex items-end justify-center"
      style={{ height: size, width: size }}
      animate={
        excited
          ? { rotate: [-2.5, 2.5, -2.5], y: [0, -3, 0] }
          : { rotate: dead ? [-0.6, 0.6, -0.6] : [-1.4, 1.4, -1.4] }
      }
      transition={{ duration: excited ? 1.4 : dead ? 7 : 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle at 50% 60%, color-mix(in oklab, ${pal.glow} 70%, transparent), transparent 62%)`,
          opacity: haloOpacity,
        }}
      />
      <svg viewBox="0 0 200 220" width={size} height={size} className="relative" style={{ overflow: "visible", transformOrigin: "100px 208px" }}>
        <defs>
          <radialGradient id={`leaf-${uid}`} cx="0.4" cy="0.3" r="0.85">
            <stop offset="0%" stopColor={pal.light} />
            <stop offset="100%" stopColor={pal.dark} />
          </radialGradient>
          <linearGradient id={`trunk-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dead ? "oklch(0.45 0.04 70)" : "oklch(0.62 0.08 120)"} />
            <stop offset="100%" stopColor={dead ? "oklch(0.3 0.03 55)" : "oklch(0.38 0.06 90)"} />
          </linearGradient>
          <linearGradient id={`fstem-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dead ? "oklch(0.5 0.05 90)" : "oklch(0.72 0.13 145)"} />
            <stop offset="100%" stopColor={dead ? "oklch(0.32 0.03 80)" : "oklch(0.45 0.1 150)"} />
          </linearGradient>
          <linearGradient id={`cactus-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={dead ? "oklch(0.4 0.04 120)" : "oklch(0.7 0.13 150)"} />
            <stop offset="100%" stopColor={dead ? "oklch(0.3 0.03 110)" : "oklch(0.5 0.12 155)"} />
          </linearGradient>
          <linearGradient id={`shroom-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={dead ? "oklch(0.6 0.02 80)" : "oklch(0.92 0.02 80)"} />
            <stop offset="100%" stopColor={dead ? "oklch(0.42 0.02 70)" : "oklch(0.78 0.03 75)"} />
          </linearGradient>
          <radialGradient id={`bloom-${uid}`} cx="0.5" cy="0.4" r="0.6">
            <stop offset="0%" stopColor="oklch(0.98 0.04 95)" />
            <stop offset="100%" stopColor={pal.accent} />
          </radialGradient>
          <radialGradient id={`cap-${uid}`} cx="0.4" cy="0.3" r="0.8">
            <stop offset="0%" stopColor={dead ? "oklch(0.55 0.04 60)" : pal.accent} />
            <stop offset="100%" stopColor={dead ? "oklch(0.38 0.03 55)" : pal.glow} />
          </radialGradient>
          {/* Glow filters with a wide region so the blur fades out fully instead
              of being clipped to a hard square by the default filter region. */}
          {glowBlur > 0 && (
            <filter id={`glow-${uid}`} x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="0" stdDeviation={glowBlur} floodColor={pal.glow} floodOpacity="0.85" />
            </filter>
          )}
          <filter id={`spark-${uid}`} x="-400%" y="-400%" width="900%" height="900%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={pal.glow} floodOpacity="0.9" />
          </filter>
        </defs>

        {/* soil mound — fixed size so the ground reads consistently */}
        <ellipse cx="100" cy="209" rx="34" ry="7" fill="oklch(0.26 0.02 150 / 0.9)" />
        <ellipse cx="100" cy="207" rx="26" ry="5" fill="oklch(0.32 0.03 145 / 0.9)" />

        {/* the plant itself scales up/down from its base */}
        <g transform={`translate(100 208) scale(${model.scale}) translate(-100 -208)`}>
          {showAura && (
            <circle cx={model.crown.x} cy={model.crown.y} r={model.crown.r * 1.5} fill="none" stroke={pal.glow} strokeWidth="1.2" opacity="0.5">
              <animate attributeName="opacity" values="0.18;0.55;0.18" dur="3.5s" repeatCount="indefinite" />
            </circle>
          )}

          <path d={model.stemPath} fill="none" stroke={stemStroke} strokeWidth={model.trunkW} strokeLinecap="round" />

          <g filter={glowBlur ? `url(#glow-${uid})` : undefined}>
            {model.stemLeaves.map((lf, i) => (
              <path
                key={`l${i}`}
                d="M0 0 C -6 -5 -7 -17 0 -24 C 7 -17 6 -5 0 0 Z"
                fill={`url(#leaf-${uid})`}
                transform={`translate(${lf.x} ${lf.y}) rotate(${lf.rot}) scale(${lf.scale})`}
                opacity={dead ? 0.7 : 0.95}
              />
            ))}
            {renderHead(model.head, uid, pal, dead, model.trunkW)}
          </g>

          {sparkles.map((sp, i) => (
            <circle key={`s${i}`} cx={sp.x} cy={sp.y} r={sp.r} fill={pal.accent} filter={`url(#spark-${uid})`}>
              <animate attributeName="opacity" values="0.15;1;0.15" dur={`${2 + sp.delay}s`} begin={`${sp.delay}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${sp.y};${sp.y - 6};${sp.y}`} dur={`${2.6 + sp.delay}s`} begin={`${sp.delay}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      </svg>
    </motion.div>
  );
}
