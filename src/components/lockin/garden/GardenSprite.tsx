import { Plant } from "@/components/lockin/Plant";
import { rarityForMinutes, RARITY_META, type GardenPlant } from "@/lib/garden";

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
  const rarity = rarityForMinutes(plant.minutes);
  const meta = RARITY_META[rarity];
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
      <Plant
        stage={plant.stage}
        size={size}
        health={dead ? 0.15 : 1}
        seed={plant.id}
        rarity={rarity}
      />
      <div className="-mt-1 flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
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
        {!dead && (
          <span
            className="font-mono text-[7px] uppercase tracking-[0.2em]"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
        )}
      </div>
    </div>
  );
}
