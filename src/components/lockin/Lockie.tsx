import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { LockieSkin } from "./achievements";

export type LockieMood =
  | "idle"
  | "curious"
  | "content"
  | "excited"
  | "ecstatic"
  | "focused"
  | "worried"
  | "sad";

interface LockieProps {
  mood?: LockieMood;
  size?: number;
  skin?: LockieSkin;
}

/**
 * Lockie — a floating AI companion orb with expressive eyes.
 * Pure SVG, animated with Motion. No external assets.
 */
export function Lockie({ mood = "idle", size = 90, skin = "none" }: LockieProps) {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const loop = () => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 140);
    };
    const id = window.setInterval(loop, 2800 + Math.random() * 1500);
    return () => window.clearInterval(id);
  }, []);

  const palette = moodPalette(mood);
  const eyeY = mood === "sad" || mood === "worried" ? 54 : 50;
  const mouth = mouthPath(mood);

  return (
    <motion.div
      className="relative inline-block"
      style={{ width: size, height: size }}
      animate={
        mood === "ecstatic"
          ? { y: [-4, -16, -4], rotate: [-8, 8, -8], scale: [1, 1.06, 1] }
          : mood === "excited"
            ? { y: [-3, -10, -3], rotate: [-4, 4, -4] }
            : mood === "worried"
              ? { x: [-2, 2, -2, 2, 0] }
              : { y: [-3, -8, -3] }
      }
      transition={{
        duration:
          mood === "ecstatic"
            ? 0.85
            : mood === "excited"
              ? 1.2
              : mood === "worried"
                ? 0.4
                : 3.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* ambient halo */}
      <div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, ${palette.glow}, transparent 65%)`,
          opacity: mood === "sad" ? 0.3 : 0.85,
        }}
      />
      <svg viewBox="0 0 100 100" width={size} height={size} className="relative" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id={`lockie-body-${mood}`} cx="0.4" cy="0.35" r="0.7">
            <stop offset="0%" stopColor={palette.light} />
            <stop offset="60%" stopColor={palette.base} />
            <stop offset="100%" stopColor={palette.dark} />
          </radialGradient>
          <radialGradient id={`lockie-spec-${mood}`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(1 0 0 / 70%)" />
            <stop offset="100%" stopColor="oklch(1 0 0 / 0%)" />
          </radialGradient>
          <linearGradient id="lockie-crown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.95 0.18 90)" />
            <stop offset="100%" stopColor="oklch(0.7 0.18 70)" />
          </linearGradient>
          {/* Soft glow with a wide region so it fades out smoothly instead of
              being clipped to a hard square by the default SVG filter region.
              Glows each element in its own colour. */}
          <filter id={`lockie-soft-${mood}`} x="-75%" y="-75%" width="250%" height="250%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Streak skin: aura ring under body */}
        {skin !== "none" && (
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke={skin === "halo" ? "oklch(0.92 0.18 90)" : "oklch(0.88 0.2 158)"}
            strokeWidth="0.8"
            opacity="0.55"
            filter={`url(#lockie-soft-${mood})`}
          />
        )}

        {/* body */}
        <circle
          cx="50"
          cy="50"
          r="32"
          fill={`url(#lockie-body-${mood})`}
          stroke={palette.ring}
          strokeWidth="1.2"
          filter={`url(#lockie-soft-${mood})`}
        />
        {/* glossy highlight */}
        <ellipse cx="40" cy="38" rx="12" ry="7" fill={`url(#lockie-spec-${mood})`} opacity="0.7" />

        {/* tiny antenna */}
        <line
          x1="50"
          y1="18"
          x2="50"
          y2="10"
          stroke={palette.ring}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="50" cy="9" r="2" fill={palette.light}>
          <animate attributeName="r" values="1.6;2.4;1.6" dur="2s" repeatCount="indefinite" />
        </circle>

        {/* eyes */}
        <g>
          <Eye cx={40} cy={eyeY} blink={blink} mood={mood} />
          <Eye cx={60} cy={eyeY} blink={blink} mood={mood} />
        </g>

        {/* mouth */}
        <path
          d={mouth}
          stroke="oklch(0.15 0.03 250)"
          strokeWidth="1.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* worried sweat */}
        {(mood === "worried" || mood === "sad") && (
          <circle cx="72" cy="48" r="2.2" fill="oklch(0.78 0.16 220)" opacity="0.9">
            <animate
              attributeName="cy"
              values="46;52;46"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Streak skin: crown */}
        {(skin === "crown" || skin === "halo") && (
          <g filter={`url(#lockie-soft-${mood})`}>
            <path
              d="M36 24 L44 16 L50 22 L56 16 L64 24 L62 28 L38 28 Z"
              fill="url(#lockie-crown)"
              stroke="oklch(0.55 0.12 60)"
              strokeWidth="0.6"
            />
            <circle cx="44" cy="16" r="1.4" fill="oklch(0.95 0.15 320)" />
            <circle cx="50" cy="22" r="1.4" fill="oklch(0.9 0.18 200)" />
            <circle cx="56" cy="16" r="1.4" fill="oklch(0.95 0.15 320)" />
          </g>
        )}

        {/* Streak skin: halo */}
        {skin === "halo" && (
          <ellipse
            cx="50"
            cy="14"
            rx="16"
            ry="3.5"
            fill="none"
            stroke="oklch(0.95 0.2 90)"
            strokeWidth="1.6"
            opacity="0.95"
            filter={`url(#lockie-soft-${mood})`}
          />
        )}
      </svg>
    </motion.div>
  );
}

