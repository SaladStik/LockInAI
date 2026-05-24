import { Plant } from "@/components/lockin/Plant";
import type { GardenPlant } from "@/lib/garden";

export function GardenSprite({
  plant,
  x,
  y,
  size = 84,
  lean = 0,
}: {
  plant: GardenPlant;
  x: number;
  y: number;
  size?: number;
  lean?: number;
}) {
  const dead = plant.status === "dead";
  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -100%) rotate(${lean}deg)`,
        transformOrigin: "bottom center",
        width: size + 12,
      }}
    >
      <div
        style={{
          filter: dead ? "grayscale(0.85) brightness(0.6)" : undefined,
          opacity: dead ? 0.72 : 1,
        }}
      >
        <Plant stage={plant.stage} size={size} health={dead ? 0.15 : 1} />
      </div>
      <div className="-mt-1 flex items-center gap-1">
        {dead && (
          <span className="font-mono text-[10px]" style={{ color: "var(--warning)" }}>
            †
          </span>
        )}
        <span
          className="truncate text-[10px] font-medium"
          style={{
            color: dead ? "var(--muted-foreground)" : "var(--foreground)",
            maxWidth: 84,
          }}
        >
          {plant.name}
        </span>
      </div>
    </div>
  );
}
