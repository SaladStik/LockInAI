import { Lock } from "lucide-react";
import { SetupShell, Row } from "@/components/lockin/primitives";

export function ConfirmScreen({
  subject,
  plantName,
  sessionPlantName,
  minutes,
  apps,
  newPreset = false,
  onLock,
}: {
  subject: string;
  plantName: string;
  sessionPlantName: string;
  minutes: number;
  apps: string[];
  newPreset?: boolean;
  onLock: () => void;
}) {
  return (
    <SetupShell step={5} title="Ready to lock in?" plantStage={3} excited>
      <div
        className="glass rounded-2xl p-4"
        style={{ boxShadow: "var(--shadow-glow-accent)" }}
      >
        <Row label={newPreset ? "New session" : "Session"} value={subject} />
        {newPreset && (
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-primary-glow">
            ↳ saved as a reusable preset
          </p>
        )}
        <div className="my-3 h-px bg-border" />
        <Row
          label="Plant"
          value={
            plantName.trim()
              ? sessionPlantName
              : `${sessionPlantName} · picked for you`
          }
        />
        <div className="my-3 h-px bg-border" />
        <Row label="Duration" value={`${minutes} min`} />
        <div className="my-3 h-px bg-border" />
        <Row
          label="Allowed"
          value={
            <div className="flex flex-wrap justify-end gap-1">
              {apps.slice(0, 3).map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] text-foreground"
                >
                  {a}
                </span>
              ))}
              {apps.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{apps.length - 3}
                </span>
              )}
            </div>
          }
        />
      </div>

      <button
        onClick={onLock}
        className="group relative mt-auto flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-semibold uppercase tracking-[0.4em] text-primary-foreground transition-transform active:scale-[0.98]"
        style={{
          background: "var(--gradient-leaf)",
          boxShadow: "var(--shadow-glow-primary)",
        }}
      >
        <span
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(1 0 0 / 30%), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2.5s linear infinite",
          }}
        />
        <Lock size={16} className="relative" />
        <span className="relative">Lock in</span>
      </button>
    </SetupShell>
  );
}
