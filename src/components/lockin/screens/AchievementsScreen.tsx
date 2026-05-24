import { Flame, ArrowLeft } from "lucide-react";
import {
  buildAchievements,
  type Achievement,
  type AchievementContext,
} from "@/components/lockin/achievements";

export function AchievementsScreen({
  ctx,
  skinLabel,
  onBack,
}: {
  ctx: AchievementContext;
  skinLabel: string | null;
  onBack: () => void;
}) {
  const items = buildAchievements(ctx);
  const unlocked = items.filter((a) => a.unlocked).length;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={12} /> Back
        </button>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-warning">
          Achievements
        </h2>
        <div className="w-12" />
      </div>

      {/* Streak reward banner */}
      <div
        className="glass relative overflow-hidden rounded-2xl px-3 py-2.5"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--warning) 14%, transparent), color-mix(in oklab, var(--primary) 8%, transparent))",
          boxShadow: "0 0 24px -10px var(--warning)",
        }}
      >
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-warning" />
          <div className="flex-1">
            <div className="text-[11px] font-medium text-foreground">
              Lockie streak reward
            </div>
            <div className="text-[10px] text-muted-foreground">
              {skinLabel
                ? `Unlocked: ${skinLabel}`
                : `Next reward at 7 days · ${ctx.streak}/7`}
            </div>
          </div>
          <div className="font-mono text-[11px] font-semibold text-warning">
            {unlocked}/{items.length}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="scroll-hidden -mx-2 flex-1 overflow-y-auto px-2 pb-1">
        <div className="grid grid-cols-2 gap-2">
          {items.map((a) => (
            <AchievementCard key={a.id} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ a }: { a: Achievement }) {
  const Icon = a.icon;
  const tone =
    a.rarity === "legendary"
      ? "var(--warning)"
      : a.rarity === "rare"
        ? "var(--accent-glow)"
        : "var(--primary-glow)";
  return (
    <div
      className="glass relative flex flex-col gap-1.5 rounded-xl p-2.5"
      style={{
        opacity: a.unlocked ? 1 : 0.55,
        boxShadow: a.unlocked ? `0 0 22px -10px ${tone}` : undefined,
        borderColor: a.unlocked
          ? `color-mix(in oklab, ${tone} 40%, transparent)`
          : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: a.unlocked
              ? `color-mix(in oklab, ${tone} 22%, transparent)`
              : "oklch(1 0 0 / 4%)",
            color: a.unlocked ? tone : "var(--muted-foreground)",
            boxShadow: a.unlocked ? `0 0 12px -4px ${tone}` : undefined,
          }}
        >
          <Icon size={13} />
        </div>
        <div className="flex-1 truncate">
          <div className="truncate text-[11px] font-medium text-foreground">
            {a.name}
          </div>
          <div
            className="font-mono text-[8px] uppercase tracking-[0.2em]"
            style={{ color: a.unlocked ? tone : "var(--muted-foreground)" }}
          >
            {a.rarity}
          </div>
        </div>
      </div>
      <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
        {a.description}
      </p>
      {a.progress && !a.unlocked && (
        <div className="mt-0.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary/50">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(a.progress.current / a.progress.target) * 100}%`,
                background: tone,
              }}
            />
          </div>
          <div className="mt-0.5 text-right font-mono text-[9px] text-muted-foreground">
            {a.progress.current}/{a.progress.target}
          </div>
        </div>
      )}
    </div>
  );
}
