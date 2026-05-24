"use client";

import { useEffect, useState } from "react";

/**
 * Lockie — the app's floating AI companion orb, ported to the website.
 * Pure SVG; blinks on a loose interval and floats via CSS.
 */
export function Lockie() {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let timer: number;
    const loop = () => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 130);
      timer = window.setTimeout(loop, 2800 + Math.random() * 1800);
    };
    timer = window.setTimeout(loop, 2000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="lockie-wrap">
      <div className="halo" />
      <svg className={`orb${blink ? " blinking" : ""}`} viewBox="0 0 100 100" aria-label="Lockie, your AI companion">
        <defs>
          <radialGradient id="lk-body" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0%" stopColor="oklch(0.95 0.1 210)" />
            <stop offset="60%" stopColor="oklch(0.82 0.16 220)" />
            <stop offset="100%" stopColor="oklch(0.5 0.14 235)" />
          </radialGradient>
          <radialGradient id="lk-spec" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="oklch(1 0 0 / 70%)" />
            <stop offset="100%" stopColor="oklch(1 0 0 / 0%)" />
          </radialGradient>
          <filter id="lk-soft" x="-75%" y="-75%" width="250%" height="250%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="50" cy="50" r="32" fill="url(#lk-body)" stroke="oklch(0.85 0.16 215)" strokeWidth="1.2" filter="url(#lk-soft)" />
        <ellipse cx="40" cy="38" rx="12" ry="7" fill="url(#lk-spec)" opacity="0.7" />

        <line x1="50" y1="18" x2="50" y2="10" stroke="oklch(0.85 0.16 215)" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="50" cy="9" r="2" fill="oklch(0.95 0.1 210)">
          <animate attributeName="r" values="1.6;2.4;1.6" dur="2s" repeatCount="indefinite" />
        </circle>

        <g id="eyes">
          <g>
            <circle cx="40" cy="50" r="3.4" fill="oklch(0.12 0.03 250)" />
            <circle cx="41" cy="49" r="1.1" fill="#fff" />
          </g>
          <g>
            <circle cx="60" cy="50" r="3.4" fill="oklch(0.12 0.03 250)" />
            <circle cx="61" cy="49" r="1.1" fill="#fff" />
          </g>
        </g>

        <path d="M44 62 Q50 70 58 62" stroke="oklch(0.15 0.03 250)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}
