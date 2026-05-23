import { useMemo } from "react";

interface ParticlesProps {
  count?: number;
  intensity?: number; // 0..1 multiplier for opacity/size
  color?: string; // css color or var
}

export function Particles({ count = 20, intensity = 1, color = "var(--primary-glow)" }: ParticlesProps) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 3,
        delay: Math.random() * 8,
        duration: 8 + Math.random() * 10,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            background: color,
            opacity: 0.5 * intensity,
            boxShadow: `0 0 ${p.size * 4}px ${color}`,
            animation: `float-up ${p.duration}s ease-in ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}