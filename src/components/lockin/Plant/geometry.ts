/* Seeded RNG + curve/colour math shared by the plant generator. */

export const TAU = Math.PI * 2;

/** Deterministic PRNG (xfnv1a hash → mulberry32) so a seed reproduces exactly. */
export function makeRng(seed: string) {
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

/** Cubic bezier interpolation for one axis. */
export function cubic(t: number, p0: number, p1: number, p2: number, p3: number) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

/** Jitter an oklch() colour string by lightness/chroma/hue deltas. */
export function shiftOklch(s: string, dL = 0, dC = 0, dH = 0): string {
  const m = s.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([-\d.]+)([^)]*)\)/);
  if (!m) return s;
  const L = Math.max(0, Math.min(1, parseFloat(m[1]) + dL));
  const C = Math.max(0, parseFloat(m[2]) + dC);
  const H = ((parseFloat(m[3]) + dH) % 360 + 360) % 360;
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)}${m[4]})`;
}
