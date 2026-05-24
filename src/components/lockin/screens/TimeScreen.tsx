import { ChevronRight } from "lucide-react";
import { SetupShell, GlowSlider, PrimaryButton } from "@/components/lockin/primitives";

export function TimeScreen({
  minutes,
  setMinutes,
  onNext,
}: {
  minutes: number;
  setMinutes: (n: number) => void;
  onNext: () => void;
}) {
  // Snap to 5 min
  const handle = (v: number) => setMinutes(Math.max(5, Math.round(v / 5) * 5));
  const stage = minutes >= 60 ? 3 : minutes >= 30 ? 2 : 1;
  const intensity = Math.min(1, minutes / 90);

  return (
    <SetupShell step={2} title="How long will you focus?" plantStage={stage} excited={minutes >= 45}>
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex items-baseline gap-2 text-glow">
          <span className="text-6xl font-semibold tabular-nums tracking-tight text-foreground">
            {minutes}
          </span>
          <span className="text-sm uppercase tracking-[0.3em] text-muted-foreground">min</span>
        </div>
        <GlowSlider value={minutes} min={5} max={120} onChange={handle} intensity={intensity} />
        <div className="flex w-full justify-between px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>5m</span>
          <span>flow state</span>
          <span>120m</span>
        </div>
      </div>
      <PrimaryButton onClick={onNext} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </SetupShell>
  );
}
