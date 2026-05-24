import type { Colors, Head } from "./types";

export const PETAL = (len: number, w: number) => `M0 0 Q ${-w} ${-len * 0.6} 0 ${-len} Q ${w} ${-len * 0.6} 0 0 Z`;

export function renderHead(head: Head, uid: string, pal: Colors, dead: boolean, trunkW: number) {
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
