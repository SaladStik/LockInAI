import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Lockie, type LockieMood } from "@/components/lockin/Lockie";
import type { GardenPlant } from "@/lib/garden";
import { hash01 } from "./hash01";
import { GardenStat } from "./GardenStat";
import { GardenSprite } from "./GardenSprite";

export function GardenScreen({
  plants,
  onBack,
  onAdd,
}: {
  plants: GardenPlant[];
  onBack: () => void;
  onAdd: (status: "alive" | "dead") => void;
}) {
  const alive = plants.filter((p) => p.status === "alive");
  const dead = plants.filter((p) => p.status === "dead");

  const scrollRef = useRef<HTMLDivElement>(null);
  const lockieRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef(0); // desired scrollLeft; eased toward each frame
  const lastSetXRef = useRef(0); // throttles scrollX state updates
  const [dims, setDims] = useState({ w: 352, h: 430 });
  const [scrollX, setScrollX] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setDims({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    // Wheel/trackpad just feeds a scroll target; the rAF loop eases toward it,
    // so scrolling is free and smooth (no snapping, no lock).
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta === 0) return;
      e.preventDefault();
      const max = el.scrollWidth - el.clientWidth;
      targetRef.current = Math.max(0, Math.min(max, targetRef.current + delta));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  // On open, start near the NEWEST plants (the right end of the path).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      const max = el.scrollWidth - el.clientWidth;
      el.scrollLeft = max;
      targetRef.current = max;
      setScrollX(max);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Single rAF loop: ease the scroll toward the wheel target AND glue Lockie to
  // the curve at the live scroll position, so he walks smoothly along the path.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      const cur = el.scrollLeft;
      const diff = targetRef.current - cur;
      if (Math.abs(diff) > 0.5) el.scrollLeft = cur + diff * 0.18;
      if (lockieRef.current) {
        const cx = el.scrollLeft + el.clientWidth / 2;
        const y = dims.h * 0.5 + dims.h * 0.2 * Math.sin(cx / 120);
        lockieRef.current.style.top = `${y}px`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dims.h]);

  // Track scroll for mood + hints only — throttled to ~every 24px so we don't
  // re-render the React tree 60×/sec. Lockie's position is driven per-frame by
  // the rAF loop (live scrollLeft), independent of this state.
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const sl = e.currentTarget.scrollLeft;
    if (Math.abs(sl - lastSetXRef.current) > 24) {
      lastSetXRef.current = sl;
      setScrollX(sl);
    }
  };

  const STEP = 62;
  const START = 50;
  const contentW = Math.max(dims.w, START + plants.length * STEP + 46);

  // A winding trail that oscillates around the vertical middle (must match the
  // curve used to position Lockie in the rAF loop above).
  const pathY = (x: number) => dims.h * 0.5 + dims.h * 0.2 * Math.sin(x / 120);

  // Oldest plants nearest the start, newest at the end. New plants are
  // prepended, so reverse for chronological left-to-right placement.
  const layout = useMemo(
    () =>
      [...plants].reverse().map((p, i) => {
        const r1 = hash01(p.id);
        const r2 = hash01(`${p.id}~s`);
        const r3 = hash01(`${p.id}~o`);
        return {
          plant: p,
          x: START + i * STEP + (r1 - 0.5) * 30, // jittered spacing
          above: i % 2 === 0 ? r2 > 0.18 : r2 > 0.82, // organic side
          size: 66 + Math.round(r2 * 30), // 66..96 depth
          lean: (r3 - 0.5) * 8,
          offFactor: 0.12 + r3 * 0.1, // distance from path
        };
      }),
    [plants],
  );

  const pathD = useMemo(() => {
    let d = "";
    for (let x = 0; x <= contentW; x += 14) {
      d += `${x === 0 ? "M" : "L"} ${x.toFixed(0)} ${pathY(x).toFixed(1)} `;
    }
    return d.trim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentW, dims.h]);

  // Trail + foliage + plants depend only on the data and viewport size — NOT the
  // scroll position. Memoizing keeps scrolling from re-rendering the N animated
  // plant SVGs every frame (the cause of scroll lag).
  const forest = useMemo(
    () => (
      <div className="relative h-full" style={{ width: contentW }}>
        <svg className="absolute inset-0" width={contentW} height={dims.h}>
          <defs>
            <linearGradient id="garden-trail" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.6 0.14 200)" />
              <stop offset="100%" stopColor="oklch(0.62 0.16 158)" />
            </linearGradient>
          </defs>
          {Array.from({ length: Math.ceil(contentW / 70) }).map((_, k) => {
            const fx = k * 70 + hash01(`fx${k}`) * 64;
            const fy = pathY(fx) + (hash01(`fy${k}`) - 0.5) * dims.h * 0.78;
            const fr = 9 + hash01(`fr${k}`) * 20;
            return (
              <circle
                key={k}
                cx={fx}
                cy={fy}
                r={fr}
                fill="color-mix(in oklab, var(--primary) 7%, transparent)"
              />
            );
          })}
          <path
            d={pathD}
            fill="none"
            stroke="color-mix(in oklab, var(--primary) 15%, transparent)"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d={pathD}
            fill="none"
            stroke="url(#garden-trail)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="2 11"
            opacity="0.9"
            style={{ filter: "drop-shadow(0 0 5px oklch(0.7 0.16 200))" }}
          />
        </svg>
        {layout.map((it) => {
          const y = pathY(it.x) + (it.above ? -1 : 1) * (dims.h * it.offFactor + 16);
          return (
            <GardenSprite
              key={it.plant.id}
              plant={it.plant}
              x={it.x}
              y={y}
              size={it.size}
              lean={it.lean}
            />
          );
        })}
      </div>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contentW, dims.h, pathD, layout],
  );

  const canScroll = contentW > dims.w + 4;

  // Lockie's mood reflects the plants immediately around him as he scrolls.
  const centerX = scrollX + dims.w / 2;
  const nearby = layout.filter((it) => Math.abs(it.x - centerX) <= STEP * 1.6);
  const pool = nearby.length ? nearby : layout;
  const aliveNear = pool.filter((it) => it.plant.status === "alive").length;
  const health = pool.length ? aliveNear / pool.length : 1;
  const mood: LockieMood =
    plants.length === 0
      ? "curious"
      : health >= 0.999
        ? aliveNear >= 2
          ? "ecstatic"
          : "excited"
        : health >= 0.66
          ? "content"
          : health >= 0.45
            ? "idle"
            : health >= 0.25
              ? "worried"
              : "sad";
  const caption =
    plants.length === 0
      ? "Plant your first seed"
      : mood === "ecstatic"
        ? "Lockie is ecstatic!"
        : mood === "excited"
          ? "Lockie is thriving"
          : mood === "content"
            ? "Lockie is content"
            : mood === "idle"
              ? "Lockie is calm"
              : mood === "worried"
                ? "Lockie is worried"
                : "Lockie mourns the fallen";
  const captionColor = health >= 0.45 ? "var(--primary-glow)" : "var(--warning)";

  return (
    <div className="flex h-full flex-col gap-3">
      {/* header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={12} /> Back
        </button>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
          Your forest
        </h2>
        <div className="w-12" />
      </div>

      {/* stats */}
      <div className="flex gap-2">
        <GardenStat label="Alive" value={alive.length} tone="primary" />
        <GardenStat label="Lost" value={dead.length} tone="warning" />
        <GardenStat label="Total" value={plants.length} tone="accent" />
      </div>

      {/* mood caption */}
      <div
        className="text-center text-[11px] font-medium"
        style={{ color: captionColor, textShadow: `0 0 12px ${captionColor}` }}
      >
        {caption}
      </div>

      {/* dev controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onAdd("alive")}
          className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-primary-glow transition hover:bg-primary/20"
        >
          <Plus size={10} /> Living
        </button>
        <button
          onClick={() => onAdd("dead")}
          className="flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-warning transition hover:bg-warning/20"
        >
          <Plus size={10} /> Dead
        </button>
      </div>

      {/* winding pathway — horizontal scroll */}
      <div className="relative -mx-6 flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {forest}
        </div>

        {/* Lockie — stays centered while the world scrolls, floating along the curve */}
        <div
          ref={lockieRef}
          className="pointer-events-none absolute z-10"
          style={{
            left: "50%",
            transform: "translate(-50%, -62%)",
          }}
        >
          <Lockie mood={mood} size={74} skin="none" />
        </div>

        {/* scroll hints — older to the left, newer to the right */}
        {canScroll && scrollX > 24 && (
          <div className="pointer-events-none absolute bottom-2 left-3 z-10 animate-pulse font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            ← older
          </div>
        )}
        {canScroll && scrollX < contentW - dims.w - 24 && (
          <div className="pointer-events-none absolute bottom-2 right-3 z-10 animate-pulse font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            newer →
          </div>
        )}
      </div>
    </div>
  );
}
