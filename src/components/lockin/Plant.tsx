import { useId, useMemo } from "react";
import { motion } from "motion/react";
import { RARITY_ORDER, type Rarity } from "@/lib/garden";

interface PlantProps {
  stage?: number; // 0..4 growth
  health?: number; // 0..1 (below 0.5 = withered/dead)
  size?: number; // px
  excited?: boolean;
  seed?: string;
  rarity?: Rarity;
}

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

          <g style={{ filter: glowBlur ? `drop-shadow(0 0 ${glowBlur}px ${pal.glow})` : undefined }}>
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
            <circle key={`s${i}`} cx={sp.x} cy={sp.y} r={sp.r} fill={pal.accent} style={{ filter: `drop-shadow(0 0 3px ${pal.glow})` }}>
              <animate attributeName="opacity" values="0.15;1;0.15" dur={`${2 + sp.delay}s`} begin={`${sp.delay}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${sp.y};${sp.y - 6};${sp.y}`} dur={`${2.6 + sp.delay}s`} begin={`${sp.delay}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      </svg>
    </motion.div>
  );
}

/* ============ rendering ============ */

const PETAL = (len: number, w: number) => `M0 0 Q ${-w} ${-len * 0.6} 0 ${-len} Q ${w} ${-len * 0.6} 0 0 Z`;

function renderHead(head: Head, uid: string, pal: Colors, dead: boolean, trunkW: number) {
  const leaf = `url(#leaf-${uid})`;
  const bloom = dead ? pal.dark : `url(#bloom-${uid})`;
  switch (head.kind) {
    case "none":
      return null;
    case "round":
      return (
        <>
          {head.lobes.map((lo, i) => (
            <circle key={`c${i}`} cx={lo.x} cy={lo.y} r={lo.r} fill={leaf} opacity={(dead ? 0.7 : 0.92) - lo.t * 0.15} />
          ))}
          {head.blooms.map((b, i) => (
            <g key={`b${i}`}>
              <circle cx={b.x} cy={b.y} r={b.r} fill={`url(#bloom-${uid})`} />
              <circle cx={b.x} cy={b.y} r={b.r * 0.4} fill={pal.accent} opacity="0.9" />
            </g>
          ))}
        </>
      );
    case "pads":
      return (
        <>
          {head.pads.map((p, i) => (
            <ellipse key={`pd${i}`} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={leaf} opacity={dead ? 0.72 : 0.95} />
          ))}
        </>
      );
    case "conifer":
      return (
        <>
          {head.tiers.map((t, i) => (
            <path key={`t${i}`} d={`M ${t.cx - t.w} ${t.cy} Q ${t.cx} ${t.cy + 4} ${t.cx + t.w} ${t.cy} L ${t.cx} ${t.cy - t.h} Z`} fill={leaf} opacity={dead ? 0.72 : 0.95} />
          ))}
        </>
      );
    case "fan":
      return (
        <>
          {head.fronds.map((f, i) => (
            <path key={`f${i}`} d={PETAL(f.len, f.len * f.wRatio)} fill={leaf} transform={`translate(${f.x} ${f.y}) rotate(${f.ang})`} opacity={dead ? 0.7 : 0.95} />
          ))}
        </>
      );
    case "willow":
      return (
        <>
          {head.lobes.map((lo, i) => (
            <circle key={`c${i}`} cx={lo.x} cy={lo.y} r={lo.r} fill={leaf} opacity={(dead ? 0.7 : 0.9) - lo.t * 0.15} />
          ))}
          {head.strands.map((st, i) => (
            <path key={`w${i}`} d={`M ${st.x} ${st.y} q ${st.bend} ${st.len * 0.5} 0 ${st.len}`} fill="none" stroke={leaf} strokeWidth="2" strokeLinecap="round" opacity={dead ? 0.6 : 0.85} />
          ))}
        </>
      );
    case "daisy":
      return (
        <>
          {head.bud && (
            <path d={`M0 0 Q ${-head.budLen * 0.42} ${-head.budLen * 0.7} 0 ${-head.budLen} Q ${head.budLen * 0.42} ${-head.budLen * 0.7} 0 0 Z`} fill={leaf} transform={`translate(${head.cx} ${head.cy})`} />
          )}
          {!head.bud && head.petals.map((p, i) => (
            <path key={`p${i}`} d={PETAL(p.len, p.w)} fill={bloom} transform={`translate(${head.cx} ${head.cy}) rotate(${p.ang})`} opacity={dead ? 0.7 : 0.96} />
          ))}
          {!head.bud && <circle cx={head.cx} cy={head.cy} r={head.centerR} fill={dead ? pal.dark : pal.accent} stroke="oklch(0.98 0.05 95)" strokeWidth="0.6" />}
        </>
      );
    case "tulip":
      return (
        <>
          {head.petals.map((p, i) => (
            <path key={`tp${i}`} d={PETAL(p.len, p.w)} fill={bloom} transform={`translate(${head.cx} ${head.cy}) rotate(${p.ang})`} opacity={dead ? 0.7 : 0.96} />
          ))}
        </>
      );
    case "spire":
      return (
        <>
          {head.blossoms.map((b, i) => (
            <circle key={`sp${i}`} cx={b.x} cy={b.y} r={b.r} fill={dead ? pal.dark : pal.accent} opacity={dead ? 0.7 : 0.95} />
          ))}
        </>
      );
    case "bell":
      return (
        <>
          {head.bells.map((b, i) => (
            <path key={`bl${i}`} d={`M ${b.x - b.w} ${b.y} Q ${b.x - b.w} ${b.y + b.h} ${b.x} ${b.y + b.h} Q ${b.x + b.w} ${b.y + b.h} ${b.x + b.w} ${b.y} Q ${b.x} ${b.y - b.w * 0.6} ${b.x - b.w} ${b.y} Z`} fill={bloom} opacity={dead ? 0.7 : 0.96} />
          ))}
        </>
      );
    case "cactus":
      return (
        <>
          {head.arms.map((a, i) => (
            <path key={`a${i}`} d={`M ${a.x} ${a.y} q ${a.dir * a.out} 0 ${a.dir * a.out} ${-a.up}`} fill="none" stroke={`url(#cactus-${uid})`} strokeWidth={trunkW * 0.7} strokeLinecap="round" />
          ))}
          {head.spines.map((sp, i) => (
            <circle key={`sn${i}`} cx={sp.x} cy={sp.y} r="0.8" fill="oklch(0.95 0.04 100 / 0.8)" />
          ))}
          {head.flower && (
            <g>
              <circle cx={head.flower.x} cy={head.flower.y} r={head.flower.r} fill={`url(#bloom-${uid})`} />
              <circle cx={head.flower.x} cy={head.flower.y} r={head.flower.r * 0.4} fill={pal.accent} />
            </g>
          )}
        </>
      );
    case "mushroom":
      return (
        <>
          <path
            d={`M ${head.cap.cx - head.cap.rx} ${head.cap.cy} Q ${head.cap.cx - head.cap.rx} ${head.cap.cy - head.cap.ry * 1.6} ${head.cap.cx} ${head.cap.cy - head.cap.ry * 1.7} Q ${head.cap.cx + head.cap.rx} ${head.cap.cy - head.cap.ry * 1.6} ${head.cap.cx + head.cap.rx} ${head.cap.cy} Q ${head.cap.cx} ${head.cap.cy + head.cap.ry * 0.5} ${head.cap.cx - head.cap.rx} ${head.cap.cy} Z`}
            fill={`url(#cap-${uid})`}
          />
          {head.spots.map((s, i) => (
            <circle key={`ms${i}`} cx={s.x} cy={s.y} r={s.r} fill="oklch(0.97 0.02 90 / 0.92)" />
          ))}
        </>
      );
  }
}

/* ============ generation ============ */

const TAU = Math.PI * 2;

interface Colors {
  light: string;
  dark: string;
  accent: string;
  glow: string;
}

const PALETTE: Record<Rarity, Colors> = {
  common: { light: "oklch(0.84 0.15 148)", dark: "oklch(0.5 0.13 152)", accent: "oklch(0.93 0.08 110)", glow: "oklch(0.7 0.13 150)" },
  uncommon: { light: "oklch(0.86 0.19 145)", dark: "oklch(0.52 0.16 152)", accent: "oklch(0.9 0.17 130)", glow: "oklch(0.76 0.18 145)" },
  rare: { light: "oklch(0.85 0.15 185)", dark: "oklch(0.5 0.14 205)", accent: "oklch(0.85 0.18 220)", glow: "oklch(0.78 0.18 210)" },
  epic: { light: "oklch(0.83 0.16 165)", dark: "oklch(0.5 0.16 295)", accent: "oklch(0.8 0.2 308)", glow: "oklch(0.72 0.2 300)" },
  legendary: { light: "oklch(0.9 0.16 120)", dark: "oklch(0.62 0.16 105)", accent: "oklch(0.9 0.18 88)", glow: "oklch(0.86 0.2 90)" },
  mythic: { light: "oklch(0.84 0.22 12)", dark: "oklch(0.52 0.21 350)", accent: "oklch(0.82 0.24 8)", glow: "oklch(0.74 0.24 5)" },
  celestial: { light: "oklch(0.96 0.07 210)", dark: "oklch(0.62 0.16 250)", accent: "oklch(0.92 0.14 225)", glow: "oklch(0.88 0.18 220)" },
};
const DEAD: Colors = { light: "oklch(0.6 0.04 80)", dark: "oklch(0.38 0.03 65)", accent: "oklch(0.5 0.03 60)", glow: "oklch(0.5 0.02 60)" };

type Lobe = { x: number; y: number; r: number; t: number };
type Petal = { ang: number; len: number; w: number };
type Frond = { x: number; y: number; ang: number; len: number; wRatio: number };
type Head =
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

interface PlantModel {
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

// archetype → render family + stem material. Duplicates bias the random pick.
const ARCHES = [
  "round", "round", "oak", "conifer", "palm", "willow", "birch", "bonsai",
  "daisy", "daisy", "tulip", "spire", "bell", "sunflower", "lotus",
  "fern", "succulent", "bush", "cactus", "mushroom",
] as const;
type Arch = (typeof ARCHES)[number];

const WOOD = new Set<Arch>(["round", "oak", "conifer", "palm", "willow", "birch", "bonsai"]);
const STRAIGHT = new Set<Arch>(["conifer", "palm", "birch", "spire", "sunflower", "cactus", "mushroom", "succulent", "fern", "bonsai"]);

function makeRng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cubic(t: number, p0: number, p1: number, p2: number, p3: number) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function shiftOklch(s: string, dL = 0, dC = 0, dH = 0): string {
  const m = s.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([-\d.]+)([^)]*)\)/);
  if (!m) return s;
  const L = Math.max(0, Math.min(1, parseFloat(m[1]) + dL));
  const C = Math.max(0, parseFloat(m[2]) + dC);
  const H = ((parseFloat(m[3]) + dH) % 360 + 360) % 360;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)}${m[4]})`;
}

function buildPlant(seed: string, rawStage: number, dead: boolean, rarity: Rarity): PlantModel {
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
