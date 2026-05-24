import { Flame, Sparkles, AlertTriangle } from "lucide-react";
import { Lockie, type LockieMood } from "@/components/lockin/Lockie";
import { Plant } from "@/components/lockin/Plant";
import { CircularTimer } from "@/components/lockin/CircularTimer";
import { isAllowedFocusApp } from "@/lib/apps";
import type { LockieSkin } from "@/components/lockin/achievements";
import type { ActiveAppSnapshot } from "@/types/electron";

export function FocusScreen({
  mm,
  ss,
  progress,
  subject,
  plantName,
  apps,
  sites,
  streak,
  xp,
  stage,
  warning,
  activeApp,
  appDetection,
  onEmergencyExit,
  breachCount,
  maxBreaches,
  skin,
}: {
  mm: string;
  ss: string;
  progress: number;
  subject: string;
  plantName: string;
  apps: string[];
  sites: string[];
  streak: number;
  xp: number;
  stage: number;
  warning: boolean;
  activeApp: ActiveAppSnapshot | null;
  appDetection: boolean;
  onEmergencyExit: () => void;
  breachCount: number;
  maxBreaches: number;
  skin: LockieSkin;
}) {
  const lockieMood: LockieMood = warning ? "worried" : "focused";
  const offApp =
    appDetection &&
    activeApp &&
    !isAllowedFocusApp(activeApp, apps, sites);
  return (
    <div className="flex h-full flex-col items-center">
      {/* Top bar with plant + streak */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Lockie mood={lockieMood} size={44} skin={skin} />
          <div className="relative h-11 w-11">
            <Plant stage={stage} size={44} health={warning ? 0.5 : 1} />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow">
              ● Locked in
            </div>
            <div className="text-[11px] font-medium text-foreground">{plantName}</div>
            <div className="text-[10px] text-muted-foreground">{subject}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[11px] text-foreground">
            <Flame size={11} className="text-warning" /> {streak}d
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Sparkles size={10} className="text-accent" /> {xp} XP
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary/40">
        <div
          className="h-full rounded-full"
          style={{
            width: `${(xp % 1000) / 10}%`,
            background: "var(--gradient-leaf)",
            boxShadow: "var(--shadow-glow-primary)",
          }}
        />
      </div>

      {/* Timer */}
      <div className="relative mt-4 flex flex-1 items-center justify-center">
        <CircularTimer progress={progress} size={240} warning={warning}>
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {warning ? "Focus interrupted" : "Deep focus"}
          </div>
          <div className="mt-1 font-mono text-5xl font-semibold tabular-nums text-foreground text-glow">
            {mm}:{ss}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-primary-glow">
            {subject}
          </div>
        </CircularTimer>
      </div>

      {/* Allowed apps */}
      <div className="mb-3 flex flex-wrap justify-center gap-1.5">
        {apps.slice(0, 4).map((a) => (
          <span
            key={a}
            className="rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {a}
          </span>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex w-full items-center justify-center gap-1.5">
          {Array.from({ length: maxBreaches }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-6 rounded-full transition-colors"
              style={{
                background:
                  i < breachCount
                    ? "var(--warning)"
                    : "color-mix(in oklab, var(--muted-foreground) 25%, transparent)",
                boxShadow: i < breachCount ? "0 0 10px -2px var(--warning)" : "none",
              }}
            />
          ))}
        </div>
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          {!appDetection
            ? breachCount === 0
              ? "focus protection active · stay in app"
              : `${maxBreaches - breachCount} breach${maxBreaches - breachCount === 1 ? "" : "es"} remaining`
            : offApp
              ? `outside allowed apps · ${activeApp?.app ?? "unknown"}`
              : breachCount === 0
                ? `watching apps · ${activeApp?.app ?? "…"}`
                : `${maxBreaches - breachCount} breach${maxBreaches - breachCount === 1 ? "" : "es"} remaining`}
        </p>
        <button
          onClick={onEmergencyExit}
          className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 text-xs uppercase tracking-[0.3em] text-destructive transition hover:bg-destructive/20"
        >
          <AlertTriangle size={14} /> Emergency exit
        </button>
      </div>
    </div>
  );
}
