import { useEffect, useMemo, useRef } from "react";

export function GlowSlider({
  value,
  min,
  max,
  onChange,
  intensity,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  intensity: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onChange(min + p * (max - min));
  };

  useEffect(() => {
    const move = (e: PointerEvent) => dragging.current && updateFromClientX(e.clientX);
    const up = () => (dragging.current = false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapMarks = useMemo(() => {
    const arr = [];
    for (let m = min; m <= max; m += 15) arr.push(((m - min) / (max - min)) * 100);
    return arr;
  }, [min, max]);

  return (
    <div
      ref={trackRef}
      onPointerDown={(e) => {
        dragging.current = true;
        updateFromClientX(e.clientX);
      }}
      className="relative h-10 w-full cursor-pointer touch-none select-none"
    >
      <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-secondary/60" />
      <div
        className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
        style={{
          width: `${pct}%`,
          background: "var(--gradient-leaf)",
          boxShadow: `0 0 ${10 + intensity * 20}px color-mix(in oklab, var(--primary) ${50 + intensity * 30}%, transparent)`,
        }}
      />
      {snapMarks.map((m, i) => (
        <span
          key={i}
          className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-foreground/15"
          style={{ left: `${m}%` }}
        />
      ))}
      <div
        className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: `${pct}%`,
          background: "oklch(0.98 0 0)",
          border: "2px solid var(--primary)",
          boxShadow: `0 0 ${12 + intensity * 24}px color-mix(in oklab, var(--primary) ${60 + intensity * 30}%, transparent)`,
        }}
      />
    </div>
  );
}
