import { Flame, Sparkles } from "lucide-react";
import { Lockie } from "@/components/lockin/Lockie";
import { Plant } from "@/components/lockin/Plant";
import { PrimaryButton, Stat } from "@/components/lockin/primitives";
import type { LockieSkin } from "@/components/lockin/achievements";

export function WelcomeScreen({
  onNext,
  skin,
  skinLabel,
  streak,
}: {
  onNext: () => void;
  skin: LockieSkin;
  skinLabel: string | null;
  streak: number;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-between text-center">
      <div className="pt-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-glow">
          Welcome
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground text-glow">
          Meet your Lockie
        </h1>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-2">
        <Lockie mood="curious" size={120} skin={skin} />
        <Plant stage={0} size={130} />
        {skinLabel && (
          <div
            className="font-mono text-[9px] uppercase tracking-[0.3em]"
            style={{ color: "var(--warning)" }}
          >
            ★ {skinLabel} · {streak}d streak
          </div>
        )}
      </div>

      <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
        Focus helps <span className="text-accent-glow">both of them</span> grow.
      </p>

      <div className="mt-5 flex items-center gap-4">
        <Stat icon={<Flame size={12} />} label="0 day streak" />
        <Stat icon={<Sparkles size={12} />} label="0 XP" />
      </div>

      <PrimaryButton onClick={onNext} className="mt-6">
        Start locking in
      </PrimaryButton>
    </div>
  );
}
