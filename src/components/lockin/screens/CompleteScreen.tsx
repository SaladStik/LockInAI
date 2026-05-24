import { Lockie } from "@/components/lockin/Lockie";
import { Plant } from "@/components/lockin/Plant";
import { Particles } from "@/components/lockin/Particles";
import { PrimaryButton, RewardRow } from "@/components/lockin/primitives";
import type { LockieSkin } from "@/components/lockin/achievements";
import { rarityForMinutes, type GardenPlant } from "@/lib/garden";

export function CompleteScreen({
  minutes,
  stage,
  plant,
  broken,
  onAgain,
  onGarden,
  skin,
}: {
  minutes: number;
  stage: number;
  plant: GardenPlant | null;
  broken: boolean;
  onAgain: () => void;
  onGarden: () => void;
  skin: LockieSkin;
}) {
  if (broken) {
    return (
      <div className="flex h-full flex-col items-center justify-between text-center">
        <div className="pt-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-warning">
            Streak broken
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Your Lockie is disappointed
          </h1>
        </div>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-3">
          <Lockie mood="sad" size={120} skin={skin} />
          <Plant
            seed={plant?.id}
            stage={plant?.stage ?? Math.max(0, stage - 1)}
            rarity={plant ? rarityForMinutes(plant.minutes) : "common"}
            size={120}
            health={0.15}
          />
        </div>
        <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          The plant dimmed a little. Come back stronger — they're waiting.
        </p>
        <div className="mt-4 flex w-full flex-col gap-2">
          <PrimaryButton onClick={onAgain}>Try again</PrimaryButton>
          <button
            onClick={onGarden}
            className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-primary-glow"
          >
            Visit garden
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-between text-center">
      <div className="pt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
          Perfect session
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground text-glow">
          Your Lockie is thriving
        </h1>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center gap-2">
        <Lockie mood="excited" size={110} skin={skin} />
        <Plant
          seed={plant?.id}
          stage={plant?.stage ?? Math.min(4, stage)}
          rarity={plant ? rarityForMinutes(plant.minutes) : "common"}
          size={150}
          excited
        />
        <Particles count={18} color="var(--accent-glow)" intensity={1.2} />
      </div>

      <div className="flex w-full flex-col gap-2">
        <RewardRow label="Focus XP" value="+50" />
        <RewardRow label="Plant growth" value="+1" />
        <RewardRow label="Time locked" value={`${minutes}m`} />
      </div>

      <div className="mt-4 flex w-full flex-col gap-2">
        <PrimaryButton onClick={onAgain}>Lock in again</PrimaryButton>
        <button
          onClick={onGarden}
          className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-primary-glow"
        >
          Visit garden
        </button>
      </div>
    </div>
  );
}
