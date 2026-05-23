import { motion } from "motion/react";

interface PlantProps {
  stage?: number; // 0..4
  health?: number; // 0..1
  size?: number; // px height
  excited?: boolean;
}

/**
 * Cinematic SVG plant companion. Stage controls leaf/flower richness.
 * 0: sprout, 1: small, 2: blooming, 3: rare glow, 4: neon tree
 */
export function Plant({ stage = 1, health = 1, size = 160, excited = false }: PlantProps) {
  const glow = 0.4 + 0.6 * health;
  const droop = 1 - health;

  return (
    <div
      className="relative inline-flex items-end justify-center"
      style={{ height: size, width: size }}
    >
      {/* ambient halo */}
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, var(--primary) ${glow * 60}%, transparent), transparent 60%)`,
          opacity: glow,
        }}
      />
      <motion.svg
        viewBox="0 0 200 220"
        width={size}
        height={size}
        className="relative animate-glow-pulse"
        animate={
          excited
            ? { scale: [1, 1.08, 1], rotate: [-2, 2, -2] }
            : { rotate: [-1.5 + droop * 2, 1.5 - droop * 2, -1.5 + droop * 2] }
        }
        transition={{ duration: excited ? 1.2 : 5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "100px 200px" }}
      >
        <defs>
          <linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.88 0.22 158)" />
            <stop offset="100%" stopColor="oklch(0.65 0.18 180)" />
          </linearGradient>
          <linearGradient id="stem" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.75 0.15 150)" />
            <stop offset="100%" stopColor="oklch(0.45 0.1 145)" />
          </linearGradient>
          <linearGradient id="pot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.4 0.04 35)" />
            <stop offset="100%" stopColor="oklch(0.22 0.03 30)" />
          </linearGradient>
          <radialGradient id="flower" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(0.95 0.15 320)" />
            <stop offset="100%" stopColor="oklch(0.7 0.2 300)" />
          </radialGradient>
        </defs>

        {/* Pot */}
        <path
          d="M65 200 L135 200 L128 170 L72 170 Z"
          fill="url(#pot)"
          stroke="oklch(0.5 0.05 30)"
          strokeWidth="1"
        />
        <ellipse cx="100" cy="170" rx="28" ry="4" fill="oklch(0.15 0.02 240)" />

        {/* Stem (always) */}
        <path
          d={`M100 170 Q${100 + droop * 5} ${140 - stage * 8} 100 ${110 - stage * 10}`}
          stroke="url(#stem)"
          strokeWidth={3 + stage * 0.5}
          fill="none"
          strokeLinecap="round"
        />

        {/* Sprout leaves (stage 0+) */}
        <g className="origin-center" style={{ opacity: 0.95 }}>
          <Leaf cx={92} cy={135 - stage * 5} rotate={-35} scale={0.7 + stage * 0.05} />
          <Leaf cx={108} cy={135 - stage * 5} rotate={35} scale={0.7 + stage * 0.05} />
        </g>

        {/* Stage 1+ leaves */}
        {stage >= 1 && (
          <g>
            <Leaf cx={80} cy={120} rotate={-55} scale={0.9} />
            <Leaf cx={120} cy={120} rotate={55} scale={0.9} />
          </g>
        )}

        {/* Stage 2+ bigger crown */}
        {stage >= 2 && (
          <g>
            <Leaf cx={72} cy={100} rotate={-70} scale={1.1} />
            <Leaf cx={128} cy={100} rotate={70} scale={1.1} />
            <Leaf cx={100} cy={88} rotate={0} scale={1.0} />
          </g>
        )}

        {/* Stage 2+ flowers */}
        {stage >= 2 && (
          <g>
            <circle cx={78} cy={95} r="6" fill="url(#flower)" />
            <circle cx={122} cy={95} r="6" fill="url(#flower)" />
          </g>
        )}

        {/* Stage 3+ glow flowers */}
        {stage >= 3 && (
          <g style={{ filter: "drop-shadow(0 0 6px oklch(0.85 0.2 215))" }}>
            <circle cx={100} cy={75} r="8" fill="oklch(0.9 0.18 215)" />
            <circle cx={88} cy={82} r="5" fill="oklch(0.85 0.2 220)" />
            <circle cx={112} cy={82} r="5" fill="oklch(0.85 0.2 220)" />
          </g>
        )}

        {/* Stage 4 neon tree top */}
        {stage >= 4 && (
          <g style={{ filter: "drop-shadow(0 0 12px oklch(0.85 0.22 290))" }}>
            <circle cx={100} cy={60} r="20" fill="oklch(0.5 0.18 290 / 50%)" />
            <circle cx={100} cy={60} r="12" fill="oklch(0.8 0.2 290)" />
          </g>
        )}
      </motion.svg>
    </div>
  );
}

function Leaf({ cx, cy, rotate, scale }: { cx: number; cy: number; rotate: number; scale: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0 Q -18 -10 -22 -28 Q 0 -22 0 0 Z"
        fill="url(#leaf)"
        opacity="0.95"
      />
      <path d="M0 0 Q -10 -14 -20 -26" stroke="oklch(0.4 0.1 150)" strokeWidth="0.6" fill="none" />
    </g>
  );
}