function Eye({ cx, cy, blink, mood }: { cx: number; cy: number; blink: boolean; mood: LockieMood }) {
  if (blink || mood === "focused") {
    return (
      <rect
        x={cx - 4}
        y={cy - 0.6}
        width="8"
        height="1.6"
        rx="0.8"
        fill="oklch(0.12 0.03 250)"
      />
    );
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r="3.4" fill="oklch(0.12 0.03 250)" />
      <circle cx={cx + 1} cy={cy - 1} r="1.1" fill="oklch(1 0 0)" />
    </g>
  );
}

function mouthPath(mood: LockieMood) {
  switch (mood) {
    case "ecstatic":
      return "M40 60 Q50 77 60 60";
    case "excited":
      return "M42 62 Q50 70 58 62";
    case "content":
      return "M44 62 Q50 69 56 62";
    case "curious":
      return "M44 63 Q50 67 56 63";
    case "worried":
      return "M44 65 Q50 60 56 65";
    case "sad":
      return "M43 66 Q50 60 57 66";
    case "focused":
      return "M44 64 L56 64";
    default:
      return "M45 63 Q50 66 55 63";
  }
}

function moodPalette(mood: LockieMood) {
  switch (mood) {
    case "worried":
    case "sad":
      return {
        light: "oklch(0.9 0.12 75)",
        base: "oklch(0.78 0.16 65)",
        dark: "oklch(0.55 0.14 55)",
        ring: "oklch(0.85 0.16 70)",
        glow: "color-mix(in oklab, oklch(0.82 0.16 75) 55%, transparent)",
      };
    case "ecstatic":
      return {
        light: "oklch(0.97 0.16 150)",
        base: "oklch(0.85 0.21 158)",
        dark: "oklch(0.55 0.18 165)",
        ring: "oklch(0.9 0.2 155)",
        glow: "color-mix(in oklab, oklch(0.85 0.22 155) 80%, transparent)",
      };
    case "content":
      return {
        light: "oklch(0.95 0.11 190)",
        base: "oklch(0.83 0.15 195)",
        dark: "oklch(0.52 0.13 210)",
        ring: "oklch(0.85 0.15 195)",
        glow: "color-mix(in oklab, oklch(0.82 0.16 195) 60%, transparent)",
      };
    case "excited":
      return {
        light: "oklch(0.95 0.14 200)",
        base: "oklch(0.82 0.18 200)",
        dark: "oklch(0.55 0.16 215)",
        ring: "oklch(0.85 0.18 200)",
        glow: "color-mix(in oklab, oklch(0.85 0.2 215) 70%, transparent)",
      };
    default:
      return {
        light: "oklch(0.95 0.1 210)",
        base: "oklch(0.82 0.16 220)",
        dark: "oklch(0.5 0.14 235)",
        ring: "oklch(0.85 0.16 215)",
        glow: "color-mix(in oklab, oklch(0.82 0.16 220) 60%, transparent)",
      };
  }
}